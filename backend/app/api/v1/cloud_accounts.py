from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.cloud_account import CloudAccount
from app.repositories.cloud_account_repo import CloudAccountRepository
from app.schemas.cloud_account import CloudAccountCreate, CloudAccountUpdate, CloudAccountResponse

router = APIRouter()


@router.get("/", response_model=list[CloudAccountResponse])
async def list_cloud_accounts(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = CloudAccountRepository(db)
    items, _ = await repo.list_all(limit=limit, offset=offset)
    return items


@router.post("/", response_model=CloudAccountResponse, status_code=201)
async def create_cloud_account(
    payload: CloudAccountCreate,
    db: AsyncSession = Depends(get_db),
):
    repo = CloudAccountRepository(db)
    obj = CloudAccount(**payload.model_dump())
    return await repo.create(obj)


@router.get("/{account_id}", response_model=CloudAccountResponse)
async def get_cloud_account(account_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = CloudAccountRepository(db)
    obj = await repo.get_by_id(account_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cloud account not found")
    return obj


@router.put("/{account_id}", response_model=CloudAccountResponse)
async def update_cloud_account(
    account_id: UUID,
    payload: CloudAccountUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = CloudAccountRepository(db)
    obj = await repo.get_by_id(account_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cloud account not found")
    return await repo.update(obj, payload.model_dump(exclude_none=True))


@router.delete("/{account_id}", status_code=204)
async def delete_cloud_account(account_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = CloudAccountRepository(db)
    obj = await repo.get_by_id(account_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cloud account not found")
    await repo.delete(obj)
