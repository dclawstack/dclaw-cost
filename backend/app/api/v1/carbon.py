from uuid import UUID
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.carbon_repo import CarbonRepository
from app.schemas.carbon_record import CarbonRecordResponse, CarbonSummary
from app.services.carbon_service import _GREEN_REGIONS

router = APIRouter()


@router.post("/calculate/{account_id}", status_code=201)
async def calculate_carbon(account_id: UUID, db: AsyncSession = Depends(get_db)):
    from app.services.carbon_service import calculate_carbon as _calc
    return await _calc(account_id, db)


@router.get("/{account_id}", response_model=list[CarbonRecordResponse])
async def list_carbon_records(
    account_id: UUID,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = CarbonRepository(db)
    items, _ = await repo.list_all(limit=limit, offset=offset)
    # filter by account in Python (repo.list_all doesn't filter)
    return [i for i in items if i.cloud_account_id == account_id]


@router.get("/{account_id}/summary", response_model=CarbonSummary)
async def carbon_summary(account_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = CarbonRepository(db)
    since = date.today().replace(day=1) - timedelta(days=330)  # ~12 months

    by_svc = await repo.summary_by_service(account_id, since)
    by_reg = await repo.summary_by_region(account_id, since)

    total_co2 = sum(float(row.total_co2) for row in by_svc)
    total_kwh = sum(float(row.total_kwh) for row in by_svc)

    # Greenest / dirtiest region
    greenest = min(by_reg, key=lambda r: float(r.avg_intensity), default=None)
    dirtiest = max(by_reg, key=lambda r: float(r.avg_intensity), default=None)

    used_regions = {row.region for row in by_reg}
    suggestions = [r for r in _GREEN_REGIONS if r not in used_regions][:3]

    return CarbonSummary(
        total_co2_kg=round(total_co2, 2),
        total_kwh=round(total_kwh, 2),
        by_service=[
            {"service": row.service, "co2_kg": round(float(row.total_co2), 2), "kwh": round(float(row.total_kwh), 2)}
            for row in by_svc
        ],
        by_region=[
            {"region": row.region, "co2_kg": round(float(row.total_co2), 2), "avg_intensity": round(float(row.avg_intensity), 0)}
            for row in by_reg
        ],
        greenest_region=greenest.region if greenest else None,
        dirtiest_region=dirtiest.region if dirtiest else None,
        green_region_suggestions=suggestions,
    )
