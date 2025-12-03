-- Migration: Create reviews table
-- Created: 2024-12-02
-- Description: Tabla para almacenar calificaciones y reseñas de productos

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_review_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_product FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_order FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Constraint: Un usuario solo puede hacer una reseña por producto
    CONSTRAINT uq_review_unique UNIQUE ("userId", "productId")
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews("productId");
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews("userId");
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews("orderId");
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews("createdAt" DESC);

-- Comentarios para documentación
COMMENT ON TABLE reviews IS 'Reseñas y calificaciones de productos por usuarios';
COMMENT ON COLUMN reviews.rating IS 'Calificación de 1 a 5 estrellas';
COMMENT ON COLUMN reviews."orderId" IS 'Pedido desde el cual se hace la reseña (debe estar DELIVERED)';
