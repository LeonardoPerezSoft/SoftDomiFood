import pytest
from httpx import AsyncClient
from services.auth_service import create_access_token
from services.database_service import create_user
import uuid as _uuid


@pytest.mark.asyncio
async def test_get_profile_authenticated_success(test_client: AsyncClient):
    # Crear usuario fuera de la transacción de test para que sea visible
    email = f"profile+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(email, "hashedpass", "Profile User", "+57 301 000 0000")
    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await test_client.get("/api/auth/profile", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("email") == user["email"]
    assert data.get("role") == user["role"]


@pytest.mark.asyncio
async def test_get_profile_unauthenticated_returns_403(test_client: AsyncClient):
    # HTTPBearer devuelve 403 cuando no hay credenciales
    resp = await test_client.get("/api/auth/profile")
    assert resp.status_code == 403