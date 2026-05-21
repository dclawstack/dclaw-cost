from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.saas_subscription import SaasSubscription
from app.repositories.saas_repo import SaasRepository
from app.schemas.saas_subscription import (
    SaasSubscriptionCreate, SaasSubscriptionUpdate,
    SaasSubscriptionResponse, SaasSummary,
)

router = APIRouter()


@router.get("/", response_model=list[SaasSubscriptionResponse])
async def list_subscriptions(
    status: str | None = None,
    category: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = SaasRepository(db)
    items, _ = await repo.list_filtered(status=status, category=category, limit=limit, offset=offset)
    return items


@router.post("/", response_model=SaasSubscriptionResponse, status_code=201)
async def create_subscription(payload: SaasSubscriptionCreate, db: AsyncSession = Depends(get_db)):
    repo = SaasRepository(db)
    data = payload.model_dump()
    obj = SaasSubscription(**data)
    return await repo.create(obj)


@router.get("/summary", response_model=SaasSummary)
async def saas_summary(db: AsyncSession = Depends(get_db)):
    repo = SaasRepository(db)
    items, _ = await repo.list_filtered(status="active", limit=1000)
    renewing = await repo.renewing_soon()
    by_cat = await repo.spend_by_category()
    total_monthly = sum(i.monthly_cost_usd for i in items)
    return SaasSummary(
        total_monthly_usd=round(total_monthly, 2),
        total_annual_usd=round(total_monthly * 12, 2),
        active_count=len(items),
        renewing_soon=len(renewing),
        by_category={cat: round(spend, 2) for cat, spend in by_cat},
    )


@router.get("/{subscription_id}", response_model=SaasSubscriptionResponse)
async def get_subscription(subscription_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = SaasRepository(db)
    obj = await repo.get_by_id(subscription_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return obj


@router.put("/{subscription_id}", response_model=SaasSubscriptionResponse)
async def update_subscription(
    subscription_id: UUID,
    payload: SaasSubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = SaasRepository(db)
    obj = await repo.get_by_id(subscription_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subscription not found")
    data = payload.model_dump(exclude_none=True)
    if "monthly_cost_usd" in data:
        data["annual_cost_usd"] = data["monthly_cost_usd"] * 12
        seats = data.get("seat_count") or obj.seat_count
        data["cost_per_seat_usd"] = data["monthly_cost_usd"] / seats if seats else None
    return await repo.update(obj, data)


@router.delete("/{subscription_id}", status_code=204)
async def delete_subscription(subscription_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = SaasRepository(db)
    obj = await repo.get_by_id(subscription_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Subscription not found")
    await repo.delete(obj)
