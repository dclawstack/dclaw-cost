# DClaw Cost — Feature Roadmap v1.4

> 📘 **REVISED PRD v2.3 is the source of truth.** See `REVISED-PRD.md` for gap analysis, AI mandates, and acceptance criteria.
> In any conflict between this file and `REVISED-PRD.md`, defer to `REVISED-PRD.md`.
> **For coding agents:** Pick features from this list, implement them fully, and update this doc with a checkmark.
> **Do NOT change the basic stack.** See `AGENTS.md` for architecture lock.

---

## What Changed in v1.4

This plan incorporates validated findings from the TestForge static analysis (`testforge/test_analysis.md`, 2026-05-31). All P0/P1/P2 product features are complete. The delta is a new **P0.5 — Security & Reliability Hardening** block that must ship before production deployment. These are genuine product defects and PRD compliance gaps — not test infrastructure issues.

**Excluded from this plan:** false-positive XSS findings in `node_modules/object-hash` (library hashing to a crypto stream, no DOM path); JS-only analyzer mis-scoring of Python test and ORM stack; Kubernetes N/A finding (helm/ directory is present and functional).

---

## Pre-Flight Checklist

- [x] `web/package-lock.json` committed after `npm install`
- [x] `web/next-env.d.ts` exists and committed
- [x] `web/.gitignore` excludes `node_modules/` and `.next/`
- [x] `docker-compose.yml` healthchecks present
- [x] `backend/.env.example` present with all required variables
- [ ] `web/public/dclaw-manifest.json` created for DPanel registration
- [ ] No hardcoded secrets in committed code (`secret_key` default must be removed)
- [ ] Non-root containers in Dockerfile
- [ ] `build-frontend.yml` points to `./web` (currently broken — references `./frontend`)

---

## Core Entities Implemented

| Entity | Table | Status |
|--------|-------|--------|
| CloudAccount | `cloud_accounts` | ✅ |
| BillingRecord | `billing_records` | ✅ |
| Budget | `budgets` | ✅ |
| CostAlert | `cost_alerts` | ✅ |
| ResourceRecommendation | `resource_recommendations` | ✅ |
| WasteItem | `waste_items` | ✅ |
| CopilotMessage | `copilot_messages` | ✅ |
| ReservedInstancePlan | `ri_plans` | ✅ |
| TagAllocation | `tag_allocations` | ✅ |
| ContainerCost | `container_costs` | ✅ |
| SaasSubscription | `saas_subscriptions` | ✅ |
| SpotStrategy | `spot_strategies` | ✅ |
| CarbonRecord | `carbon_records` | ✅ |

---

## P0 — Foundation ✅

### P0.1 — AI Cost Copilot ✅
- **Backend:** `POST /api/v1/copilot/chat` — streaming SSE via OpenRouter (Kimi K2) with Ollama fallback
- **Backend:** `GET /api/v1/copilot/history/{session_id}` — conversation history
- **Service:** `copilot_service.py` — context-aware prompt with live spend/alert data
- **Frontend:** `/copilot` full-page chat + `CopilotWidget` floating on every page
- **Files:** `app/models/copilot_message.py`, `app/api/v1/copilot.py`, `app/services/copilot_service.py`, `web/src/app/(app)/copilot/page.tsx`, `web/src/components/CopilotWidget.tsx`
- ⚠️ **Auth and rate limiting gaps tracked in P0.5.2 and P0.5.4**

### P0.2 — Multi-Cloud Billing ✅
- **Backend:** Full CRUD for CloudAccount + BillingRecord bulk ingest
- **Endpoints:** `GET|POST /api/v1/cloud-accounts/`, `POST /api/v1/billing-records/ingest`
- **Frontend:** `/cloud-accounts` + `/billing`
- ⚠️ **Ingest idempotency gap tracked in P0.5.6**

### P0.3 — Resource Right-Sizing ✅
- **Backend:** Heuristic analyzer generates `ResourceRecommendation` + `WasteItem` from 30-day billing
- **Endpoint:** `POST /api/v1/recommendations/analyze/{account_id}`
- **Frontend:** `/recommendations`

