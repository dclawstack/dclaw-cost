from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.spot_strategy_repo import SpotStrategyRepository
from app.schemas.spot_strategy import SpotStrategyResponse, SpotStrategyStatusUpdate, SpotStrategySummary

router = APIRouter()


@router.post("/analyze/{account_id}", status_code=201)
async def analyze_spot_opportunities(account_id: UUID, db: AsyncSession = Depends(get_db)):
    from app.services.spot_strategy_service import generate_spot_strategies
    return await generate_spot_strategies(account_id, db)


@router.get("/{account_id}", response_model=list[SpotStrategyResponse])
async def list_spot_strategies(
    account_id: UUID,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    repo = SpotStrategyRepository(db)
    return await repo.list_for_account(account_id, status=status)


@router.get("/{account_id}/summary", response_model=SpotStrategySummary)
async def spot_summary(account_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = SpotStrategyRepository(db)
    items = await repo.list_for_account(account_id)
    savings = await repo.total_potential_savings(account_id)
    return SpotStrategySummary(
        total_resources_analyzed=len(items),
        suitable_count=sum(1 for i in items if i.recommendation == "suitable"),
        partial_count=sum(1 for i in items if i.recommendation == "partial"),
        not_suitable_count=sum(1 for i in items if i.recommendation == "not_suitable"),
        total_potential_savings_usd=round(savings, 2),
    )


@router.put("/{strategy_id}/status", response_model=SpotStrategyResponse)
async def update_status(
    strategy_id: UUID,
    payload: SpotStrategyStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = SpotStrategyRepository(db)
    obj = await repo.get_by_id(strategy_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return await repo.update(obj, {"status": payload.status})
