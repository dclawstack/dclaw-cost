from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.budget import Budget
from app.repositories.budget_repo import BudgetRepository
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse

router = APIRouter()


@router.get("/", response_model=list[BudgetResponse])
async def list_budgets(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = BudgetRepository(db)
    items, _ = await repo.list_all(limit=limit, offset=offset)
    return items


@router.post("/", response_model=BudgetResponse, status_code=201)
async def create_budget(payload: BudgetCreate, db: AsyncSession = Depends(get_db)):
    repo = BudgetRepository(db)
    obj = Budget(**payload.model_dump())
    return await repo.create(obj)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = BudgetRepository(db)
    obj = await repo.get_by_id(budget_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    return obj


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: UUID,
    payload: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = BudgetRepository(db)
    obj = await repo.get_by_id(budget_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    return await repo.update(obj, payload.model_dump(exclude_none=True))


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = BudgetRepository(db)
    obj = await repo.get_by_id(budget_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    await repo.delete(obj)
