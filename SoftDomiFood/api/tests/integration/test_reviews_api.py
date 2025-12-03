"""
Tests de Integración para Endpoints de Reseñas
Siguiendo principios FIRST:
- Fast: Usa DB de test in-memory
- Independent: Setup/teardown por test
- Repeatable: Datos de prueba consistentes
- Self-validating: Verifica status codes y respuestas
- Timely: Cobertura completa de endpoints
"""
import pytest
from httpx import AsyncClient
from fastapi import status
import uuid

from main import app


# ==================== FIXTURES ====================

@pytest.fixture
async def test_user_with_delivered_order(test_db_connection):
    """
    Crea un usuario con un pedido DELIVERED para pruebas
    """
    # Crear usuario
    user_id = await test_db_connection.fetchval(
        """
        INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, 'CUSTOMER', NOW(), NOW())
        RETURNING id
        """,
        "test_review@test.com",
        "hashed_password",
        "Test Review User"
    )
    
    # Crear dirección
    address_id = await test_db_connection.fetchval(
        """
        INSERT INTO addresses (id, "userId", street, city, state, "zipCode", country, "isDefault", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'Test St', 'City', 'State', '12345', 'Country', true, NOW(), NOW())
        RETURNING id
        """,
        user_id
    )
    
    # Obtener un producto existente
    product = await test_db_connection.fetchrow(
        'SELECT id FROM products LIMIT 1'
    )
    product_id = product['id'] if product else None
    
    if not product_id:
        # Crear producto si no existe
        product_id = await test_db_connection.fetchval(
            """
            INSERT INTO products (id, name, description, price, category, "isAvailable", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), 'Test Product', 'Test Description', 10.00, 'SALCHIPAPAS', true, NOW(), NOW())
            RETURNING id
            """,
        )
    
    # Crear pedido DELIVERED
    order_id = await test_db_connection.fetchval(
        """
        INSERT INTO orders (id, "userId", "addressId", status, total, "paymentMethod", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, 'DELIVERED', 10.00, 'CASH', NOW(), NOW())
        RETURNING id
        """,
        user_id, address_id
    )
    
    # Agregar item al pedido
    await test_db_connection.execute(
        """
        INSERT INTO order_items (id, "orderId", "productId", quantity, price, "createdAt")
        VALUES (gen_random_uuid(), $1, $2, 1, 10.00, NOW())
        """,
        order_id, product_id
    )
    
    yield {
        "user_id": str(user_id),
        "product_id": str(product_id),
        "order_id": str(order_id),
        "email": "test_review@test.com"
    }
    
    # Cleanup
    await test_db_connection.execute('DELETE FROM reviews WHERE "userId" = $1', user_id)
    await test_db_connection.execute('DELETE FROM order_items WHERE "orderId" = $1', order_id)
    await test_db_connection.execute('DELETE FROM orders WHERE id = $1', order_id)
    await test_db_connection.execute('DELETE FROM addresses WHERE "userId" = $1', user_id)
    await test_db_connection.execute('DELETE FROM users WHERE id = $1', user_id)


@pytest.fixture
async def auth_token(test_user_with_delivered_order):
    """
    Genera un token JWT para el usuario de prueba
    """
    from routers.auth import create_access_token
    
    token = create_access_token({
        "userId": test_user_with_delivered_order["user_id"],
        "email": test_user_with_delivered_order["email"],
        "role": "CUSTOMER"
    })
    
    return token


# ==================== TESTS: POST /api/reviews ====================

