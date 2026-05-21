from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RIPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    cloud_account_id: UUID
    service: str
    resource_type: str
    commitment_type: str
    term_years: int
    monthly_on_demand_cost: float
    monthly_ri_cost: float
    upfront_cost: float
    monthly_savings: float
    annual_savings: float
    break_even_months: int
    discount_pct: float
    status: str
    created_at: datetime
    updated_at: datetime


class RIPlanStatusUpdate(BaseModel):
    status: str  # proposed | accepted | rejected
