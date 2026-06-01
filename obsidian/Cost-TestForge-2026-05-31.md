# DClaw Cost — TestForge Security & Reliability Audit

> Run date: 2026-05-31 · Tool: TestForge MCP · Commit: `98e9bb1`
> Score: **71/100** · 54 test files · 275 pytest cases · 12 synthetic Tier-2 tests (all passed)
> Analysed by: Claude Sonnet 4.6

---

## Executive Summary

| Priority | Finding | Layer | Risk |
|---|---|---|---|
| P0 | All 136 API routes unauthenticated | Backend | Full data exposure |
| P0 | Frontend CI pipeline broken | CI/CD | Frontend images never rebuilt |
| P0 | Hardcoded `secret_key` default | Backend config | Token forgery |
| P0 | Copilot unprotected LLM proxy | Backend copilot | Unlimited credit drain |
| P1 | CORS wildcard + credentials | Backend | Silent prod API failures |
| P1 | Billing ingest no idempotency | Backend ingest | Silent data duplication |
| P1 | No observability stack | Backend + CI | MTTR unbounded |
| P2 | Mutation score 32/100 | Backend tests | 68% of logic changes undetected |
| P2 | Frontend zero tests | Frontend | No UI regression guard |
| P3 | DORA score 25/100 | CI/CD | No deployment frequency signal |

---

## Security Score 0/100 — FALSE POSITIVE (do not act on)

The scanner reported 933 findings (540 critical, 386 high) for XSS via `write()`.

> [!note] Every finding is in `web/node_modules/object-hash/index.js`. The `write()` calls are Node.js stream writes to a `crypto.createHash()` stream — not DOM writes. Zero XSS exposure in application code. The actual JS/TSX under `web/src/` is not flagged.

**Action:** No application code change needed. Scanner limitation — `node_modules/` should be excluded from future scans.

---

## Finding T1 — All 136 Routes Unauthenticated [CRITICAL]

**File:** `backend/app/api/main.py`, `backend/app/core/config.py`
**Root cause:** `config.py` declares `secret_key` and `access_token_expire_minutes` (implying JWT auth was designed) but neither is wired to any route or middleware. Every endpoint is publicly accessible.
**Impact:** Anyone who can reach the API can read, write, and delete all FinOps data including cloud account credentials, billing records, and cost allocations.
**Fix:** See [[Cost-v1.4-Roadmap]] § P0.5.2.

---

## Finding T2 — Frontend CI Uses Wrong Directory [CRITICAL]

**File:** `.github/workflows/build-frontend.yml`
**Root cause:** `working-directory: ./frontend` — directory does not exist. Frontend moved to `./web` in commit `98e9bb1` but the CI workflow was never updated.
**Impact:** Every push to `main` runs the frontend build against the wrong path. Frontend Docker images have never been built from the current source. The deploy workflow chains on `Build Frontend` — meaning frontend deploys are silently broken.
**Fix:** Change `./frontend` → `./web` in the workflow. See [[Cost-v1.4-Roadmap]] § P0.5.1.

---

## Finding T3 — Hardcoded Default Secret Key [CRITICAL]

**File:** `backend/app/core/config.py:16`
**Root cause:** `secret_key: str = "change-me-in-production"` committed to a public repo.
**Impact:** All tokens signed with this key are forgeable by any attacker who reads the repo.
**Fix:** `secret_key: str` — required env var, no default. See [[Cost-v1.4-Roadmap]] § P0.5.3.

---

## Finding T4 — Copilot Is an Open LLM Proxy [CRITICAL]

**File:** `backend/app/api/v1/copilot.py`, `backend/app/services/copilot_service.py`
**Root cause:**
1. No authentication on `POST /api/v1/copilot/chat` — any caller burns OpenRouter quota.
2. `session_id` is user-supplied; `GET /copilot/history/{session_id}` has no ownership check — user A can read user B's chat history.
3. Internal exceptions yielded raw into the SSE stream (internal error details reach the browser).
**Impact:** Credit drain attack, cross-session data leakage, potential config value exposure.
**Fix:** Auth + rate limiting + session ownership FK + sanitized error messages. See [[Cost-v1.4-Roadmap]] § P0.5.4.

---

## Finding T5 — CORS Wildcard + Credentials (Browser-Rejected) [HIGH]

**File:** `backend/app/api/main.py:24-28`
**Root cause:** `allow_origins=["*"]` with `allow_credentials=True`. Browsers reject this combination for credentialed requests — silently failing all cross-origin API calls in production.

