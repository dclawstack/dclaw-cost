from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.cost_alert_repo import CostAlertRepository
from app.schemas.cost_alert import CostAlertResponse

router = APIRouter()


@router.get("/", response_model=list[CostAlertResponse])
async def list_cost_alerts(
    severity: str | None = None,
    acknowledged: bool | None = None,
    budget_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = CostAlertRepository(db)
    items, _ = await repo.list_filtered(
        severity=severity,
        acknowledged=acknowledged,
        budget_id=budget_id,
        limit=limit,
        offset=offset,
    )
    return items


@router.get("/{alert_id}", response_model=CostAlertResponse)
async def get_cost_alert(alert_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = CostAlertRepository(db)
    obj = await repo.get_by_id(alert_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Alert not found")
    return obj


@router.put("/{alert_id}/acknowledge", response_model=CostAlertResponse)
async def acknowledge_alert(alert_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = CostAlertRepository(db)
    obj = await repo.get_by_id(alert_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Alert not found")
    return await repo.acknowledge(obj)
