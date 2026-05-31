# DClaw Cost — Presentation Deck Content

> Source content for slide deck regeneration.
> Version: 1.4 · Updated: 2026-05-31
> Design system: One Convergence Vol. 01 · Purple `#7030A0` · Manrope display

---

## Slide 1 — Cover

**Title:** DClaw Cost

**Tagline:** AI-powered cloud cost optimization for platform teams

**Visual:** Dark ink hero, dashboard screenshot at right showing cost dashboard with spend metrics  
**Sub-copy:** Understand your cloud bill. Kill waste. Forecast spend. Ask your numbers anything.

---

## Slide 2 — The Problem

**Headline:** Cloud bills are growing. Nobody knows why.

**Three pain points (icon + one-liner each):**

- 💸 **Invisible waste** — $26B wasted annually on idle resources, orphaned volumes, and over-provisioned instances. Most teams find it months late.
- 📊 **Fragmented visibility** — AWS Console, GCP Billing, Azure Cost Management, SaaS dashboards — four interfaces, zero unified picture.
- ⏱️ **Reactive FinOps** — By the time a budget alert fires, the month is half over. Engineering teams are always looking backward.

**Bottom line:** Cloud providers profit from complexity. DClaw Cost makes the opaque obvious, before the invoice arrives.

---

## Slide 3 — The Solution

**Headline:** One platform that sees all your cloud spend and thinks ahead

**Visual:** App screenshot grid (3×2) — Dashboard, Recommendations, AI Copilot chat, Carbon, RI Planner, SaaS

**Three differentiators:**
1. Unified billing across AWS, GCP, Azure, and on-prem with a single ingest API
2. AI copilot with live context — ask "which services drove last week's spike?" and get an actual answer
3. Proactive intelligence: RI commitment modeling, spot workload classification, carbon footprint, SaaS spend — all in one platform

---

## Slide 4 — Product Overview

**Layout:** Hub-and-spoke diagram, feature groups radiating from center

| Feature Area | Key Value |
|---|---|
| Dashboard | Real-time spend, projected costs, savings opportunities, budget utilization |
| Multi-Cloud Billing | AWS + GCP + Azure + on-prem unified; filter by service, region, tag |
| Budget Alerts | Threshold + forecast + anomaly detection; acknowledge workflow |
| Recommendations | Right-sizing, spot, RI, delete, schedule — with confidence scoring |
| Waste Detection | 5 waste types; on-demand deep scan per account |
| AI Cost Copilot | Streaming chat on every page; context-aware; OpenRouter → Ollama fallback |
| RI Planner | 90-day analysis; 6 commitment variants; break-even calculation |
| Cost Allocation | Tag → team/project rules; showback + chargeback reports |
| Container Costs | Per-namespace and per-pod cost breakdown |
| FinOps Reports | 12-month trend; 6 unit economics; AI executive summary |
| Spot Strategy | Workload classifier; interruption risk scoring; 70% savings modeling |
| SaaS Spend | Subscription CRUD; renewal alerts; cost-per-seat analysis |
| Carbon Footprint | CO₂ by service + region; 19-region intensity table; green migration |

---

## Slide 5 — AI Feature Showcase

**Headline:** 8 AI-powered workflows. Each triggered by real work, not a demo button.

| # | Feature | Trigger | Delivery |
|---|---------|---------|---------|
| 01 | AI Cost Copilot | Chat input on any page | SSE streaming |
| 02 | Spend Anomaly Detection | After every billing ingest | Auto-fires CostAlert |
| 03 | Spend Forecasting | After every billing ingest | 7-day-ahead alert |
| 04 | Resource Right-Sizing | POST /recommendations/analyze | Confidence-scored recommendations |
| 05 | Waste Detection | POST /waste-scan/scan | 5-type waste classification |
| 06 | RI Commitment Modeling | POST /ri-plans/analyze | 6 commitment variants + break-even |
| 07 | Spot Workload Classifier | POST /spot-strategy/analyze | Risk-scored spot recommendations |
| 08 | Carbon Intensity Estimation | POST /carbon/calculate | CO₂ per service/region |

