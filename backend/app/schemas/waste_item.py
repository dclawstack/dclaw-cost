from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class WasteItemCreate(BaseModel):
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    waste_type: str
    estimated_monthly_waste_usd: float
    last_used_at: datetime | None = None
    status: str = "open"


class WasteItemStatusUpdate(BaseModel):
    status: str  # open | remediated | ignored


class WasteItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    waste_type: str
    estimated_monthly_waste_usd: float
    last_used_at: datetime | None
    status: str
    created_at: datetime