### P0.4 — Budget Alerts ✅
- **Backend:** `alert_service.py` runs after every ingest — threshold + forecast alerts
- **Endpoints:** CRUD `/api/v1/budgets/`, `PUT /api/v1/cost-alerts/{id}/acknowledge`
- **Frontend:** `/budgets`

---

## P0.5 — Security & Reliability Hardening 🔴 NEW — Blocks Production

> **All items in this section are production blockers.** They represent PRD compliance gaps (Logto auth, no hardcoded secrets, structlog, Prometheus/Grafana) and genuine behavioral defects found in the TestForge analysis. Ship in priority order.

---

### P0.5.1 — Fix Broken Frontend CI Pipeline
**Priority:** Critical  
**Root cause:** `.github/workflows/build-frontend.yml` sets `working-directory: ./frontend` but the frontend lives in `./web`. Frontend Docker images have never been built from the correct source. The deploy workflow chains on `Build Frontend` — meaning frontend deploys are silently broken.  
**Product impact:** Every push to `main` deploys stale frontend images. Any UI change since the `web/` directory was established has never reached staging/production.  
**Files:** `.github/workflows/build-frontend.yml`

**Remediation:**
```yaml
# In build-frontend.yml — change ALL working-directory references
working-directory: ./web   # was: ./frontend
```
Also update `build-frontend.yml` to reference the correct `Dockerfile` path. Add a `CI` job step that runs `npm run build` from `./web` to gate PRs.

---

### P0.5.2 — Implement Logto JWT Authentication (PRD Mandate)
**Priority:** Critical  
**Root cause:** The PRD mandates "Logto — JWT validation on all protected routes." `config.py` declares `secret_key` and `access_token_expire_minutes` but neither is referenced from any route or middleware. All 136 endpoints are publicly accessible with no authentication whatsoever.  
**Product impact:** Any actor who can reach the API can read, write, and delete all FinOps data including cloud account credentials, billing records, budgets, and cost allocations. The product is not deployable in any multi-user or customer-facing context.  
**Files:** `backend/app/core/config.py`, `backend/app/api/main.py`, all `backend/app/api/v1/*.py` routers

**Remediation:**
1. Add `python-jose[cryptography]` and `httpx` (already present) to `requirements.txt`.
2. Create `backend/app/core/auth.py` with a `get_current_user` FastAPI dependency that validates Logto JWTs against the Logto JWKS endpoint.
3. Apply `dependencies=[Depends(get_current_user)]` at the router level in `main.py` for all non-health routes.
4. Add `LOGTO_JWKS_URL` and `LOGTO_AUDIENCE` to `config.py` (no defaults) and `.env.example`.
5. Add `pytest` fixtures that inject a mock valid JWT for integration tests; update `conftest.py` to override the auth dependency in the test `app`.

**Routes to protect:** all `/api/v1/*` routes. `/health` remains public.

---

### P0.5.3 — Remove Hardcoded `secret_key` Default (PRD Compliance)
**Priority:** Critical  
**Root cause:** `backend/app/core/config.py:16` sets `secret_key: str = "change-me-in-production"`. PRD scaffold checklist explicitly requires "No hardcoded secrets." If this value reaches production, all tokens signed against it are forgeable.  
**Product impact:** Token forgery; full API access bypass for any attacker who reads the public repo.  
**Files:** `backend/app/core/config.py`

**Remediation:**
```python
# BEFORE
secret_key: str = "change-me-in-production"

# AFTER
secret_key: str   # Required — raises ValidationError at startup if not set in env
```
Update `backend/.env.example` to include `SECRET_KEY=` with no default value and a comment marking it as required. Update CI to inject a test-only value via environment variable.

---

