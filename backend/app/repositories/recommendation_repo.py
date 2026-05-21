from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.recommendation import ResourceRecommendation
from app.repositories.base_repo import BaseRepository


class RecommendationRepository(BaseRepository[ResourceRecommendation]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ResourceRecommendation)

    async def list_filtered(
        self,
        recommendation_type: str | None = None,
        status: str | None = None,
        cloud_account_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ResourceRecommendation], int]:
        q = select(ResourceRecommendation)
        if recommendation_type:
            q = q.where(ResourceRecommendation.recommendation_type == recommendation_type)
        if status:
            q = q.where(ResourceRecommendation.status == status)
        if cloud_account_id:
            q = q.where(ResourceRecommendation.cloud_account_id == cloud_account_id)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0
        items = list((await self.db.execute(q.limit(limit).offset(offset))).scalars().all())
        return items, total

    async def total_savings(self) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(ResourceRecommendation.estimated_savings_usd), 0.0))
            .where(ResourceRecommendation.status == "open")
        )
        return float(result.scalar() or 0.0)
