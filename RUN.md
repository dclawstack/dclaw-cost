# Running DClaw Cost

## Prerequisites

### 1. Environment file

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

The only required key for AI features is `OPENROUTER_API_KEY`. Everything else has sensible defaults.

```
# Required for AI Cost Copilot
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=moonshotai/kimi-k2   # default; change to any OpenRouter model

# Optional — Ollama fallback (local, free)
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1

# Set automatically by docker-compose; only needed for local dev
NEXT_PUBLIC_API_URL=http://localhost:8122
```

Get an OpenRouter key at: https://openrouter.ai/keys

To use Ollama as a local fallback (no key needed):

```bash
ollama pull llama3.1   # or any model from https://ollama.com/library
```

### 2. Docker

Docker and Docker Compose v2 must be installed. Verify:

```bash
docker --version
docker compose version
```

---

## Start all services

Run from the project root (`dclaw-cost/`):

```bash
docker compose up --build -d
```

This starts three containers: `postgres`, `backend`, `frontend`.

---

## Run database migrations

Once the backend container is healthy:

```bash
docker compose exec backend alembic upgrade head
```

If the backend is not ready yet, wait a few seconds and retry. You can check readiness with:

```bash
docker compose ps
```

All three services should show `healthy` or `running`.

---

## Verify everything is running

```bash
docker compose ps
docker compose logs backend   # check for startup errors
docker compose logs frontend
```

Health check endpoints:

```bash
curl http://localhost:8122/health/      # → {"status":"ok"}
curl http://localhost:3036/             # → DClaw Cost UI
```

---

## Service URLs

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:3036     |
| Backend  | http://localhost:8122     |
| API docs | http://localhost:8122/docs |
| Postgres | localhost:5432 · DB: `dclaw_cost` · user: `postgres` |

---

## What you can do from the UI

| Page | Path | What it does |
|------|------|--------------|
| Dashboard | `/dashboard` | Spend overview, budget utilization, recent alerts |
| Cloud Accounts | `/cloud-accounts` | Connect AWS / GCP / Azure / on-prem accounts |
| Billing | `/billing` | Cost explorer with filters by account, service, region, date |
| Budgets & Alerts | `/budgets` | Create budgets, view threshold/forecast alerts |
| Recommendations | `/recommendations` | Right-sizing + waste items with apply/dismiss |
| RI Planner | `/ri-planner` | Reserved instance plans with break-even analysis |
| Waste Detection | `/waste` | Deep scan for 5 waste types |
| Cost Allocation | `/cost-allocation` | Tag → team mapping + showback reports |
| Container Costs | `/container-costs` | Per-namespace K8s cost breakdown |
| FinOps Reports | `/reports` | 12-month trends + unit economics |
| Spot Strategy | `/spot-strategy` | Spot instance suitability analysis |
| SaaS Spend | `/saas` | SaaS subscription tracker + renewal alerts |
| Carbon & Green | `/carbon` | CO₂ estimates + green region suggestions |
| AI Copilot | `/copilot` | Chat assistant with live cost context |

The **AI Cost Copilot** floating widget is available on every page (bottom-right corner).

---

## Ingest sample data

After the stack is up, seed some billing records via the API to explore the UI:

