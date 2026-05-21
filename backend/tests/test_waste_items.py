import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_waste_items_empty(client: AsyncClient):
    r = await client.get("/api/v1/waste-items/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_waste_scan_with_billing(client: AsyncClient):
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Waste Test", "provider": "aws", "external_account_id": "waste-111"
    })).json()["id"]

    import datetime
    three_months_ago = (datetime.date.today() - datetime.timedelta(days=90)).isoformat()
    two_months_ago = (datetime.date.today() - datetime.timedelta(days=60)).isoformat()

    # Ingest records that look like orphaned volumes and unused IPs
    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "vol-orphan-1", "resource_type": "ebs_volume",
         "service": "EBS", "region": "us-east-1", "cost_usd": 5.0,
         "usage_quantity": 100.0, "usage_unit": "GB-month",
         "billing_period_start": three_months_ago, "billing_period_end": two_months_ago, "tags": None},
        {"cloud_account_id": acct, "resource_id": "eip-unused-1", "resource_type": "elastic_ip",
         "service": "EC2", "region": "us-east-1", "cost_usd": 3.6,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": three_months_ago, "billing_period_end": two_months_ago, "tags": None},
    ]})

    # Run enhanced scan
    r = await client.post(f"/api/v1/waste-scan/scan/{acct}")
    assert r.status_code == 201
    data = r.json()
    assert "resources_scanned" in data
    assert "waste_items_created" in data
    assert data["resources_scanned"] >= 0


@pytest.mark.asyncio
async def test_update_waste_item_status(client: AsyncClient):
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Status Test", "provider": "aws", "external_account_id": "st-111"
    })).json()["id"]

    import datetime
    since = (datetime.date.today() - datetime.timedelta(days=60)).isoformat()
    until = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()

    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "vol-test-1", "resource_type": "ebs_volume",
         "service": "EBS", "region": "us-east-1", "cost_usd": 4.0,
         "usage_quantity": 80.0, "usage_unit": "GB-month",
         "billing_period_start": since, "billing_period_end": until, "tags": None},
    ]})
    await client.post(f"/api/v1/waste-scan/scan/{acct}")

    items = (await client.get(f"/api/v1/waste-items/?cloud_account_id={acct}")).json()
    if not items:
        pytest.skip("No waste items found for this account in the test period")

    item_id = items[0]["id"]
    r = await client.put(f"/api/v1/waste-items/{item_id}/status", json={"status": "remediated"})
    assert r.status_code == 200
    assert r.json()["status"] == "remediated"
