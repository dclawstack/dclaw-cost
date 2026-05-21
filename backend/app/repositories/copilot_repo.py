from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.copilot_message import CopilotMessage
from app.repositories.base_repo import BaseRepository


class CopilotRepository(BaseRepository[CopilotMessage]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CopilotMessage)

    async def get_history(self, session_id: str, limit: int = 20) -> list[CopilotMessage]:
        result = await self.db.execute(
            select(CopilotMessage)
            .where(CopilotMessage.session_id == session_id)
            .order_by(CopilotMessage.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_history_as_dicts(self, session_id: str) -> list[dict]:
        messages = await self.get_history(session_id)
        return [{"role": m.role, "content": m.content} for m in messages]
