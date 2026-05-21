"""Classify compute resources for spot instance suitability."""
from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.billing_record import BillingRecord
from app.models.spot_strategy import SpotStrategy

# Spot discount vs on-demand (conservative estimate)
_SPOT_DISCOUNT = 0.70  # 70% savings vs on-demand

_COMPUTE_SERVICES = {"EC2", "Compute Engine", "Virtual Machines", "Compute"}

# Workload classification by resource type keywords
_BATCH_KEYWORDS    = {"batch", "job", "worker", "task", "etl", "pipeline", "spark", "hadoop"}
_STATELESS_KEYWORDS = {"web", "api", "app", "nginx", "frontend", "server", "lb", "proxy"}
_STATEFUL_KEYWORDS  = {"db", "database", "rds", "mysql", "postgres", "redis", "kafka", "elastic"}

# Risk by workload type
_RISK_MAP = {
    "batch":     ("low",    "suitable"),
    "stateless": ("medium", "partial"),
    "stateful":  ("high",   "not_suitable"),
    "unknown":   ("medium", "partial"),
}


def _classify(resource_type: str, resource_id: str) -> str:
    combined = (resource_type + resource_id).lower()
    if any(k in combined for k in _STATEFUL_KEYWORDS):
        return "stateful"
    if any(k in combined for k in _STATELESS_KEYWORDS):
        return "stateless"
    if any(k in combined for k in _BATCH_KEYWORDS):
        return "batch"
    return "unknown"


async def generate_spot_strategies(account_id: UUID, db: AsyncSession) -> dict:
    since = date.today() - timedelta(days=30)

    rows = (
        await db.execute(
            select(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
                BillingRecord.region,
                func.sum(BillingRecord.cost_usd).label("monthly_cost"),
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
                BillingRecord.region,
            )
            .having(func.sum(BillingRecord.cost_usd) > 50)
            .order_by(func.sum(BillingRecord.cost_usd).desc())
            .limit(100)
        )
    ).all()

    # Skip resources already analyzed
    existing_ids = set(
        row[0]
        for row in (
            await db.execute(
                select(SpotStrategy.resource_id)
                .where(SpotStrategy.cloud_account_id == account_id)
            )
        ).all()
    )

    strategies: list[SpotStrategy] = []
    for row in rows:
        if row.resource_id in existing_ids:
            continue

        monthly = float(row.monthly_cost)
        workload = _classify(row.resource_type, row.resource_id)
        risk, rec = _RISK_MAP[workload]
        spot_cost = monthly * (1 - _SPOT_DISCOUNT)
        savings = monthly - spot_cost

        strategies.append(SpotStrategy(
            cloud_account_id=account_id,
            resource_id=row.resource_id,
            resource_type=row.resource_type,
            service=row.service,
            region=row.region,
            workload_type=workload,
            current_monthly_cost=round(monthly, 2),
            spot_monthly_cost=round(spot_cost, 2),
            estimated_savings_usd=round(savings, 2),
            savings_pct=round(_SPOT_DISCOUNT * 100, 1),
            interruption_risk=risk,
            recommendation=rec,
        ))

    if strategies:
        db.add_all(strategies)
        await db.commit()

    return {
        "resources_analyzed": len(rows),
        "strategies_created": len(strategies),
        "suitable": sum(1 for s in strategies if s.recommendation == "suitable"),
        "partial": sum(1 for s in strategies if s.recommendation == "partial"),
        "not_suitable": sum(1 for s in strategies if s.recommendation == "not_suitable"),
    }
