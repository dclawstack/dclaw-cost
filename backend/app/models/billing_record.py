import uuid
from datetime import datetime, date
from typing import Any
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.core.utils import utc_now


class BillingRecord(Base):
    __tablename__ = "billing_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    resource_id: Mapped[str]
    resource_type: Mapped[str]
    service: Mapped[str] = mapped_column(index=True)
    region: Mapped[str]
    cost_usd: Mapped[float]
    usage_quantity: Mapped[float]
    usage_unit: Mapped[str]
    billing_period_start: Mapped[date] = mapped_column(index=True)
    billing_period_end: Mapped[date]
    tags: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    cloud_account: Mapped["CloudAccount"] = relationship(lazy="selectin")  # type: ignore[name-defined]
