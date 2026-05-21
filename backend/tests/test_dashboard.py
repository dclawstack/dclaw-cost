import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_empty(client: AsyncClient):
    """Dashboard should return zeros when there is no data — not crash."""
    r = await client.get("/api/v1/dashboard/")
    assert r.status_code == 200
    data = r.json()
    assert data["total_monthly_spend"] == 0.0
    assert data["projected_monthly_spend"] == 0.0
    assert data["total_savings_opportunities"] == 0.0
    assert data["active_alerts_count"] == 0
    assert data["top_services"] == []
    assert data["budget_utilization"] == []


@pytest.mark.asyncio
async def test_dashboard_with_data(client: AsyncClient):
    import datetime
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Dash Test", "provider": "aws", "external_account_id": "dash-111"
    })).json()["id"]

    today = datetime.date.today()
    first = today.replace(day=1).isoformat()
    last_day = min(today.day + 5, 28)
    end = today.replace(day=last_day).isoformat()

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "i-dash-1",
         "resource_type": "ec2_instance", "service": "EC2",
         "region": "us-east-1", "cost_usd": 1500.0,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": first, "billing_period_end": end, "tags": None},
        {"cloud_account_id": acct, "resource_id": "bucket-1",
         "resource_type": "s3_bucket", "service": "S3",
         "region": "us-east-1", "cost_usd": 200.0,
         "usage_quantity": 500.0, "usage_unit": "GB",
         "billing_period_start": first, "billing_period_end": end, "tags": None},
    ]})

    r = await client.get("/api/v1/dashboard/")
    assert r.status_code == 200
    data = r.json()
    assert data["total_monthly_spend"] == 1700.0
    assert len(data["top_services"]) == 2
    assert data["top_services"][0]["service"] == "EC2"
    assert data["top_services"][0]["cost_usd"] == 1500.0
