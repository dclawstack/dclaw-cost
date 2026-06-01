# DClaw Cost — Architecture Reference

> Do not modify the stack. See `AGENTS.md` for the full anti-pattern table.
> Source of truth: `dclaw-cost/REVISED-PRD.md` · Spec: `dclaw-cost/PRODUCT-SPEC.md`

## Ports & Identity

| Item | Value |
|---|---|
| Backend | FastAPI on port **8122** |
| Frontend | Next.js on port **3036** |
| Database | PostgreSQL `dclaw_cost` |
| Base API path | `/api/v1` |
| AI primary | OpenRouter (`moonshotai/kimi-k2`) |
| AI fallback | Ollama (`llama3.2` · localhost:11434) |
| Vercel | https://dclaw-cost.vercel.app |

## Stack (Locked)

**Backend**
- FastAPI with `lifespan` handler (`init_db()` on startup)
- SQLAlchemy 2.0 — `DeclarativeBase` from `app.models.base`
- Pydantic v2 with `ConfigDict(from_attributes=True)`
- Async: `create_async_engine` + `AsyncSession` (asyncpg driver)
- Repository pattern — all DB access in `app/repositories/`
- DI: `Depends(get_db)` — never manual `AsyncSession` creation
- Services layer: `app/services/` — business logic + AI integrations

**Frontend**
- Next.js 14 App Router (`web/` directory — **not** `frontend/`)
- Tailwind CSS + shadcn/ui components
- API client in `web/src/lib/api.ts`
- `BACKEND_URL` env var for server-side proxy (never exposed to browser)
- 15 pages: landing `/`, dashboard, 13 app pages under `(app)/`

**AI Copilot**
- Streaming SSE via `POST /api/v1/copilot/chat`
- `copilot_service.py` builds live context from 4 parallel DB queries (`asyncio.gather`)
- History: last 12 turns per session persisted to `copilot_messages`
- Fallback chain: OpenRouter → Ollama → sanitized error in stream

**Docker**
- Backend: `python:3.11-slim`, port 8122
- Frontend: `node:20-alpine`, port 3036
- Postgres: `postgres:16-alpine`, port 5432
- Healthcheck backend: `python urllib.request.urlopen()`
- Healthcheck frontend: `wget -q --spider`

## Domain Entities (13)

| Model | Table | Key Relations |
|---|---|---|
| CloudAccount | `cloud_accounts` | Root entity — all others FK to this |
| BillingRecord | `billing_records` | FK → CloudAccount CASCADE |
| Budget | `budgets` | — |
| CostAlert | `cost_alerts` | FK → Budget CASCADE |
| ResourceRecommendation | `resource_recommendations` | FK → CloudAccount CASCADE |
| WasteItem | `waste_items` | FK → CloudAccount CASCADE |
| CopilotMessage | `copilot_messages` | session_id (string) |
| RIPlan | `ri_plans` | FK → CloudAccount CASCADE |
| TagAllocation | `tag_allocations` | tag_key + tag_value → team/project |
| ContainerCost | `container_costs` | FK → CloudAccount CASCADE |
| SaasSubscription | `saas_subscriptions` | — |
| SpotStrategy | `spot_strategies` | FK → CloudAccount CASCADE |
| CarbonRecord | `carbon_records` | FK → CloudAccount CASCADE |

## Services Layer (8)

| Service | Triggered by |
|---|---|
| `copilot_service.py` | POST /api/v1/copilot/chat |
| `alert_service.py` | POST /api/v1/billing-records/ingest |
| `analyzer_service.py` | POST /api/v1/recommendations/analyze/{id} |
| `waste_scanner_service.py` | POST /api/v1/waste-scan/scan/{id} |
| `ri_planner_service.py` | POST /api/v1/ri-plans/analyze/{id} |
| `cost_allocation_service.py` | GET /api/v1/cost-allocation/showback |
| `spot_strategy_service.py` | POST /api/v1/spot-strategy/analyze/{id} |
| `carbon_service.py` | POST /api/v1/carbon/calculate/{id} |

## API Surface (136 endpoints, 17 route groups)

```
/health                  → health check (public)
/api/v1/cloud-accounts   → CRUD
/api/v1/billing-records  → list + bulk ingest
/api/v1/budgets          → CRUD
/api/v1/cost-alerts      → list + acknowledge
/api/v1/recommendations  → list + status + analyze
/api/v1/waste-items      → list + status
/api/v1/dashboard        → aggregate stats
/api/v1/copilot          → SSE chat + history
/api/v1/ri-plans         → analyze + CRUD + status
/api/v1/waste-scan       → on-demand scan
/api/v1/cost-allocation  → rules CRUD + showback
/api/v1/container-costs  → ingest + namespace summary
/api/v1/reports          → 12-month FinOps report
/api/v1/spot-strategy    → analyze + summary + status
/api/v1/saas             → CRUD + summary
/api/v1/carbon           → calculate + summary
```

## Model Rules

- Inherit from `Base` in `app.models.base`
- Use `Mapped[...]` and `mapped_column()`
- Relationships: `lazy="selectin"`
- Child FK: `ondelete="CASCADE"`
- Every new table → new alembic migration (`alembic revision --autogenerate`)

## Testing

- 15 pytest modules in `backend/tests/`
- 275 test cases · 67% function coverage
- `pytest-asyncio==0.24.0` pinned — do not upgrade
- `httpx.AsyncClient` + `ASGITransport`
- Override `get_db` with test session via `app.dependency_overrides`
- Test DB: `dclaw_cost_test` — created/dropped per test run (NullPool)

## Key Anti-Patterns (Never Do)

| Bad | Good |
|---|---|
| `declarative_base()` in database.py | `from app.models.base import Base` |
| curl in healthcheck | `python urllib.request.urlopen(...)` |
| In-memory mock dicts | Real repository + DB |
| `frontend/` path references | `web/` — frontend moved in commit `98e9bb1` |
| Yield exception messages to SSE stream | Log with structlog, return sanitized message |
| `allow_origins=["*"]` + `allow_credentials=True` | Scoped origin list (P0.5.5) |
| `secret_key: str = "change-me-in-production"` | Required env var, no default (P0.5.3) |

## Pending: P0.5 Hardening (PLAN-v1.4)

| ID | Item | Priority |
|---|---|---|
| P0.5.1 | Fix `build-frontend.yml` → `./web` | Critical |
| P0.5.2 | Logto JWT on all `/api/v1/*` | Critical |
| P0.5.3 | Remove hardcoded `secret_key` default | Critical |
| P0.5.4 | Copilot: auth + rate limit + session isolation | Critical |
| P0.5.5 | Fix CORS wildcard | High |
| P0.5.6 | Billing ingest idempotency (`source_record_id`) | High |
| P0.5.7 | structlog + Prometheus + Sentry | High |

## Related Notes

- [[Cost-v1.4-Roadmap]] — feature roadmap and sprint ordering
- [[Cost-TestForge-2026-05-31]] — security & reliability audit findings
