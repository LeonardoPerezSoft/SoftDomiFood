-- Migration: Add scheduledFor column to orders
-- Created: 2025-12-02

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP NULL;

-- Index for scheduled orders queries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON orders("scheduledFor");
