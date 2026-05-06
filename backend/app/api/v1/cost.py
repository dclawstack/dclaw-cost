import uuid
from datetime import datetime, timezone
from random import randint

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CreateReportRequest(BaseModel):
    account_id: str


class CostReport(BaseModel):
    id: str
    account_id: str
    monthly_spend: float
    top_services: list[str]
    savings_opportunities: list[str]
    anomaly_alerts: list[str]
    created_at: str


class BreakdownItem(BaseModel):
    service: str
    cost: float
    percentage: float


class BreakdownResponse(BaseModel):
    report_id: str
    items: list[BreakdownItem]


@router.post("/reports", response_model=CostReport)
async def create_report(payload: CreateReportRequest):
    return CostReport(
        id=str(uuid.uuid4()),
        account_id=payload.account_id,
        monthly_spend=float(randint(1000, 50000)),
        top_services=["Compute", "Storage"],
        savings_opportunities=["Right-size VMs"],
        anomaly_alerts=["Spike in egress"],
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/reports/{report_id}/breakdown", response_model=BreakdownResponse)
async def get_breakdown(report_id: str):
    return BreakdownResponse(
        report_id=report_id,
        items=[
            BreakdownItem(service="Compute", cost=3500.0, percentage=45.0),
            BreakdownItem(service="Storage", cost=2000.0, percentage=25.0),
            BreakdownItem(service="Network", cost=1500.0, percentage=20.0),
            BreakdownItem(service="Other", cost=800.0, percentage=10.0),
        ],
    )
