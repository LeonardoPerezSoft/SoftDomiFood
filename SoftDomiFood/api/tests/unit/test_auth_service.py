"""
Pruebas Unitarias - Auth Service
Testing de lógica de autenticación aislada (sin DB, sin API)
"""
import pytest
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token
)
from datetime import timedelta

class TestPasswordHashing:
    """Tests de hashing de contraseñas con bcrypt"""
    
    def test_password_hashing_creates_different_hash(self):
        """Hash debe ser diferente al texto plano"""
        password = "MySecurePass123!"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt signature
    
    def test_password_verification_success(self):
        """Verificación exitosa con contraseña correcta"""
        password = "MySecurePass123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Verificación falla con contraseña incorrecta"""
        password = "MySecurePass123!"
        hashed = get_password_hash(password)
        
        assert verify_password("WrongPassword", hashed) is False
    
    def test_same_password_different_hashes(self):
        """Mismo password genera diferentes hashes (salt)"""
        password = "SamePassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Tests de creación y decodificación de JWT"""
    
    def test_create_access_token_basic(self):
        """Crear token JWT básico"""
        payload = {"userId": "123", "role": "CUSTOMER"}
        token = create_access_token(payload)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        # JWT tiene 3 partes separadas por puntos
        assert token.count('.') == 2
    
    def test_decode_token_success(self):
        """Decodificar token válido"""
        payload = {"userId": "user-456", "role": "ADMIN"}
        token = create_access_token(payload)
        
        decoded = decode_token(token)
        
        assert decoded is not None
        assert decoded["userId"] == "user-456"
        assert decoded["role"] == "ADMIN"
        assert "exp" in decoded  # Debe incluir expiración
    
    def test_decode_invalid_token_returns_none(self):
        """Token inválido retorna None"""
        invalid_token = "this-is-not-a-valid-jwt-token"
        decoded = decode_token(invalid_token)
        
        assert decoded is None
    
    def test_decode_malformed_token_returns_none(self):
        """Token mal formado retorna None"""
        malformed_token = "header.payload"  # Falta signature
        decoded = decode_token(malformed_token)
        
        assert decoded is None
    
    def test_token_contains_expiration(self):
        """Token debe contener tiempo de expiración"""
        from datetime import datetime, timedelta
        
        payload = {"userId": "789"}
        token = create_access_token(payload)
        decoded = decode_token(token)
        
        assert "exp" in decoded
        # Verificar que expiración está en el futuro
        exp_timestamp = decoded["exp"]
        assert exp_timestamp > datetime.utcnow().timestamp()
    
    def test_token_with_custom_data(self):
        """Token puede contener datos personalizados"""
        custom_payload = {
            "userId": "abc-123",
            "role": "DELIVERY",
            "email": "delivery@test.com",
            "custom_field": "custom_value"
        }
        token = create_access_token(custom_payload)
        decoded = decode_token(token)
        
        assert decoded["userId"] == "abc-123"
        assert decoded["role"] == "DELIVERY"
        assert decoded["email"] == "delivery@test.com"
        assert decoded["custom_field"] == "custom_value"


class TestPasswordSecurityRequirements:
    """Tests de requisitos de seguridad de contraseñas"""
    
    def test_empty_password_hash(self):
        """Hashing de password vacío (edge case)"""
        # bcrypt puede hashear strings vacíos
        hashed = get_password_hash("")
        assert hashed is not None
        assert verify_password("", hashed) is True
    
    def test_very_long_password(self):
        """Hash de password extremadamente largo"""
        long_password = "A" * 1000
        hashed = get_password_hash(long_password)
        assert verify_password(long_password, hashed) is True
    
    def test_special_characters_password(self):
        """Password con caracteres especiales"""
        special_password = "P@ss!#$%&*()_+={}[]|:;<>,.?/~`w0rd"
        hashed = get_password_hash(special_password)
        assert verify_password(special_password, hashed) is True
    
    def test_unicode_password(self):
        """Password con caracteres Unicode"""
        unicode_password = "Contraseña123!🔐🚀"
        hashed = get_password_hash(unicode_password)
        assert verify_password(unicode_password, hashed) is True

class TestPasswordSecurityRequirements:
    """Tests de requisitos de seguridad de contraseñas"""

    @pytest.mark.parametrize("password", [
        "", "a" * 1024, "pässÜnicode", "   spaces   ", "!@#$%^&*()_+", " contraseña "
    ])
    def test_parametrized_passwords(self, password):
        hashed = get_password_hash(password)
        assert verify_password(password, hashed)

class TestJWTErrorPaths:
    def test_decode_expired_token_returns_none(self):
        token = create_access_token({"sub": "user1"}, expires_delta=timedelta(seconds=-1))
        assert decode_token(token) is None

    @pytest.mark.skip(reason="La clave JWT se carga estáticamente; este test se omite")
    def test_decode_token_with_wrong_secret_returns_none(self, monkeypatch):
        pass

    def test_decode_malformed_token_returns_none(self):
        assert decode_token("not.a.jwt") is None

    def test_token_without_sub_still_decodes(self):
        token = create_access_token({"role": "ADMIN"}, expires_delta=timedelta(minutes=1))
        data = decode_token(token)
        assert data is not None
        assert data.get("role") == "ADMIN"
