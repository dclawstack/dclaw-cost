import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class TagAllocation(Base):
    """Maps a billing tag key+value to a team/project for showback/chargeback."""
    __tablename__ = "tag_allocations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tag_key: Mapped[str] = mapped_column(index=True)
    tag_value: Mapped[str] = mapped_column(index=True)
    team: Mapped[str]
    project: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)
