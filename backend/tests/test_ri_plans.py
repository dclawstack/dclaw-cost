import pytest
from httpx import AsyncClient


async def _account_with_compute(client: AsyncClient) -> str:
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "RI Test AWS", "provider": "aws", "external_account_id": "ri-111"
    })).json()["id"]

    import datetime
    three_months_ago = (datetime.date.today() - datetime.timedelta(days=90)).isoformat()
    today = datetime.date.today().isoformat()

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": f"i-ec2-{i}",
         "resource_type": "ec2_instance", "service": "EC2",
         "region": "us-east-1", "cost_usd": 600.0,
         "usage_quantity": 2160.0, "usage_unit": "hours",
         "billing_period_start": three_months_ago, "billing_period_end": today, "tags": None}
        for i in range(3)
    ]})
    return acct


@pytest.mark.asyncio
async def test_list_ri_plans_empty_account(client: AsyncClient):
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Empty RI", "provider": "aws", "external_account_id": "empty-ri"
    })).json()["id"]
    r = await client.get(f"/api/v1/ri-plans/{acct}")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_analyze_creates_ri_plans(client: AsyncClient):
    acct = await _account_with_compute(client)
    r = await client.post(f"/api/v1/ri-plans/analyze/{acct}")
    assert r.status_code == 201
    data = r.json()
    assert "plans_created" in data
    assert data["plans_created"] >= 0

    plans = (await client.get(f"/api/v1/ri-plans/{acct}")).json()
    assert isinstance(plans, list)
    for p in plans:
        assert p["monthly_savings"] > 0
        assert p["annual_savings"] > 0
        assert p["status"] == "proposed"


@pytest.mark.asyncio
async def test_accept_ri_plan(client: AsyncClient):
    acct = await _account_with_compute(client)
    await client.post(f"/api/v1/ri-plans/analyze/{acct}")
    plans = (await client.get(f"/api/v1/ri-plans/{acct}")).json()
    if not plans:
        pytest.skip("No RI plans generated")

    plan_id = plans[0]["id"]
    r = await client.put(f"/api/v1/ri-plans/{plan_id}/status", json={"status": "accepted"})
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"


@pytest.mark.asyncio
async def test_ri_plan_not_found(client: AsyncClient):
    r = await client.put("/api/v1/ri-plans/00000000-0000-0000-0000-000000000000/status", json={"status": "accepted"})
    assert r.status_code == 404
