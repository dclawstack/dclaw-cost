import uuid
from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class ReservedInstancePlan(Base):
    __tablename__ = "ri_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    service: Mapped[str]
    resource_type: Mapped[str]
    # 1yr_no_upfront | 1yr_partial | 1yr_all_upfront | 3yr_no_upfront | 3yr_partial | 3yr_all_upfront
    commitment_type: Mapped[str]
    term_years: Mapped[int]
    monthly_on_demand_cost: Mapped[float]
    monthly_ri_cost: Mapped[float]
    upfront_cost: Mapped[float]
    monthly_savings: Mapped[float]
    annual_savings: Mapped[float]
    break_even_months: Mapped[int]
    discount_pct: Mapped[float]
    status: Mapped[str] = mapped_column(default="proposed")  # proposed | accepted | rejected
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)
