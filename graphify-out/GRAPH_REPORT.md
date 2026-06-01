# Graph Report - /home/chandraja/AI_white_noise/dclaw/dclaw-cost  (2026-06-01)

## Corpus Check
- Corpus is ~42,800 words - graph traversal recommended for large-scale queries.

## Summary
- 412 nodes · 387 edges · 74 communities (52 shown, 22 thin omitted)
- Extraction: 91% EXTRACTED · 8% INFERRED · 1% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.87)
- Token cost: 61,240 input · 11,820 output

## Community Hubs (Navigation)
- [[_COMMUNITY_FastAPI App Core & Routing|FastAPI App Core & Routing]]
- [[_COMMUNITY_SQLAlchemy ORM Foundation|SQLAlchemy ORM Foundation]]
- [[_COMMUNITY_Base ORM & Repository|Base ORM & Repository]]
- [[_COMMUNITY_App Configuration|App Configuration]]
- [[_COMMUNITY_Core Database Module|Core Database Module]]
- [[_COMMUNITY_FinOps CloudAccount Entity|FinOps: CloudAccount Entity]]
- [[_COMMUNITY_FinOps BillingRecord Entity|FinOps: BillingRecord Entity]]
- [[_COMMUNITY_FinOps Budget Entity|FinOps: Budget Entity]]
- [[_COMMUNITY_FinOps CostAlert Entity|FinOps: CostAlert Entity]]
- [[_COMMUNITY_FinOps ResourceRecommendation|FinOps: ResourceRecommendation]]
- [[_COMMUNITY_FinOps WasteItem Entity|FinOps: WasteItem Entity]]
- [[_COMMUNITY_FinOps RIPlan Entity|FinOps: RIPlan Entity]]
- [[_COMMUNITY_FinOps TagAllocation Entity|FinOps: TagAllocation Entity]]
- [[_COMMUNITY_FinOps ContainerCost Entity|FinOps: ContainerCost Entity]]
- [[_COMMUNITY_FinOps SaasSubscription Entity|FinOps: SaasSubscription Entity]]
- [[_COMMUNITY_FinOps SpotStrategy Entity|FinOps: SpotStrategy Entity]]
- [[_COMMUNITY_FinOps CarbonRecord Entity|FinOps: CarbonRecord Entity]]
- [[_COMMUNITY_AI Cost Copilot|AI Cost Copilot]]
- [[_COMMUNITY_Copilot Service & Streaming|Copilot Service & Streaming]]
- [[_COMMUNITY_Alert Service|Alert Service]]
- [[_COMMUNITY_Analyzer Service|Analyzer Service]]
- [[_COMMUNITY_Waste Scanner Service|Waste Scanner Service]]
- [[_COMMUNITY_RI Planner Service|RI Planner Service]]
- [[_COMMUNITY_Cost Allocation Service|Cost Allocation Service]]
- [[_COMMUNITY_Spot Strategy Service|Spot Strategy Service]]
- [[_COMMUNITY_Carbon Service|Carbon Service]]
- [[_COMMUNITY_Frontend Landing Page|Frontend: Landing Page]]
- [[_COMMUNITY_Frontend App Shell|Frontend: App Shell]]
- [[_COMMUNITY_Frontend API Client|Frontend: API Client]]
- [[_COMMUNITY_Frontend Dashboard|Frontend: Dashboard]]
- [[_COMMUNITY_Frontend Copilot Widget|Frontend: Copilot Widget]]
- [[_COMMUNITY_Frontend Sidebar|Frontend: Sidebar]]
- [[_COMMUNITY_Pre-built UI Components|Pre-built UI Components]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Docker Postgres Service|Docker: Postgres Service]]
- [[_COMMUNITY_Docker Backend Service|Docker: Backend Service]]
- [[_COMMUNITY_Docker Frontend Service|Docker: Frontend Service]]
- [[_COMMUNITY_CICD CI Workflow|CI/CD: CI Workflow]]
- [[_COMMUNITY_CICD Build Backend|CI/CD: Build Backend]]
- [[_COMMUNITY_CICD Build Frontend|CI/CD: Build Frontend]]
- [[_COMMUNITY_CICD Deploy Workflow|CI/CD: Deploy Workflow]]
- [[_COMMUNITY_CICD Claude Workflow|CI/CD: Claude Workflow]]
- [[_COMMUNITY_Alembic Migration Runner|Alembic Migration Runner]]
- [[_COMMUNITY_Helm Chart Base|Helm Chart Base]]
- [[_COMMUNITY_Helm Service & Ingress|Helm Service & Ingress]]
- [[_COMMUNITY_Helm CloudNativePG|Helm: CloudNativePG]]
- [[_COMMUNITY_Docs Getting Started|Docs: Getting Started]]
- [[_COMMUNITY_Docs Reference|Docs: Reference]]
- [[_COMMUNITY_Docs Guides & Releases|Docs: Guides & Releases]]
- [[_COMMUNITY_Product Docs|Product Docs]]
- [[_COMMUNITY_TestForge Analysis|TestForge Analysis]]
- [[_COMMUNITY_Infographics & Slides|Infographics & Slides]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Tailwind CSS Config|Tailwind CSS Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]

