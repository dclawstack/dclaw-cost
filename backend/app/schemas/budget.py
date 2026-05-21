from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BudgetCreate(BaseModel):
    name: str
    amount_usd: float
    period: str = "monthly"
    scope: str
    scope_value: str
    alert_threshold_pct: int = 80
    status: str = "active"


class BudgetUpdate(BaseModel):
    name: str | None = None
    amount_usd: float | None = None
    period: str | None = None
    scope: str | None = None
    scope_value: str | None = None
    alert_threshold_pct: int | None = None
    status: str | None = None


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    amount_usd: float
    period: str
    scope: str
    scope_value: str
    alert_threshold_pct: int
    status: str
    created_at: datetime
    updated_at: datetime
