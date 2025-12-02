import asyncio
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def generate_hash():
    # Generar hash para "password123"
    hashed = pwd_context.hash("password123")
    print(f"Hash para 'password123': {hashed}")
    return hashed

if __name__ == "__main__":
    asyncio.run(generate_hash())