```python
# Current (broken in production)
CORSMiddleware(allow_origins=["*"], allow_credentials=True, ...)

# Fix
CORSMiddleware(allow_origins=settings.allowed_origins, allow_credentials=True, ...)
```

**Fix:** See [[Cost-v1.4-Roadmap]] § P0.5.5.

---

## Finding T6 — Billing Ingest Has No Idempotency [HIGH]

**Files:** `backend/app/api/v1/billing_records.py`, `backend/app/models/billing_record.py`
**Root cause:** `POST /api/v1/billing-records/ingest` has no deduplication key. Any pipeline failure that triggers a retry creates duplicate billing records, silently corrupting all downstream cost calculations, budget utilization, RI analysis, showback reports, and carbon estimates.
**Fix:** Add `source_record_id` unique column. `INSERT ... ON CONFLICT (source_record_id) DO NOTHING`. See [[Cost-v1.4-Roadmap]] § P0.5.6.

---

## Finding T7 — No Observability Stack [HIGH]

**Root cause:** PRD mandates structlog (Python rules: "No print() — use structlog") and Prometheus + Grafana for monitoring. None are present. No Sentry. DORA MTTR capability: Weak.
**DORA score: 25/100.**
**Fix:** `structlog>=24.1.0`, `prometheus-fastapi-instrumentator`, `sentry-sdk[fastapi]`. See [[Cost-v1.4-Roadmap]] § P0.5.7.

---

## Finding T8 — Mutation Score 32/100 [MEDIUM]

**Root cause:** Tests assert HTTP status codes and field presence — not business logic. All 8 service files (`alert_service`, `ri_planner_service`, `waste_scanner_service`, etc.) have zero test coverage. 68% of logic mutants survive the test suite undetected.

**Boundary conditions with no test coverage:**
| Scenario | Risk |
|---|---|
| Alert fires at exactly `threshold_pct` (not below) | Boundary regression kills FinOps alerting |
| RI break-even month calculation | Silent wrong savings estimate |
| Waste detection on zero-record account | Division-by-zero path |
| Copilot session isolation (A cannot see B's history) | Cross-tenant data leak |
| Budget period rollover | Stale spend figures |

**Fix:** New test files targeting service-layer boundaries. Target mutation score ≥ 60%. See [[Cost-v1.4-Roadmap]] § P0.5.9.

---

## Finding T9 — Sequential Copilot Context Queries [MEDIUM]

**File:** `backend/app/services/copilot_service.py:28-51`
**Root cause:** `build_context()` issues 4 sequential `await` DB calls. Under load, serialized round-trips add unnecessary latency to every copilot request.
**Fix:** `await asyncio.gather(...)` — single parallel round-trip. See [[Cost-v1.4-Roadmap]] § P0.5.8.

---

## Stack Score 47/100 — FALSE NEGATIVE

The TestForge Stack analyzer is JS/TS-only. It reports "No testing framework" and "No ORM" because it cannot parse Python. The backend has:
- `pytest` + `pytest-asyncio` (54 test files, 275 cases)
- `SQLAlchemy 2.0` async ORM with 13 models
- `Alembic` migrations (3 migration files)

Stack score should be discounted for the Python backend.

---

## Tier-2 Synthetic Tests

All 12 tests passed. These validate the *pattern* of each fix — not the application itself:

| File | Tests | Status |
|---|---|---|
| `auth-endpoints-not-rate-limited-src-l0.test.ts` | 4 | ✅ All passed |
| `no-observability-stack-detected-src-l0.test.ts` | 4 | ✅ All passed |
| `no-product-analytics-dependency-src-l0.test.ts` | 4 | ✅ All passed |

---

## Code Smells (Low Priority)

| Location | Issue | Severity |
|---|---|---|
| `copilot.py` post-stream | Fresh `AsyncSession` created inline — bypasses DI | Low |
| `copilot_service.py` | `yield f"\n\n[Copilot error: {exc}]"` exposes internals | Medium |
| `billing_records.py` ingest | No `source_record_id` — silent duplicates on retry | High (tracked as T6) |

---

## Links

- Full analysis: `testforge/test_analysis.md`
- Remediation plan: [[Cost-v1.4-Roadmap]] (P0.5.1–P0.5.11)
- Raw scan JSON: `testforge/testforge-dclaw-cost.json`
- Tier-2 tests: `testforge/tier2.json`
- [[Cost-Architecture]] — stack, ports, anti-patterns
