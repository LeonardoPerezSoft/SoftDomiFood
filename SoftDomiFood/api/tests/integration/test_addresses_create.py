import pytest
from httpx import AsyncClient
from services.auth_service import create_access_token
from services.database_service import create_user


@pytest.mark.asyncio
async def test_create_address_with_camelCase_payload_returns_201(test_client: AsyncClient):
    # Usuario y token
    import uuid as _uuid
    email = f"addr.post+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(email, "hashedpass", "Addr Post User", None)
    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "street": "Calle 123 #45-67",
        "city": "Bogotá",
        "state": "Cundinamarca",
        "zipCode": "110111",           # alias camelCase
        "country": "Colombia",
        "isDefault": True,               # alias camelCase
        "instructions": "Tocar timbre"
    }

    resp = await test_client.post("/api/addresses", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("message") == "Address created successfully"
    addr = data.get("address", {})
    assert addr.get("street") == payload["street"]
    assert addr.get("city") == payload["city"]
    assert addr.get("state") == payload["state"]
    assert addr.get("zipCode") == payload["zipCode"]
    assert addr.get("isDefault") is True