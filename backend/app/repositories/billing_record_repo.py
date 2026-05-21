from datetime import date
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.billing_record import BillingRecord
from app.repositories.base_repo import BaseRepository


class BillingRecordRepository(BaseRepository[BillingRecord]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, BillingRecord)

    async def list_filtered(
        self,
        cloud_account_id: UUID | None = None,
        service: str | None = None,
        region: str | None = None,
        start: date | None = None,
        end: date | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[BillingRecord], int]:
        q = select(BillingRecord)
        if cloud_account_id:
            q = q.where(BillingRecord.cloud_account_id == cloud_account_id)
        if service:
            q = q.where(BillingRecord.service == service)
        if region:
            q = q.where(BillingRecord.region == region)
        if start:
            q = q.where(BillingRecord.billing_period_start >= start)
        if end:
            q = q.where(BillingRecord.billing_period_end <= end)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0
        items = list((await self.db.execute(q.limit(limit).offset(offset))).scalars().all())
        return items, total

    async def bulk_create(self, records: list[BillingRecord]) -> list[BillingRecord]:
        self.db.add_all(records)
        await self.db.commit()
        return records

    async def total_spend(self, start: date, end: date) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(BillingRecord.cost_usd), 0.0)).where(
                BillingRecord.billing_period_start >= start,
                BillingRecord.billing_period_end <= end,
            )
        )
        return float(result.scalar() or 0.0)

    async def spend_by_service(self, start: date, limit: int = 5) -> list[tuple[str, float]]:
        result = await self.db.execute(
            select(BillingRecord.service, func.sum(BillingRecord.cost_usd).label("total"))
            .where(BillingRecord.billing_period_start >= start)
            .group_by(BillingRecord.service)
            .order_by(func.sum(BillingRecord.cost_usd).desc())
            .limit(limit)
        )
        return [(row.service, float(row.total)) for row in result.all()]

    async def spend_for_scope(
        self, scope: str, scope_value: str, start: date, end: date
    ) -> float:
        q = select(func.coalesce(func.sum(BillingRecord.cost_usd), 0.0)).where(
            BillingRecord.billing_period_start >= start,
            BillingRecord.billing_period_end <= end,
        )
        if scope == "service":
            q = q.where(BillingRecord.service == scope_value)
        elif scope == "region":
            q = q.where(BillingRecord.region == scope_value)
        result = await self.db.execute(q)
        return float(result.scalar() or 0.0)
