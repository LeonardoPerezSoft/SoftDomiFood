"""
Tests Unitarios para Funcionalidad de Reseñas
Siguiendo principios FIRST:
- Fast: Usan mocks, no DB real
- Independent: Cada test es autónomo
- Repeatable: Resultados consistentes
- Self-validating: Assert claros
- Timely: Escritos junto con el código
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime
import uuid

# Módulo bajo prueba
import services.database_service as dbs

class DummyConn:
    """Mock de conexión asyncpg para tests aislados"""
    def __init__(self):
        self.execute = AsyncMock()
        self.fetch = AsyncMock()
        self.fetchrow = AsyncMock()
        self.fetchval = AsyncMock()
        self.close = AsyncMock()
        self.transaction = MagicMock()


# ==================== TESTS: user_can_review_product ====================

@pytest.mark.asyncio
async def test_user_can_review_product_when_has_delivered_order():
    """
    GIVEN un usuario con pedido DELIVERED que contiene el producto
    WHEN se verifica si puede reseñar
    THEN retorna el order_id
    """
    # Arrange
    dummy = DummyConn()
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    order_id = str(uuid.uuid4())
    
    dummy.fetchrow.return_value = {"id": order_id}
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.user_can_review_product(user_id, product_id)
    
    # Assert
    assert result == order_id
    dummy.fetchrow.assert_called_once()
    # Verificar que la query incluye status DELIVERED
    call_args = dummy.fetchrow.call_args
    assert "DELIVERED" in call_args[0][0]


@pytest.mark.asyncio
async def test_user_cannot_review_product_when_no_delivered_order():
    """
    GIVEN un usuario sin pedidos DELIVERED del producto
    WHEN se verifica si puede reseñar
    THEN retorna None
    """
    # Arrange
    dummy = DummyConn()
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    
    dummy.fetchrow.return_value = None
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.user_can_review_product(user_id, product_id)
    
    # Assert
    assert result is None
    dummy.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_user_can_review_closes_connection():
    """
    GIVEN cualquier escenario
    WHEN se ejecuta user_can_review_product
    THEN la conexión se cierra correctamente
    """
    # Arrange
    dummy = DummyConn()
    dummy.fetchrow.return_value = None
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        await dbs.user_can_review_product("user", "product")
    
    # Assert
    dummy.close.assert_called_once()


# ==================== TESTS: create_review ====================

@pytest.mark.asyncio
async def test_create_review_with_comment():
    """
    GIVEN datos válidos de reseña con comentario
    WHEN se crea la reseña
    THEN retorna los datos de la reseña creada incluyendo user_name
    """
    # Arrange
    dummy = DummyConn()
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    order_id = str(uuid.uuid4())
    review_id = str(uuid.uuid4())
    rating = 5
    comment = "Excelente producto"
    
    dummy.fetchval.return_value = review_id
    dummy.fetchrow.return_value = {
        "id": review_id,
        "userId": user_id,
        "productId": product_id,
        "orderId": order_id,
        "rating": rating,
        "comment": comment,
        "createdAt": datetime.now(),
        "user_name": "Test User"
    }
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.create_review(user_id, product_id, order_id, rating, comment)
    
    # Assert
    assert result is not None
    assert result["rating"] == rating
    assert result["comment"] == comment
    assert result["user_name"] == "Test User"
    dummy.fetchval.assert_called_once()
    dummy.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_create_review_without_comment():
    """
    GIVEN datos válidos sin comentario (None)
    WHEN se crea la reseña
    THEN retorna la reseña con comment=None
    """
    # Arrange
    dummy = DummyConn()
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    order_id = str(uuid.uuid4())
    review_id = str(uuid.uuid4())
    
    dummy.fetchval.return_value = review_id
    dummy.fetchrow.return_value = {
        "id": review_id,
        "userId": user_id,
        "productId": product_id,
        "orderId": order_id,
        "rating": 4,
        "comment": None,
        "createdAt": datetime.now(),
        "user_name": "Test User"
    }
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.create_review(user_id, product_id, order_id, 4, None)
    
    # Assert
    assert result["comment"] is None
    assert result["rating"] == 4


@pytest.mark.asyncio
async def test_create_review_validates_rating_range():
    """
    GIVEN diferentes valores de rating
    WHEN se insertan en la DB
    THEN se pasan correctamente a la query
    """
    # Arrange
    dummy = DummyConn()
    review_id = str(uuid.uuid4())
    dummy.fetchval.return_value = review_id
    dummy.fetchrow.return_value = {"id": review_id, "rating": 3}
    
    # Act - rating mínimo
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        await dbs.create_review("u1", "p1", "o1", 1, None)
        
    # Assert - verificar que se llamó con rating=1
    assert dummy.fetchval.call_args[0][4] == 1
    
    # Act - rating máximo
    dummy.fetchval.reset_mock()
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        await dbs.create_review("u1", "p1", "o1", 5, None)
        
    # Assert - verificar que se llamó con rating=5
    assert dummy.fetchval.call_args[0][4] == 5


# ==================== TESTS: get_product_reviews ====================

@pytest.mark.asyncio
async def test_get_product_reviews_with_multiple_reviews():
    """
    GIVEN un producto con múltiples reseñas
    WHEN se obtienen las reseñas
    THEN retorna lista completa con promedio y total correctos
    """
    # Arrange
    dummy = DummyConn()
    product_id = str(uuid.uuid4())
    
    reviews = [
        {
            "id": str(uuid.uuid4()),
            "userId": str(uuid.uuid4()),
            "productId": product_id,
            "orderId": str(uuid.uuid4()),
            "rating": 5,
            "comment": "Excelente",
            "createdAt": datetime.now(),
            "user_name": "Usuario 1"
        },
        {
            "id": str(uuid.uuid4()),
            "userId": str(uuid.uuid4()),
            "productId": product_id,
            "orderId": str(uuid.uuid4()),
            "rating": 4,
            "comment": "Bueno",
            "createdAt": datetime.now(),
            "user_name": "Usuario 2"
        },
        {
            "id": str(uuid.uuid4()),
            "userId": str(uuid.uuid4()),
            "productId": product_id,
            "orderId": str(uuid.uuid4()),
            "rating": 3,
            "comment": None,
            "createdAt": datetime.now(),
            "user_name": "Usuario 3"
        }
    ]
    
    dummy.fetch.return_value = reviews
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.get_product_reviews(product_id)
    
    # Assert
    assert result["total"] == 3
    assert result["average"] == 4.0  # (5+4+3)/3 = 4.0
    assert len(result["reviews"]) == 3
    assert result["reviews"][0]["rating"] == 5
    dummy.fetch.assert_called_once()


@pytest.mark.asyncio
async def test_get_product_reviews_with_no_reviews():
    """
    GIVEN un producto sin reseñas
    WHEN se obtienen las reseñas
    THEN retorna lista vacía con promedio 0 y total 0
    """
    # Arrange
    dummy = DummyConn()
    product_id = str(uuid.uuid4())
    
    dummy.fetch.return_value = []
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.get_product_reviews(product_id)
    
    # Assert
    assert result["total"] == 0
    assert result["average"] == 0
    assert result["reviews"] == []


@pytest.mark.asyncio
async def test_get_product_reviews_average_rounds_correctly():
    """
    GIVEN reseñas con promedio decimal
    WHEN se calcula el promedio
    THEN redondea a 1 decimal
    """
    # Arrange
    dummy = DummyConn()
    product_id = str(uuid.uuid4())
    
    reviews = [
        {"rating": 5, "id": "1", "createdAt": datetime.now(), "user_name": "U1"},
        {"rating": 4, "id": "2", "createdAt": datetime.now(), "user_name": "U2"},
    ]
    
    dummy.fetch.return_value = reviews
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.get_product_reviews(product_id)
    
    # Assert
    # (5+4)/2 = 4.5
    assert result["average"] == 4.5
    assert isinstance(result["average"], float)


# ==================== TESTS: check_user_reviewed_product ====================

@pytest.mark.asyncio
async def test_check_user_reviewed_product_when_exists():
    """
    GIVEN un usuario que ya reseñó el producto
    WHEN se verifica si ya reseñó
    THEN retorna True
    """
    # Arrange
    dummy = DummyConn()
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    
    dummy.fetchrow.return_value = {"id": str(uuid.uuid4())}
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.check_user_reviewed_product(user_id, product_id)
    
    # Assert
    assert result is True
    dummy.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_check_user_reviewed_product_when_not_exists():
    """
    GIVEN un usuario que NO ha reseñado el producto
    WHEN se verifica si ya reseñó
    THEN retorna False
    """
    # Arrange
    dummy = DummyConn()
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    
    dummy.fetchrow.return_value = None
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result = await dbs.check_user_reviewed_product(user_id, product_id)
    
    # Assert
    assert result is False


# ==================== TESTS: Principio FIRST - Independence ====================

@pytest.mark.asyncio
async def test_all_review_functions_are_independent():
    """
    GIVEN ejecución de todas las funciones de reseñas
    WHEN se ejecutan en cualquier orden
    THEN cada una es independiente y no afecta a las demás
    """
    # Arrange
    dummy = DummyConn()
    
    # Mock responses para diferentes funciones
    dummy.fetchrow.side_effect = [
        {"id": "order1"},  # user_can_review_product
        None,               # check_user_reviewed_product
        {"id": "review1", "rating": 5, "user_name": "User"}  # create_review
    ]
    dummy.fetchval.return_value = "review_id"
    dummy.fetch.return_value = []
    
    # Act - ejecutar en orden aleatorio
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        result1 = await dbs.user_can_review_product("u1", "p1")
        result2 = await dbs.check_user_reviewed_product("u2", "p2")
        result3 = await dbs.get_product_reviews("p3")
    
    # Assert - cada resultado es independiente
    assert result1 == "order1"
    assert result2 is False
    assert result3["total"] == 0


# ==================== TESTS: Manejo de Errores ====================

@pytest.mark.asyncio
async def test_create_review_handles_duplicate_constraint():
    """
    GIVEN un usuario intentando reseñar el mismo producto dos veces
    WHEN se intenta crear la segunda reseña
    THEN lanza excepción con constraint violation
    """
    # Arrange
    dummy = DummyConn()
    
    # Simular constraint violation
    dummy.fetchval.side_effect = Exception("duplicate key value violates unique constraint")
    
    # Act & Assert
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        with pytest.raises(Exception) as exc_info:
            await dbs.create_review("u1", "p1", "o1", 5, "Test")
        
        assert "duplicate key" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_all_functions_close_connection_on_error():
    """
    GIVEN error durante ejecución de cualquier función
    WHEN ocurre el error
    THEN la conexión se cierra correctamente (no leak)
    """
    # Arrange
    dummy = DummyConn()
    dummy.fetchrow.side_effect = Exception("DB Error")
    
    # Act & Assert
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        with pytest.raises(Exception):
            await dbs.user_can_review_product("u1", "p1")
        
        # Assert - conexión cerrada incluso con error
        dummy.close.assert_called_once()


# ==================== TESTS: Performance (Fast) ====================

@pytest.mark.asyncio
async def test_get_product_reviews_executes_single_query():
    """
    GIVEN solicitud de reseñas de un producto
    WHEN se ejecuta get_product_reviews
    THEN realiza una sola query (no N+1)
    """
    # Arrange
    dummy = DummyConn()
    dummy.fetch.return_value = [
        {"id": "1", "rating": 5, "user_name": "User1", "createdAt": datetime.now()},
        {"id": "2", "rating": 4, "user_name": "User2", "createdAt": datetime.now()}
    ]
    
    # Act
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        await dbs.get_product_reviews("p1")
    
    # Assert - solo una llamada a fetch (incluye JOIN con users)
    assert dummy.fetch.call_count == 1
    
    # Verificar que la query incluye JOIN con users
    call_args = dummy.fetch.call_args[0][0]
    assert "JOIN users" in call_args
    assert "user_name" in call_args
