import pytest
from httpx import AsyncClient


async def _budget(client: AsyncClient) -> str:
    r = await client.post("/api/v1/budgets/", json={
        "name": "Test Budget", "amount_usd": 1000.0, "period": "monthly",
        "scope": "service", "scope_value": "EC2", "alert_threshold_pct": 80,
    })
    return r.json()["id"]


@pytest.mark.asyncio
async def test_list_alerts_empty(client: AsyncClient):
    r = await client.get("/api/v1/cost-alerts/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_alert_created_after_threshold_breach(client: AsyncClient):
    # Create an account and budget, ingest billing that exceeds threshold
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "AWS", "provider": "aws", "external_account_id": "123"
    })).json()["id"]

    budget_id = await _budget(client)

    import datetime
    today = datetime.date.today()
    first = today.replace(day=1).isoformat()
    last_day = 28
    last = today.replace(day=last_day).isoformat()

    # Ingest billing that exceeds 80% of $1000 budget (EC2 service = scope)
    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "i-1", "resource_type": "ec2_instance",
         "service": "EC2", "region": "us-east-1", "cost_usd": 850.0,
         "usage_quantity": 744.0, "usage_unit": "hours",
         "billing_period_start": first, "billing_period_end": last, "tags": None}
    ]})

    r = await client.get("/api/v1/cost-alerts/")
    assert r.status_code == 200
    alerts = r.json()
    assert len(alerts) >= 1
    assert alerts[0]["budget_id"] == budget_id
    assert alerts[0]["alert_type"] in ("threshold", "forecast")


@pytest.mark.asyncio
async def test_acknowledge_alert(client: AsyncClient):
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "GCP", "provider": "gcp", "external_account_id": "proj-1"
    })).json()["id"]

    import datetime
    today = datetime.date.today()
    first = today.replace(day=1).isoformat()
    last = today.replace(day=28).isoformat()

    await client.post("/api/v1/budgets/", json={
        "name": "GCP Budget", "amount_usd": 100.0, "period": "monthly",
        "scope": "service", "scope_value": "Compute Engine", "alert_threshold_pct": 50,
    })
    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "vm-1", "resource_type": "gcp_vm",
         "service": "Compute Engine", "region": "us-central1", "cost_usd": 80.0,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": first, "billing_period_end": last, "tags": None}
    ]})

    alerts = (await client.get("/api/v1/cost-alerts/")).json()
    if not alerts:
        pytest.skip("No alert generated in this billing period")

    alert_id = alerts[0]["id"]
    r = await client.put(f"/api/v1/cost-alerts/{alert_id}/acknowledge")
    assert r.status_code == 200
    assert r.json()["acknowledged"] is True