## God Nodes (most connected - your core abstractions)
1. `CloudAccount` - 24 edges (FK target for all 9 cloud-scoped entities)
2. `BaseRepository` - 18 edges (base class for all 13 repository files)
3. `API Main Module` - 17 edges (registers all 17 route groups)
4. `Core Config Module` - 14 edges (imported by all services + main)
5. `Core Database Module` - 13 edges (get_db dependency across all 17 routers)
6. `copilot_service.py` - 11 edges (connects DB, AI providers, streaming)
7. `fetchJson()` - 11 edges (called by all 136 API functions in api.ts)
8. `Base` - 10 edges (SQLAlchemy declarative base — all models inherit)
9. `lifespan()` - 9 edges (orchestrates startup: init_db, router mounts)
10. `CopilotWidget` - 8 edges (rendered in every app page layout)

## Surprising Connections (you probably didn't know these)
- `copilot_service.py` --calls--> `asyncio.gather`  [INFERRED]
  build_context() parallelises 4 DB queries — single round-trip latency
- `alert_service.py` --triggered_by--> `billing_records.py`  [EXTRACTED]
  ingest endpoint calls alert_service after every bulk ingest
- `LandingPage` --references--> `CopilotWidget`  [EXTRACTED]
  web/src/app/page.tsx embeds roadmap data derived from PLAN-v1.4.md
- `waste_scanner_service.py` --reads--> `BillingRecord`  [INFERRED]
  waste heuristics are billing-pattern-derived, not metric-derived
- `carbon_service.py` --embeds--> `19-region intensity table`  [EXTRACTED]
  hardcoded gCO2eq/kWh constants — no external API dependency
- `cost_allocation_service.py` --joins--> `TagAllocation + BillingRecord`  [EXTRACTED]
  showback report matches tags JSON on billing_records to tag_allocations rules

## Communities (74 total, 22 thin omitted)

### Community 0 — "FastAPI App Core & Routing"
Cohesion: 0.42
Nodes (12): lifespan(), API Main Module, Health Routes Module, 17× v1 route modules (billing_records, budgets, carbon, cloud_accounts, container_costs, copilot, cost_alerts, cost_allocation, dashboard, recommendations, reports, ri_plans, saas, spot_strategy, waste_items, waste_scan, cost)

### Community 1 — "SQLAlchemy ORM Foundation"
Cohesion: 0.38
Nodes (16): DeclarativeBase, Base, BaseRepository, 13× entity models (CloudAccount, BillingRecord, Budget, CostAlert, ResourceRecommendation, WasteItem, CopilotMessage, RIPlan, TagAllocation, ContainerCost, SaasSubscription, SpotStrategy, CarbonRecord)

### Community 2 — "App Configuration"
Cohesion: 0.50
Nodes (5): BaseSettings, Settings, get_settings(), Core Config Module, lru_cache

