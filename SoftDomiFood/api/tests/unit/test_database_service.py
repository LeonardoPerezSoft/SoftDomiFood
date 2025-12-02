import pytest
import types
from unittest.mock import AsyncMock, patch

# Módulo bajo prueba
import services.database_service as dbs

class DummyConn:
    def __init__(self):
        self.execute = AsyncMock()
        self.fetch = AsyncMock()
        self.fetchrow = AsyncMock()
        self.fetchval = AsyncMock()
        self.close = AsyncMock()

@pytest.mark.asyncio
async def test_get_connection_uses_asyncpg_connect():
    dummy = DummyConn()
    with patch("services.database_service.asyncpg.connect", return_value=dummy) as mock_connect:
        conn = await dbs.get_connection()
        assert conn is dummy
        mock_connect.assert_called_once()
        await conn.close()

@pytest.mark.asyncio
async def test_get_user_by_email_found():
    dummy = DummyConn()
    user = {"id": "u1", "email": "user@test.com", "name": "User"}
    dummy.fetchrow.return_value = user
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        res = await dbs.get_user_by_email("user@test.com")
        assert res == user
        dummy.fetchrow.assert_called_once()

@pytest.mark.asyncio
async def test_get_user_by_email_not_found():
    dummy = DummyConn()
    dummy.fetchrow.return_value = None
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        res = await dbs.get_user_by_email("missing@test.com")
        assert res is None
        dummy.fetchrow.assert_called_once()

@pytest.mark.asyncio
async def test_create_user_inserts_and_returns_id():
    dummy = DummyConn()
    dummy.fetchrow.return_value = {"id": "generated-id"}
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        uid = await dbs.create_user("email@test.com", "hashed", "Name", "CUSTOMER")
        assert isinstance(uid, dict)
        assert uid.get("id") == "generated-id"
        dummy.fetchrow.assert_called_once()

@pytest.mark.asyncio
async def test_get_products_returns_rows():
    dummy = DummyConn()
    rows = [{"id": "p1", "name": "Prod"}]
    dummy.fetch.return_value = rows
    with patch("services.database_service.asyncpg.connect", return_value=dummy):
        res = await dbs.get_products()
        assert res == rows
        dummy.fetch.assert_called_once()
