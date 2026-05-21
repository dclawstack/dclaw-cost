from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.cloud_account import CloudAccount
from app.repositories.base_repo import BaseRepository


class CloudAccountRepository(BaseRepository[CloudAccount]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CloudAccount)

    async def get_by_provider(self, provider: str) -> list[CloudAccount]:
        result = await self.db.execute(
            select(CloudAccount).where(CloudAccount.provider == provider)
        )
        return list(result.scalars().all())
