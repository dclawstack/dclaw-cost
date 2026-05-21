from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, model_validator


class SaasSubscriptionCreate(BaseModel):
    name: str
    vendor: str
    category: str
    monthly_cost_usd: float
    seat_count: int | None = None
    renewal_date: date | None = None
    owner: str | None = None
    status: str = "active"
    notes: str | None = None

    @model_validator(mode="after")
    def compute_derived(self):
        self.annual_cost_usd = self.monthly_cost_usd * 12
        if self.seat_count and self.seat_count > 0:
            self.cost_per_seat_usd = self.monthly_cost_usd / self.seat_count
        else:
            self.cost_per_seat_usd = None
        return self

    annual_cost_usd: float = 0.0
    cost_per_seat_usd: float | None = None


class SaasSubscriptionUpdate(BaseModel):
    name: str | None = None
    vendor: str | None = None
    category: str | None = None
    monthly_cost_usd: float | None = None
    seat_count: int | None = None
    renewal_date: date | None = None
    owner: str | None = None
    status: str | None = None
    notes: str | None = None


class SaasSubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    vendor: str
    category: str
    monthly_cost_usd: float
    annual_cost_usd: float
    seat_count: int | None
    cost_per_seat_usd: float | None
    renewal_date: date | None
    owner: str | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class SaasSummary(BaseModel):
    total_monthly_usd: float
    total_annual_usd: float
    active_count: int
    renewing_soon: int  # within 90 days
    by_category: dict[str, float]
