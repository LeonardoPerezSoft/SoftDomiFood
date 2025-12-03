-- Migration: Add updatedAt column to reviews
-- Created: 2025-12-02

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Optional: update existing rows to have updatedAt set
UPDATE reviews SET "updatedAt" = COALESCE("updatedAt", NOW());

-- Index for ordering by updatedAt (optional)
CREATE INDEX IF NOT EXISTS idx_reviews_updated ON reviews("updatedAt" DESC);
