# DClaw Cost — v1.4 Roadmap

> Source of truth: `dclaw-cost/PLAN-v1.4.md`
> Architecture rules: `dclaw-cost/AGENTS.md`
> Last updated: June 2026 · **v1.4 — all features live, security hardening next**

---

## Status Summary

| Phase | Items | Status |
|---|---|---|
| P0 Foundation | AI Copilot, Multi-Cloud Billing, Right-Sizing, Budget Alerts | ✅ Done |
| P1 Platform | RI Planner, Waste Detection, Cost Allocation, Container Costs | ✅ Done |
| P2 Scale | FinOps Reports, Spot Strategy, SaaS Spend, Carbon Footprint | ✅ Done |
| Landing page | Marketing landing, OC design system, Roadmap section | ✅ Done |
| Infographics | `Infographics/architecture-diagram.md`, `dclaw-cost-infograph.html` | ✅ Done |
| Slides | `slides/deck-content.md`, `dclaw-cost-deck.html` | ✅ Done |
| Docs | README, PRODUCT-SPEC, TestForge analysis, PLAN-v1.4 | ✅ Done |
| P0.5 Security | 11 hardening items (CI fix, auth, CORS, observability) | 🔲 Next sprint |

---

## Failure Analysis Sources

| Source | Date | Score | Findings |
|---|---|---|---|
| TestForge static analysis | 2026-05-31 | 71/100 | Security, mutation, DORA, accessibility |

See [[Cost-TestForge-2026-05-31]] for full findings.

---

## P0.5 — Security & Reliability Hardening (Current Sprint)

### P0.5.1 — Fix Broken Frontend CI [CRITICAL]

**File:** `.github/workflows/build-frontend.yml`
**Root cause:** `working-directory: ./frontend` — directory doesn't exist. Frontend is at `./web` since commit `98e9bb1`.
**Impact:** Frontend Docker images have never been built from the correct source. All frontend deploys have been stale.
**Fix:** Change all `working-directory` references from `./frontend` to `./web`.

---

### P0.5.2 — Logto JWT Authentication [CRITICAL]

**Files:** `backend/app/core/config.py`, `backend/app/api/main.py`, all `backend/app/api/v1/*.py`
**Root cause:** PRD mandates "Logto — JWT validation on all protected routes." `config.py` has `secret_key` and `access_token_expire_minutes` but neither is wired to any route or middleware. All 136 endpoints are public.
**Fix:**
1. Add `python-jose[cryptography]` to `requirements.txt`
2. Create `backend/app/core/auth.py` — `get_current_user` dependency validating Logto JWTs
3. Apply `dependencies=[Depends(get_current_user)]` at router level in `main.py`
4. Add `LOGTO_JWKS_URL`, `LOGTO_AUDIENCE` to config (required, no defaults)

---

### P0.5.3 — Remove Hardcoded Secret Key [CRITICAL]

**File:** `backend/app/core/config.py:16`
**Root cause:** `secret_key: str = "change-me-in-production"` — committed to public repo.
**Fix:** `secret_key: str` (no default) — raises `ValidationError` at startup if missing.

---

### P0.5.4 — Copilot Security [CRITICAL]

**Files:** `backend/app/api/v1/copilot.py`, `backend/app/services/copilot_service.py`
**Root cause:** POST `/api/v1/copilot/chat` is unauthenticated, unthrottled, no session ownership. Any caller burns OpenRouter credits. `session_id` not bound to user identity. Exceptions yielded raw into SSE stream.
**Fix:** Auth dependency, per-user rate limiting (30 req/min via `slowapi`), session ownership FK, sanitized SSE error messages.

---

### P0.5.5 — Fix CORS [HIGH]

**File:** `backend/app/api/main.py:24-28`
**Root cause:** `allow_origins=["*"]` + `allow_credentials=True` — browsers reject this. Credentialed cross-origin requests silently fail in production.
**Fix:** `allow_origins=settings.allowed_origins` — scoped list from env.

