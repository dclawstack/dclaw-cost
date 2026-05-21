from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.billing_record import BillingRecord
from app.repositories.billing_record_repo import BillingRecordRepository
from app.schemas.billing_record import BillingRecordIngest, BillingRecordResponse
from app.services.alert_service import check_budgets_and_alert

router = APIRouter()


@router.get("/", response_model=list[BillingRecordResponse])
async def list_billing_records(
    cloud_account_id: UUID | None = None,
    service: str | None = None,
    region: str | None = None,
    start: date | None = None,
    end: date | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = BillingRecordRepository(db)
    items, _ = await repo.list_filtered(
        cloud_account_id=cloud_account_id,
        service=service,
        region=region,
        start=start,
        end=end,
        limit=limit,
        offset=offset,
    )
    return items


@router.get("/{record_id}", response_model=BillingRecordResponse)
async def get_billing_record(record_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = BillingRecordRepository(db)
    obj = await repo.get_by_id(record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Billing record not found")
    return obj


@router.post("/ingest", status_code=201)
async def ingest_billing_records(
    payload: BillingRecordIngest,
    db: AsyncSession = Depends(get_db),
):
    repo = BillingRecordRepository(db)
    records = [BillingRecord(**r.model_dump()) for r in payload.records]
    await repo.bulk_create(records)
    alerts_created = await check_budgets_and_alert(db)
    return {"created": len(records), "alerts_created": alerts_created}
