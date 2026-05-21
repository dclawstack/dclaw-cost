import pytest
from httpx import AsyncClient


async def _create_account(client: AsyncClient, name: str = "AWS Prod") -> str:
    r = await client.post("/api/v1/cloud-accounts/", json={
        "name": name, "provider": "aws", "external_account_id": "acc-001"
    })
    return r.json()["id"]


@pytest.mark.asyncio
async def test_list_billing_records_empty(client: AsyncClient):
    r = await client.get("/api/v1/billing-records/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_ingest_billing_records(client: AsyncClient):
    account_id = await _create_account(client)
    payload = {
        "records": [
            {
                "cloud_account_id": account_id,
                "resource_id": "i-abc123",
                "resource_type": "ec2_instance",
                "service": "EC2",
                "region": "us-east-1",
                "cost_usd": 450.0,
                "usage_quantity": 744.0,
                "usage_unit": "hours",
                "billing_period_start": "2026-05-01",
                "billing_period_end": "2026-05-31",
                "tags": {"env": "prod"},
            }
        ]
    }
    r = await client.post("/api/v1/billing-records/ingest", json=payload)
    assert r.status_code == 201
    assert r.json()["created"] == 1


@pytest.mark.asyncio
async def test_list_billing_records_after_ingest(client: AsyncClient):
    account_id = await _create_account(client)
    records = [
        {
            "cloud_account_id": account_id,
            "resource_id": f"r-{i}",
            "resource_type": "ec2_instance",
            "service": "EC2" if i % 2 == 0 else "S3",
            "region": "us-east-1",
            "cost_usd": float(100 * i),
            "usage_quantity": 100.0,
            "usage_unit": "hours",
            "billing_period_start": "2026-05-01",
            "billing_period_end": "2026-05-31",
            "tags": None,
        }
        for i in range(1, 4)
    ]
    await client.post("/api/v1/billing-records/ingest", json={"records": records})

    r = await client.get("/api/v1/billing-records/")
    assert r.status_code == 200
    assert len(r.json()) == 3


@pytest.mark.asyncio
async def test_filter_billing_records_by_service(client: AsyncClient):
    account_id = await _create_account(client)
    records = [
        {"cloud_account_id": account_id, "resource_id": "r1", "resource_type": "bucket",
         "service": "S3", "region": "us-east-1", "cost_usd": 50.0,
         "usage_quantity": 1000.0, "usage_unit": "GB",
         "billing_period_start": "2026-05-01", "billing_period_end": "2026-05-31", "tags": None},
        {"cloud_account_id": account_id, "resource_id": "r2", "resource_type": "ec2_instance",
         "service": "EC2", "region": "us-east-1", "cost_usd": 200.0,
         "usage_quantity": 744.0, "usage_unit": "hours",
         "billing_period_start": "2026-05-01", "billing_period_end": "2026-05-31", "tags": None},
    ]
    await client.post("/api/v1/billing-records/ingest", json={"records": records})

    r = await client.get("/api/v1/billing-records/?service=S3")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["service"] == "S3"
