import uuid
from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.core.utils import utc_now


class WasteItem(Base):
    __tablename__ = "waste_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    resource_id: Mapped[str]
    resource_type: Mapped[str]
    waste_type: Mapped[str]  # idle | orphaned | unused_ip | unattached_volume | old_snapshot
    estimated_monthly_waste_usd: Mapped[float]
    last_used_at: Mapped[datetime | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(default="open", index=True)  # open | remediated | ignored
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    cloud_account: Mapped["CloudAccount"] = relationship(lazy="selectin")  # type: ignore[name-defined]
