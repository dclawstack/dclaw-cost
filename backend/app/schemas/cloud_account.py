from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CloudAccountCreate(BaseModel):
    name: str
    provider: str
    external_account_id: str
    status: str = "active"


class CloudAccountUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    external_account_id: str | None = None
    status: str | None = None


class CloudAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    provider: str
    external_account_id: str
    status: str
    created_at: datetime
    updated_at: datetime
