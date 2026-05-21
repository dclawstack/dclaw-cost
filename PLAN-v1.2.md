# DClaw Cost — Feature Roadmap v1.2

> 📘 **REVISED PRD v2.3 is the source of truth.** See `REVISED-PRD.md` for gap analysis, AI mandates, and acceptance criteria.
> **For coding agents:** Pick features from this list, implement them fully, and update this doc with a checkmark.
> **Do NOT change the basic stack.** See `AGENTS.md` for architecture lock.

## Pre-Flight Checklist

- [x] `frontend/package-lock.json` committed after `npm install`
- [x] `frontend/next-env.d.ts` exists and committed
- [x] `frontend/.gitignore` excludes `node_modules/` and `.next/`
- [x] `docker-compose.yml` healthchecks use `python urllib.request.urlopen()` (backend) and `wget -q --spider` (frontend)
- [x] `frontend/Dockerfile` declares `ARG NEXT_PUBLIC_API_URL` before `RUN npm run build`
- [x] `frontend/public/dclaw-manifest.json` created for DPanel registration
- [x] `backend/.env.example` present with all required variables

---

## Core Entities Implemented

| Entity | Table | Files |
|--------|-------|-------|
| CloudAccount | `cloud_accounts` | model, schema, repo, router |
| BillingRecord | `billing_records` | model, schema, repo, router |
| Budget | `budgets` | model, schema, repo, router |
| CostAlert | `cost_alerts` | model, schema, repo, router |
| ResourceRecommendation | `resource_recommendations` | model, schema, repo, router |
| WasteItem | `waste_items` | model, schema, repo, router |
| CopilotMessage | `copilot_messages` | model, schema, repo, router |
| ReservedInstancePlan | `ri_plans` | model, schema, repo, router |
| TagAllocation | `tag_allocations` | model, schema, repo, router |
| ContainerCost | `container_costs` | model, schema, repo, router |
| SaasSubscription | `saas_subscriptions` | model, schema, repo, router |
| SpotStrategy | `spot_strategies` | model, schema, repo, router |
| CarbonRecord | `carbon_records` | model, schema, repo, router |

---

## P0 — Foundation (Must Have — Demo Ready) ✅

### P0.1 — AI Cost Copilot ✅
- **Backend:** `POST /api/v1/copilot/chat` — streaming SSE via OpenRouter (Kimi K2)
- **Backend:** `GET /api/v1/copilot/history/{session_id}` — conversation history
- **Service:** `copilot_service.py` — context-aware prompt with live spend/alert data
- **Frontend:** `/copilot` full-page chat + `CopilotWidget` floating on every page
- **Files:** `app/models/copilot_message.py`, `app/api/v1/copilot.py`, `app/services/copilot_service.py`, `src/app/copilot/page.tsx`, `src/components/CopilotWidget.tsx`

### P0.2 — Multi-Cloud Billing ✅
- **Backend:** Full CRUD for CloudAccount + BillingRecord bulk ingest
- **Endpoints:** `GET|POST /api/v1/cloud-accounts/`, `POST /api/v1/billing-records/ingest`
- **Frontend:** `/cloud-accounts` (connect AWS/GCP/Azure/on-prem) + `/billing` (cost explorer with filters)
- **Files:** `app/models/cloud_account.py`, `app/models/billing_record.py`, `src/app/cloud-accounts/page.tsx`, `src/app/billing/page.tsx`

### P0.3 — Resource Right-Sizing ✅
- **Backend:** Heuristic analyzer generates `ResourceRecommendation` + `WasteItem` from 30-day billing
- **Endpoint:** `POST /api/v1/recommendations/analyze/{account_id}`
- **Frontend:** `/recommendations` — tabbed Recommendations / Waste Items with Apply/Dismiss
- **Files:** `app/services/analyzer_service.py`, `src/app/recommendations/page.tsx`

### P0.4 — Budget Alerts ✅
- **Backend:** `alert_service.py` runs after every ingest — creates threshold + forecast alerts
- **Endpoints:** Full CRUD `/api/v1/budgets/`, `PUT /api/v1/cost-alerts/{id}/acknowledge`
- **Frontend:** `/budgets` — budget cards with live utilization bars + alert history
- **Files:** `app/services/alert_service.py`, `src/app/budgets/page.tsx`

---

## P1 — Platform Features (Should Have — v1.1–1.2) ✅

### P1.1 — Reserved Instance Planner ✅
- **Backend:** Analyzes 90d billing; generates 6 commitment types (1yr/3yr × no-upfront/partial/all-upfront)
- **Service:** Break-even calculation, annual savings, discount modeling
- **Endpoints:** `POST /api/v1/ri-plans/analyze/{account_id}`, `GET /api/v1/ri-plans/{account_id}`, `PUT /api/v1/ri-plans/{plan_id}/status`
- **Frontend:** `/ri-planner` — proposed/accepted tabs with accept/reject per plan
- **Files:** `app/models/ri_plan.py`, `app/services/ri_planner_service.py`, `app/api/v1/ri_plans.py`, `src/app/ri-planner/page.tsx`

