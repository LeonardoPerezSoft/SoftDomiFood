-- Crear usuario cliente de prueba
-- Email: cliente@test.com
-- Password: password123

INSERT INTO users (id, name, email, password, role, phone, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(), 
    'Cliente Test', 
    'cliente@test.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ck0GfAb0NqBO',
    'CUSTOMER', 
    '1234567890', 
    NOW(), 
    NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING email, name, role;

-- Verificar usuarios
SELECT email, role, name FROM users WHERE role = 'CUSTOMER';
