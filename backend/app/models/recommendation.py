import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.core.utils import utc_now


class ResourceRecommendation(Base):
    __tablename__ = "resource_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    resource_id: Mapped[str]
    resource_type: Mapped[str]
    recommendation_type: Mapped[str]  # right_size | reserved_instance | spot | delete | schedule
    current_cost_usd: Mapped[float]
    estimated_savings_usd: Mapped[float]
    confidence: Mapped[int]  # 0–100
    details: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True, default=None)
    status: Mapped[str] = mapped_column(default="open", index=True)  # open | applied | dismissed
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    cloud_account: Mapped["CloudAccount"] = relationship(lazy="selectin")  # type: ignore[name-defined]
