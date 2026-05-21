from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CostAlertCreate(BaseModel):
    budget_id: UUID
    alert_type: str
    current_spend_usd: float
    projected_spend_usd: float | None = None
    message: str
    severity: str


class CostAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    budget_id: UUID
    alert_type: str
    current_spend_usd: float
    projected_spend_usd: float | None
    message: str
    severity: str
    acknowledged: bool
    created_at: datetime
