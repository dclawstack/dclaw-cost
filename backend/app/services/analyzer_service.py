from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.billing_record import BillingRecord
from app.models.recommendation import ResourceRecommendation
from app.models.waste_item import WasteItem

_COMPUTE_TYPES = {"ec2_instance", "gcp_vm", "azure_vm", "compute", "vm"}
_COMPUTE_SERVICES = {"EC2", "Compute Engine", "Virtual Machines", "Compute"}
_STORAGE_WASTE_TYPES = {"ebs_volume", "disk", "snapshot", "persistent_disk"}
_IP_WASTE_TYPES = {"elastic_ip", "static_ip", "reserved_ip"}


async def analyze_account(account_id: UUID, db: AsyncSession) -> dict:
    """Heuristic analysis: generate ResourceRecommendation and WasteItem records
    from the last 30 days of billing data for the given account."""
    today = date.today()
    since = today - timedelta(days=30)

    rows = (
        await db.execute(
            select(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
                func.sum(BillingRecord.cost_usd).label("total_cost"),
            )
            .where(
                BillingRecord.cloud_account_id == account_id,
                BillingRecord.billing_period_start >= since,
            )
            .group_by(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
            )
            .order_by(func.sum(BillingRecord.cost_usd).desc())
        )
    ).all()

    recs: list[ResourceRecommendation] = []
    waste: list[WasteItem] = []

    for row in rows:
        cost = float(row.total_cost)
        rid = row.resource_id
        rtype = row.resource_type.lower()
        svc = row.service

        if cost > 500 and svc in _COMPUTE_SERVICES:
            recs.append(ResourceRecommendation(
                cloud_account_id=account_id,
                resource_id=rid,
                resource_type=row.resource_type,
                recommendation_type="reserved_instance",
                current_cost_usd=cost,
                estimated_savings_usd=round(cost * 0.40, 2),
                confidence=80,
                details={"service": svc, "reason": "Consistent high spend; 1-yr RI saves ~40%"},
            ))
        elif cost > 150 and rtype in _COMPUTE_TYPES:
            recs.append(ResourceRecommendation(
                cloud_account_id=account_id,
                resource_id=rid,
                resource_type=row.resource_type,
                recommendation_type="right_size",
                current_cost_usd=cost,
                estimated_savings_usd=round(cost * 0.30, 2),
                confidence=70,
                details={"service": svc, "reason": "High monthly cost; consider downsizing"},
            ))
        elif cost < 15 and rtype in _STORAGE_WASTE_TYPES:
            waste.append(WasteItem(
                cloud_account_id=account_id,
                resource_id=rid,
                resource_type=row.resource_type,
                waste_type="unattached_volume" if "volume" in rtype or "disk" in rtype else "old_snapshot",
                estimated_monthly_waste_usd=cost,
            ))
        elif cost < 15 and rtype in _IP_WASTE_TYPES:
            waste.append(WasteItem(
                cloud_account_id=account_id,
                resource_id=rid,
                resource_type=row.resource_type,
                waste_type="unused_ip",
                estimated_monthly_waste_usd=cost,
            ))

    if recs:
        db.add_all(recs)
    if waste:
        db.add_all(waste)
    await db.commit()

    return {"recommendations_created": len(recs), "waste_items_created": len(waste)}
