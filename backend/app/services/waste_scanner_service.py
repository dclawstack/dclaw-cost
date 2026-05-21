"""Enhanced waste detection — identifies 5 waste types from billing patterns."""
from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.billing_record import BillingRecord
from app.models.waste_item import WasteItem

_IP_KEYWORDS    = {"elastic_ip", "static_ip", "reserved_ip", "public_ip"}
_SNAP_KEYWORDS  = {"snapshot", "ami", "image_storage"}
_VOL_KEYWORDS   = {"ebs_volume", "persistent_disk", "managed_disk", "disk"}
_IDLE_THRESHOLD = 10.0   # USD: resources with < $10/month are idle candidates
_ORPHAN_MONTHS  = 3      # months with minimal consistent charge = orphaned


async def scan_waste(account_id: UUID, db: AsyncSession) -> dict:
    """Scan billing patterns and create WasteItem records for 5 waste types."""
    today = date.today()
    since_90 = today - timedelta(days=90)
    since_30 = today - timedelta(days=30)

    # Aggregate over 90 days by resource
    rows_90 = (
        await db.execute(
            select(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
                BillingRecord.region,
                func.sum(BillingRecord.cost_usd).label("total_90d"),
                func.count(BillingRecord.id).label("months"),
                func.min(BillingRecord.billing_period_start).label("first_seen"),
                func.max(BillingRecord.billing_period_start).label("last_seen"),
            )
            .where(
                BillingRecord.cloud_account_id == account_id,
                BillingRecord.billing_period_start >= since_90,
            )
            .group_by(
                BillingRecord.resource_id,
                BillingRecord.resource_type,
                BillingRecord.service,
                BillingRecord.region,
            )
        )
    ).all()

    # Aggregate over 30 days for idle detection
    rows_30_ids = set(
        row[0]
        for row in (
            await db.execute(
                select(BillingRecord.resource_id)
                .where(
                    BillingRecord.cloud_account_id == account_id,
                    BillingRecord.billing_period_start >= since_30,
                )
                .distinct()
            )
        ).all()
    )

    # Fetch existing waste item resource_ids to avoid duplicates
    existing = set(
        row[0]
        for row in (
            await db.execute(
                select(WasteItem.resource_id)
                .where(WasteItem.cloud_account_id == account_id, WasteItem.status == "open")
            )
        ).all()
    )

    new_waste: list[WasteItem] = []

    for row in rows_90:
        rid = row.resource_id
        rtype = row.resource_type.lower()
        monthly_avg = float(row.total_90d) / 3.0

        if rid in existing:
            continue

        waste_type: str | None = None

        # 1. Unused IP
        if any(k in rtype for k in _IP_KEYWORDS) and monthly_avg < 15:
            waste_type = "unused_ip"

        # 2. Old snapshot
        elif any(k in rtype for k in _SNAP_KEYWORDS):
            waste_type = "old_snapshot"

        # 3. Unattached volume
        elif any(k in rtype for k in _VOL_KEYWORDS) and monthly_avg < 25:
            waste_type = "unattached_volume"

        # 4. Idle: was active >30 days ago but absent from last 30 days
        elif rid not in rows_30_ids and monthly_avg < _IDLE_THRESHOLD:
            waste_type = "idle"

        # 5. Orphaned: consistently tiny spend over 3 months = forgotten resource
        elif int(row.months) >= _ORPHAN_MONTHS and monthly_avg < _IDLE_THRESHOLD:
            waste_type = "orphaned"

        if waste_type:
            new_waste.append(WasteItem(
                cloud_account_id=account_id,
                resource_id=rid,
                resource_type=row.resource_type,
                waste_type=waste_type,
                estimated_monthly_waste_usd=round(monthly_avg, 2),
            ))

    if new_waste:
        db.add_all(new_waste)
        await db.commit()

    return {
        "resources_scanned": len(rows_90),
        "waste_items_created": len(new_waste),
        "by_type": _count_by_type(new_waste),
    }


def _count_by_type(items: list[WasteItem]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        counts[item.waste_type] = counts.get(item.waste_type, 0) + 1
    return counts
