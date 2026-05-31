# PRODUCT-SPEC: DClaw Cost

> This document tells coding agents WHAT to build.
> Separate from `AGENTS.md` (HOW to build) and `PLAN-v1.4.md` (WHEN to build).
> **Source of truth:** `REVISED-PRD.md`. In any conflict, defer to `REVISED-PRD.md`.

---

## Overview

| Field | Value |
|-------|-------|
| **App Name** | DClaw Cost |
| **App ID** | `cost` |
| **Domain** | FinOps — Cloud Cost Optimization |
| **Target Users** | Platform engineers, FinOps teams, engineering managers |
| **Backend Port** | `8122` (FastAPI, docker-compose) |
| **Frontend Port** | `3036` (Next.js, docker-compose) |
| **Database** | `dclaw_cost` (PostgreSQL 16) |
| **AI Provider** | OpenRouter (primary) → Ollama (local fallback) |
| **Status** | P0/P1/P2 features complete · P0.5 hardening in progress |

---

## Core Domain Models

### CloudAccount
```
CloudAccount
├── id: UUID (PK)
├── name: str (required)
├── provider: enum ["aws", "gcp", "azure", "on_prem"]
├── external_account_id: str (cloud-side account/project ID)
├── status: enum ["active", "inactive", "error"] (default: "active")
├── created_at: datetime
└── updated_at: datetime
```

### BillingRecord
```
BillingRecord
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── resource_id: str (cloud resource identifier)
├── resource_type: str (e.g. "ec2_instance", "gcs_bucket")
├── service: str (e.g. "EC2", "BigQuery")
├── region: str
├── cost_usd: float
├── usage_quantity: float
├── usage_unit: str (e.g. "GB", "hours")
├── billing_period_start: date
├── billing_period_end: date
├── tags: JSON (key-value pairs, optional)
└── created_at: datetime
```
> **Pending (P0.5.6):** Add `source_record_id` unique column for ingest idempotency.

### Budget
```
Budget
├── id: UUID (PK)
├── name: str
├── amount_usd: float
├── period: enum ["daily", "weekly", "monthly", "quarterly", "annual"] (default: "monthly")
├── scope: enum ["account", "service", "tag", "team"]
├── scope_value: str (which account/service/tag/team)
├── alert_threshold_pct: int (0–100, default: 80)
├── status: enum ["active", "inactive"] (default: "active")
├── created_at: datetime
└── updated_at: datetime
```

### CostAlert
```
CostAlert
├── id: UUID (PK)
├── budget_id: UUID (FK → Budget CASCADE)
├── alert_type: enum ["threshold", "anomaly", "forecast"]
├── current_spend_usd: float
├── projected_spend_usd: float (optional — set for forecast alerts)
├── message: str
├── severity: enum ["info", "warning", "critical"]
├── acknowledged: bool (default: false)
└── created_at: datetime
```

### ResourceRecommendation
```
ResourceRecommendation
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── resource_id: str
├── resource_type: str
├── recommendation_type: enum ["right_size", "reserved_instance", "spot", "delete", "schedule"]
├── current_cost_usd: float
├── estimated_savings_usd: float
├── confidence: int (0–100)
├── details: JSON (provider-specific metadata, optional)
├── status: enum ["open", "applied", "dismissed"] (default: "open")
├── created_at: datetime
└── updated_at: datetime
```

### WasteItem
```
WasteItem
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── resource_id: str
├── resource_type: str
├── waste_type: enum ["idle", "orphaned", "unused_ip", "unattached_volume", "old_snapshot"]
├── estimated_monthly_waste_usd: float
├── last_used_at: datetime (optional)
├── status: enum ["open", "remediated", "ignored"] (default: "open")
└── created_at: datetime
```

### CopilotMessage
```
CopilotMessage
├── id: UUID (PK)
├── session_id: str (client-generated session identifier)
├── role: enum ["user", "assistant"]
├── content: text
└── created_at: datetime
```
> **Pending (P0.5.4):** Add `user_id` FK to bind sessions to authenticated users.

