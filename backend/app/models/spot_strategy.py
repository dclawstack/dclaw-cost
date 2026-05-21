import uuid
from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class SpotStrategy(Base):
    __tablename__ = "spot_strategies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    resource_id: Mapped[str]
    resource_type: Mapped[str]
    service: Mapped[str]
    region: Mapped[str]
    # batch | stateless_web | stateful | unknown
    workload_type: Mapped[str]
    current_monthly_cost: Mapped[float]
    spot_monthly_cost: Mapped[float]
    estimated_savings_usd: Mapped[float]
    savings_pct: Mapped[float]
    # low | medium | high
    interruption_risk: Mapped[str]
    # suitable | partial | not_suitable
    recommendation: Mapped[str]
    # open | accepted | rejected
    status: Mapped[str] = mapped_column(default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)
