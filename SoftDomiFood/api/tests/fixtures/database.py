"""
Fixtures de base de datos para pruebas
"""
import asyncpg
import os
from typing import AsyncGenerator

# URL de base de datos de pruebas
TEST_DATABASE_URL = os.getenv(
    "ASYNC_PG_URL",
    os.getenv(
        "TEST_DATABASE_URL",
        "postgresql://softdomifood_user:softdomifood_pass@localhost:5432/softdomifood_test_db"
    )
)

async def create_test_database():
    """Crear base de datos de pruebas si no existe"""
    # Conectar a postgres default para crear DB
    conn = await asyncpg.connect(
        "postgresql://softdomifood_user:softdomifood_pass@localhost:5432/postgres"
    )
    try:
        # Verificar si existe
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'softdomifood_test_db'"
        )
        if not exists:
            await conn.execute("CREATE DATABASE softdomifood_test_db")
            print("✅ Base de datos de pruebas creada")
    finally:
        await conn.close()

async def drop_test_database():
    """Eliminar base de datos de pruebas"""
    conn = await asyncpg.connect(
        "postgresql://softdomifood_user:softdomifood_pass@localhost:5432/postgres"
    )
    try:
        # Terminar conexiones activas
        await conn.execute("""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'softdomifood_test_db'
            AND pid <> pg_backend_pid()
        """)
        await conn.execute("DROP DATABASE IF EXISTS softdomifood_test_db")
        print("✅ Base de datos de pruebas eliminada")
    finally:
        await conn.close()

async def init_test_database(conn: asyncpg.Connection):
    """Inicializar esquema de base de datos de pruebas"""
    from init_db import INIT_SQL
    await conn.execute(INIT_SQL)

async def clean_test_database(conn: asyncpg.Connection):
    """Limpiar datos de prueba (mantener esquema)"""
    # Orden importante por foreign keys
    tables = [
        "coupon_usages",
        "order_items",
        "orders",
        "addresses",
        "coupons",
        "products",
        "users"
    ]
    for table in tables:
        await conn.execute(f'TRUNCATE TABLE "{table}" CASCADE')

async def seed_sample_products(conn: asyncpg.Connection):
    """Insertar productos de prueba"""
    from tests.fixtures.data import SAMPLE_PRODUCTS
    
    for product in SAMPLE_PRODUCTS:
        await conn.execute(
            """
            INSERT INTO products (id, name, description, price, category, image, "isAvailable", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
            """,
            product["name"],
            product["description"],
            product["price"],
            product["category"],
            product.get("image"),
            product["isAvailable"]
        )