### ReservedInstancePlan (RIPlan)
```
RIPlan
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── service: str
├── resource_type: str
├── commitment_type: str (e.g. "1yr-no-upfront", "3yr-all-upfront")
├── term_years: int (1 or 3)
├── monthly_on_demand_cost: float
├── monthly_ri_cost: float
├── upfront_cost: float
├── monthly_savings: float
├── annual_savings: float
├── break_even_months: int
├── discount_pct: float
├── status: enum ["proposed", "accepted", "rejected"] (default: "proposed")
├── created_at: datetime
└── updated_at: datetime
```

### TagAllocation
```
TagAllocation
├── id: UUID (PK)
├── tag_key: str (e.g. "team", "env")
├── tag_value: str (e.g. "platform", "production")
├── team: str
├── project: str (optional)
├── created_at: datetime
└── updated_at: datetime
```

### ContainerCost
```
ContainerCost
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── cluster: str
├── namespace: str
├── pod_name: str (optional — null for namespace-level aggregates)
├── cpu_cores_requested: float
├── memory_gb_requested: float
├── cpu_cost_usd: float
├── memory_cost_usd: float
├── total_cost_usd: float
├── period_start: datetime
├── period_end: datetime
└── created_at: datetime
```

### SaasSubscription
```
SaasSubscription
├── id: UUID (PK)
├── name: str
├── vendor: str
├── category: str (e.g. "Productivity", "DevTools", "Security")
├── monthly_cost_usd: float
├── annual_cost_usd: float
├── seat_count: int (optional)
├── cost_per_seat_usd: float (optional)
├── renewal_date: date (optional)
├── owner: str (optional)
├── status: enum ["active", "inactive", "under_review"]
├── notes: text (optional)
├── created_at: datetime
└── updated_at: datetime
```

### SpotStrategy
```
SpotStrategy
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── resource_id: str
├── resource_type: str
├── service: str
├── region: str
├── workload_type: enum ["batch", "stateless", "stateful"]
├── current_monthly_cost: float
├── spot_monthly_cost: float
├── estimated_savings_usd: float
├── savings_pct: float
├── interruption_risk: enum ["low", "medium", "high"]
├── recommendation: str
├── status: enum ["proposed", "accepted", "rejected"]
├── created_at: datetime
└── updated_at: datetime
```

### CarbonRecord
```
CarbonRecord
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount CASCADE)
├── service: str
├── region: str
├── estimated_kwh: float
├── carbon_intensity_gco2_kwh: float (19-region intensity table)
├── co2_kg: float
├── cost_usd: float
├── period_start: datetime
├── period_end: datetime
└── created_at: datetime
```

---

## Screens & User Stories

### Screen 1: Landing Page (`/`)
Marketing page. Hero section, feature highlights, architecture overview, GitHub link, and CTA to enter the app dashboard.

### Screen 2: Dashboard (`/dashboard`)
- Summary cards: total monthly spend, projected spend, total savings opportunities, active alert count
- Top 5 cost drivers by service (bar visualization)
- Budget utilization bars (% consumed per budget)
- Recent alert feed
- Quick actions: Connect Account, Create Budget, Scan Waste

### Screen 3: Cloud Accounts (`/cloud-accounts`)
- Table of connected accounts with provider badge (AWS/GCP/Azure/On-Prem), status indicator, external account ID
- "Connect Account" modal: name, provider dropdown, external account ID
- Delete account (cascades all related records)

### Screen 4: Billing & Cost Explorer (`/billing`)
- Date-range filter (default: current month)
- Filter by cloud account, service, region
- Grouped cost table with totals
- Tag coverage indicator (% tagged resources)

### Screen 5: Budgets & Alerts (`/budgets`)
- Budget cards with period, amount, current spend, % utilization bar, status badge
- Alert history: type, severity, budget name, timestamp, acknowledge toggle
- Create/edit/delete budget
- Alert severity breakdown (info / warning / critical)

