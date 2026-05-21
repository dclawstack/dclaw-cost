from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TagAllocationCreate(BaseModel):
    tag_key: str
    tag_value: str
    team: str
    project: str | None = None


class TagAllocationUpdate(BaseModel):
    team: str | None = None
    project: str | None = None


class TagAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tag_key: str
    tag_value: str
    team: str
    project: str | None
    created_at: datetime
    updated_at: datetime


class ShowbackRow(BaseModel):
    team: str
    project: str | None
    total_spend_usd: float
    record_count: int
    pct_of_total: float


class ShowbackReport(BaseModel):
    period_start: str
    period_end: str
    total_spend_usd: float
    allocated_spend_usd: float
    unallocated_spend_usd: float
    allocation_pct: float
    rows: list[ShowbackRow]
