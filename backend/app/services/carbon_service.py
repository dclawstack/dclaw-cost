"""Estimate CO2 emissions from billing records using regional carbon intensity data."""
from datetime import date
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.billing_record import BillingRecord
from app.models.carbon_record import CarbonRecord

# gCO2eq per kWh — sourced from Electricity Maps / Our World in Data (2024 estimates)
_CARBON_INTENSITY: dict[str, float] = {
    "us-east-1": 385, "us-east-2": 410, "us-west-1": 227, "us-west-2": 146,
    "eu-west-1": 339, "eu-west-2": 256, "eu-west-3": 56,  "eu-central-1": 338,
    "eu-north-1": 8,  "eu-south-1": 233,
    "ap-southeast-1": 408, "ap-southeast-2": 650,
    "ap-northeast-1": 506, "ap-northeast-2": 415,
    "ap-south-1": 708, "ca-central-1": 130,
    "sa-east-1": 109, "me-south-1": 732, "af-south-1": 908,
}
_DEFAULT_INTENSITY = 400.0  # gCO2eq/kWh for unknown regions

# Green regions (< 200 gCO2eq/kWh)
_GREEN_REGIONS = [r for r, v in _CARBON_INTENSITY.items() if v < 200]

# USD per kWh by service category (rough averages)
_COST_PER_KWH: dict[str, float] = {
    "EC2": 0.050, "Compute Engine": 0.048, "Virtual Machines": 0.052,
    "RDS": 0.080, "Cloud SQL": 0.078, "Azure SQL": 0.082,
    "S3": 0.010, "GCS": 0.010, "Blob Storage": 0.010,
    "default": 0.050,
}


def _kwh(cost_usd: float, service: str) -> float:
    rate = _COST_PER_KWH.get(service, _COST_PER_KWH["default"])
    return cost_usd / rate if rate > 0 else 0.0


async def calculate_carbon(account_id: UUID, db: AsyncSession) -> dict:
    """Calculate CO2 from all billing records for the account and store as CarbonRecords."""
    from sqlalchemy import func as sqlfunc
    rows = (
        await db.execute(
            select(
                BillingRecord.service,
                BillingRecord.region,
                BillingRecord.billing_period_start,
                BillingRecord.billing_period_end,
                sqlfunc.sum(BillingRecord.cost_usd).label("total_cost"),
            )
            .where(BillingRecord.cloud_account_id == account_id)
            .group_by(
                BillingRecord.service,
                BillingRecord.region,
                BillingRecord.billing_period_start,
                BillingRecord.billing_period_end,
            )
        )
    ).all()

    # Skip periods already calculated
    existing = set(
        (row[0], row[1], row[2])
        for row in (
            await db.execute(
                select(CarbonRecord.service, CarbonRecord.region, CarbonRecord.period_start)
                .where(CarbonRecord.cloud_account_id == account_id)
            )
        ).all()
    )

    new_records: list[CarbonRecord] = []
    for row in rows:
        if (row.service, row.region, row.billing_period_start) in existing:
            continue
        intensity = _CARBON_INTENSITY.get(row.region, _DEFAULT_INTENSITY)
        kwh = _kwh(float(row.total_cost), row.service)
        co2 = kwh * intensity / 1000.0  # convert grams → kg

        new_records.append(CarbonRecord(
            cloud_account_id=account_id,
            service=row.service,
            region=row.region,
            estimated_kwh=round(kwh, 4),
            carbon_intensity_gco2_kwh=intensity,
            co2_kg=round(co2, 4),
            cost_usd=round(float(row.total_cost), 2),
            period_start=row.billing_period_start,
            period_end=row.billing_period_end,
        ))

    if new_records:
        db.add_all(new_records)
        await db.commit()

    return {
        "records_created": len(new_records),
        "green_regions": _GREEN_REGIONS,
    }
