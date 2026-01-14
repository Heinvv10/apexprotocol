-- Migration: Add platform_relevance column to recommendations table
-- Adds support for tracking which AI platforms are most affected by each recommendation

ALTER TABLE "recommendations"
ADD COLUMN IF NOT EXISTS "platform_relevance" jsonb;

-- Create index for platform_relevance queries
CREATE INDEX IF NOT EXISTS "recommendations_platform_relevance_idx"
ON "recommendations" USING GIN ("platform_relevance");
