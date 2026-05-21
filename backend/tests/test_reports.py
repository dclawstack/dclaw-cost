import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_finops_report_empty(client: AsyncClient):
    """Report should return a valid structure even with no billing data."""
    r = await client.get("/api/v1/reports/finops?months=12")
    assert r.status_code == 200
    data = r.json()
    assert "monthly_trends" in data
    assert "unit_economics" in data
    assert "insights" in data
    assert len(data["unit_economics"]) >= 5
    assert isinstance(data["insights"], list)
    assert len(data["insights"]) >= 1


@pytest.mark.asyncio
async def test_finops_report_with_data(client: AsyncClient):
    import datetime

    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Report Test", "provider": "aws", "external_account_id": "report-111"
    })).json()["id"]

    today = datetime.date.today()
    first = today.replace(day=1).isoformat()
    end = today.isoformat()

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "i-report-1",
         "resource_type": "ec2_instance", "service": "EC2",
         "region": "us-east-1", "cost_usd": 2000.0,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": first, "billing_period_end": end, "tags": None},
    ]})

    r = await client.get("/api/v1/reports/finops?months=1")
    assert r.status_code == 200
    data = r.json()
    assert len(data["monthly_trends"]) >= 1

    # Find avg monthly metric
    avg = next((u for u in data["unit_economics"] if u["name"] == "Avg Monthly Spend"), None)
    assert avg is not None
    assert avg["value"] > 0