**Cost controls:** All AI features are independent of each other. Copilot is the only endpoint that calls the LLM at query time; all other AI features run as batch analysis triggered on-demand.

---

## Slide 6 — Architecture Deep Dive

**Headline:** Production-grade stack. Nothing exotic. Everything observable.

```
Browser / Next.js 14 App Router (port 3036)
        ↓ Server-side API proxy (BACKEND_URL — never exposed to browser)
FastAPI backend (port 8122)
├── [P0.5] Logto JWT middleware — all /api/v1/* routes
├── 17 API route modules → 136 endpoints
│   └── Services layer
│       ├── copilot_service.py  — SSE streaming, OpenRouter → Ollama fallback
│       ├── alert_service.py    — threshold + forecast + anomaly
│       ├── analyzer_service.py — right-sizing + waste heuristics
│       ├── ri_planner_service.py
│       ├── spot_strategy_service.py
│       ├── cost_allocation_service.py
│       ├── carbon_service.py
│       └── waste_scanner_service.py
│   └── Repository layer (13 models)
└── PostgreSQL 16 (dclaw_cost, CloudNativePG in K8s)
```

**Stack badges:**
Row 1: Next.js 14 · FastAPI · PostgreSQL 16 · SQLAlchemy 2.0 async
Row 2: Tailwind CSS · Pydantic v2 · Alembic · Docker · Helm · GitHub Actions

---

## Slide 7 — Copilot Architecture

**Headline:** A copilot that knows your numbers before you ask.

**Left — Context Assembly:**
Every copilot request triggers a parallel DB query batch (asyncio.gather):
- Monthly spend to date
- Unacknowledged alert count
- Open savings opportunities ($)
- Top 5 cost-driving services

**Right — Streaming Delivery:**
```
POST /api/v1/copilot/chat
  → persist user message
  → build_context() [parallel DB queries]
  → stream_chat(message, context, history[-12:])
     → OpenRouter (kimi-k2 or claude-*)
        → SSE: data: {"content": "..."} per token
        → SSE: data: [DONE]
  → persist assistant reply (fresh session)
```

**Fallback chain:** OpenRouter → Ollama (local) → sanitized error message

---

## Slide 8 — Deployment Options

**Headline:** Local in 3 commands. Kubernetes in 1.

**Option A — Docker (local / staging):**
```bash
cp backend/.env.example backend/.env   # add OPENROUTER_API_KEY
docker compose up --build -d
docker compose exec backend alembic upgrade head
# → Frontend: http://localhost:3036
# → API docs: http://localhost:8122/docs
```

**Option B — Kubernetes (production):**
```bash
helm upgrade --install dclaw-cost ./helm \
  --namespace dclaw \
  --create-namespace \
  --values helm/values.yaml \
  --wait
# CloudNativePG operator manages PostgreSQL
# K8s Secrets for API keys — no hardcoded values
```

**Option C — Local dev (hot reload):**
```bash
# Backend
cd backend && uvicorn app.api.main:app --reload --port 8122
# Frontend
cd web && npm run dev   # → http://localhost:3036
```

---

## Slide 9 — API Surface

**Headline:** 136 endpoints across 17 route groups. Fully documented.

| Group | Routes | Purpose |
|-------|--------|---------|
| `/health` | 1 | Health check |
| `/api/v1/cloud-accounts` | 5 | Multi-cloud account management |
| `/api/v1/billing-records` | 3 | Cost data ingest + explorer |
| `/api/v1/budgets` | 5 | Budget CRUD |
| `/api/v1/cost-alerts` | 3 | Alert management |
| `/api/v1/recommendations` | 4 | Right-sizing + analysis |
| `/api/v1/waste-items` | 3 | Waste management |
| `/api/v1/dashboard` | 1 | Aggregate stats |
| `/api/v1/copilot` | 2 | AI chat + history |
| `/api/v1/ri-plans` | 3 | RI commitment analysis |
| `/api/v1/waste-scan` | 1 | On-demand waste scan |
| `/api/v1/cost-allocation` | 4 | Tag rules + showback |
| `/api/v1/container-costs` | 2 | K8s cost ingest + summary |
| `/api/v1/reports` | 1 | FinOps report |
| `/api/v1/spot-strategy` | 4 | Spot analysis |
| `/api/v1/saas` | 6 | SaaS subscription management |
| `/api/v1/carbon` | 2 | Carbon footprint |

