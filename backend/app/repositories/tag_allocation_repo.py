from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tag_allocation import TagAllocation
from app.repositories.base_repo import BaseRepository


class TagAllocationRepository(BaseRepository[TagAllocation]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, TagAllocation)

    async def find_by_tag(self, tag_key: str, tag_value: str) -> TagAllocation | None:
        result = await self.db.execute(
            select(TagAllocation)
            .where(TagAllocation.tag_key == tag_key, TagAllocation.tag_value == tag_value)
        )
        return result.scalar_one_or_none()

    async def list_all_rules(self) -> list[TagAllocation]:
        result = await self.db.execute(
            select(TagAllocation).order_by(TagAllocation.team, TagAllocation.tag_key)
        )
        return list(result.scalars().all())
