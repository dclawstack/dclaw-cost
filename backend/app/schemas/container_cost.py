from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


class ContainerCostCreate(BaseModel):
    cloud_account_id: UUID
    cluster: str
    namespace: str
    pod_name: str | None = None
    cpu_cores_requested: float
    memory_gb_requested: float
    cpu_cost_usd: float
    memory_cost_usd: float
    total_cost_usd: float
    period_start: date
    period_end: date


class ContainerCostIngest(BaseModel):
    records: list[ContainerCostCreate]


class ContainerCostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    cloud_account_id: UUID
    cluster: str
    namespace: str
    pod_name: str | None
    cpu_cores_requested: float
    memory_gb_requested: float
    cpu_cost_usd: float
    memory_cost_usd: float
    total_cost_usd: float
    period_start: date
    period_end: date
    created_at: datetime


class NamespaceSummary(BaseModel):
    namespace: str
    cluster: str
    total_cost_usd: float
    cpu_cost_usd: float
    memory_cost_usd: float
    pod_count: int
    avg_cost_per_pod: float