Interactive docs: `http://localhost:8122/docs`

---

## Slide 10 — Test Coverage & Quality

**Headline:** 275 tests across 15 modules. TestForge score: 71/100.

**What's covered:**
- 15 pytest test modules (one per feature area)
- Integration tests against real PostgreSQL (NullPool, fresh schema per test)
- Full CRUD coverage for all 13 entities
- Happy-path API validation for all 136 endpoints

**TestForge Tier 2 (generated tests, all passed 12/12):**
| Test | Result |
|------|--------|
| Auth endpoint rate limiting pattern | ✅ 4/4 |
| Observability stack detection | ✅ 4/4 |
| Product analytics dependency | ✅ 4/4 |

**Quality roadmap (P0.5.9):**
- Service-layer tests for business logic boundaries (alert thresholds, RI break-even, waste heuristics)
- Mutation score target: 32% → 60%+
- Frontend vitest infrastructure (P0.5.10)

---

## Slide 11 — Roadmap

**Headline:** All v1.2 features shipped. Now: hardening for production.

**Phase 1 — Security & Reliability (Current — PLAN-v1.4 P0.5)**
- Auth: Logto JWT on all 136 endpoints
- Fix broken frontend CI pipeline
- Copilot: rate limiting, session isolation, error sanitization
- Billing ingest: idempotency via source_record_id
- Observability: structlog + Prometheus + Sentry

**Phase 2 — Intelligence (Next quarter)**
- Redis cache layer for dashboard aggregations
- Proactive copilot: daily spend digest push
- Budget forecast accuracy feedback loop
- Multi-tenancy: per-org data isolation

**Phase 3 — Agentic (Following quarter)**
- Cloud provider API integrations (AWS CUR, GCP BQ export, Azure EA)
- Real utilization metrics (not billing-derived estimates)
- Streaming waste scan with progress SSE
- Copilot tool-use: create budget / acknowledge alert via chat

---

## Slide 12 — Links & Call to Action

**Headline:** Get started in 3 minutes.

| Resource | Link |
|----------|------|
| GitHub | https://github.com/dclawstack/dclaw-cost |
| API docs | http://localhost:8122/docs |
| Roadmap | `PLAN-v1.4.md` |
| Product spec | `PRODUCT-SPEC.md` |
| Architecture | `Infographics/architecture-diagram.md` |

**Quick start:**
```bash
git clone https://github.com/dclawstack/dclaw-cost
cp backend/.env.example backend/.env   # add OPENROUTER_API_KEY
docker compose up -d
docker compose exec backend alembic upgrade head
# → http://localhost:3036
```

---

## Design Notes (for deck builder)

**Colours:**
- Primary: `#7030A0` (purple)
- Background: `#FFFFFF`
- Accent dark: `#2B0E45`
- Ink: `#141414`
- Positive / savings: `#10B981` (emerald)
- Alert / warn: `#F59E0B` (amber)
- Critical: `#EF4444` (red)
- Light purple tint: `#FAF6FD`
- Border purple: `#E7D8F4`

**Fonts:**
- Display headings: Manrope 700/800
- Body: Inter 400/500
- Code snippets: JetBrains Mono 400

**Corner radius:** 2px (sharp — One Convergence design system)

**Chart palette:**
- Current spend: `#3B82F6`
- Projected: `#60A5FA`
- Savings: `#10B981`
- Waste: `#F59E0B`
- Alerts: `#EF4444`
- Carbon: `#6B7280`
