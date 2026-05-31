# DClaw Cost — Agent Development Guide (v2)

> **Read this file first before making any code changes.**

## App Identity

**DClaw Cost** is a cloud cost management SaaS app built on the DClaw Stack.

- **Backend Port:** `8122` (FastAPI) — `REVISED-PRD.md` shows `18147`/`3077` which are stale placeholders; ignore them
- **Frontend Port:** `3036` (Next.js) — `RUN.md` incorrectly says `3000`; actual `package.json` dev script is `next dev --port 3036`
- **Database:** `dclaw_cost` (prod) / `dclaw_cost_test` (local tests) / `dclaw_app_test` (CI)
- **Base API Path:** `/api/v1`
- **Health endpoint:** `GET /health/` → `{"status": "ok"}`

## Developer Commands

### Docker (primary workflow)
```bash
docker compose up --build -d
docker compose exec backend alembic upgrade head   # run after first build
docker compose logs backend
docker compose down -v    # wipe DB volume too
```

### Backend (local)
```bash
cd backend
cp .env.example .env      # add OPENROUTER_API_KEY
pip install -r requirements.txt
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE dclaw_cost;"
alembic upgrade head
uvicorn app.api.main:app --host 0.0.0.0 --port 8122 --reload
```

### Frontend (local)
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8122 npm run dev   # → http://localhost:3036
NEXT_PUBLIC_API_URL=http://localhost:8122 npm run build
```

### Tests
```bash
cd backend
# first-time: create test DB
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE dclaw_cost_test;"
pytest tests/ -v
# or with explicit URL:
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_cost_test" pytest tests/ -v
```

### Migrations
```bash
cd backend
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
```

## Architecture Lock — DO NOT CHANGE

### Backend
- **FastAPI** with `lifespan` handler
- **SQLAlchemy 2.0** — `DeclarativeBase` from `app.models.base`, NOT `declarative_base()`. Do NOT use `MappedAsDataclass`.
- **Pydantic v2** schemas with `ConfigDict(from_attributes=True)`
- **Async SQLAlchemy** — `create_async_engine` + `AsyncSession`
- **Repository pattern** — all DB access through `app/repositories/`; extend `BaseRepository[T]` from `app/repositories/base_repo.py`
- **Dependency injection** — `Depends(get_db)`, never manual `AsyncSession`; instantiate repos inside route handlers, not as singletons
- **NO MOCK DATA** — never use in-memory `dict`s
- **pytest-asyncio==0.24.0** — pinned, do not upgrade (v1.3.0 breaks fixture scoping)

### Frontend
- **Next.js 14+ App Router** with `output: 'standalone'` (required for Docker multi-stage build)
- **Tailwind CSS** + pre-built UI components in `src/components/ui/`
- **API client** in `src/lib/api.ts` — typed fetch wrapper; always use `process.env.NEXT_PUBLIC_API_URL`, never hardcode
- **`NEXT_PUBLIC_API_URL`** baked at build time — Dockerfile MUST declare `ARG NEXT_PUBLIC_API_URL` before `RUN npm run build`
- **DO NOT install shadcn CLI or `@base-ui/react`** — use the 10 pre-built components in `src/components/ui/`
- **`tailwindcss-animate`** must stay in `dependencies` (not devDependencies) — `tailwind.config.ts` requires it as a plugin at build time

### Docker
- **Backend:** `python:3.11-slim`, non-root `appuser`, healthcheck with `python -c "import urllib.request; urllib.request.urlopen(...)"`
- **Frontend:** `node:20-alpine`, `ENV PORT=3036`
- **Compose:** container port MUST match `EXPOSE`/`ENV PORT`

## Critical Quirks

### Alembic / Models
- `alembic.ini` hardcodes DB name `dclaw_app` (wrong) — irrelevant because `alembic/env.py` always overrides from `settings.database_url`
- **`app/models/__init__.py` MUST import every model** — `alembic/env.py` does `import app.models` to register tables with `Base.metadata`; missing imports → autogenerate silently misses the table
- `database.py` `init_db()` also runs `Base.metadata.create_all` on startup (lifespan) — tables are created even without `alembic upgrade head`, but always run migrations for schema changes
- **`app/api/v1/cost.py` exists but is NOT wired into `main.py`** — verify a router is registered before assuming its endpoints are live

### Model Conventions
- IDs: `Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)` — `default=`, NEVER `default_factory=`
- Timestamps: use `utc_now()` from `app.core.utils` — returns naive UTC datetime (required for `TIMESTAMP WITHOUT TIME ZONE`)
- Relationships: always `lazy="selectin"`
- FK cascade: `ondelete="CASCADE"` for children, `ondelete="SET NULL"` for optional refs

### Copilot Service
- `POST /api/v1/copilot/chat` — SSE streaming via `StreamingResponse`
- Falls back to local Ollama if `OPENROUTER_API_KEY` is not set
- After streaming, saves the assistant reply using a **fresh `AsyncSession(engine)`** (request session is already closed); this is intentional
- Default model: `anthropic/claude-opus-4-8` (set in `config.py`); `.env.example` and `RUN.md` suggest different models — trust `config.py` unless overriding via `OPENROUTER_MODEL` env var

### Testing
- `conftest.py` drops and recreates all tables before and after every test — full isolation per test
- Uses `NullPool` to avoid async connection leaks
- CI injects `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_app_test` — always use `localhost:5432` (CI only maps standard port)
- Test client: `httpx.AsyncClient` with `ASGITransport` (in-process, no real HTTP)

## Anti-Patterns — NEVER DO

| Anti-Pattern | Why It Breaks Things | Correct Alternative |
|--------------|---------------------|---------------------|
| `declarative_base()` in `database.py` | Separate metadata → zero tables | `from app.models.base import Base` |
| `curl` in healthcheck on `python:*-slim` | No `curl` → silent failure | `python -c "import urllib.request; urllib.request.urlopen(...)"` |
| In-memory `MOCK_*` dicts | Data lost on restart | Create repository + real DB |
| Missing `ARG NEXT_PUBLIC_API_URL` in frontend Dockerfile | Wrong API URL baked in | Add `ARG NEXT_PUBLIC_API_URL` before `RUN npm run build` |
| Manual `get_db()` with `__anext__()` | Session leaks | `Depends(get_db)` |
| Hardcoded `localhost:PORT` in frontend | Breaks Docker/K8s | `process.env.NEXT_PUBLIC_API_URL` |
| New model not in `app/models/__init__.py` | Alembic autogenerate misses the table | Import every model in `__init__.py` |
| No alembic migration for new models | Schema drift | `alembic revision --autogenerate` |
| Installing `shadcn` CLI or `@base-ui/react` | Breaks Tailwind v3 build | Use pre-built components in `src/components/ui/` |
| Non-standard Postgres port in tests | CI service maps 5432 only | Always `localhost:5432` in conftest.py |
| Upgrading `pytest-asyncio` past 0.24.0 | v1.3.0 breaks fixture scoping | Keep `pytest-asyncio==0.24.0` pinned |
| Deleting `.github/workflows/ci.yml` | No CI runs | Leave CI workflow intact |
| `MappedAsDataclass` in `Base` | Relationship/FK sync conflicts on flush | Plain `DeclarativeBase` only |
| `default_factory=` in `mapped_column()` | `ArgumentError` on plain `DeclarativeBase` | Use `default=uuid.uuid4` |
| Timezone-aware `datetime` in models | `DataError` with `TIMESTAMP WITHOUT TIME ZONE` | `utc_now()` from `app.core.utils` |
| Trusting `REVISED-PRD.md` for port numbers | Shows stale placeholder ports | Use 8122 (backend) / 3036 (frontend) |

## Database Rules

1. All models MUST inherit from `Base` in `app.models.base`
2. All models MUST use `Mapped[...]` and `mapped_column()`
3. **Never use `default_factory=` in `mapped_column()`** — use `default=` instead
4. Relationships MUST specify `lazy="selectin"`
5. All new tables MUST get an alembic migration AND be imported in `app/models/__init__.py`
6. Use `ondelete="CASCADE"` for child tables
7. Use `ondelete="SET NULL"` for optional references

## Pre-Built UI Components

Use directly from `frontend/src/components/ui/`. Do NOT install shadcn CLI.

- `Button` — variants: default, destructive, outline, secondary, ghost, link
- `Card` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Input`, `Label`, `Badge` (variants: default, secondary, destructive, outline)
- `Select` — with `onValueChange` support
- `Dialog` — modal with trigger, content, header, title
- `Table` — TableHeader, TableBody, TableRow, TableHead, TableCell
- `Tabs` — TabsList, TabsTrigger, TabsContent
- `Avatar` — AvatarImage, AvatarFallback

