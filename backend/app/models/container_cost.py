import uuid
from datetime import datetime, date
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class ContainerCost(Base):
    __tablename__ = "container_costs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    cluster: Mapped[str] = mapped_column(index=True)
    namespace: Mapped[str] = mapped_column(index=True)
    pod_name: Mapped[str | None] = mapped_column(nullable=True)
    cpu_cores_requested: Mapped[float]
    memory_gb_requested: Mapped[float]
    cpu_cost_usd: Mapped[float]
    memory_cost_usd: Mapped[float]
    total_cost_usd: Mapped[float]
    period_start: Mapped[date]
    period_end: Mapped[date]
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