### P1.2 — Enhanced Waste Detection ✅
- **Backend:** `waste_scanner_service.py` — detects 5 waste types from billing patterns
- **Waste types:** idle, orphaned, unused_ip, unattached_volume, old_snapshot
- **Endpoint:** `POST /api/v1/waste-scan/scan/{account_id}`
- **Frontend:** `/waste` dedicated page with per-type counts and deep-scan trigger
- **Files:** `app/services/waste_scanner_service.py`, `app/api/v1/waste_scan.py`, `src/app/waste/page.tsx`

### P1.3 — Cost Allocation ✅
- **Backend:** `TagAllocation` model maps tag key+value → team/project; showback report engine
- **Service:** `cost_allocation_service.py` — matches billing record tags to allocation rules
- **Endpoints:** CRUD `/api/v1/cost-allocation/rules`, `GET /api/v1/cost-allocation/showback`
- **Frontend:** `/cost-allocation` — allocation rules manager + team showback report
- **Files:** `app/models/tag_allocation.py`, `app/services/cost_allocation_service.py`, `app/api/v1/cost_allocation.py`, `src/app/cost-allocation/page.tsx`

### P1.4 — Container Cost Analysis ✅
- **Backend:** `ContainerCost` model with per-pod CPU + memory cost; namespace aggregation
- **Endpoints:** `POST /api/v1/container-costs/ingest`, `GET /api/v1/container-costs/namespaces/{account_id}`
- **Frontend:** `/container-costs` — namespace breakdown with share bars and pod counts
- **Files:** `app/models/container_cost.py`, `app/api/v1/container_costs.py`, `src/app/container-costs/page.tsx`

---

## P2 — Vertical / Scale Features (Could Have — v1.3+) ✅

### P2.1 — FinOps Reporting ✅
- **Backend:** 12-month trend analysis + 6 unit economics metrics + AI insights
- **Endpoint:** `GET /api/v1/reports/finops?months=12`
- **Frontend:** `/reports` — bar chart trend, unit economics grid, MoM table
- **Files:** `app/api/v1/reports.py`, `src/app/reports/page.tsx`

### P2.2 — Spot Instance Strategy ✅
- **Backend:** Classifies workloads (batch/stateless/stateful) + 70% spot discount modeling
- **Service:** `spot_strategy_service.py` — interruption risk scoring
- **Endpoints:** `POST /api/v1/spot-strategy/analyze/{account_id}`, `GET /api/v1/spot-strategy/{account_id}/summary`
- **Frontend:** `/spot-strategy` — recommendations with risk badges + accept/reject
- **Files:** `app/models/spot_strategy.py`, `app/services/spot_strategy_service.py`, `app/api/v1/spot_strategy.py`, `src/app/spot-strategy/page.tsx`

### P2.3 — SaaS Spend Management ✅
- **Backend:** Full CRUD for SaasSubscription (vendor, category, seats, renewal date, cost-per-seat)
- **Endpoints:** CRUD `/api/v1/saas/`, `GET /api/v1/saas/summary`
- **Frontend:** `/saas` — subscription table + 30-day renewal alerts + category breakdown
- **Files:** `app/models/saas_subscription.py`, `app/api/v1/saas.py`, `src/app/saas/page.tsx`

### P2.4 — Carbon Cost ✅
- **Backend:** 19-region carbon intensity table (gCO2eq/kWh); kWh estimated from billing cost by service
- **Service:** `carbon_service.py` — green region suggestions, greenest/dirtiest region
- **Endpoints:** `POST /api/v1/carbon/calculate/{account_id}`, `GET /api/v1/carbon/{account_id}/summary`
- **Frontend:** `/carbon` — CO2 by service + region, green migration suggestions
- **Files:** `app/models/carbon_record.py`, `app/services/carbon_service.py`, `app/api/v1/carbon.py`, `src/app/carbon/page.tsx`

---

## API Surface (58 routes)

```
Core:            /health /api/v1/cloud-accounts /api/v1/billing-records
                 /api/v1/budgets /api/v1/cost-alerts
Optimization:    /api/v1/recommendations /api/v1/waste-items /api/v1/dashboard
AI:              /api/v1/copilot/chat /api/v1/copilot/history/{session_id}
P1:              /api/v1/ri-plans /api/v1/waste-scan /api/v1/cost-allocation
                 /api/v1/container-costs
P2:              /api/v1/reports /api/v1/spot-strategy /api/v1/saas /api/v1/carbon
```

## Implementation Priority (completed order)

1. Foundation (config, 13 models, alembic migrations)
2. P0.2 Multi-Cloud Billing (cloud accounts + billing ingest)
3. P0.4 Budget Alerts (budgets + alert service)
4. P0.3 Right-Sizing (recommendations + waste items + analyzer)
5. P0.1 AI Copilot (streaming chat + widget)
6. P1.1 RI Planner
7. P1.2 Enhanced Waste Detection
8. P1.3 Cost Allocation
9. P1.4 Container Cost Analysis
10. P2.1 FinOps Reporting
11. P2.2 Spot Strategy
12. P2.3 SaaS Spend Management
13. P2.4 Carbon Cost
