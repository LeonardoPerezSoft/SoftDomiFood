import pytest
from httpx import AsyncClient
from services.database_service import create_user
from services.auth_service import get_password_hash
import uuid as _uuid


@pytest.mark.asyncio
async def test_login_success_with_created_user(test_client: AsyncClient):
    email = f"login.user+{_uuid.uuid4().hex[:8]}@test.com"
    plain = "Password123!"
    hashed = get_password_hash(plain)
    user = await create_user(email, hashed, "Login User", "+57 302 000 0000")

    resp = await test_client.post("/api/auth/login", json={"email": email, "password": plain})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("user", {}).get("email") == email
    assert "token" in data


@pytest.mark.asyncio
async def test_login_invalid_password_returns_401(test_client: AsyncClient):
    email = f"login.badpass+{_uuid.uuid4().hex[:8]}@test.com"
    plain = "CorrectPass123!"
    hashed = get_password_hash(plain)
    await create_user(email, hashed, "Bad Pass User", None)

    resp = await test_client.post("/api/auth/login", json={"email": email, "password": "WrongPass!"})
    assert resp.status_code == 401