### P0.5.4 — Secure the Copilot Endpoint (Auth + Rate Limiting + Session Isolation)
**Priority:** Critical  
**Root cause:** `POST /api/v1/copilot/chat` and `GET /api/v1/copilot/history/{session_id}` are unauthenticated, unthrottled, and have no session ownership check. The chat endpoint proxies requests directly to OpenRouter, creating a free LLM credit drain vector. The history endpoint lets any caller read any session by guessing a UUID.  
**Product impact:** (1) Unlimited LLM API cost amplification — a single attacker can exhaust the OpenRouter quota. (2) Cross-session data leakage — user A can retrieve user B's conversation history. (3) Error details including internal exceptions are yielded directly into the SSE stream and reach the browser.  
**Files:** `backend/app/api/v1/copilot.py`, `backend/app/services/copilot_service.py`

**Remediation:**
1. Apply `get_current_user` dependency (from P0.5.2) to both copilot endpoints.
2. Bind `session_id` to the authenticated user's identity — store `user_id` on `CopilotMessage` and enforce it in the history query.
3. Add per-user rate limiting on `POST /chat`: 30 requests/minute using `slowapi` (or Redis token bucket once Redis is added per PRD).
4. Replace bare exception yields in `copilot_service.py:147-157` with a generic user-facing message and log the real error via structlog:
```python
# BEFORE
yield f"\n\n[Copilot error: {exc}]"

# AFTER (in copilot_service.py)
logger.error("copilot_stream_error", exc_info=exc)
yield "\n\n[Copilot encountered an error. Please try again.]"
```

---

### P0.5.5 — Fix CORS Configuration
**Priority:** High  
**Root cause:** `main.py` sets `allow_origins=["*"]` with `allow_credentials=True`. Browsers reject this combination — credentialed cross-origin requests (those carrying cookies or `Authorization` headers) are silently blocked by the browser. The frontend API layer is broken for any deployment where frontend and backend are on different origins.  
**Product impact:** All API calls from the deployed frontend fail silently in production (the Next.js rewrite proxy in dev masks this locally). Authentication headers are never transmitted.  
**Files:** `backend/app/api/main.py:24-28`, `backend/app/core/config.py`

**Remediation:**
```python
# config.py — add
allowed_origins: list[str] = ["http://localhost:3036"]

# main.py — replace wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```
Add `ALLOWED_ORIGINS=https://cost.dclaw.io` to `.env.example`.

---

### P0.5.6 — Add Idempotency to Billing and Container Cost Ingest
**Priority:** High  
**Root cause:** `POST /api/v1/billing-records/ingest` and `POST /api/v1/container-costs/ingest` have no deduplication key. Any pipeline failure that triggers a retry creates duplicate billing records, corrupting all downstream cost calculations, budget utilization, RI analysis, showback reports, and carbon estimates.  
**Product impact:** Silent data corruption. All cost figures, savings estimates, and alert thresholds derived from billing data become unreliable after a single failed-retry scenario.  
**Files:** `backend/app/api/v1/billing_records.py`, `backend/app/api/v1/container_costs.py`, `backend/app/models/billing_record.py`, `backend/app/models/container_cost.py`

**Remediation:**
1. Add a `source_record_id` (string, unique) column to `billing_records` and `container_costs` tables.
2. On ingest, use PostgreSQL `INSERT ... ON CONFLICT (source_record_id) DO NOTHING` (via SQLAlchemy `insert().on_conflict_do_nothing()`).
3. Add an Alembic migration for the new unique constraint.
4. Callers supply their billing provider's native record ID as `source_record_id`; the API returns `{ "created": N, "skipped": M }`.

---

### P0.5.7 — Add Observability Stack (PRD Mandate)
**Priority:** High  
**Root cause:** PRD mandates Prometheus + Grafana for monitoring. No APM, error tracking, or structured logging is present. The backend uses neither `structlog` (required by PRD Python rules) nor any metrics exporter. MTTR is unbounded — there is no mechanism to detect production degradation.  
**Product impact:** Production incidents are invisible until a user reports them. The PRD's "No print() — use structlog" rule is violated throughout the backend. DORA MTTR capability is Weak (25/100 DORA score).  
**Files:** `backend/requirements.txt`, `backend/app/api/main.py`, all service files

