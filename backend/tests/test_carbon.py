import pytest
from httpx import AsyncClient

import datetime

SINCE = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
TODAY = datetime.date.today().isoformat()


async def _account_with_billing(client: AsyncClient) -> str:
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Carbon Test", "provider": "aws", "external_account_id": "carbon-111"
    })).json()["id"]

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "i-carbon-1",
         "resource_type": "ec2_instance", "service": "EC2",
         "region": "us-east-1", "cost_usd": 500.0,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": SINCE, "billing_period_end": TODAY, "tags": None},
        {"cloud_account_id": acct, "resource_id": "bucket-carbon",
         "resource_type": "s3_bucket", "service": "S3",
         "region": "us-west-2", "cost_usd": 100.0,
         "usage_quantity": 1000.0, "usage_unit": "GB",
         "billing_period_start": SINCE, "billing_period_end": TODAY, "tags": None},
    ]})
    return acct


@pytest.mark.asyncio
async def test_calculate_carbon(client: AsyncClient):
    acct = await _account_with_billing(client)
    r = await client.post(f"/api/v1/carbon/calculate/{acct}")
    assert r.status_code == 201
    data = r.json()
    assert "records_created" in data
    assert data["records_created"] >= 0
    assert "green_regions" in data


@pytest.mark.asyncio
async def test_carbon_summary(client: AsyncClient):
    acct = await _account_with_billing(client)
    await client.post(f"/api/v1/carbon/calculate/{acct}")

    r = await client.get(f"/api/v1/carbon/{acct}/summary")
    assert r.status_code == 200
    data = r.json()
    assert "total_co2_kg" in data
    assert "total_kwh" in data
    assert isinstance(data["by_service"], list)
    assert isinstance(data["by_region"], list)
    assert isinstance(data["green_region_suggestions"], list)

    # us-east-1 should be dirtier than us-west-2
    if data["greenest_region"] and data["dirtiest_region"]:
        assert data["greenest_region"] != data["dirtiest_region"]


@pytest.mark.asyncio
async def test_carbon_idempotent(client: AsyncClient):
    """Calculating twice shouldn't create duplicate records."""
    acct = await _account_with_billing(client)
    r1 = await client.post(f"/api/v1/carbon/calculate/{acct}")
    r2 = await client.post(f"/api/v1/carbon/calculate/{acct}")
    assert r1.status_code == 201
    assert r2.status_code == 201
    # Second run should create 0 new records (already calculated)
    assert r2.json()["records_created"] == 0
