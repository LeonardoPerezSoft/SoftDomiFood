import pytest
from httpx import AsyncClient
from services.auth_service import create_access_token
from services.database_service import create_user, create_coupon, validate_coupon_for_user


@pytest.mark.asyncio
async def test_validate_coupon_valid_flow(test_client: AsyncClient):
    # Crear usuario y cupón válido fuera de transacción
    import uuid as _uuid
    user_email = f"coupon.user+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(user_email, "hashedpass", "Coupon User", None)
    import uuid as _uuid
    code = f"TEST20-{_uuid.uuid4().hex[:6]}"
    coupon = await create_coupon(
        code=code,
        description="Cupón 20%",
        discount_type="PERCENTAGE",
        amount=None,
        percentage=20.0,
        valid_from=None,
        valid_to=None,
        max_uses=100,
        per_user_limit=3,
        applicable_user_id=None,
        is_active=True,
    )

    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await test_client.post("/api/coupons/validate", json={"code": code}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("valid") is True


@pytest.mark.asyncio
async def test_validate_coupon_missing_code_returns_400(test_client: AsyncClient):
    import uuid as _uuid
    user_email = f"coupon2.user+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(user_email, "hashedpass", "Coupon2 User", None)
    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await test_client.post("/api/coupons/validate", json={}, headers=headers)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_validate_coupon_inactive_returns_invalid(test_client: AsyncClient):
    import uuid as _uuid
    user_email = f"coupon.inactive+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(user_email, "hashedpass", "Coupon Inactive", None)
    import uuid as _uuid
    code = f"INACTIVE10-{_uuid.uuid4().hex[:6]}"
    await create_coupon(
        code=code,
        description="Cupón inactivo",
        discount_type="AMOUNT",
        amount=1000.0,
        percentage=None,
        valid_from=None,
        valid_to=None,
        max_uses=10,
        per_user_limit=1,
        applicable_user_id=None,
        is_active=False,
    )
    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await test_client.post("/api/coupons/validate", json={"code": code}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("valid") is False
    assert "inactivo" in data.get("reason", "").lower()


@pytest.mark.asyncio
async def test_validate_coupon_expired_returns_invalid(test_client: AsyncClient):
    from datetime import datetime, timedelta
    import uuid as _uuid
    user_email = f"coupon.expired+{_uuid.uuid4().hex[:8]}@test.com"
    user = await create_user(user_email, "hashedpass", "Coupon Expired", None)
    # Crear cupón con valid_to en el pasado
    past = datetime.utcnow() - timedelta(days=1)
    code = f"EXPIRED15-{_uuid.uuid4().hex[:6]}"
    await create_coupon(
        code=code,
        description="Cupón expirado",
        discount_type="PERCENTAGE",
        amount=None,
        percentage=15.0,
        valid_from=None,
        valid_to=past,
        max_uses=10,
        per_user_limit=2,
        applicable_user_id=None,
        is_active=True,
    )
    token = create_access_token({"userId": user["id"], "role": user["role"]})
    headers = {"Authorization": f"Bearer {token}"}
    # Forzar "now" mediante parámetro opcional si fuera necesario, pero la API usa now=utcnow
    resp = await test_client.post("/api/coupons/validate", json={"code": code}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("valid") is False
    assert "expirado" in data.get("reason", "").lower()