import pytest
from httpx import AsyncClient


BUDGET_PAYLOAD = {
    "name": "Monthly EC2 Budget",
    "amount_usd": 5000.0,
    "period": "monthly",
    "scope": "service",
    "scope_value": "EC2",
    "alert_threshold_pct": 80,
}


@pytest.mark.asyncio
async def test_list_budgets_empty(client: AsyncClient):
    r = await client.get("/api/v1/budgets/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_budget(client: AsyncClient):
    r = await client.post("/api/v1/budgets/", json=BUDGET_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Monthly EC2 Budget"
    assert data["amount_usd"] == 5000.0
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_get_budget(client: AsyncClient):
    r = await client.post("/api/v1/budgets/", json=BUDGET_PAYLOAD)
    budget_id = r.json()["id"]

    r = await client.get(f"/api/v1/budgets/{budget_id}")
    assert r.status_code == 200
    assert r.json()["id"] == budget_id


@pytest.mark.asyncio
async def test_update_budget(client: AsyncClient):
    r = await client.post("/api/v1/budgets/", json=BUDGET_PAYLOAD)
    budget_id = r.json()["id"]

    r = await client.put(f"/api/v1/budgets/{budget_id}", json={"amount_usd": 7500.0})
    assert r.status_code == 200
    assert r.json()["amount_usd"] == 7500.0


@pytest.mark.asyncio
async def test_delete_budget(client: AsyncClient):
    r = await client.post("/api/v1/budgets/", json=BUDGET_PAYLOAD)
    budget_id = r.json()["id"]

    r = await client.delete(f"/api/v1/budgets/{budget_id}")
    assert r.status_code == 204

    r = await client.get(f"/api/v1/budgets/{budget_id}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_budget_not_found(client: AsyncClient):
    r = await client.get("/api/v1/budgets/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