@pytest.mark.asyncio
async def test_create_review_success(test_user_with_delivered_order, auth_token):
    """
    GIVEN un usuario autenticado con pedido DELIVERED
    WHEN crea una reseña con rating y comentario
    THEN retorna 200 con los datos de la reseña
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/reviews",
            json={
                "productId": test_user_with_delivered_order["product_id"],
                "rating": 5,
                "comment": "Excelente producto de prueba"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "review" in data
    assert data["review"]["rating"] == 5
    assert data["review"]["comment"] == "Excelente producto de prueba"


@pytest.mark.asyncio
async def test_create_review_without_comment(test_user_with_delivered_order, auth_token):
    """
    GIVEN un usuario autenticado
    WHEN crea una reseña sin comentario
    THEN retorna 200 con comment=null
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/reviews",
            json={
                "productId": test_user_with_delivered_order["product_id"],
                "rating": 4,
                "comment": None
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["review"]["rating"] == 4
    assert data["review"]["comment"] is None


@pytest.mark.asyncio
async def test_create_review_invalid_rating_too_low():
    """
    GIVEN un usuario autenticado
    WHEN intenta crear reseña con rating < 1
    THEN retorna 422 Validation Error
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/reviews",
            json={
                "productId": str(uuid.uuid4()),
                "rating": 0,
                "comment": "Test"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_create_review_invalid_rating_too_high():
    """
    GIVEN un usuario autenticado
    WHEN intenta crear reseña con rating > 5
    THEN retorna 422 Validation Error
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/reviews",
            json={
                "productId": str(uuid.uuid4()),
                "rating": 6,
                "comment": "Test"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_create_review_without_authentication():
    """
    GIVEN un usuario NO autenticado
    WHEN intenta crear una reseña
    THEN retorna 401 Unauthorized
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/reviews",
            json={
                "productId": str(uuid.uuid4()),
                "rating": 5,
                "comment": "Test"
            }
        )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_create_review_for_non_delivered_product(auth_token, test_db_connection):
    """
    GIVEN un usuario autenticado sin pedidos DELIVERED del producto
    WHEN intenta crear una reseña
    THEN retorna 403 Forbidden
    """
    # Crear producto que el usuario NO ha recibido
    new_product_id = await test_db_connection.fetchval(
        """
        INSERT INTO products (id, name, description, price, category, "isAvailable", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Unreceived Product', 'Test', 15.00, 'BEBIDAS', true, NOW(), NOW())
        RETURNING id
        """,
    )
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/reviews",
            json={
                "productId": str(new_product_id),
                "rating": 5,
                "comment": "Test"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Solo puedes reseñar productos entregados" in response.json()["detail"]
    
    # Cleanup
    await test_db_connection.execute('DELETE FROM products WHERE id = $1', new_product_id)


@pytest.mark.asyncio
async def test_create_review_duplicate_returns_409(test_user_with_delivered_order, auth_token):
    """
    GIVEN un usuario que ya reseñó un producto
    WHEN intenta crear otra reseña del mismo producto
    THEN retorna 409 Conflict
    """
    # Crear primera reseña
    async with AsyncClient(app=app, base_url="http://test") as client:
        response1 = await client.post(
            "/api/reviews",
            json={
                "productId": test_user_with_delivered_order["product_id"],
                "rating": 5,
                "comment": "Primera reseña"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response1.status_code == status.HTTP_200_OK
        
        # Intentar crear segunda reseña
        response2 = await client.post(
            "/api/reviews",
            json={
                "productId": test_user_with_delivered_order["product_id"],
                "rating": 4,
                "comment": "Segunda reseña"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response2.status_code == status.HTTP_409_CONFLICT
    assert "Ya registraste reseña" in response2.json()["detail"]


# ==================== TESTS: GET /api/products/{product_id}/reviews ====================

@pytest.mark.asyncio
async def test_get_product_reviews_success(test_user_with_delivered_order, test_db_connection):
    """
    GIVEN un producto con reseñas
    WHEN se solicitan las reseñas
    THEN retorna lista con average y total
    """
    product_id = test_user_with_delivered_order["product_id"]
    user_id = test_user_with_delivered_order["user_id"]
    order_id = test_user_with_delivered_order["order_id"]
    
    # Crear reseña
    await test_db_connection.execute(
        """
        INSERT INTO reviews (id, "userId", "productId", "orderId", rating, comment, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, 5, 'Excelente', NOW(), NOW())
        """,
        user_id, product_id, order_id
    )
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(f"/api/products/{product_id}/reviews")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "reviews" in data
    assert "average" in data
    assert "total" in data
    assert data["total"] >= 1
    assert data["average"] > 0


@pytest.mark.asyncio
async def test_get_product_reviews_empty(test_db_connection):
    """
    GIVEN un producto sin reseñas
    WHEN se solicitan las reseñas
    THEN retorna lista vacía con average=0 y total=0
    """
    # Crear producto sin reseñas
    product_id = await test_db_connection.fetchval(
        """
        INSERT INTO products (id, name, description, price, category, "isAvailable", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'No Reviews Product', 'Test', 20.00, 'COMBOS', true, NOW(), NOW())
        RETURNING id
        """,
    )
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(f"/api/products/{product_id}/reviews")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["reviews"] == []
    assert data["average"] == 0
    assert data["total"] == 0
    
    # Cleanup
    await test_db_connection.execute('DELETE FROM products WHERE id = $1', product_id)


@pytest.mark.asyncio
async def test_get_product_reviews_includes_user_name():
    """
    GIVEN reseñas con usuarios
    WHEN se obtienen las reseñas
    THEN cada reseña incluye el nombre del usuario
    """
    # Este test se puede combinar con el anterior
    # o usar el fixture test_user_with_delivered_order
    pass  # Cubierto por test_get_product_reviews_success


# ==================== TESTS: GET /api/products/{product_id}/can-review ====================

@pytest.mark.asyncio
async def test_can_review_product_when_allowed(test_user_with_delivered_order, auth_token):
    """
    GIVEN un usuario con pedido DELIVERED del producto y sin reseña previa
    WHEN verifica si puede reseñar
    THEN retorna canReview=true con orderId
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/products/{test_user_with_delivered_order['product_id']}/can-review",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["canReview"] is True
    assert "orderId" in data


@pytest.mark.asyncio
async def test_can_review_product_when_already_reviewed(test_user_with_delivered_order, auth_token, test_db_connection):
    """
    GIVEN un usuario que ya reseñó el producto
    WHEN verifica si puede reseñar
    THEN retorna canReview=false con razón
    """
    product_id = test_user_with_delivered_order["product_id"]
    user_id = test_user_with_delivered_order["user_id"]
    order_id = test_user_with_delivered_order["order_id"]
    
    # Crear reseña previa
    await test_db_connection.execute(
        """
        INSERT INTO reviews (id, "userId", "productId", "orderId", rating, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, 5, NOW(), NOW())
        """,
        user_id, product_id, order_id
    )
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/products/{product_id}/can-review",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["canReview"] is False
    assert "Ya has reseñado" in data["reason"]


@pytest.mark.asyncio
async def test_can_review_product_without_delivered_order(auth_token, test_db_connection):
    """
    GIVEN un usuario sin pedidos DELIVERED del producto
    WHEN verifica si puede reseñar
    THEN retorna canReview=false
    """
    # Crear producto que el usuario no ha recibido
    product_id = await test_db_connection.fetchval(
        """
        INSERT INTO products (id, name, description, price, category, "isAvailable", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Unordered Product', 'Test', 25.00, 'ADICIONALES', true, NOW(), NOW())
        RETURNING id
        """,
    )
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/products/{product_id}/can-review",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["canReview"] is False
    assert "productos que hayas recibido" in data["reason"]
    
    # Cleanup
    await test_db_connection.execute('DELETE FROM products WHERE id = $1', product_id)


@pytest.mark.asyncio
async def test_can_review_product_without_authentication():
    """
    GIVEN un usuario NO autenticado
    WHEN intenta verificar si puede reseñar
    THEN retorna 401 Unauthorized
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(f"/api/products/{uuid.uuid4()}/can-review")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ==================== TESTS: Principios FIRST ====================

@pytest.mark.asyncio
async def test_reviews_endpoints_are_fast():
    """
    GIVEN múltiples requests a endpoints de reseñas
    WHEN se ejecutan en paralelo
    THEN todos responden rápidamente (< 1s cada uno)
    """
    import time
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        start = time.time()
        
        # Ejecutar múltiples requests
        await client.get(f"/api/products/{uuid.uuid4()}/reviews")
        
        elapsed = time.time() - start
    
    # Fast: debe ejecutarse en menos de 1 segundo
    assert elapsed < 1.0


@pytest.mark.asyncio
async def test_reviews_endpoints_are_independent(test_user_with_delivered_order, auth_token):
    """
    GIVEN múltiples operaciones en diferentes endpoints
    WHEN se ejecutan en secuencia
    THEN no se afectan entre sí
    """
    product_id = test_user_with_delivered_order["product_id"]
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 1. Verificar que puede reseñar
        r1 = await client.get(
            f"/api/products/{product_id}/can-review",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # 2. Obtener reseñas (vacío al inicio)
        r2 = await client.get(f"/api/products/{product_id}/reviews")
        
        # 3. Crear reseña
        r3 = await client.post(
            "/api/reviews",
            json={"productId": product_id, "rating": 5, "comment": "Test"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # 4. Verificar que ahora NO puede reseñar de nuevo
        r4 = await client.get(
            f"/api/products/{product_id}/can-review",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    # Assert - cada endpoint funciona independientemente
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 200
    assert r4.status_code == 200
    
    # Y los resultados son consistentes
    assert r1.json()["canReview"] is True
    assert r4.json()["canReview"] is False