`src/lib/utils.ts` provides `cn()` (clsx + tailwind-merge) — do NOT delete.

## How to Add a Feature

1. **Read this file**
2. **Backend:**
   - Add/update model in `app/models/` and import it in `app/models/__init__.py`
   - Add/update schema in `app/schemas/`
   - Add repository in `app/repositories/` (extend `BaseRepository[T]`)
   - Add/update router in `app/api/v1/` and register it in `app/api/main.py`
   - Add tests in `tests/`
   - `alembic revision --autogenerate -m "..."` + `alembic upgrade head`
3. **Frontend:**
   - Add types/functions to `src/lib/api.ts`
   - Add page in `src/app/` using pre-built UI components
4. **Verify:** `docker compose config` then `docker compose up --build -d`
5. **Commit** with conventional commit message

## Testing Requirements

- Every new repository MUST have tests
- Every new router endpoint MUST be covered
- Use `@pytest.mark.asyncio` with async test functions
- Use `httpx.AsyncClient` with `ASGITransport`
- Override `get_db` via `app.dependency_overrides` in `conftest.py`
- Tests MUST use `localhost:5432` (CI requirement)

## Services (Business Logic)

All in `backend/app/services/`. Key services an agent must know about:

| Service | Trigger | What it does |
|---------|---------|-------------|
| `alert_service.py` | Auto-called after billing ingest | Creates threshold + forecast `CostAlert` rows |
| `analyzer_service.py` | On demand | Generates `ResourceRecommendation` + `WasteItem` from 30d billing |
| `copilot_service.py` | `POST /api/v1/copilot/chat` | SSE streaming; OpenRouter → Ollama fallback; injects live spend context |
| `ri_planner_service.py` | On demand | 90d billing analysis; 6 commitment types; break-even math |
| `waste_scanner_service.py` | On demand | Detects 5 waste types from billing patterns |
| `cost_allocation_service.py` | On demand | Tag → team/project mapping; showback report |
| `spot_strategy_service.py` | On demand | Workload classification; 70% spot discount modeling |
| `carbon_service.py` | On demand | 19-region carbon intensity; kWh estimation; green region suggestions |

## Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_cost` | Full async URL |
| `OPENROUTER_API_KEY` | For AI | `""` | Falls back to Ollama if absent |
| `OPENROUTER_MODEL` | No | `anthropic/claude-opus-4-8` | Override per deployment |
| `OLLAMA_URL` | No | `http://localhost:11434` | Local AI fallback |
| `OLLAMA_MODEL` | No | `llama3.2` | |
| `SECRET_KEY` | Production | `change-me-in-production` | JWT signing |
| `APP_ENV` | No | `dev` | `dev` enables SQLAlchemy SQL echo |
| `NEXT_PUBLIC_API_URL` | Yes (frontend build) | — | Must be set at Docker build time via `ARG` |

## Port Registry

| App | Backend | Frontend | Postgres DB |
|-----|---------|----------|-------------|
| dclaw-cost | 8122 | 3036 | dclaw_cost |
| dclaw-chat | 8090 | 3000 | dclaw_chat |
| dclaw-med | 8092 | 3004 | dclaw_med |
| dclaw-learn | 8093 | 3003 | dclaw_learn |
| dclaw-code | 8094 | 3005 | dclaw_code |
| dclaw-legal | 8099 | 3013 | dclaw_legal |
| dclaw-crm | 8095 | 3006 | dclaw_crm |
| dclaw-finance | 8096 | 3007 | dclaw_finance |
| dclaw-hr | 8097 | 3008 | dclaw_hr |
| dclaw-inventory | 8098 | 3009 | dclaw_inventory |
| dclaw-project | 8100 | 3010 | dclaw_project |
| dclaw-support | 8101 | 3014 | dclaw_support |
| dclaw-marketing | 8102 | 3015 | dclaw_marketing |
| dclaw-real-estate | 8103 | 3016 | dclaw_real_estate |
| dclaw-sales | 8104 | 3017 | dclaw_sales |
| dclaw-recruit | 8105 | 3018 | dclaw_recruit |
| dclaw-vendor | 8106 | 3019 | dclaw_vendor |
| dclaw-doc | 8107 | 3020 | dclaw_doc |
| dclaw-calendar | 8108 | 3021 | dclaw_calendar |
