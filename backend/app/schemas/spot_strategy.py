from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SpotStrategyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    service: str
    region: str
    workload_type: str
    current_monthly_cost: float
    spot_monthly_cost: float
    estimated_savings_usd: float
    savings_pct: float
    interruption_risk: str
    recommendation: str
    status: str
    created_at: datetime
    updated_at: datetime


class SpotStrategyStatusUpdate(BaseModel):
    status: str  # open | accepted | rejected


class SpotStrategySummary(BaseModel):
    total_resources_analyzed: int
    suitable_count: int
    partial_count: int
    not_suitable_count: int
    total_potential_savings_usd: float
