from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.container_cost import ContainerCost
from app.repositories.base_repo import BaseRepository


class ContainerCostRepository(BaseRepository[ContainerCost]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ContainerCost)

    async def bulk_create(self, records: list[ContainerCost]) -> list[ContainerCost]:
        self.db.add_all(records)
        await self.db.commit()
        return records

    async def namespace_summary(
        self, cloud_account_id: UUID, period_start: date, period_end: date
    ) -> list[tuple]:
        result = await self.db.execute(
            select(
                ContainerCost.namespace,
                ContainerCost.cluster,
                func.sum(ContainerCost.total_cost_usd).label("total_cost"),
                func.sum(ContainerCost.cpu_cost_usd).label("cpu_cost"),
                func.sum(ContainerCost.memory_cost_usd).label("memory_cost"),
                func.count(ContainerCost.id).label("pod_count"),
            )
            .where(
                ContainerCost.cloud_account_id == cloud_account_id,
                ContainerCost.period_start >= period_start,
                ContainerCost.period_end <= period_end,
            )
            .group_by(ContainerCost.namespace, ContainerCost.cluster)
            .order_by(func.sum(ContainerCost.total_cost_usd).desc())
        )
        return result.all()
