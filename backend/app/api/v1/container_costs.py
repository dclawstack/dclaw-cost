from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.container_cost import ContainerCost
from app.repositories.container_cost_repo import ContainerCostRepository
from app.schemas.container_cost import (
    ContainerCostIngest, ContainerCostResponse, NamespaceSummary,
)

router = APIRouter()


@router.post("/ingest", status_code=201)
async def ingest_container_costs(
    payload: ContainerCostIngest,
    db: AsyncSession = Depends(get_db),
):
    repo = ContainerCostRepository(db)
    records = [ContainerCost(**r.model_dump()) for r in payload.records]
    await repo.bulk_create(records)
    return {"created": len(records)}


@router.get("/namespaces/{account_id}", response_model=list[NamespaceSummary])
async def namespace_summary(
    account_id: UUID,
    period_start: date,
    period_end: date,
    db: AsyncSession = Depends(get_db),
):
    repo = ContainerCostRepository(db)
    rows = await repo.namespace_summary(account_id, period_start, period_end)
    return [
        NamespaceSummary(
            namespace=row.namespace,
            cluster=row.cluster,
            total_cost_usd=round(float(row.total_cost), 2),
            cpu_cost_usd=round(float(row.cpu_cost), 2),
            memory_cost_usd=round(float(row.memory_cost), 2),
            pod_count=int(row.pod_count),
            avg_cost_per_pod=round(float(row.total_cost) / max(int(row.pod_count), 1), 2),
        )
        for row in rows
    ]


@router.get("/", response_model=list[ContainerCostResponse])
async def list_container_costs(
    limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)
):
    repo = ContainerCostRepository(db)
    items, _ = await repo.list_all(limit=limit, offset=offset)
    return items