```bash
# Create a cloud account
curl -s -X POST http://localhost:8122/api/v1/cloud-accounts/ \
  -H "Content-Type: application/json" \
  -d '{"name":"AWS Production","provider":"aws","external_account_id":"123456789"}' | jq .

# Ingest billing records (replace ACCOUNT_ID with the id from above)
curl -s -X POST http://localhost:8122/api/v1/billing-records/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"cloud_account_id":"ACCOUNT_ID","resource_id":"i-ec2-001","resource_type":"ec2_instance",
       "service":"EC2","region":"us-east-1","cost_usd":1250.0,"usage_quantity":720,"usage_unit":"hours",
       "billing_period_start":"2026-05-01","billing_period_end":"2026-05-31","tags":{"team":"platform","env":"prod"}},
      {"cloud_account_id":"ACCOUNT_ID","resource_id":"bucket-logs","resource_type":"s3_bucket",
       "service":"S3","region":"us-east-1","cost_usd":340.0,"usage_quantity":5000,"usage_unit":"GB",
       "billing_period_start":"2026-05-01","billing_period_end":"2026-05-31","tags":{"team":"data"}},
      {"cloud_account_id":"ACCOUNT_ID","resource_id":"rds-prod-01","resource_type":"rds_instance",
       "service":"RDS","region":"us-east-1","cost_usd":890.0,"usage_quantity":720,"usage_unit":"hours",
       "billing_period_start":"2026-05-01","billing_period_end":"2026-05-31","tags":{"team":"backend"}}
    ]
  }' | jq .

# Run AI analysis (generates recommendations + waste items)
curl -s -X POST http://localhost:8122/api/v1/recommendations/analyze/ACCOUNT_ID | jq .

# Run RI planning
curl -s -X POST http://localhost:8122/api/v1/ri-plans/analyze/ACCOUNT_ID | jq .

# Calculate carbon footprint
curl -s -X POST http://localhost:8122/api/v1/carbon/calculate/ACCOUNT_ID | jq .
```

---

## Run tests locally (without Docker)

### Backend

Requires a running Postgres instance. Uses the `dclaw_cost_test` database:

```bash
cd backend
pip install -r requirements.txt

# Create test database (first time only)
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE dclaw_cost_test;"

# Run all 55 tests
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_cost_test" pytest tests/ -v
```

### Frontend type-check + build

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8122 npm run build
```

---

## Local development (without Docker)

Start Postgres separately (e.g. via Docker):

```bash
docker compose up postgres -d
```

Backend:

```bash
cd backend
cp .env.example .env          # add your OPENROUTER_API_KEY
pip install -r requirements.txt
alembic upgrade head
uvicorn app.api.main:app --host 0.0.0.0 --port 8122 --reload
```

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8122 npm run dev
# → http://localhost:3000 (Next.js dev server, hot reload)
```

---

## Common issues

| Issue | Fix |
|-------|-----|
| `relation does not exist` | Run `docker compose exec backend alembic upgrade head` |
| `database "dclaw_cost" does not exist` | Run `PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE dclaw_cost;"` |
| Frontend can't reach backend | Check `NEXT_PUBLIC_API_URL` in `.env` matches the backend port (`8122`) |
| AI Copilot returns `OpenRouter API key is not configured` | Set `OPENROUTER_API_KEY` in `backend/.env` and restart the backend |
| Port `3036` or `8122` already in use | Change `PORT` / `NEXT_PUBLIC_API_URL` in `.env` and update `docker-compose.yml` |
| `alembic upgrade head` fails with connection error | Wait for the `postgres` container to be healthy: `docker compose ps` |
| Backend container exits immediately | Check `docker compose logs backend` — usually a missing env var or DB not ready |

---

## Stopping everything

Keep data (Postgres volume persists):

```bash
docker compose down
```

Wipe all data (removes the Postgres volume):

```bash
docker compose down -v
```

---

## Environment variable reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_cost` | Postgres connection string |
| `OPENROUTER_API_KEY` | For AI | — | OpenRouter key for AI Copilot |
| `OPENROUTER_MODEL` | No | `moonshotai/kimi-k2` | LLM model via OpenRouter |
| `OLLAMA_URL` | No | `http://localhost:11434` | Ollama base URL (local fallback) |
| `OLLAMA_MODEL` | No | `llama3.1` | Ollama model name |
| `NEXT_PUBLIC_API_URL` | Yes (frontend) | `http://localhost:8122` | Backend URL baked into frontend at build time |
| `SECRET_KEY` | Production | `change-me-in-production` | JWT signing key |
| `APP_ENV` | No | `dev` | `dev` enables SQL echo; `production` disables it |
