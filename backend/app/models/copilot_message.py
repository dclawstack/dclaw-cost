import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(index=True)
    role: Mapped[str]  # user | assistant
    content: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
