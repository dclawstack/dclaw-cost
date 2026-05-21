from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.ri_plan_repo import RIPlanRepository
from app.schemas.ri_plan import RIPlanResponse, RIPlanStatusUpdate

router = APIRouter()


@router.post("/analyze/{account_id}", status_code=201)
async def analyze_ri_opportunities(account_id: UUID, db: AsyncSession = Depends(get_db)):
    """Generate RI plans by analyzing 90 days of billing for the account."""
    from app.services.ri_planner_service import generate_ri_plans
    return await generate_ri_plans(account_id, db)


@router.get("/{account_id}", response_model=list[RIPlanResponse])
async def list_ri_plans(
    account_id: UUID,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    repo = RIPlanRepository(db)
    return await repo.list_for_account(account_id, status=status)


@router.put("/{plan_id}/status", response_model=RIPlanResponse)
async def update_ri_plan_status(
    plan_id: UUID,
    payload: RIPlanStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = RIPlanRepository(db)
    plan = await repo.get_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="RI plan not found")
    return await repo.update(plan, {"status": payload.status})


@router.get("/summary/accepted-savings")
async def accepted_savings(db: AsyncSession = Depends(get_db)):
    repo = RIPlanRepository(db)
    total = await repo.total_accepted_savings()
    return {"total_accepted_annual_savings_usd": total}
