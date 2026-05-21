# PRODUCT-SPEC: DClaw Cost

> This document tells coding agents WHAT to build.
> Separate from `AGENTS.md` (HOW to build) and `PLAN-v1.2.md` (WHEN to build).
> See `REVISED-PRD.md` for full gap analysis, AI mandates, and acceptance criteria.

## Overview

**App Name:** DClaw Cost
**App ID:** `cost`
**Domain:** FinOps — Cloud Cost Optimization
**Target User:** Platform engineers, FinOps teams, engineering managers
**Backend Port:** `8034` (FastAPI)
**Frontend Port:** `3034` (Next.js)
**Database:** `dclaw_cost` (PostgreSQL)

## Core Entities

### CloudAccount
```
CloudAccount
├── id: UUID (PK)
├── name: str (required)
├── provider: enum ["aws", "gcp", "azure", "on_prem"] (required)
├── external_account_id: str (cloud-side account/project ID, required)
├── status: enum ["active", "inactive", "error"] (default: "active")
├── created_at: datetime
└── updated_at: datetime
```

### BillingRecord
```
BillingRecord
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount, ondelete=CASCADE)
├── resource_id: str (cloud resource identifier, required)
├── resource_type: str (e.g. "ec2_instance", "gcs_bucket", required)
├── service: str (e.g. "EC2", "BigQuery", required)
├── region: str (required)
├── cost_usd: float (required)
├── usage_quantity: float (required)
├── usage_unit: str (e.g. "GB", "hours", required)
├── billing_period_start: date (required)
├── billing_period_end: date (required)
├── tags: JSON (key-value pairs, optional)
└── created_at: datetime
```

### Budget
```
Budget
├── id: UUID (PK)
├── name: str (required)
├── amount_usd: float (required)
├── period: enum ["daily", "weekly", "monthly", "quarterly", "annual"] (default: "monthly")
├── scope: enum ["account", "service", "tag", "team"] (required)
├── scope_value: str (which account/service/tag/team, required)
├── alert_threshold_pct: int (0-100, alert trigger, default: 80)
├── status: enum ["active", "inactive"] (default: "active")
├── created_at: datetime
└── updated_at: datetime
```

### CostAlert
```
CostAlert
├── id: UUID (PK)
├── budget_id: UUID (FK → Budget, ondelete=CASCADE)
├── alert_type: enum ["threshold", "anomaly", "forecast"] (required)
├── current_spend_usd: float (required)
├── projected_spend_usd: float (optional, set for forecast alerts)
├── message: str (required)
├── severity: enum ["info", "warning", "critical"] (required)
├── acknowledged: bool (default: false)
└── created_at: datetime
```

### ResourceRecommendation
```
ResourceRecommendation
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount, ondelete=CASCADE)
├── resource_id: str (required)
├── resource_type: str (required)
├── recommendation_type: enum ["right_size", "reserved_instance", "spot", "delete", "schedule"] (required)
├── current_cost_usd: float (required)
├── estimated_savings_usd: float (required)
├── confidence: int (0-100, required)
├── details: JSON (provider-specific metadata, optional)
├── status: enum ["open", "applied", "dismissed"] (default: "open")
├── created_at: datetime
└── updated_at: datetime
```

### WasteItem
```
WasteItem
├── id: UUID (PK)
├── cloud_account_id: UUID (FK → CloudAccount, ondelete=CASCADE)
├── resource_id: str (required)
├── resource_type: str (required)
├── waste_type: enum ["idle", "orphaned", "unused_ip", "unattached_volume", "old_snapshot"] (required)
├── estimated_monthly_waste_usd: float (required)
├── last_used_at: datetime (optional)
├── status: enum ["open", "remediated", "ignored"] (default: "open")
└── created_at: datetime
```

## User Stories / Screens

### Screen 1: Dashboard
- Summary cards: total monthly spend, projected spend, total savings opportunities, active budget alerts
- Top 5 cost drivers by service and account
- Budget utilization bars (% of each budget consumed)
- Recent alerts feed
- Quick action buttons: Connect Account, Create Budget, View Recommendations

### Screen 2: Cloud Accounts
- Table of connected accounts with provider badge, status, and last sync time
- "Connect Account" modal (name, provider dropdown, external account ID)
- Per-account drill-down: total spend this month, top services
- Edit / remove account

