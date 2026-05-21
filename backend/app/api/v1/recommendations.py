from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.recommendation_repo import RecommendationRepository
from app.schemas.recommendation import RecommendationStatusUpdate, RecommendationResponse

router = APIRouter()


@router.get("/", response_model=list[RecommendationResponse])
async def list_recommendations(
    recommendation_type: str | None = None,
    status: str | None = None,
    cloud_account_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    repo = RecommendationRepository(db)
    items, _ = await repo.list_filtered(
        recommendation_type=recommendation_type,
        status=status,
        cloud_account_id=cloud_account_id,
        limit=limit,
        offset=offset,
    )
    return items


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(recommendation_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = RecommendationRepository(db)
    obj = await repo.get_by_id(recommendation_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return obj


@router.put("/{recommendation_id}/status", response_model=RecommendationResponse)
async def update_recommendation_status(
    recommendation_id: UUID,
    payload: RecommendationStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = RecommendationRepository(db)
    obj = await repo.get_by_id(recommendation_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return await repo.update(obj, {"status": payload.status})


@router.post("/analyze/{account_id}", status_code=201)
async def analyze_account_spending(account_id: UUID, db: AsyncSession = Depends(get_db)):
    """Run heuristic analysis on billing data and generate recommendations + waste items."""
    from app.services.analyzer_service import analyze_account
    return await analyze_account(account_id, db)
