import uuid
from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.core.utils import utc_now


class CostAlert(Base):
    __tablename__ = "cost_alerts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    budget_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("budgets.id", ondelete="CASCADE"), index=True
    )
    alert_type: Mapped[str]  # threshold | anomaly | forecast
    current_spend_usd: Mapped[float]
    projected_spend_usd: Mapped[float | None] = mapped_column(nullable=True)
    message: Mapped[str]
    severity: Mapped[str]  # info | warning | critical
    acknowledged: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    budget: Mapped["Budget"] = relationship(lazy="selectin")  # type: ignore[name-defined]
