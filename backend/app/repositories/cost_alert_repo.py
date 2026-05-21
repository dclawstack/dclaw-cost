from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.cost_alert import CostAlert
from app.repositories.base_repo import BaseRepository


class CostAlertRepository(BaseRepository[CostAlert]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CostAlert)

    async def list_filtered(
        self,
        severity: str | None = None,
        acknowledged: bool | None = None,
        budget_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[CostAlert], int]:
        q = select(CostAlert)
        if severity:
            q = q.where(CostAlert.severity == severity)
        if acknowledged is not None:
            q = q.where(CostAlert.acknowledged == acknowledged)
        if budget_id:
            q = q.where(CostAlert.budget_id == budget_id)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0
        items = list((await self.db.execute(q.limit(limit).offset(offset))).scalars().all())
        return items, total

    async def count_unacknowledged(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(CostAlert).where(CostAlert.acknowledged.is_(False))
        )
        return result.scalar() or 0

    async def acknowledge(self, alert: CostAlert) -> CostAlert:
        alert.acknowledged = True
        await self.db.commit()
        await self.db.refresh(alert)
        return alert
