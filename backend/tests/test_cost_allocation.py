import pytest
from httpx import AsyncClient

import datetime

TODAY = datetime.date.today().isoformat()
FIRST = datetime.date.today().replace(day=1).isoformat()


@pytest.mark.asyncio
async def test_list_rules_empty(client: AsyncClient):
    r = await client.get("/api/v1/cost-allocation/rules")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_allocation_rule(client: AsyncClient):
    r = await client.post("/api/v1/cost-allocation/rules", json={
        "tag_key": "team", "tag_value": "platform", "team": "Platform Engineering"
    })
    assert r.status_code == 201
    data = r.json()
    assert data["tag_key"] == "team"
    assert data["team"] == "Platform Engineering"


@pytest.mark.asyncio
async def test_delete_allocation_rule(client: AsyncClient):
    r = await client.post("/api/v1/cost-allocation/rules", json={
        "tag_key": "env", "tag_value": "prod", "team": "Infra"
    })
    rule_id = r.json()["id"]
    r = await client.delete(f"/api/v1/cost-allocation/rules/{rule_id}")
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_showback_empty_period(client: AsyncClient):
    r = await client.get(f"/api/v1/cost-allocation/showback?period_start={FIRST}&period_end={TODAY}")
    assert r.status_code == 200
    data = r.json()
    assert data["total_spend_usd"] == 0.0
    assert data["allocation_pct"] == 0.0


@pytest.mark.asyncio
async def test_showback_with_tagged_billing(client: AsyncClient):
    acct = (await client.post("/api/v1/cloud-accounts/", json={
        "name": "Alloc Test", "provider": "aws", "external_account_id": "alloc-111"
    })).json()["id"]

    # Create allocation rule
    await client.post("/api/v1/cost-allocation/rules", json={
        "tag_key": "team", "tag_value": "platform", "team": "Platform",
    })

    # Ingest billing with matching tag
    await client.post("/api/v1/billing-records/ingest", json={"records": [
        {"cloud_account_id": acct, "resource_id": "i-tagged", "resource_type": "ec2_instance",
         "service": "EC2", "region": "us-east-1", "cost_usd": 300.0,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": FIRST, "billing_period_end": TODAY,
         "tags": {"team": "platform"}},
        {"cloud_account_id": acct, "resource_id": "i-untagged", "resource_type": "ec2_instance",
         "service": "EC2", "region": "us-east-1", "cost_usd": 100.0,
         "usage_quantity": 720.0, "usage_unit": "hours",
         "billing_period_start": FIRST, "billing_period_end": TODAY,
         "tags": None},
    ]})

    r = await client.get(f"/api/v1/cost-allocation/showback?period_start={FIRST}&period_end={TODAY}")
    assert r.status_code == 200
    data = r.json()
    assert data["total_spend_usd"] == 400.0
    assert data["allocated_spend_usd"] == 300.0
    assert data["unallocated_spend_usd"] == 100.0
    assert data["allocation_pct"] == 75.0

    teams = {row["team"] for row in data["rows"]}
    assert "Platform" in teams
    assert "unallocated" in teams