**Remediation:**
1. Add `structlog`, `prometheus-fastapi-instrumentator` to `requirements.txt`.
2. Initialize structlog in `main.py` before app creation; replace any `print()` calls across service files.
3. Mount Prometheus metrics endpoint: `Instrumentator().instrument(app).expose(app, endpoint="/metrics")`.
4. Add Grafana dashboard definition to `helm/` for the DClaw platform Grafana instance.
5. For error tracking, add `sentry-sdk[fastapi]` and initialize with `SENTRY_DSN` from env (no default).

---

### P0.5.8 — Parallelize Copilot Context Queries
**Priority:** Medium  
**Root cause:** `copilot_service.build_context()` issues 4 sequential `await` database calls. Under any non-trivial load each chat request serializes 4 full DB round-trips before streaming begins, adding unnecessary P99 latency.  
**Product impact:** Copilot first-token latency degrades under load; DB connection pool is held longer per request.  
**Files:** `backend/app/services/copilot_service.py:28-51`

**Remediation:**
```python
import asyncio

total_spend, active_alerts, total_savings, top_services = await asyncio.gather(
    billing_repo.total_spend(first, today),
    alert_repo.count_unacknowledged(),
    rec_repo.total_savings(),
    billing_repo.spend_by_service(first, limit=5),
)
```

---

### P0.5.9 — Raise Test Quality: Service Layer and Business Logic Coverage
**Priority:** Medium  
**Root cause:** Mutation score is 32% — tests assert HTTP response codes and field presence, not business logic correctness. The entire services layer (`alert_service`, `ri_planner_service`, `waste_scanner_service`, `cost_allocation_service`, `spot_strategy_service`, `carbon_service`, `copilot_service`) has zero test coverage. Alert threshold boundaries, RI break-even calculations, waste heuristics, and showback allocation math are all untested.  
**Product impact:** Silent regressions in core FinOps computations. A one-character change to threshold logic (e.g., `>=` → `>`) ships undetected. Mutation score of 32% means 68% of logic mutations are invisible to the test suite.  
**Files:** All files under `backend/app/services/`, `backend/tests/`

**Remediation (priority targets for new tests):**
- `test_alert_service.py`: Assert alert fires at exactly `threshold_pct`; assert no alert at `threshold_pct - 0.1`; test forecast alert 7 days ahead
- `test_ri_planner_service.py`: Verify break-even month calculation; assert 1yr vs 3yr ROI ordering; test zero-spend edge case
- `test_cost_allocation_service.py`: 100% allocation when all tags match; correct `unallocated_spend_usd` when tags are absent
- `test_waste_scanner_service.py`: Each of the 5 waste types is detected under appropriate billing conditions; zero waste on clean accounts
- `test_copilot_service.py`: Session isolation (history from session A absent from session B query); build_context returns correct spend values

---

### P0.5.10 — Add Frontend Test Infrastructure
**Priority:** Medium  
**Root cause:** `web/package.json` has no testing framework. Zero UI regression coverage exists. The frontend CI step (`npm run build`) catches type errors and import failures but not behavioral regressions.  
**Product impact:** Any refactor of the dashboard, copilot widget, or billing explorer can silently break user-facing behavior with no automated detection.  
**Files:** `web/package.json`, `web/vitest.config.ts` (new)

**Remediation:**
1. Add `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event` to `devDependencies`.
2. Add `"test": "vitest run"` to scripts.
3. Add `vitest run` step to the CI workflow after `npm run build`.
4. Initial test targets: `CopilotWidget` (open/close/send flow), `api.ts` `fetchJson` error handling, `DashboardStats` rendering with mock data.

---

### P0.5.11 — Create DPanel Manifest (PRD Gap)
**Priority:** Medium  
**Root cause:** `web/public/dclaw-manifest.json` is missing. PRD scaffold checklist marks this as required for DPanel registration. REVISED-PRD.md §2.1 flags it as ❌.  
**Product impact:** DClaw Cost cannot be registered with DPanel; it is invisible to the DClaw platform hub.  
**Files:** `web/public/dclaw-manifest.json` (new)