### Screen 6: Recommendations (`/recommendations`)
- Tabbed view: Right-Sizing | Reserved Instances | Spot | Waste Items
- Per-row: resource ID, type, current monthly cost, estimated savings, confidence bar, status
- Apply / Dismiss per-recommendation
- Aggregate savings summary header

### Screen 7: Waste Items (`/waste`)
- Filterable by waste type and status
- Per-resource waste summary with estimated monthly cost and last-used timestamp
- "Deep Scan" trigger button → calls `/api/v1/waste-scan/scan/{account_id}`
- Remediate / Ignore per item

### Screen 8: AI Cost Copilot (`/copilot`)
- Full-page chat interface with conversation history per session
- Floating `CopilotWidget` accessible on every app page (bottom-right)
- Context-aware: knows current month spend, open alerts, top savings opportunities
- Streaming SSE responses
- Falls back to local Ollama when OpenRouter is unavailable

### Screen 9: RI Planner (`/ri-planner`)
- Tabs: Proposed | Accepted | Rejected
- Per-plan: service, resource type, commitment type (1yr/3yr × upfront variants), monthly savings, annual savings, break-even months, discount %
- Accept / Reject action per plan
- Trigger new RI analysis per account

### Screen 10: Cost Allocation (`/cost-allocation`)
- Allocation rules table: tag key → tag value → team → project mapping
- Add / delete rules
- Showback report: period picker → team/project cost breakdown with % of total and unallocated spend

### Screen 11: Container Costs (`/container-costs`)
- Namespace summary: cluster, namespace, total cost, CPU cost, memory cost, pod count, avg cost/pod
- Period filter
- Expandable pod-level detail

### Screen 12: FinOps Reports (`/reports`)
- 12-month spend trend bar chart
- Unit economics grid (6 metrics: cost per customer, per API call, per pod, etc.)
- AI-generated executive insights
- Month-over-month comparison table

### Screen 13: Spot Strategy (`/spot-strategy`)
- Workload grid: batch/stateless/stateful classification with interruption risk badge
- Estimated savings per resource + overall summary
- Accept / Reject per strategy

### Screen 14: SaaS Spend (`/saas`)
- Subscription table: vendor, category, monthly cost, seat count, cost/seat, renewal date, status
- 30-day renewal alert banner
- Category breakdown chart
- Add / edit / delete subscription

### Screen 15: Carbon Footprint (`/carbon`)
- CO₂ by service (sorted descending)
- CO₂ by region with avg carbon intensity
- Greenest / dirtiest region callout
- Green region migration suggestions

---

## AI Features

### AI Cost Copilot
- **Endpoint:** `POST /api/v1/copilot/chat`
- **Delivery:** Server-Sent Events (SSE) streaming
- **Context:** Live spend, active alert count, open savings opportunities, top services — fetched at request time
- **History:** Last 12 turns per session persisted to `copilot_messages`
- **Fallback:** OpenRouter unavailable → Ollama; both unavailable → error message in stream
- **Pending (P0.5.4):** Session ownership validation, per-user rate limiting (30 req/min), error sanitization

### Anomaly Detection
- Triggered inside `alert_service.py` after each billing ingest
- Compares current period spend vs 30-day rolling baseline
- Fires `CostAlert` with `alert_type=anomaly` when spike detected

### Spend Forecasting
- Triggered inside `alert_service.py` after each billing ingest
- Projects end-of-period spend from daily run-rate
- Fires `CostAlert` with `alert_type=forecast` when projected spend exceeds `alert_threshold_pct`

### Resource Right-Sizing
- **Trigger:** `POST /api/v1/recommendations/analyze/{account_id}` — heuristic pass over 30-day billing
- **Output:** `ResourceRecommendation` records (right_size, delete, schedule types) with confidence scores and estimated savings

