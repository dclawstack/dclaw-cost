import pytest
from httpx import AsyncClient

import datetime

TODAY = datetime.date.today().isoformat()
FIRST = datetime.date.today().replace(day=1).isoformat()


async def _account(client: AsyncClient) -> str:
    r = await client.post("/api/v1/cloud-accounts/", json={
        "name": "K8s Account", "provider": "gcp", "external_account_id": "proj-k8s"
    })
    return r.json()["id"]


@pytest.mark.asyncio
async def test_ingest_container_costs(client: AsyncClient):
    acct = await _account(client)
    r = await client.post("/api/v1/container-costs/ingest", json={"records": [
        {"cloud_account_id": acct, "cluster": "prod-cluster", "namespace": "frontend",
         "pod_name": "web-abc123", "cpu_cores_requested": 0.5, "memory_gb_requested": 1.0,
         "cpu_cost_usd": 12.0, "memory_cost_usd": 8.0, "total_cost_usd": 20.0,
         "period_start": FIRST, "period_end": TODAY},
        {"cloud_account_id": acct, "cluster": "prod-cluster", "namespace": "backend",
         "pod_name": "api-xyz456", "cpu_cores_requested": 1.0, "memory_gb_requested": 2.0,
         "cpu_cost_usd": 24.0, "memory_cost_usd": 16.0, "total_cost_usd": 40.0,
         "period_start": FIRST, "period_end": TODAY},
    ]})
    assert r.status_code == 201
    assert r.json()["created"] == 2


@pytest.mark.asyncio
async def test_namespace_summary(client: AsyncClient):
    acct = await _account(client)
    await client.post("/api/v1/container-costs/ingest", json={"records": [
        {"cloud_account_id": acct, "cluster": "prod", "namespace": "ns-a",
         "pod_name": "pod-1", "cpu_cores_requested": 0.5, "memory_gb_requested": 1.0,
         "cpu_cost_usd": 10.0, "memory_cost_usd": 5.0, "total_cost_usd": 15.0,
         "period_start": FIRST, "period_end": TODAY},
        {"cloud_account_id": acct, "cluster": "prod", "namespace": "ns-a",
         "pod_name": "pod-2", "cpu_cores_requested": 0.5, "memory_gb_requested": 1.0,
         "cpu_cost_usd": 10.0, "memory_cost_usd": 5.0, "total_cost_usd": 15.0,
         "period_start": FIRST, "period_end": TODAY},
        {"cloud_account_id": acct, "cluster": "prod", "namespace": "ns-b",
         "pod_name": "pod-3", "cpu_cores_requested": 2.0, "memory_gb_requested": 4.0,
         "cpu_cost_usd": 50.0, "memory_cost_usd": 30.0, "total_cost_usd": 80.0,
         "period_start": FIRST, "period_end": TODAY},
    ]})

    r = await client.get(f"/api/v1/container-costs/namespaces/{acct}?period_start={FIRST}&period_end={TODAY}")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2

    # ns-b has higher cost → should be first
    assert data[0]["namespace"] == "ns-b"
    assert data[0]["total_cost_usd"] == 80.0
    assert data[0]["pod_count"] == 1

    assert data[1]["namespace"] == "ns-a"
    assert data[1]["total_cost_usd"] == 30.0
    assert data[1]["pod_count"] == 2
    assert data[1]["avg_cost_per_pod"] == 15.0
