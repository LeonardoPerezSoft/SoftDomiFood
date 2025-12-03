import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint_ok(test_client: AsyncClient):
    resp = await test_client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "producer"