# DClaw Cost

> AI-powered cloud cost optimization for platform engineering and FinOps teams.

DClaw Cost is a full-stack FinOps platform that unifies multi-cloud billing, detects waste, forecasts spend, and delivers AI-driven savings recommendations — all in one operator-grade dashboard.

---

## What It Does

| Capability | Description |
|------------|-------------|
| **Multi-Cloud Billing** | Unified cost explorer across AWS, GCP, Azure, and on-premises |
| **Budget Alerts** | Threshold + forecast alerts with AI anomaly detection |
| **Resource Right-Sizing** | AI-generated recommendations with confidence scoring |
| **Waste Detection** | 5-type scanner: idle, orphaned, unused IPs, unattached volumes, old snapshots |
| **RI Planner** | 90-day analysis → 6 commitment variants with break-even modeling |
| **Cost Allocation** | Tag-based showback + chargeback reports per team/project |
| **Container Costs** | Per-namespace and per-pod cost breakdown for Kubernetes workloads |
| **FinOps Reports** | 12-month trend analysis, unit economics, AI-generated insights |
| **Spot Strategy** | Workload classification + interruption-risk scoring for spot savings |
| **SaaS Spend** | Subscription tracker with renewal alerts and cost-per-seat analysis |
| **Carbon Footprint** | CO₂ estimation by service and region with green migration suggestions |
| **AI Cost Copilot** | Streaming chat interface with live cost context, available on every page |

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| Backend | FastAPI, SQLAlchemy 2.0 async, Pydantic v2 |
| Database | PostgreSQL 16 (CloudNativePG in K8s) |
| AI | OpenRouter → Ollama (local fallback) |
| Migrations | Alembic |
| Tests | pytest + pytest-asyncio |
| Container | Docker + docker-compose |
| Orchestration | Kubernetes + Helm |
| CI/CD | GitHub Actions |

---

## Quick Start

### Docker (recommended)

```bash
# 1. Clone and configure
git clone https://github.com/dclawstack/dclaw-cost
cd dclaw-cost
cp backend/.env.example backend/.env
# Edit backend/.env — add OPENROUTER_API_KEY

# 2. Start all services
docker compose up --build -d

# 3. Apply migrations
docker compose exec backend alembic upgrade head

# 4. Open the app
open http://localhost:3036
# API docs: http://localhost:8122/docs
```

### Local Development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add OPENROUTER_API_KEY
uvicorn app.api.main:app --reload --port 8122

# Frontend (separate terminal)
cd web
npm install
cp .env.example .env.local
npm run dev   # → http://localhost:3036
```

### Kubernetes

```bash
helm upgrade --install dclaw-cost ./helm \
  --namespace dclaw \
  --create-namespace \
  --set image.backend.tag=latest \
  --set image.frontend.tag=latest \
  --values helm/values.yaml
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_cost` | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter API key for LLM features |
| `OPENROUTER_MODEL` | No | `moonshotai/kimi-k2` | LLM model via OpenRouter |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama endpoint (local fallback) |
| `OLLAMA_MODEL` | No | `llama3.2` | Local model name |
| `APP_ENV` | No | `dev` | `dev` or `production` |

*If `OPENROUTER_API_KEY` is not set, the Copilot falls back to local Ollama.

### Frontend (`web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | Yes | Backend base URL for server-side API proxy (e.g. `http://localhost:8122`) |

---

## API Overview

The backend exposes **136 endpoints** across 17 route groups. All `/api/v1/*` routes will require Logto JWT auth (P0.5.2 — in progress).

```
GET  /health                              → Health check

# Cloud & Billing
/api/v1/cloud-accounts                   → CRUD
/api/v1/billing-records                  → List + bulk ingest

# Budgets & Alerts
/api/v1/budgets                          → CRUD
/api/v1/cost-alerts                      → List, acknowledge

# Optimization
/api/v1/recommendations                  → List, update status
/api/v1/waste-items                      → List, update status
/api/v1/dashboard                        → Aggregate stats

# AI Copilot
POST /api/v1/copilot/chat                → Streaming SSE response
GET  /api/v1/copilot/history/{id}        → Conversation history

# P1 — Platform
/api/v1/ri-plans                         → RI analysis + CRUD
/api/v1/waste-scan                       → On-demand waste scan
/api/v1/cost-allocation                  → Allocation rules + showback
/api/v1/container-costs                  → Namespace ingest + summary

# P2 — Scale
/api/v1/reports                          → FinOps report (12-month)
/api/v1/spot-strategy                    → Spot opportunity analysis
/api/v1/saas                             → SaaS subscription CRUD + summary
/api/v1/carbon                           → Carbon calculation + summary
```

Interactive API docs: `http://localhost:8122/docs`

---

## Running Tests

```bash
cd backend

# Requires a running PostgreSQL at localhost:5432
# The test suite creates and drops dclaw_cost_test automatically

# Install dependencies
pip install -r requirements.txt

# Run all tests
python -m pytest -v --tb=short

# Run a specific module
python -m pytest tests/test_cloud_accounts.py -v
```

CI runs the full test suite on every push to `main` via `.github/workflows/ci.yml`.

---

## Project Structure

```
dclaw-cost/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── main.py          # FastAPI app + router registration
│   │   │   ├── routes/health.py
│   │   │   └── v1/              # 15 route modules
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings
│   │   │   └── database.py      # Async engine + session
│   │   ├── models/              # 13 SQLAlchemy models
│   │   ├── repositories/        # Data access layer
│   │   ├── schemas/             # Pydantic v2 request/response models
│   │   └── services/            # Business logic + AI integrations
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # 15 pytest test modules
│   └── requirements.txt
├── web/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── page.tsx         # Marketing landing page
│   │   │   └── (app)/           # Authenticated app routes (15 pages)
│   │   ├── components/          # Shared UI components
│   │   └── lib/api.ts           # Typed API client
│   └── package.json
├── helm/                        # Kubernetes Helm chart
├── docs/                        # Developer documentation
├── Infographics/                # Architecture diagrams + visual assets
├── slides/                      # Presentation deck
├── docker-compose.yml
└── PLAN-v1.4.md                 # Current roadmap
```

---

## Ports

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3036 |
| Backend (FastAPI) | 8122 |
| PostgreSQL | 5432 |

---

## Docs

| Document | Purpose |
|----------|---------|
| `PLAN-v1.4.md` | Feature roadmap + current sprint |
| `REVISED-PRD.md` | Product requirements (source of truth) |
| `PRODUCT-SPEC.md` | Domain models, API spec, screen designs |
| `AGENTS.md` | Coding agent instructions |
| `docs/` | Getting started, guides, API reference |
| `RUN.md` | Detailed run instructions |

---

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push/PR to `main` | pytest backend tests + frontend build |
| `build-backend.yml` | Push to `main` (backend changes) | Build + push Docker image to GHCR |
| `build-frontend.yml` | Push to `main` (web changes) | Build + push Docker image to GHCR |
| `deploy.yml` | Build success or manual trigger | Helm upgrade to staging/production |
| `claude.yml` | `@claude` mention in issues/PRs | Claude Code agent response |
| `claude-code-review.yml` | PR opened/updated | Automated code review |

---

## License

Copyright © 2026 One Convergence / DClaw Stack. All rights reserved.
