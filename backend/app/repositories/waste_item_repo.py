from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.waste_item import WasteItem
from app.repositories.base_repo import BaseRepository


class WasteItemRepository(BaseRepository[WasteItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, WasteItem)

    async def list_filtered(
        self,
        waste_type: str | None = None,
        status: str | None = None,
        cloud_account_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[WasteItem], int]:
        q = select(WasteItem)
        if waste_type:
            q = q.where(WasteItem.waste_type == waste_type)
        if status:
            q = q.where(WasteItem.status == status)
        if cloud_account_id:
            q = q.where(WasteItem.cloud_account_id == cloud_account_id)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0
        items = list((await self.db.execute(q.limit(limit).offset(offset))).scalars().all())
        return items, total