### Community 3 — "Core Database Module"
Cohesion: 0.55
Nodes (4): create_async_engine, AsyncSession, get_db(), init_db()

### Community 4 — "AI Cost Copilot"
Cohesion: 0.48
Nodes (8): CopilotMessage model, copilot_repo, ChatRequest schema, CopilotMessageResponse schema, chat() endpoint, get_history() endpoint, session_id, SSE StreamingResponse

### Community 5 — "Copilot Service & Streaming"
Cohesion: 0.52
Nodes (9): copilot_service.py, build_context(), stream_chat(), _stream_openrouter(), _stream_ollama(), asyncio.gather, httpx.AsyncClient, SYSTEM_PROMPT, OpenRouter fallback→Ollama chain

### Community 6 — "Alert Service"
Cohesion: 0.44
Nodes (6): alert_service.py, threshold alert, forecast alert, anomaly detection, 30-day rolling baseline, CostAlert

### Community 7 — "Analyzer Service"
Cohesion: 0.40
Nodes (5): analyzer_service.py, right-sizing heuristics, ResourceRecommendation, confidence scoring, 30-day billing window

### Community 8 — "Waste Scanner Service"
Cohesion: 0.43
Nodes (7): waste_scanner_service.py, idle detection, orphaned detection, unused_ip detection, unattached_volume detection, old_snapshot detection, WasteItem

### Community 9 — "RI Planner Service"
Cohesion: 0.46
Nodes (8): ri_planner_service.py, 90-day billing analysis, 6 commitment variants, break-even calculation, annual savings, monthly savings, discount_pct, RIPlan

### Community 10 — "Cost Allocation Service"
Cohesion: 0.50
Nodes (6): cost_allocation_service.py, tag→team matching, showback report, chargeback, unallocated_spend, TagAllocation

### Community 11 — "Spot Strategy Service"
Cohesion: 0.47
Nodes (7): spot_strategy_service.py, batch/stateless/stateful classification, interruption risk scoring, 70% discount modeling, SpotStrategy, workload_type enum, recommendation

### Community 12 — "Carbon Service"
Cohesion: 0.45
Nodes (6): carbon_service.py, 19-region gCO2eq/kWh table, kWh estimation from billing cost, CarbonRecord, green region suggestions, greenest/dirtiest region

### Community 13 — "Frontend Landing Page"
Cohesion: 0.38
Nodes (14): LandingPage component, hero section, features grid (12 items), marquee, how-it-works, multi-cloud section, AI copilot spotlight, tech stack badges, open source CTA, roadmap section (Live + Next), footer, FadeUp animation, FeatureCard, rotatingWords

### Community 14 — "Frontend App Shell"
Cohesion: 0.44
Nodes (6): RootLayout, (app) layout, Sidebar, CopilotWidget, Global Styles, Next Config

### Community 15 — "Frontend API Client"
Cohesion: 0.51
Nodes (8): fetchJson(), ApiError, api.ts, 136 typed API functions, 30+ TypeScript interfaces, URLSearchParams builder, SSE stream reader, CloudAccount/BillingRecord/Budget/... type exports

### Community 16 — "Pre-built UI Components"
Cohesion: 0.22
Nodes (9): Avatar, Badge, Button, Card, Dialog, Input, Label, Select, Table, Tabs

### Community 17 — "TypeScript Compiler Config"
Cohesion: 0.18
Nodes (14): compilerOptions, strict, target, lib, paths, jsx, moduleResolution, allowJs, incremental, esModuleInterop, isolatedModules, plugins, baseUrl, next-env.d.ts

### Community 18 — "Docker Compose Services"
Cohesion: 0.55
Nodes (9): postgres:16-alpine (port 5432), backend python:3.11-slim (port 8122), web node:20-alpine (port 3036), DATABASE_URL, BACKEND_URL, healthcheck backend, healthcheck frontend, postgres_data volume, service dependencies

### Community 19 — "CI/CD Workflows"
Cohesion: 0.40
Nodes (11): ci.yml (pytest + frontend build), build-backend.yml (GHCR), build-frontend.yml (⚠️ BROKEN: ./frontend → fix to ./web), deploy.yml (Helm upgrade), claude.yml (AI agent), claude-code-review.yml, GHCR registry, SHA tagging, staging/production environments, kubeconfig secret, Helm --wait