### Waste Detection
- **Trigger:** `POST /api/v1/waste-scan/scan/{account_id}`
- **Detects:** idle instances, orphaned resources, unused IPs, unattached volumes, old snapshots
- **Output:** `WasteItem` records per resource with estimated monthly waste

### RI Commitment Modeling
- **Trigger:** `POST /api/v1/ri-plans/analyze/{account_id}` — analyzes 90-day billing patterns
- **Output:** Up to 6 `RIPlan` variants per resource type (1yr/3yr × no-upfront/partial/all-upfront) with break-even calculation

### Spot Workload Classifier
- **Trigger:** `POST /api/v1/spot-strategy/analyze/{account_id}`
- **Output:** `SpotStrategy` per resource with workload type, interruption risk, and 70% discount modeling

### Carbon Intensity Estimation
- **Trigger:** `POST /api/v1/carbon/calculate/{account_id}` — runs against existing billing records
- **Data:** 19-region carbon intensity table (gCO₂eq/kWh); kWh estimated from billing cost by service
- **Output:** `CarbonRecord` per service/region + green region suggestions

---

## Complete API Reference

### Health
```
GET  /health/                             → {"status": "ok"}
```

### Cloud Accounts
```
GET    /api/v1/cloud-accounts/            → List (limit, offset)
POST   /api/v1/cloud-accounts/            → Create → 201
GET    /api/v1/cloud-accounts/{id}        → Get
PUT    /api/v1/cloud-accounts/{id}        → Update
DELETE /api/v1/cloud-accounts/{id}        → Delete → 204
```

### Billing Records
```
GET    /api/v1/billing-records/           → List (account_id, service, region, start, end, limit, offset)
POST   /api/v1/billing-records/ingest     → Bulk ingest → {"created": N}
GET    /api/v1/billing-records/{id}       → Get
```

### Budgets
```
GET    /api/v1/budgets/                   → List (limit, offset)
POST   /api/v1/budgets/                   → Create → 201
GET    /api/v1/budgets/{id}              → Get
PUT    /api/v1/budgets/{id}              → Update
DELETE /api/v1/budgets/{id}              → Delete → 204
```

### Cost Alerts
```
GET    /api/v1/cost-alerts/              → List (severity, acknowledged, budget_id, limit, offset)
GET    /api/v1/cost-alerts/{id}          → Get
PUT    /api/v1/cost-alerts/{id}/acknowledge → Acknowledge → updated alert
```

### Recommendations
```
GET    /api/v1/recommendations/          → List (type, status, account_id, limit, offset)
GET    /api/v1/recommendations/{id}      → Get
PUT    /api/v1/recommendations/{id}/status → Update status
POST   /api/v1/recommendations/analyze/{account_id} → Run analyzer
```

### Waste Items
```
GET    /api/v1/waste-items/              → List (waste_type, status, account_id, limit, offset)
GET    /api/v1/waste-items/{id}          → Get
PUT    /api/v1/waste-items/{id}/status   → Update status
```

### Dashboard
```
GET    /api/v1/dashboard/                → Aggregate stats (spend, savings, alerts, budget utilization, top services)
```

### AI Copilot
```
POST   /api/v1/copilot/chat              → SSE stream (payload: {session_id, message})
GET    /api/v1/copilot/history/{id}      → Conversation history
```

### Reserved Instance Plans (P1)
```
POST   /api/v1/ri-plans/analyze/{account_id}  → Run RI analysis
GET    /api/v1/ri-plans/{account_id}           → List plans (status filter)
PUT    /api/v1/ri-plans/{plan_id}/status       → Accept / reject plan
```

### Waste Scan (P1)
```
POST   /api/v1/waste-scan/scan/{account_id}   → Run waste scan → {resources_scanned, waste_items_created, by_type}
```

### Cost Allocation (P1)
```
GET    /api/v1/cost-allocation/rules           → List allocation rules
POST   /api/v1/cost-allocation/rules           → Create rule
DELETE /api/v1/cost-allocation/rules/{id}      → Delete rule
GET    /api/v1/cost-allocation/showback        → Showback report (period_start, period_end)
```

