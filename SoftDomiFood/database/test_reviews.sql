-- Script de prueba para el sistema de reseñas
-- Este script verifica que el sistema de reviews funcione correctamente

-- 1. Verificar que existe la tabla reviews
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews'
) as "tabla_reviews_existe";

-- 2. Ver estructura de la tabla reviews
\d reviews

-- 3. Verificar pedidos entregados disponibles para reseñar
SELECT 
    o.id as order_id,
    o."userId" as user_id,
    u.name as user_name,
    oi."productId" as product_id,
    p.name as product_name,
    o.status,
    o."createdAt"
FROM orders o
JOIN order_items oi ON oi."orderId" = o.id
JOIN users u ON o."userId" = u.id
JOIN products p ON oi."productId" = p.id
WHERE o.status = 'DELIVERED'
LIMIT 5;

-- 4. Ver reseñas existentes (si hay alguna)
SELECT 
    r.id,
    r.rating,
    r.comment,
    r."createdAt",
    u.name as user_name,
    p.name as product_name
FROM reviews r
JOIN users u ON r."userId" = u.id
JOIN products p ON r."productId" = p.id
ORDER BY r."createdAt" DESC
LIMIT 10;

-- 5. Estadísticas de reseñas por producto
SELECT 
    p.id,
    p.name,
    COUNT(r.id) as total_reviews,
    ROUND(AVG(r.rating)::numeric, 1) as avg_rating
FROM products p
LEFT JOIN reviews r ON r."productId" = p.id
GROUP BY p.id, p.name
HAVING COUNT(r.id) > 0
ORDER BY avg_rating DESC;
