import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_cloud_accounts_empty(client: AsyncClient):
    r = await client.get("/api/v1/cloud-accounts/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_cloud_account(client: AsyncClient):
    payload = {"name": "Prod AWS", "provider": "aws", "external_account_id": "123456789"}
    r = await client.post("/api/v1/cloud-accounts/", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Prod AWS"
    assert data["provider"] == "aws"
    assert data["status"] == "active"
    assert "id" in data


@pytest.mark.asyncio
async def test_get_cloud_account(client: AsyncClient):
    r = await client.post("/api/v1/cloud-accounts/", json={
        "name": "Dev GCP", "provider": "gcp", "external_account_id": "proj-dev"
    })
    account_id = r.json()["id"]

    r = await client.get(f"/api/v1/cloud-accounts/{account_id}")
    assert r.status_code == 200
    assert r.json()["id"] == account_id


@pytest.mark.asyncio
async def test_get_cloud_account_not_found(client: AsyncClient):
    r = await client.get("/api/v1/cloud-accounts/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_cloud_account(client: AsyncClient):
    r = await client.post("/api/v1/cloud-accounts/", json={
        "name": "Old Name", "provider": "azure", "external_account_id": "sub-123"
    })
    account_id = r.json()["id"]

    r = await client.put(f"/api/v1/cloud-accounts/{account_id}", json={"name": "New Name"})
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_cloud_account(client: AsyncClient):
    r = await client.post("/api/v1/cloud-accounts/", json={
        "name": "To Delete", "provider": "aws", "external_account_id": "del-123"
    })
    account_id = r.json()["id"]

    r = await client.delete(f"/api/v1/cloud-accounts/{account_id}")
    assert r.status_code == 204

    r = await client.get(f"/api/v1/cloud-accounts/{account_id}")
    assert r.status_code == 404
