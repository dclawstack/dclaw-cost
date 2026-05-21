from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.tag_allocation import TagAllocation
from app.repositories.tag_allocation_repo import TagAllocationRepository
from app.schemas.tag_allocation import (
    TagAllocationCreate, TagAllocationUpdate,
    TagAllocationResponse, ShowbackReport,
)
from app.services.cost_allocation_service import generate_showback

router = APIRouter()


@router.get("/rules", response_model=list[TagAllocationResponse])
async def list_rules(db: AsyncSession = Depends(get_db)):
    repo = TagAllocationRepository(db)
    return await repo.list_all_rules()


@router.post("/rules", response_model=TagAllocationResponse, status_code=201)
async def create_rule(payload: TagAllocationCreate, db: AsyncSession = Depends(get_db)):
    repo = TagAllocationRepository(db)
    obj = TagAllocation(**payload.model_dump())
    return await repo.create(obj)


@router.put("/rules/{rule_id}", response_model=TagAllocationResponse)
async def update_rule(
    rule_id: UUID,
    payload: TagAllocationUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = TagAllocationRepository(db)
    obj = await repo.get_by_id(rule_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Rule not found")
    return await repo.update(obj, payload.model_dump(exclude_none=True))


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_rule(rule_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = TagAllocationRepository(db)
    obj = await repo.get_by_id(rule_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Rule not found")
    await repo.delete(obj)


@router.get("/showback", response_model=ShowbackReport)
async def showback_report(
    period_start: date,
    period_end: date,
    db: AsyncSession = Depends(get_db),
):
    return await generate_showback(db, period_start, period_end)