### Community 20 — "Alembic Migrations"
Cohesion: 0.60
Nodes (5): alembic.ini, env.py, script.py.mako, 3 migration versions (fe9b0e1 initial, 84c1da7 P1/P2, a908b6f copilot_messages)

### Community 21 — "Helm Chart"
Cohesion: 0.45
Nodes (10): Chart.yaml, values.yaml, deployment.yaml, service.yaml, ingress.yaml, secrets.yaml, cloudnativepg.yaml, NOTES.txt, _helpers.tpl, dclaw-cost/Chart.yaml

### Community 22 — "Product Documentation"
Cohesion: 0.38
Nodes (12): README.md (rewritten 2026-05-31), PRODUCT-SPEC.md (expanded to 13 entities + 136 endpoints), PLAN-v1.2.md, PLAN-v1.4.md (new), REVISED-PRD.md, AGENTS.md, CLAUDE.md, RUN.md, SCALING-PLAYBOOK.md, TEAM-ONBOARDING-GUIDE.md, PATCHES.md, PATCH-2026-05-15

### Community 23 — "TestForge Analysis"
Cohesion: 0.50
Nodes (7): testforge-dclaw-cost.json, testforge-dclaw-cost.md, tier2.json, test_analysis.md, TestForge PDF, 12 Tier-2 synthetic tests (12/12 passed), 71/100 score

### Community 24 — "Infographics & Slides"
Cohesion: 0.55
Nodes (6): Infographics/architecture-diagram.md (9 Mermaid diagrams), Infographics/dclaw-cost-infograph.html (OC design system, purple), slides/deck-content.md (12 slides), slides/dclaw-cost-deck.html (1280×720 HTML deck), vercel deployment at dclaw-cost.vercel.app

## Knowledge Gaps (resolved since 2026-05-21)

- ~~`# TODO: Wire v1 routers here after creating them`~~ — **RESOLVED**: all 17 route modules wired in `main.py`
- ~~`frontend/` directory references~~ — **RESOLVED**: frontend moved to `web/` (commit `98e9bb1`)
- ~~Missing P1/P2 entities~~ — **RESOLVED**: all 13 entities implemented with models, schemas, repos, services
- ~~Missing test files for services~~ — **PENDING**: services layer still lacks test coverage (P0.5.9)

## Remaining Knowledge Gaps

- **`source_record_id` column** missing from `BillingRecord` and `ContainerCost` — planned in P0.5.6
- **`user_id` FK** missing from `CopilotMessage` — planned in P0.5.4
- **`build-frontend.yml`** references `./frontend` — broken CI, planned in P0.5.1
- **`get_current_user` dependency** — not yet created (P0.5.2)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CloudAccount` have 24 edges — what breaks if it's deleted?**
  _It's the root FK for BillingRecord, ResourceRecommendation, WasteItem, RIPlan, ContainerCost, SpotStrategy, CarbonRecord — cascade deletes wipe all related data._
- **What is the full call chain when a user sends a copilot message?**
  _chat() → CopilotRepository.create() → build_context() (asyncio.gather × 4) → stream_chat() → _stream_openrouter() / _stream_ollama() → SSE token yield → CopilotRepository.create(assistant)_
- **Which service fires automatically on billing ingest (not on-demand)?**
  _alert_service.py — triggered inside billing_records.py ingest endpoint after every bulk POST._
- **What is the blast radius of the broken frontend CI?**
  _build-frontend.yml references `./frontend` which doesn't exist. build-backend.yml is correct. deploy.yml chains on both — frontend images are stale since commit `98e9bb1` (2026-05-29)._
- **Which community has the lowest test coverage?**
  _Services layer (communities 5–12): alert_service, analyzer_service, waste_scanner_service, ri_planner_service, cost_allocation_service, spot_strategy_service, carbon_service have zero pytest coverage. Mutation score: 32%._
