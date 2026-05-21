from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.billing_record import BillingRecord
from app.repositories.tag_allocation_repo import TagAllocationRepository
from app.schemas.tag_allocation import ShowbackReport, ShowbackRow


async def generate_showback(
    db: AsyncSession,
    period_start: date,
    period_end: date,
) -> ShowbackReport:
    """Match billing record tags to TeamAllocations and produce a showback report."""
    tag_repo = TagAllocationRepository(db)
    rules = await tag_repo.list_all_rules()

    # Build lookup: (tag_key, tag_value) → (team, project)
    rule_map: dict[tuple[str, str], tuple[str, str | None]] = {
        (r.tag_key, r.tag_value): (r.team, r.project)
        for r in rules
    }

    # Fetch all billing records for the period (with tags)
    records = (
        await db.execute(
            select(BillingRecord).where(
                BillingRecord.billing_period_start >= period_start,
                BillingRecord.billing_period_end <= period_end,
            )
        )
    ).scalars().all()

    totals: dict[tuple[str, str | None], float] = {}
    counts: dict[tuple[str, str | None], int] = {}
    allocated_spend = 0.0
    total_spend = sum(r.cost_usd for r in records)

    for rec in records:
        team: str | None = None
        project: str | None = None

        if rec.tags:
            for key, val in rec.tags.items():
                match = rule_map.get((key, str(val)))
                if match:
                    team, project = match
                    break

        if team is None:
            team = "unallocated"

        key = (team, project)
        totals[key] = totals.get(key, 0.0) + rec.cost_usd
        counts[key] = counts.get(key, 0) + 1
        if team != "unallocated":
            allocated_spend += rec.cost_usd

    unallocated = total_spend - allocated_spend
    rows = [
        ShowbackRow(
            team=team,
            project=proj,
            total_spend_usd=round(spend, 2),
            record_count=counts[(team, proj)],
            pct_of_total=round((spend / total_spend * 100) if total_spend > 0 else 0.0, 1),
        )
        for (team, proj), spend in sorted(totals.items(), key=lambda x: -x[1])
    ]

    return ShowbackReport(
        period_start=str(period_start),
        period_end=str(period_end),
        total_spend_usd=round(total_spend, 2),
        allocated_spend_usd=round(allocated_spend, 2),
        unallocated_spend_usd=round(unallocated, 2),
        allocation_pct=round((allocated_spend / total_spend * 100) if total_spend > 0 else 0.0, 1),
        rows=rows,
    )
