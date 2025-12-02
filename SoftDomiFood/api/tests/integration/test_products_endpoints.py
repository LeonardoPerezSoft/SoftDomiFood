import pytest
from httpx import AsyncClient
from services.database_service import create_product
import uuid


@pytest.mark.asyncio
async def test_products_list_returns_array(test_client: AsyncClient):
    # Insertar un producto comprometido en DB (no transaccional)
    await create_product(
        name="Coca Cola 350ml",
        description="Bebida gaseosa Coca Cola",
        price=3000.0,
        category="BEBIDAS",
        image=None,
        is_available=True,
    )
    resp = await test_client.get("/api/products/")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data.get("products"), list)
    assert len(data["products"]) >= 1


@pytest.mark.asyncio
async def test_product_not_found_returns_404(test_client: AsyncClient):
    fake_id = str(uuid.uuid4())
    resp = await test_client.get(f"/api/products/{fake_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_product_by_id_returns_product(test_client: AsyncClient):
    created = await create_product(
        name="Salchipapa Básica",
        description="Salchipapa tradicional",
        price=15000.0,
        category="SALCHIPAPAS",
        image=None,
        is_available=True,
    )
    pid = created["id"]
    resp = await test_client.get(f"/api/products/{pid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("product", {}).get("id") == pid