import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    amount_usd: Mapped[float]
    period: Mapped[str] = mapped_column(default="monthly")  # daily | weekly | monthly | quarterly | annual
    scope: Mapped[str]  # account | service | tag | team
    scope_value: Mapped[str]
    alert_threshold_pct: Mapped[int] = mapped_column(default=80)
    status: Mapped[str] = mapped_column(default="active")  # active | inactive
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)