**Remediation:** Create `web/public/dclaw-manifest.json`:
```json
{
  "app_id": "cost",
  "name": "DClaw Cost",
  "category": "FinOps",
  "tagline": "Cloud cost optimization",
  "color": "#3B82F6",
  "port": 3077,
  "health_path": "/health",
  "icon": "/icon.svg"
}
```

---

## P1 — Platform Features ✅

### P1.1 — Reserved Instance Planner ✅
### P1.2 — Enhanced Waste Detection ✅
### P1.3 — Cost Allocation ✅
### P1.4 — Container Cost Analysis ✅

---

## P2 — Vertical / Scale Features ✅

### P2.1 — FinOps Reporting ✅
### P2.2 — Spot Instance Strategy ✅
### P2.3 — SaaS Spend Management ✅
### P2.4 — Carbon Cost ✅

---

## API Surface (136 routes)

```
Health:          /health
Core:            /api/v1/cloud-accounts  /api/v1/billing-records
                 /api/v1/budgets  /api/v1/cost-alerts
Optimization:    /api/v1/recommendations  /api/v1/waste-items  /api/v1/dashboard
AI:              /api/v1/copilot/chat  /api/v1/copilot/history/{session_id}
P1:              /api/v1/ri-plans  /api/v1/waste-scan  /api/v1/cost-allocation
                 /api/v1/container-costs
P2:              /api/v1/reports  /api/v1/spot-strategy  /api/v1/saas  /api/v1/carbon
Observability:   /metrics  (new — P0.5.7)
```

All `/api/v1/*` routes require a valid Logto JWT after P0.5.2 lands.

---

## Milestones

### Milestone 1 — CI Unblocked (Day 1)
- [ ] P0.5.1 — Fix `build-frontend.yml` working directory

### Milestone 2 — Safe to Demo (Week 1)
- [ ] P0.5.3 — Remove hardcoded `secret_key` default
- [ ] P0.5.5 — Fix CORS configuration
- [ ] P0.5.11 — Create DPanel manifest

### Milestone 3 — Production-Hardened (Week 2–3)
- [ ] P0.5.2 — Logto JWT authentication on all `/api/v1/*` routes
- [ ] P0.5.4 — Copilot auth + rate limiting + session isolation + error sanitization
- [ ] P0.5.6 — Billing ingest idempotency

### Milestone 4 — Observable & Resilient (Week 3–4)
- [ ] P0.5.7 — Prometheus metrics + structlog + Sentry DSN
- [ ] P0.5.8 — Parallelize copilot context queries

### Milestone 5 — Quality Baseline (Week 4–6)
- [ ] P0.5.9 — Service layer tests (mutation score target: ≥ 60%)
- [ ] P0.5.10 — Frontend vitest infrastructure

---

## Implementation Priority (v1.4 ordering)

Previous P0–P2 feature work (completed):
1. Foundation — 13 models, alembic migrations, config
2. P0.2 Multi-Cloud Billing
3. P0.4 Budget Alerts
4. P0.3 Right-Sizing
5. P0.1 AI Copilot (streaming + widget)
6. P1.1–P1.4 (RI Planner, Waste Detection, Cost Allocation, Container Costs)
7. P2.1–P2.4 (FinOps Reporting, Spot Strategy, SaaS, Carbon)

New work from this plan (P0.5, in order):
8. **P0.5.1** — Fix frontend CI directory (5 min, immediate unblock)
9. **P0.5.3** — Remove hardcoded secret_key default
10. **P0.5.5** — Fix CORS configuration
11. **P0.5.11** — DPanel manifest
12. **P0.5.2** — Logto JWT authentication (largest effort; required before P0.5.4)
13. **P0.5.4** — Copilot auth + rate limit + session isolation + error sanitization
14. **P0.5.6** — Billing/container ingest idempotency
15. **P0.5.7** — Observability stack (structlog + Prometheus + Sentry)
16. **P0.5.8** — Parallelize copilot context queries
17. **P0.5.9** — Service layer test coverage
18. **P0.5.10** — Frontend test infrastructure
