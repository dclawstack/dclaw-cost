from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.budget import Budget
from app.repositories.base_repo import BaseRepository


class BudgetRepository(BaseRepository[Budget]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Budget)

    async def list_active(self) -> list[Budget]:
        result = await self.db.execute(
            select(Budget).where(Budget.status == "active")
        )
        return list(result.scalars().all())
