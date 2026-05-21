import pytest
from httpx import AsyncClient

PAYLOAD = {
    "name": "Datadog",
    "vendor": "Datadog Inc",
    "category": "monitoring",
    "monthly_cost_usd": 500.0,
    "seat_count": 25,
    "status": "active",
}


@pytest.mark.asyncio
async def test_list_saas_empty(client: AsyncClient):
    r = await client.get("/api/v1/saas/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_saas_subscription(client: AsyncClient):
    r = await client.post("/api/v1/saas/", json=PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Datadog"
    assert data["annual_cost_usd"] == 6000.0
    assert data["cost_per_seat_usd"] == 20.0


@pytest.mark.asyncio
async def test_get_saas_summary(client: AsyncClient):
    await client.post("/api/v1/saas/", json=PAYLOAD)
    await client.post("/api/v1/saas/", json={**PAYLOAD, "name": "Slack", "vendor": "Slack Technologies", "category": "communication", "monthly_cost_usd": 200.0})

    r = await client.get("/api/v1/saas/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["active_count"] == 2
    assert data["total_monthly_usd"] == 700.0
    assert data["total_annual_usd"] == 8400.0
    assert "monitoring" in data["by_category"]
    assert "communication" in data["by_category"]


@pytest.mark.asyncio
async def test_delete_saas_subscription(client: AsyncClient):
    r = await client.post("/api/v1/saas/", json=PAYLOAD)
    sub_id = r.json()["id"]

    r = await client.delete(f"/api/v1/saas/{sub_id}")
    assert r.status_code == 204

    r = await client.get(f"/api/v1/saas/{sub_id}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_saas_subscription(client: AsyncClient):
    r = await client.post("/api/v1/saas/", json=PAYLOAD)
    sub_id = r.json()["id"]

    r = await client.put(f"/api/v1/saas/{sub_id}", json={"monthly_cost_usd": 600.0, "status": "under_review"})
    assert r.status_code == 200
    data = r.json()
    assert data["monthly_cost_usd"] == 600.0
    assert data["status"] == "under_review"


@pytest.mark.asyncio
async def test_saas_category_filter(client: AsyncClient):
    await client.post("/api/v1/saas/", json=PAYLOAD)
    await client.post("/api/v1/saas/", json={**PAYLOAD, "name": "GitHub", "vendor": "GitHub Inc", "category": "ci_cd"})

    r = await client.get("/api/v1/saas/?category=monitoring")
    assert r.status_code == 200
    data = r.json()
    assert all(s["category"] == "monitoring" for s in data)
