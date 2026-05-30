import json
import httpx
from datetime import date
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.billing_record_repo import BillingRecordRepository
from app.repositories.cost_alert_repo import CostAlertRepository
from app.repositories.recommendation_repo import RecommendationRepository

_SYSTEM_PROMPT = """You are DClaw Cost Copilot, an AI-powered FinOps assistant embedded in the DClaw Cost platform.

You help platform engineers and FinOps teams:
- Understand and reduce cloud spend across AWS, GCP, Azure, and on-premises
- Identify waste, orphaned resources, and optimization opportunities
- Set and track budgets with intelligent forecasting
- Get actionable right-sizing, reserved instance, and spot usage recommendations

Guidelines:
- Be concise and direct — no fluff
- Reference specific numbers from the provided context when available
- Always end with 2-3 concrete, actionable next steps
- If asked something outside FinOps, briefly acknowledge and redirect
"""


async def build_context(db: AsyncSession) -> str:
    today = date.today()
    first = today.replace(day=1)

    billing_repo = BillingRecordRepository(db)
    alert_repo = CostAlertRepository(db)
    rec_repo = RecommendationRepository(db)

    total_spend = await billing_repo.total_spend(first, today)
    active_alerts = await alert_repo.count_unacknowledged()
    total_savings = await rec_repo.total_savings()
    top_services = await billing_repo.spend_by_service(first, limit=5)

    lines = [
        f"Live context (as of {today}):",
        f"- Monthly spend to date: ${total_spend:,.2f}",
        f"- Unacknowledged alerts: {active_alerts}",
        f"- Open savings opportunities: ${total_savings:,.2f}",
        "- Top cost drivers: " + (
            ", ".join(f"{s} ${c:,.2f}" for s, c in top_services)
            if top_services else "no billing data yet"
        ),
    ]
    return "\n".join(lines)


async def _stream_openrouter(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=90.0) as client:
        async with client.stream(
            "POST",
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": "https://dclaw.cost",
                "X-Title": "DClaw Cost Copilot",
            },
            json={
                "model": settings.openrouter_model,
                "messages": messages,
                "stream": True,
            },
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise RuntimeError(f"OpenRouter {response.status_code}: {body.decode()[:200]}")

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line[6:].strip()
                if chunk == "[DONE]":
                    break
                try:
                    data = json.loads(chunk)
                    content = data["choices"][0]["delta"].get("content", "")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


async def _stream_ollama(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_base_url}/api/chat",
            json={
                "model": settings.ollama_model,
                "messages": messages,
                "stream": True,
            },
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise RuntimeError(f"Ollama {response.status_code}: {body.decode()[:200]}")

            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break
                except (json.JSONDecodeError, KeyError):
                    continue


async def stream_chat(
    message: str,
    context: str,
    history: list[dict],
) -> AsyncGenerator[str, None]:
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT + "\n\n" + context},
        *history[-12:],  # keep last 12 turns for context window efficiency
        {"role": "user", "content": message},
    ]

    # Use OpenRouter when key is available; fall back to local Ollama
    use_openrouter = bool(settings.openrouter_api_key)

    try:
        if use_openrouter:
            async for token in _stream_openrouter(messages):
                yield token
        else:
            async for token in _stream_ollama(messages):
                yield token
    except httpx.ConnectError:
        if use_openrouter:
            # OpenRouter unreachable — try Ollama
            try:
                yield "[OpenRouter unavailable — switching to local Ollama]\n\n"
                async for token in _stream_ollama(messages):
                    yield token
            except Exception as exc:
                yield f"\n\n[Both OpenRouter and Ollama unavailable: {exc}]"
        else:
            yield "\n\n[Ollama is not running. Start it with: ollama serve]"
    except httpx.TimeoutException:
        yield "\n\n[Copilot timed out — try a shorter question or check your network.]"
    except Exception as exc:
        yield f"\n\n[Copilot error: {exc}]"
