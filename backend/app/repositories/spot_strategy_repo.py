from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.spot_strategy import SpotStrategy
from app.repositories.base_repo import BaseRepository


class SpotStrategyRepository(BaseRepository[SpotStrategy]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, SpotStrategy)

    async def list_for_account(
        self, cloud_account_id: UUID, status: str | None = None
    ) -> list[SpotStrategy]:
        q = select(SpotStrategy).where(SpotStrategy.cloud_account_id == cloud_account_id)
        if status:
            q = q.where(SpotStrategy.status == status)
        result = await self.db.execute(q.order_by(SpotStrategy.estimated_savings_usd.desc()))
        return list(result.scalars().all())

    async def total_potential_savings(self, cloud_account_id: UUID) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(SpotStrategy.estimated_savings_usd), 0.0))
            .where(SpotStrategy.cloud_account_id == cloud_account_id, SpotStrategy.status == "open")
        )
        return float(result.scalar() or 0.0)
