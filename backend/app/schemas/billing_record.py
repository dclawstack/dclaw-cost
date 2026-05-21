from uuid import UUID
from datetime import datetime, date
from typing import Any
from pydantic import BaseModel, ConfigDict


class BillingRecordCreate(BaseModel):
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    service: str
    region: str
    cost_usd: float
    usage_quantity: float
    usage_unit: str
    billing_period_start: date
    billing_period_end: date
    tags: dict[str, Any] | None = None


class BillingRecordIngest(BaseModel):
    records: list[BillingRecordCreate]


class BillingRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    service: str
    region: str
    cost_usd: float
    usage_quantity: float
    usage_unit: str
    billing_period_start: date
    billing_period_end: date
    tags: dict[str, Any] | None
    created_at: datetime
