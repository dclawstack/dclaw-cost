import uuid
from datetime import datetime, date
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class SaasSubscription(Base):
    __tablename__ = "saas_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]          # e.g. Datadog, Slack, GitHub
    vendor: Mapped[str]
    # monitoring | communication | ci_cd | security | analytics | productivity | other
    category: Mapped[str] = mapped_column(index=True)
    monthly_cost_usd: Mapped[float]
    annual_cost_usd: Mapped[float]
    seat_count: Mapped[int | None] = mapped_column(nullable=True)
    cost_per_seat_usd: Mapped[float | None] = mapped_column(nullable=True)
    renewal_date: Mapped[date | None] = mapped_column(nullable=True)
    owner: Mapped[str | None] = mapped_column(nullable=True)
    # active | cancelled | under_review | duplicate
    status: Mapped[str] = mapped_column(default="active", index=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)
