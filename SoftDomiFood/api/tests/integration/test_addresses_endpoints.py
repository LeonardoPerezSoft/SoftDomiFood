import pytest
from httpx import AsyncClient
from services.auth_service import create_access_token
from services.database_service import create_user, create_address
import uuid as _uuid


@pytest.mark.asyncio
async def test_get_addresses_returns_list(test_client: AsyncClient):
    # Crear usuario y una dirección fuera de transacción
    email = f"addr.user+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(email, "hashedpass", "Addr User", None)
    await create_address(user_id=user["id"], street="Calle 1", city="Bogotá", state="Cundinamarca", zip_code="110111", country="Colombia", is_default=True, instructions=None)

    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await test_client.get("/api/addresses", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data.get("addresses"), list)
    assert len(data["addresses"]) >= 1


@pytest.mark.asyncio
async def test_get_address_by_id_ok(test_client: AsyncClient):
    email = f"addr2.user+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(email, "hashedpass", "Addr2 User", None)
    addr = await create_address(user_id=user["id"], street="Calle 2", city="Medellín", state="Antioquia", zip_code="050001", country="Colombia", is_default=False, instructions="Puerta negra")

    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await test_client.get(f"/api/addresses/{addr['id']}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("address", {}).get("id") == addr["id"]


@pytest.mark.asyncio
async def test_get_address_not_found(test_client: AsyncClient):
    email = f"addr3.user+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(email, "hashedpass", "Addr3 User", None)
    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    import uuid
    fake_id = str(uuid.uuid4())
    resp = await test_client.get(f"/api/addresses/{fake_id}", headers=headers)
    assert resp.status_code == 404