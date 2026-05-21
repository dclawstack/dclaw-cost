from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.saas_subscription import SaasSubscription
from app.repositories.base_repo import BaseRepository


class SaasRepository(BaseRepository[SaasSubscription]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, SaasSubscription)

    async def list_filtered(
        self,
        status: str | None = None,
        category: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[SaasSubscription], int]:
        q = select(SaasSubscription)
        if status:
            q = q.where(SaasSubscription.status == status)
        if category:
            q = q.where(SaasSubscription.category == category)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0
        items = list(
            (await self.db.execute(q.order_by(SaasSubscription.monthly_cost_usd.desc()).limit(limit).offset(offset))).scalars().all()
        )
        return items, total

    async def renewing_soon(self, days: int = 90) -> list[SaasSubscription]:
        cutoff = date.today() + timedelta(days=days)
        result = await self.db.execute(
            select(SaasSubscription)
            .where(
                SaasSubscription.status == "active",
                SaasSubscription.renewal_date.isnot(None),
                SaasSubscription.renewal_date <= cutoff,
            )
            .order_by(SaasSubscription.renewal_date)
        )
        return list(result.scalars().all())

    async def spend_by_category(self) -> list[tuple[str, float]]:
        result = await self.db.execute(
            select(SaasSubscription.category, func.sum(SaasSubscription.monthly_cost_usd).label("total"))
            .where(SaasSubscription.status == "active")
            .group_by(SaasSubscription.category)
            .order_by(func.sum(SaasSubscription.monthly_cost_usd).desc())
        )
        return [(row.category, float(row.total)) for row in result.all()]
