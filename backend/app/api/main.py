from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import health
from app.api.v1 import (
    cloud_accounts, billing_records, budgets, cost_alerts,
    recommendations, waste_items, dashboard, copilot,
    ri_plans, waste_scan, cost_allocation, container_costs,
    reports, spot_strategy, saas, carbon,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Core
app.include_router(health.router,           prefix="/health",                    tags=["health"])
app.include_router(cloud_accounts.router,   prefix="/api/v1/cloud-accounts",    tags=["cloud-accounts"])
app.include_router(billing_records.router,  prefix="/api/v1/billing-records",   tags=["billing-records"])
app.include_router(budgets.router,          prefix="/api/v1/budgets",           tags=["budgets"])
app.include_router(cost_alerts.router,      prefix="/api/v1/cost-alerts",       tags=["cost-alerts"])
app.include_router(recommendations.router,  prefix="/api/v1/recommendations",   tags=["recommendations"])
app.include_router(waste_items.router,      prefix="/api/v1/waste-items",       tags=["waste-items"])
app.include_router(dashboard.router,        prefix="/api/v1/dashboard",         tags=["dashboard"])
app.include_router(copilot.router,          prefix="/api/v1/copilot",           tags=["copilot"])

# P1
app.include_router(ri_plans.router,         prefix="/api/v1/ri-plans",          tags=["ri-plans"])
app.include_router(waste_scan.router,       prefix="/api/v1/waste-scan",        tags=["waste-scan"])
app.include_router(cost_allocation.router,  prefix="/api/v1/cost-allocation",   tags=["cost-allocation"])
app.include_router(container_costs.router,  prefix="/api/v1/container-costs",   tags=["container-costs"])

# P2
app.include_router(reports.router,          prefix="/api/v1/reports",           tags=["reports"])
app.include_router(spot_strategy.router,    prefix="/api/v1/spot-strategy",     tags=["spot-strategy"])
app.include_router(saas.router,             prefix="/api/v1/saas",              tags=["saas"])
app.include_router(carbon.router,           prefix="/api/v1/carbon",            tags=["carbon"])