---

### P0.5.6 — Billing Ingest Idempotency [HIGH]

**Files:** `backend/app/api/v1/billing_records.py`, `backend/app/models/billing_record.py`
**Root cause:** No deduplication key on ingest. Pipeline retries create duplicate billing records, corrupting all cost calculations.
**Fix:** Add `source_record_id` unique column. `INSERT ... ON CONFLICT DO NOTHING`. New Alembic migration.

---

### P0.5.7 — Observability Stack [HIGH]

**Files:** `requirements.txt`, `backend/app/api/main.py`, all service files
**Root cause:** PRD mandates structlog (no print()). No Prometheus metrics, no Sentry. MTTR unbounded.
**Fix:** `structlog>=24.1.0`, `prometheus-fastapi-instrumentator`, `sentry-sdk[fastapi]`. Expose `/metrics`.

---

### P0.5.8 — Parallelize Copilot Context Queries [MEDIUM]

**File:** `backend/app/services/copilot_service.py:28-51`
**Root cause:** 4 sequential `await` DB calls in `build_context()`. Single-round-trip latency wasted.
**Fix:** `await asyncio.gather(billing_repo.total_spend(...), alert_repo.count_unacknowledged(), ...)`.

---

### P0.5.9 — Service-Layer Tests [MEDIUM]

**Files:** All `backend/app/services/`, `backend/tests/`
**Root cause:** Mutation score 32%. Tests assert HTTP status codes, not business logic. Alert threshold boundaries, RI break-even math, waste heuristics — all untested.
**Target:** Mutation score ≥ 60%. New test files: `test_alert_service.py`, `test_ri_planner_service.py`, `test_cost_allocation_service.py`, `test_waste_scanner_service.py`.

---

### P0.5.10 — Frontend Test Infrastructure [MEDIUM]

**File:** `web/package.json`
**Root cause:** Zero frontend tests. No vitest, no jest. Build step ≠ test step.
**Fix:** Add `vitest`, `@testing-library/react`, `@testing-library/user-event`. Add `test` script. Add CI step.

---

### P0.5.11 — DPanel Manifest [MEDIUM]

**File:** `web/public/dclaw-manifest.json` (missing)
**Root cause:** PRD scaffold checklist requires it. App invisible to DPanel hub.
**Fix:** Create manifest with `app_id: "cost"`, `name`, `color`, `port`, `health_path`.

---

## Implementation Order (P0.5)

```
P0.5.1  Fix frontend CI           ← 5 min, unblocks frontend deploys
P0.5.3  Remove hardcoded secret   ← 5 min, prevents credential exposure
P0.5.5  Fix CORS                  ← 15 min, fixes silent prod API failures
P0.5.11 DPanel manifest           ← 10 min
P0.5.2  Logto JWT auth            ← 1-2 days, required before P0.5.4
P0.5.4  Copilot security          ← 30 min (after P0.5.2)
P0.5.6  Billing idempotency       ← 2h (model + migration + endpoint)
P0.5.7  Observability             ← 2h
P0.5.8  Parallel context queries  ← 15 min
P0.5.9  Service-layer tests       ← 2-3 days (raises mutation score)
P0.5.10 Frontend vitest           ← 1h
```

---

## Phase 2 — Intelligence (Next Quarter)

- Redis cache layer for dashboard aggregations
- Proactive copilot: daily spend digest push
- Budget forecast accuracy feedback loop
- Multi-tenancy: per-org data isolation with JWT claims

## Phase 3 — Agentic (Following Quarter)

- AWS CUR / GCP BQ export / Azure EA billing integrations
- Real utilization metrics (not billing-derived estimates)
- Streaming waste scan with progress SSE
- Copilot tool-use: create budget / acknowledge alert via chat

---

## Related Notes

- [[Cost-Architecture]] — stack, ports, anti-patterns, API surface
- [[Cost-TestForge-2026-05-31]] — TestForge audit that produced P0.5 items
