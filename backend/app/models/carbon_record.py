import uuid
from datetime import datetime, date
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.core.utils import utc_now


class CarbonRecord(Base):
    __tablename__ = "carbon_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"), index=True
    )
    service: Mapped[str]
    region: Mapped[str]
    estimated_kwh: Mapped[float]
    carbon_intensity_gco2_kwh: Mapped[float]  # grams CO2eq per kWh
    co2_kg: Mapped[float]                     # kg CO2eq emitted
    cost_usd: Mapped[float]                   # source billing cost
    period_start: Mapped[date] = mapped_column(index=True)
    period_end: Mapped[date]
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
