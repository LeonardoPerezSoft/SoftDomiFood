import asyncio
import asyncpg
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def create_test_client():
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
        database="softdomifood"
    )
    
    try:
        # Hashear contraseña
        hashed_password = pwd_context.hash("password123")
        
        # Crear usuario cliente
        await conn.execute("""
            INSERT INTO users (id, name, email, password, role, phone, address, "createdAt")
            VALUES (gen_random_uuid(), 'Cliente Test', 'cliente@example.com', $1, 'client', '1234567890', 'Calle Test 123', NOW())
            ON CONFLICT (email) DO NOTHING
        """, hashed_password)
        
        print("✅ Usuario cliente creado exitosamente")
        print("📧 Email: cliente@example.com")
        print("🔑 Password: password123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_test_client())