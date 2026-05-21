from datetime import date, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.billing_record_repo import BillingRecordRepository
from app.repositories.budget_repo import BudgetRepository
from app.repositories.cost_alert_repo import CostAlertRepository
from app.repositories.recommendation_repo import RecommendationRepository

router = APIRouter()


class TopService(BaseModel):
    service: str
    cost_usd: float


class BudgetUtilization(BaseModel):
    budget_id: str
    name: str
    amount_usd: float
    spent_usd: float
    used_pct: float


class DashboardStats(BaseModel):
    total_monthly_spend: float
    projected_monthly_spend: float
    total_savings_opportunities: float
    active_alerts_count: int
    top_services: list[TopService]
    budget_utilization: list[BudgetUtilization]


@router.get("/", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    today = date.today()
    first_of_month = today.replace(day=1)
    # last day of current month
    if today.month == 12:
        last_of_month = today.replace(day=31)
    else:
        last_of_month = (today.replace(month=today.month + 1, day=1)) - timedelta(days=1)

    billing_repo = BillingRecordRepository(db)
    budget_repo = BudgetRepository(db)
    alert_repo = CostAlertRepository(db)
    rec_repo = RecommendationRepository(db)

    total_spend = await billing_repo.total_spend(first_of_month, last_of_month)

    # simple run-rate projection: spend so far / days elapsed * total days in month
    days_elapsed = max((today - first_of_month).days + 1, 1)
    total_days = (last_of_month - first_of_month).days + 1
    projected = (total_spend / days_elapsed) * total_days if total_spend > 0 else 0.0

    savings = await rec_repo.total_savings()
    active_alerts = await alert_repo.count_unacknowledged()
    top_raw = await billing_repo.spend_by_service(first_of_month, limit=5)
    top_services = [TopService(service=s, cost_usd=c) for s, c in top_raw]

    budgets = await budget_repo.list_active()
    utilization: list[BudgetUtilization] = []
    for b in budgets:
        spent = await billing_repo.spend_for_scope(b.scope, b.scope_value, first_of_month, last_of_month)
        used_pct = round((spent / b.amount_usd) * 100, 1) if b.amount_usd > 0 else 0.0
        utilization.append(BudgetUtilization(
            budget_id=str(b.id),
            name=b.name,
            amount_usd=b.amount_usd,
            spent_usd=spent,
            used_pct=used_pct,
        ))

    return DashboardStats(
        total_monthly_spend=total_spend,
        projected_monthly_spend=round(projected, 2),
        total_savings_opportunities=savings,
        active_alerts_count=active_alerts,
        top_services=top_services,
        budget_utilization=utilization,
    )