### Container Costs (P1)
```
POST   /api/v1/container-costs/ingest          → Bulk ingest → {"created": N}
GET    /api/v1/container-costs/namespaces/{account_id} → Namespace summary (period_start, period_end)
```

### FinOps Reports (P2)
```
GET    /api/v1/reports/finops                  → 12-month trend + unit economics + insights (?months=12)
```

### Spot Strategy (P2)
```
POST   /api/v1/spot-strategy/analyze/{account_id}  → Run spot analysis
GET    /api/v1/spot-strategy/{account_id}           → List strategies (status filter)
GET    /api/v1/spot-strategy/{account_id}/summary   → Aggregate savings summary
PUT    /api/v1/spot-strategy/{id}/status            → Accept / reject strategy
```

### SaaS Spend (P2)
```
GET    /api/v1/saas/                    → List subscriptions (status, category)
POST   /api/v1/saas/                    → Create subscription → 201
GET    /api/v1/saas/summary             → Aggregate summary (total monthly, by category, renewing soon)
GET    /api/v1/saas/{id}               → Get subscription
PUT    /api/v1/saas/{id}               → Update subscription
DELETE /api/v1/saas/{id}               → Delete → 204
```

### Carbon (P2)
```
POST   /api/v1/carbon/calculate/{account_id}  → Calculate carbon from billing → {"records_created": N}
GET    /api/v1/carbon/{account_id}/summary    → CO₂ by service + region + green suggestions
```

---

## Non-Functional Requirements

| Requirement | Status |
|-------------|--------|
| Backend tests: pytest + pytest-asyncio, real PostgreSQL | ✅ 15 test modules, 275 test cases |
| All entities persisted to PostgreSQL (no mock data) | ✅ |
| AI Copilot accessible from every page (floating widget) | ✅ CopilotWidget on (app) layout |
| Responsive UI with Tailwind CSS | ✅ |
| Docker: all services start with `docker compose up -d` | ✅ |
| Health endpoint at `/health` returning `{"status":"ok"}` | ✅ |
| Logto JWT authentication on all `/api/v1/*` routes | ⬜ P0.5.2 — in progress |
| Structured logging via structlog (no print()) | ⬜ P0.5.7 — in progress |
| Prometheus metrics endpoint at `/metrics` | ⬜ P0.5.7 — in progress |
| `dclaw-manifest.json` in `web/public/` for DPanel registration | ⬜ P0.5.11 — in progress |
| Billing ingest idempotency via `source_record_id` | ⬜ P0.5.6 — in progress |
| CORS scoped to specific origins (not wildcard) | ⬜ P0.5.5 — in progress |
| No hardcoded secrets (all from env, required at startup) | ⬜ P0.5.3 — in progress |

---

## Pending: P0.5 Hardening Items

See `PLAN-v1.4.md` §P0.5 for full context. Summary of items blocking production:

| ID | Item | Priority |
|----|------|----------|
| P0.5.1 | Fix `build-frontend.yml` working directory (`./frontend` → `./web`) | Critical |
| P0.5.2 | Logto JWT auth on all `/api/v1/*` routes | Critical |
| P0.5.3 | Remove hardcoded `secret_key` default | Critical |
| P0.5.4 | Copilot: auth, rate limiting, session isolation, error sanitization | Critical |
| P0.5.5 | Fix CORS (wildcard → scoped origins) | High |
| P0.5.6 | Billing/container ingest idempotency (`source_record_id`) | High |
| P0.5.7 | Observability: structlog + Prometheus + Sentry | High |
| P0.5.8 | Parallelize copilot context DB queries with `asyncio.gather` | Medium |
| P0.5.9 | Service-layer tests (alert thresholds, RI math, waste heuristics) | Medium |
| P0.5.10 | Frontend test infrastructure (vitest) | Medium |
| P0.5.11 | DPanel manifest (`web/public/dclaw-manifest.json`) | Medium |
