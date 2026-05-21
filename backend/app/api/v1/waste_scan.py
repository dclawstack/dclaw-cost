from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()


@router.post("/scan/{account_id}", status_code=201)
async def scan_waste(account_id: UUID, db: AsyncSession = Depends(get_db)):
    """Enhanced waste detection: identify 5 waste types from billing patterns."""
    from app.services.waste_scanner_service import scan_waste as _scan
    return await _scan(account_id, db)
