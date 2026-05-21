import pytest
from httpx import AsyncClient

import datetime


async def _account_with_compute(client: AsyncClient, name: str = "Spot Test") -> str:
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": name, "provider": "aws", "external_account_id": f"spot-{name[:4]}"
    })).json()["id"]

    since = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
    today = datetime.date.today().isoformat()

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": f"i-{i:04d}",
         "resource_type": "ec2_instance", "service": "EC2",
         "region": "us-east-1", "cost_usd": float(100 + i * 30),
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": since, "billing_period_end": today, "tags": None}
        for i in range(5)
    ]})
    return acct


@pytest.mark.asyncio
async def test_analyze_spot_opportunities(client: AsyncClient):
    acct = await _account_with_compute(client)
    r = await client.post(f"/api/v1/spot-strategy/analyze/{acct}")
    assert r.status_code == 201
    data = r.json()
    assert "resources_analyzed" in data
    assert "strategies_created" in data


@pytest.mark.asyncio
async def test_list_spot_strategies(client: AsyncClient):
    acct = await _account_with_compute(client, "Spot List")
    await client.post(f"/api/v1/spot-strategy/analyze/{acct}")
    r = await client.get(f"/api/v1/spot-strategy/{acct}")
    assert r.status_code == 200
    strategies = r.json()
    for s in strategies:
        assert s["spot_monthly_cost"] < s["current_monthly_cost"]
        assert s["interruption_risk"] in ("low", "medium", "high")
        assert s["recommendation"] in ("suitable", "partial", "not_suitable")


@pytest.mark.asyncio
async def test_spot_summary(client: AsyncClient):
    acct = await _account_with_compute(client, "Spot Sum")
    await client.post(f"/api/v1/spot-strategy/analyze/{acct}")
    r = await client.get(f"/api/v1/spot-strategy/{acct}/summary")
    assert r.status_code == 200
    data = r.json()
    assert "total_resources_analyzed" in data
    assert "total_potential_savings_usd" in data
    assert data["suitable_count"] + data["partial_count"] + data["not_suitable_count"] == data["total_resources_analyzed"]


@pytest.mark.asyncio
async def test_accept_spot_strategy(client: AsyncClient):
    acct = await _account_with_compute(client, "Spot Accept")
    await client.post(f"/api/v1/spot-strategy/analyze/{acct}")
    strategies = (await client.get(f"/api/v1/spot-strategy/{acct}")).json()
    if not strategies:
        pytest.skip("No strategies generated")
    sid = strategies[0]["id"]
    r = await client.put(f"/api/v1/spot-strategy/{sid}/status", json={"status": "accepted"})
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"
