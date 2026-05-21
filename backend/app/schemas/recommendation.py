from uuid import UUID
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict


class RecommendationCreate(BaseModel):
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    recommendation_type: str
    current_cost_usd: float
    estimated_savings_usd: float
    confidence: int
    details: dict[str, Any] | None = None
    status: str = "open"


class RecommendationStatusUpdate(BaseModel):
    status: str  # open | applied | dismissed


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cloud_account_id: UUID
    resource_id: str
    resource_type: str
    recommendation_type: str
    current_cost_usd: float
    estimated_savings_usd: float
    confidence: int
    details: dict[str, Any] | None
    status: str
    created_at: datetime
    updated_at: datetime
