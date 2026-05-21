from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.carbon_record import CarbonRecord
from app.repositories.base_repo import BaseRepository


class CarbonRepository(BaseRepository[CarbonRecord]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CarbonRecord)

    async def bulk_create(self, records: list[CarbonRecord]) -> list[CarbonRecord]:
        self.db.add_all(records)
        await self.db.commit()
        return records

    async def summary_by_service(
        self, cloud_account_id: UUID, period_start: date
    ) -> list[tuple]:
        result = await self.db.execute(
            select(
                CarbonRecord.service,
                func.sum(CarbonRecord.co2_kg).label("total_co2"),
                func.sum(CarbonRecord.estimated_kwh).label("total_kwh"),
            )
            .where(
                CarbonRecord.cloud_account_id == cloud_account_id,
                CarbonRecord.period_start >= period_start,
            )
            .group_by(CarbonRecord.service)
            .order_by(func.sum(CarbonRecord.co2_kg).desc())
        )
        return result.all()

    async def summary_by_region(
        self, cloud_account_id: UUID, period_start: date
    ) -> list[tuple]:
        result = await self.db.execute(
            select(
                CarbonRecord.region,
                func.sum(CarbonRecord.co2_kg).label("total_co2"),
                func.avg(CarbonRecord.carbon_intensity_gco2_kwh).label("avg_intensity"),
            )
            .where(
                CarbonRecord.cloud_account_id == cloud_account_id,
                CarbonRecord.period_start >= period_start,
            )
            .group_by(CarbonRecord.region)
            .order_by(func.sum(CarbonRecord.co2_kg).desc())
        )
        return result.all()
