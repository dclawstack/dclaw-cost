from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.waste_item_repo import WasteItemRepository
from app.schemas.waste_item import WasteItemStatusUpdate, WasteItemResponse

router = APIRouter()


@router.get("/", response_model=list[WasteItemResponse])
async def list_waste_items(
    waste_type: str | None = None,
    status: str | None = None,
    cloud_account_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = WasteItemRepository(db)
    items, _ = await repo.list_filtered(
        waste_type=waste_type,
        status=status,
        cloud_account_id=cloud_account_id,
        limit=limit,
        offset=offset,
    )
    return items


@router.get("/{item_id}", response_model=WasteItemResponse)
async def get_waste_item(item_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = WasteItemRepository(db)
    obj = await repo.get_by_id(item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Waste item not found")
    return obj


@router.put("/{item_id}/status", response_model=WasteItemResponse)
async def update_waste_item_status(
    item_id: UUID,
    payload: WasteItemStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = WasteItemRepository(db)
    obj = await repo.get_by_id(item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Waste item not found")
    return await repo.update(obj, {"status": payload.status})
