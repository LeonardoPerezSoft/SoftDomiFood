import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from unittest.mock import AsyncMock

from main import app
from routers.auth import get_current_user

# ====================== FIXTURES ======================

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: {"userId": "user-123"}
    yield
    app.dependency_overrides = {}

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def fake_publish_order(monkeypatch):
    counter = {"count": 0}

    async def _fake_publish_order(order):
        counter["count"] += 1

    import routers.orders as orders_router
    monkeypatch.setattr(orders_router, "publish_order", _fake_publish_order)
    return counter

@pytest.fixture
def fake_db(monkeypatch):
    import services.database_service as db

    async def fake_get_product_by_id(product_id: str):
        return {"id": "prod-1", "name": "Salchi", "price": 10, "isAvailable": True}

    async def fake_get_address_by_id(address_id: str, user_id=None):
        return {"id": "addr-1", "userId": user_id or "user-123", "street": "Calle 1", "city": "Medellín"}

    async def fake_create_order(**kwargs):
        return {"id": "order-1", **kwargs}

    async def fake_validate_coupon_for_user(code, user_id):
        return {"valid": False, "reason": "no coupon"}

    monkeypatch.setattr(db, "get_product_by_id", fake_get_product_by_id)
    monkeypatch.setattr(db, "get_address_by_id", fake_get_address_by_id)
    monkeypatch.setattr(db, "create_order", fake_create_order)
    monkeypatch.setattr(db, "validate_coupon_for_user", fake_validate_coupon_for_user)

@pytest.fixture
def fake_schedule(monkeypatch):
    import services.schedule_service as sched

    def fake_parse_client_datetime(iso_str: str):
        return datetime.now(timezone.utc) + timedelta(hours=2)

    def fake_validate_schedule(dt_local):
        return None

    monkeypatch.setattr(sched, "parse_client_datetime", fake_parse_client_datetime)
    monkeypatch.setattr(sched, "validate_schedule", fake_validate_schedule)

# ====================== HELPERS ======================

def _scheduled_payload():
    return {
        "addressId": "addr-1",
        "paymentMethod": "CASH",
        "notes": "ok",
        "items": [{"productId": "prod-1", "quantity": 1, "price": 10}],
        "scheduledFor": "2025-12-02T18:00:00"
    }

def _normal_payload():
    return {
        "addressId": "addr-1",
        "paymentMethod": "CASH",
        "items": [{"productId": "prod-1", "quantity": 1, "price": 10}],
    }

# ====================== TESTS ======================

@pytest.mark.asyncio
async def test_create_order_scheduled_sets_status_and_does_not_publish(client, monkeypatch, fake_db, fake_schedule, fake_publish_order):
    created_payload = {}

    import services.database_service as db
    # Capturamos kwargs de create_order
    original_create_order = db.create_order
    async def _capture_create_order(**kwargs):
        created_payload.update(kwargs)
        return await original_create_order(**kwargs)
    monkeypatch.setattr(db, "create_order", _capture_create_order)

    import routers.orders as orders_router
    # reemplaza publish_order con el fake que cuenta llamadas
    monkeypatch.setattr(orders_router, "publish_order", AsyncMock(side_effect=fake_publish_order))

    res = await client.post("/api/orders/", json=_scheduled_payload())
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["scheduled"] is True
    assert created_payload["status"] == "SCHEDULED"
    assert created_payload["scheduled_for"] is not None
    # no se publica
    assert fake_publish_order["count"] == 0

@pytest.mark.asyncio
async def test_create_order_normal_publishes_to_rabbit(client, monkeypatch, fake_db, fake_publish_order):
    import routers.orders as orders_router
    monkeypatch.setattr(orders_router, "publish_order", AsyncMock(side_effect=fake_publish_order))

    res = await client.post("/api/orders/", json=_normal_payload())
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["scheduled"] is False
    assert fake_publish_order["count"] == 1

@pytest.mark.asyncio
async def test_create_order_scheduled_invalid_time_returns_400(client, monkeypatch, fake_db):
    import services.schedule_service as sched

    def fake_parse_client_datetime(iso_str: str):
        return datetime.now(timezone.utc) + timedelta(hours=1)

    def fake_validate_schedule(dt_local):
        raise ValueError("El restaurante no está disponible en ese horario.")

    monkeypatch.setattr(sched, "parse_client_datetime", fake_parse_client_datetime)
    monkeypatch.setattr(sched, "validate_schedule", fake_validate_schedule)

    payload = _scheduled_payload()
    res = await client.post("/api/orders/", json=payload)
    assert res.status_code == 400, res.text
    body = res.json()
    assert "no está disponible" in (body.get("detail") or "").lower()
