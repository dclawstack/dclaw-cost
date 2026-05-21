from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.billing_record import BillingRecord
from app.models.ri_plan import ReservedInstancePlan

# Discount factors vs on-demand pricing (industry averages)
_COMMITMENTS: dict[str, dict] = {
    "1yr_no_upfront":   {"term": 1, "discount": 0.25, "upfront_factor": 0.0},
    "1yr_partial":      {"term": 1, "discount": 0.32, "upfront_factor": 0.40},
    "1yr_all_upfront":  {"term": 1, "discount": 0.37, "upfront_factor": 1.00},
    "3yr_no_upfront":   {"term": 3, "discount": 0.42, "upfront_factor": 0.0},
    "3yr_partial":      {"term": 3, "discount": 0.54, "upfront_factor": 0.40},
    "3yr_all_upfront":  {"term": 3, "discount": 0.60, "upfront_factor": 1.00},
}

_COMPUTE_SERVICES = {"EC2", "Compute Engine", "Virtual Machines", "Compute"}


async def generate_ri_plans(account_id: UUID, db: AsyncSession) -> dict:
    """Analyze 90 days of billing and generate RI plans for consistent compute spenders."""
    since = date.today() - timedelta(days=90)

    rows = (
        await db.execute(
            select(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
                func.sum(BillingRecord.cost_usd).label("total_90d"),
                func.count(BillingRecord.id).label("record_count"),
            )
            .where(
                BillingRecord.cloud_account_id == account_id,
                BillingRecord.billing_period_start >= since,
                BillingRecord.service.in_(_COMPUTE_SERVICES),
            )
            .group_by(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
            )
            .having(func.sum(BillingRecord.cost_usd) > 300)  # only meaningful spenders
            .order_by(func.sum(BillingRecord.cost_usd).desc())
            .limit(50)  # cap per account
        )
    ).all()

    plans: list[ReservedInstancePlan] = []

    for row in rows:
        monthly_od = float(row.total_90d) / 3.0  # avg monthly from 90 days

        for ctype, cfg in _COMMITMENTS.items():
            discount = cfg["discount"]
            term = cfg["term"]
            upfront_factor = cfg["upfront_factor"]

            monthly_ri = monthly_od * (1 - discount)
            monthly_savings = monthly_od - monthly_ri
            annual_savings = monthly_savings * 12

            # upfront cost = fraction of annual RI cost paid upfront
            annual_ri_cost = monthly_ri * 12
            upfront_cost = annual_ri_cost * upfront_factor * term  # total upfront over the term
            break_even = int(upfront_cost / monthly_savings) if monthly_savings > 0 and upfront_cost > 0 else 0

            plans.append(ReservedInstancePlan(
                cloud_account_id=account_id,
                service=row.service,
                resource_type=row.resource_type,
                commitment_type=ctype,
                term_years=term,
                monthly_on_demand_cost=round(monthly_od, 2),
                monthly_ri_cost=round(monthly_ri, 2),
                upfront_cost=round(upfront_cost, 2),
                monthly_savings=round(monthly_savings, 2),
                annual_savings=round(annual_savings, 2),
                break_even_months=break_even,
                discount_pct=round(discount * 100, 1),
            ))

    if plans:
        db.add_all(plans)
        await db.commit()

    return {"plans_created": len(plans), "resources_analyzed": len(rows)}
