from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.ri_plan import ReservedInstancePlan
from app.repositories.base_repo import BaseRepository


class RIPlanRepository(BaseRepository[ReservedInstancePlan]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ReservedInstancePlan)

    async def list_for_account(
        self, cloud_account_id: UUID, status: str | None = None
    ) -> list[ReservedInstancePlan]:
        q = select(ReservedInstancePlan).where(
            ReservedInstancePlan.cloud_account_id == cloud_account_id
        )
        if status:
            q = q.where(ReservedInstancePlan.status == status)
        result = await self.db.execute(q.order_by(ReservedInstancePlan.annual_savings.desc()))
        return list(result.scalars().all())

    async def total_accepted_savings(self) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(ReservedInstancePlan.annual_savings), 0.0))
            .where(ReservedInstancePlan.status == "accepted")
        )
        return float(result.scalar() or 0.0)
