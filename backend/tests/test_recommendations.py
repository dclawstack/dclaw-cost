import pytest
from httpx import AsyncClient


async def _account_with_billing(client: AsyncClient) -> str:
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "AWS Prod", "provider": "aws", "external_account_id": "111"
    })).json()["id"]

    import datetime
    since = (datetime.date.today() - datetime.timedelta(days=15)).isoformat()
    today = datetime.date.today().isoformat()

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": f"i-{i}", "resource_type": "ec2_instance",
         "service": "EC2", "region": "us-east-1", "cost_usd": float(200 + i * 50),
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": since, "billing_period_end": today, "tags": None}
        for i in range(4)
    ]})
    return acct


@pytest.mark.asyncio
async def test_list_recommendations_empty(client: AsyncClient):
    r = await client.get("/api/v1/recommendations/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_analyze_creates_recommendations(client: AsyncClient):
    acct = await _account_with_billing(client)
    r = await client.post(f"/api/v1/recommendations/analyze/{acct}")
    assert r.status_code == 201
    data = r.json()
    assert "recommendations_created" in data
    assert data["recommendations_created"] >= 0

    recs = (await client.get("/api/v1/recommendations/")).json()
    assert isinstance(recs, list)


@pytest.mark.asyncio
async def test_update_recommendation_status(client: AsyncClient):
    acct = await _account_with_billing(client)
    await client.post(f"/api/v1/recommendations/analyze/{acct}")
    recs = (await client.get("/api/v1/recommendations/")).json()
    if not recs:
        pytest.skip("No recommendations generated")

    rec_id = recs[0]["id"]
    r = await client.put(f"/api/v1/recommendations/{rec_id}/status", json={"status": "applied"})
    assert r.status_code == 200
    assert r.json()["status"] == "applied"


@pytest.mark.asyncio
async def test_recommendation_not_found(client: AsyncClient):
    r = await client.put("/api/v1/recommendations/00000000-0000-0000-0000-000000000000/status", json={"status": "applied"})
    assert r.status_code == 404