### Screen 3: Billing & Cost Explorer
- Date-range selector (default: current month)
- Filterable by cloud account, service, region, tag
- Grouped bar or table view of costs by selected dimension
- CSV export button
- Tag enforcement heatmap (% untagged resources per account)

### Screen 4: Budgets & Alerts
- Budget list with period, amount, current spend, % used, status badge
- "Create Budget" form (name, amount, period, scope, alert threshold)
- Alert history table: type, severity, budget, timestamp, acknowledged toggle
- Edit / delete budget

### Screen 5: Recommendations
- Tabbed view: Right-Sizing | Reserved Instances | Waste Items
- Each row: resource ID, type, current cost, estimated savings, confidence bar, status
- "Apply" / "Dismiss" action per recommendation
- Aggregate savings summary at the top

### Screen 6: AI Cost Copilot
- Floating chat widget accessible from every page (bottom-right)
- Also a full-page `/copilot` route with conversation history
- Context-aware: knows current account, date range, and visible data
- Suggests next actions (e.g., "You have 3 idle instances — want me to create a deletion plan?")
- Falls back to local Ollama when cloud LLM is unavailable

## AI Features (P0 — Required per YC S25/W26 RFS)

- **AI Cost Copilot** (`POST /api/v1/copilot/chat`): Chat interface backed by LLM + RAG over billing data. Answers cost questions, explains anomalies, and recommends savings actions.
- **Anomaly Detection** (part of Budget Alerts): Identifies spend spikes vs. 30-day rolling baseline; fires `CostAlert` with `alert_type=anomaly`.
- **Spend Forecasting** (part of Budget Alerts): Projects end-of-period spend based on daily run-rate; fires `CostAlert` with `alert_type=forecast` when projected to exceed budget.
- **Right-Sizing Recommendations**: Analyzes 30 days of utilization metrics; generates `ResourceRecommendation` records with `recommendation_type=right_size`.
- **Waste Detection**: Scans accounts for idle/orphaned resources; generates `WasteItem` records.

## API Endpoints (v1.0)

```
# Cloud Accounts
GET    /api/v1/cloud-accounts              → List accounts
POST   /api/v1/cloud-accounts              → Create account
GET    /api/v1/cloud-accounts/{id}         → Get account
PUT    /api/v1/cloud-accounts/{id}         → Update account
DELETE /api/v1/cloud-accounts/{id}         → Delete account

# Billing Records
GET    /api/v1/billing-records             → List records (filter: account_id, service, region, start, end)
POST   /api/v1/billing-records/ingest      → Bulk ingest billing CSV/JSON
GET    /api/v1/billing-records/{id}        → Get record

# Budgets
GET    /api/v1/budgets                     → List budgets
POST   /api/v1/budgets                     → Create budget
GET    /api/v1/budgets/{id}               → Get budget
PUT    /api/v1/budgets/{id}               → Update budget
DELETE /api/v1/budgets/{id}               → Delete budget

# Cost Alerts
GET    /api/v1/cost-alerts                 → List alerts (filter: severity, acknowledged, budget_id)
GET    /api/v1/cost-alerts/{id}           → Get alert
PUT    /api/v1/cost-alerts/{id}/acknowledge → Acknowledge alert

# Resource Recommendations
GET    /api/v1/recommendations             → List recommendations (filter: type, status, account_id)
GET    /api/v1/recommendations/{id}        → Get recommendation
PUT    /api/v1/recommendations/{id}/status → Update status (applied/dismissed)

# Waste Items
GET    /api/v1/waste-items                 → List waste items (filter: type, status, account_id)
GET    /api/v1/waste-items/{id}           → Get waste item
PUT    /api/v1/waste-items/{id}/status     → Update status (remediated/ignored)

# Dashboard
GET    /api/v1/dashboard                   → Aggregate stats (total spend, savings, alert counts, budget utilization)

# AI Copilot
POST   /api/v1/copilot/chat               → Send message, get AI response (streaming)
GET    /api/v1/copilot/history            → Conversation history
```

## Non-Functional Requirements

- Backend tests: 70%+ coverage (pytest + pytest-asyncio)
- Frontend: Responsive, Tailwind CSS + pre-built UI components in `src/components/ui/`
- Docker: All services start with `docker compose up -d`; healthchecks must pass
- No mock data — all entities persisted to PostgreSQL (`dclaw_cost` DB)
- AI Copilot must be accessible from every page
- All API routes protected by Logto JWT (except `/health`)
- `dclaw-manifest.json` in `frontend/public/` for DPanel registration
