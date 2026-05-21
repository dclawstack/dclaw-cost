# Graph Report - /home/chandraja/AI_white_noise/dclaw/dclaw-cost  (2026-05-21)

## Corpus Check
- Corpus is ~17,184 words - fits in a single context window. You may not need a graph.

## Summary
- 257 nodes · 233 edges · 62 communities (35 shown, 27 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.86)
- Token cost: 38,453 input · 6,977 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pre-built UI Component Library|Pre-built UI Component Library]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_FastAPI App Core & Routing|FastAPI App Core & Routing]]
- [[_COMMUNITY_SQLAlchemy ORM Foundation|SQLAlchemy ORM Foundation]]
- [[_COMMUNITY_Docs & Backend Requirements|Docs & Backend Requirements]]
- [[_COMMUNITY_Frontend UI Exports|Frontend UI Exports]]
- [[_COMMUNITY_Dashboard & API Client|Dashboard & API Client]]
- [[_COMMUNITY_Cost Reporting API|Cost Reporting API]]
- [[_COMMUNITY_Table Component|Table Component]]
- [[_COMMUNITY_Guides, Releases & Roadmap|Guides, Releases & Roadmap]]
- [[_COMMUNITY_Alembic Migration Runner|Alembic Migration Runner]]
- [[_COMMUNITY_App Configuration|App Configuration]]
- [[_COMMUNITY_Helm Deployment Templates|Helm Deployment Templates]]
- [[_COMMUNITY_Documentation Metadata|Documentation Metadata]]
- [[_COMMUNITY_Next.js App Shell|Next.js App Shell]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_Helm Service & Ingress|Helm Service & Ingress]]
- [[_COMMUNITY_Input Form Component|Input Form Component]]
- [[_COMMUNITY_Core Utilities (utc_now)|Core Utilities (utc_now)]]
- [[_COMMUNITY_Base ORM & Repository|Base ORM & Repository]]
- [[_COMMUNITY_Claude Code Config|Claude Code Config]]
- [[_COMMUNITY_Helm Chart Base|Helm Chart Base]]
- [[_COMMUNITY_Frontend API Bindings|Frontend API Bindings]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Tailwind CSS Config|Tailwind CSS Config]]
- [[_COMMUNITY_Tailwind Config Alt|Tailwind Config Alt]]
- [[_COMMUNITY_Cost API Router|Cost API Router]]
- [[_COMMUNITY_FinOps CloudAccount Entity|FinOps: CloudAccount Entity]]
- [[_COMMUNITY_FinOps BillingRecord Entity|FinOps: BillingRecord Entity]]
- [[_COMMUNITY_FinOps Budget Entity|FinOps: Budget Entity]]
- [[_COMMUNITY_FinOps CostAlert Entity|FinOps: CostAlert Entity]]
- [[_COMMUNITY_FinOps ResourceRecommendation|FinOps: ResourceRecommendation]]
- [[_COMMUNITY_FinOps WasteItem Entity|FinOps: WasteItem Entity]]
- [[_COMMUNITY_AI Cost Copilot|AI Cost Copilot]]
- [[_COMMUNITY_Docker Postgres Service|Docker: Postgres Service]]
- [[_COMMUNITY_Docker Backend Service|Docker: Backend Service]]
- [[_COMMUNITY_Docker Frontend Service|Docker: Frontend Service]]
- [[_COMMUNITY_CICD - Claude Workflow|CI/CD - Claude Workflow]]
- [[_COMMUNITY_Docs README|Docs README]]
- [[_COMMUNITY_Getting Started Install|Getting Started: Install]]
- [[_COMMUNITY_Getting Started Index|Getting Started: Index]]
- [[_COMMUNITY_Helm Chart Metadata|Helm Chart Metadata]]
- [[_COMMUNITY_Helm Notes|Helm Notes]]
- [[_COMMUNITY_Helm Cost Chart|Helm Cost Chart]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `cn()` - 15 edges
3. `dependencies` - 12 edges
4. `BaseRepository` - 9 edges
5. `cn utility` - 9 edges
6. `Core Config Module` - 6 edges
7. `scripts` - 5 edges
8. `devDependencies` - 5 edges
9. `API Main Module` - 5 edges
10. `Core Database Module` - 5 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  frontend/src/lib/utils.ts → frontend/package.json
- `Core Config Module` --conceptually_related_to--> `Core Utils Module`  [INFERRED]
  backend/app/core/config.py → backend/app/core/utils.py
- `RootLayout` --references--> `Global Styles`  [EXTRACTED]
  frontend/src/app/layout.tsx → frontend/src/app/globals.css
- `Backend Requirements` --implements--> `Stack Reference`  [EXTRACTED]
  backend/requirements.txt → docs/reference/stack.md
- `lifespan()` --calls--> `init_db()`  [INFERRED]
  backend/app/api/main.py → backend/app/core/database.py

## Communities (62 total, 27 thin omitted)

### Community 0 - "Pre-built UI Component Library"
Cohesion: 0.07
Nodes (27): cn(), Avatar, AvatarFallback, AvatarImage, Badge(), BadgeProps, badgeVariants, Button (+19 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, autoprefixer, class-variance-authority, clsx, lucide-react, next, postcss, react (+17 more)

### Community 2 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "FastAPI App Core & Routing"
Cohesion: 0.15
Nodes (10): lifespan(), # TODO: Wire v1 routers here after creating them, API Main Module, Health Routes Module, Core Config Module, Core Database Module, Core Utils Module, init_db() (+2 more)

### Community 4 - "SQLAlchemy ORM Foundation"
Cohesion: 0.18
Nodes (6): DeclarativeBase, Base, Base class for all SQLAlchemy models.      ALL models MUST inherit from this cla, BaseRepository, Generic async CRUD repository.      Subclass per entity:         class UserRepos, Select

### Community 5 - "Docs & Backend Requirements"
Cohesion: 0.24
Nodes (10): Backend Requirements, Configuration Guide, Quickstart Guide, API Reference, Architecture Reference, Reference Index, Stack Reference, Common Issues Troubleshooting (+2 more)

### Community 6 - "Frontend UI Exports"
Cohesion: 0.2
Nodes (10): Avatar component, Badge component, Button component, Card component, Dialog component, Label component, Select component, Table component (+2 more)

### Community 7 - "Dashboard & API Client"
Cohesion: 0.32
Nodes (4): ApiError, CostReport, fetchJson(), getHealth()

### Community 8 - "Cost Reporting API"
Cohesion: 0.46
Nodes (7): BaseModel, BreakdownItem, BreakdownResponse, CostReport, create_report(), CreateReportRequest, get_breakdown()

### Community 9 - "Table Component"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 10 - "Guides, Releases & Roadmap"
Cohesion: 0.33
Nodes (6): Best Practices Guide, Guides Index, Use Cases Guide, Changelog, Releases Index, Roadmap

### Community 12 - "App Configuration"
Cohesion: 0.5
Nodes (4): BaseSettings, Config, get_settings(), Settings

### Community 13 - "Helm Deployment Templates"
Cohesion: 0.4
Nodes (5): dclaw-cost Deployment, dclaw-cost.fullname helper, dclaw-cost.labels helper, dclaw-cost.selectorLabels helper, dclaw-cost.serviceAccountName helper

### Community 14 - "Documentation Metadata"
Cohesion: 0.4
Nodes (4): app_id, nav, title, version

### Community 15 - "Next.js App Shell"
Cohesion: 0.5
Nodes (4): Global Styles, RootLayout, Next Config, Home Page

### Community 17 - "Helm Service & Ingress"
Cohesion: 0.5
Nodes (4): dclaw-cost Ingress.yaml, dclaw-cost Service.yaml, dclaw-cost ServiceAccount.yaml, dclaw-cost values.yaml

### Community 18 - "Input Form Component"
Cohesion: 0.5
Nodes (4): cn utility, Input component, InputProps interface, React

### Community 20 - "Base ORM & Repository"
Cohesion: 0.67
Nodes (3): Alembic Env Base, Base, BaseRepository

### Community 22 - "Helm Chart Base"
Cohesion: 0.67
Nodes (3): Helm Deployment.yaml, Helm Service.yaml, Helm values.yaml

## Knowledge Gaps
- **135 isolated node(s):** `# TODO: Wire v1 routers here after creating them`, `Config`, `Return a naive UTC datetime (no tzinfo).      PostgreSQL TIMESTAMP WITHOUT TIME`, `Base class for all SQLAlchemy models.      ALL models MUST inherit from this cla`, `Generic async CRUD repository.      Subclass per entity:         class UserRepos` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Pre-built UI Component Library` to `Table Component`, `Frontend Dependencies`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `clsx` connect `Frontend Dependencies` to `Pre-built UI Component Library`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `# TODO: Wire v1 routers here after creating them`, `Config`, `Return a naive UTC datetime (no tzinfo).      PostgreSQL TIMESTAMP WITHOUT TIME` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pre-built UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._