"""P2.1 FinOps Reporting — unit economics and trend analysis."""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from app.core.database import get_db
from app.models.billing_record import BillingRecord
from app.models.recommendation import ResourceRecommendation

router = APIRouter()


class MonthlyTrend(BaseModel):
    month: str  # YYYY-MM
    total_spend_usd: float
    record_count: int


class UnitEconomic(BaseModel):
    name: str
    description: str
    value: float
    unit: str


class FinOpsReport(BaseModel):
    generated_at: str
    period_months: int
    monthly_trends: list[MonthlyTrend]
    unit_economics: list[UnitEconomic]
    insights: list[str]


@router.get("/finops", response_model=FinOpsReport)
async def finops_report(
    months: int = 12,
    db: AsyncSession = Depends(get_db),
):
    since = date.today().replace(day=1) - timedelta(days=30 * (months - 1))

    # Monthly spend trend
    trend_rows = (
        await db.execute(
            select(
                extract("year", BillingRecord.billing_period_start).label("yr"),
                extract("month", BillingRecord.billing_period_start).label("mo"),
                func.sum(BillingRecord.cost_usd).label("total"),
                func.count(BillingRecord.id).label("cnt"),
            )
            .where(BillingRecord.billing_period_start >= since)
            .group_by("yr", "mo")
            .order_by("yr", "mo")
        )
    ).all()

    trends = [
        MonthlyTrend(
            month=f"{int(row.yr):04d}-{int(row.mo):02d}",
            total_spend_usd=round(float(row.total), 2),
            record_count=int(row.cnt),
        )
        for row in trend_rows
    ]

    # Unit economics
    total_spend = sum(t.total_spend_usd for t in trends)
    total_months = len(trends) or 1
    avg_monthly = total_spend / total_months

    # Service count
    svc_count = (
        await db.execute(
            select(func.count(BillingRecord.service.distinct()))
            .where(BillingRecord.billing_period_start >= since)
        )
    ).scalar() or 0

    # Savings identified
    savings = (
        await db.execute(
            select(func.coalesce(func.sum(ResourceRecommendation.estimated_savings_usd), 0.0))
            .where(ResourceRecommendation.status == "open")
        )
    ).scalar() or 0.0

    unit_economics: list[UnitEconomic] = [
        UnitEconomic(name="Avg Monthly Spend",   description="Average monthly cloud spend",         value=round(avg_monthly, 2),      unit="USD/month"),
        UnitEconomic(name="Cost per Service",     description="Average cost spread across services", value=round(avg_monthly / max(svc_count, 1), 2), unit="USD/service/month"),
        UnitEconomic(name="Savings Opportunity",  description="Open optimization savings",           value=round(float(savings), 2),   unit="USD"),
        UnitEconomic(name="Savings Rate",         description="Potential savings vs total spend",    value=round(float(savings) / avg_monthly * 100 if avg_monthly else 0.0, 1), unit="%"),
        UnitEconomic(name="Services Tracked",     description="Distinct cloud services in use",      value=float(svc_count),           unit="services"),
        UnitEconomic(name="MoM Growth",           description="Month-over-month spend change",
                     value=round((trends[-1].total_spend_usd / trends[-2].total_spend_usd - 1) * 100, 1) if len(trends) >= 2 else 0.0,
                     unit="%"),
    ]

    # Simple insights
    insights: list[str] = []
    if len(trends) >= 2 and trends[-1].total_spend_usd > trends[-2].total_spend_usd * 1.1:
        insights.append(f"Spend increased >10% month-over-month. Investigate top cost drivers.")
    if float(savings) > avg_monthly * 0.2:
        insights.append(f"Over 20% of monthly spend can be saved — act on open recommendations.")
    if svc_count > 10:
        insights.append(f"{svc_count} distinct services tracked — consider consolidating to reduce complexity.")
    if not insights:
        insights.append("Cloud spend is stable. Keep monitoring for new savings opportunities.")

    return FinOpsReport(
        generated_at=str(date.today()),
        period_months=months,
        monthly_trends=trends,
        unit_economics=unit_economics,
        insights=insights,
    )
