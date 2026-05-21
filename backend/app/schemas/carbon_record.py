from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


class CarbonRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    cloud_account_id: UUID
    service: str
    region: str
    estimated_kwh: float
    carbon_intensity_gco2_kwh: float
    co2_kg: float
    cost_usd: float
    period_start: date
    period_end: date
    created_at: datetime


class CarbonSummary(BaseModel):
    total_co2_kg: float
    total_kwh: float
    by_service: list[dict]
    by_region: list[dict]
    greenest_region: str | None
    dirtiest_region: str | None
    green_region_suggestions: list[str]
