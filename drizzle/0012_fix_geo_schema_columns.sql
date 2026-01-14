-- Fix GEO Schema Column Mismatches
-- This migration aligns the actual database columns with the TypeScript schema

-- ============================================================================
-- Fix platform_changes table
-- ============================================================================

-- Rename affected_practices to affected_recommendations (as per TypeScript schema)
DO $$ BEGIN
    ALTER TABLE "platform_changes" RENAME COLUMN "affected_practices" TO "affected_recommendations";
EXCEPTION WHEN undefined_column THEN null;
END $$;

-- Change id from varchar to uuid
DO $$ BEGIN
    ALTER TABLE "platform_changes" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;
EXCEPTION WHEN others THEN null;
END $$;

-- Change change_detected from date to timestamp with time zone
DO $$ BEGIN
    ALTER TABLE "platform_changes" ALTER COLUMN "change_detected" TYPE timestamp with time zone;
EXCEPTION WHEN others THEN null;
END $$;

-- Set default for id
DO $$ BEGIN
    ALTER TABLE "platform_changes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
EXCEPTION WHEN others THEN null;
END $$;

-- Make required columns NOT NULL (only if they have values)
DO $$ BEGIN
    UPDATE "platform_changes" SET "impact_assessment" = '' WHERE "impact_assessment" IS NULL;
    ALTER TABLE "platform_changes" ALTER COLUMN "impact_assessment" SET NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    UPDATE "platform_changes" SET "recommended_response" = '' WHERE "recommended_response" IS NULL;
    ALTER TABLE "platform_changes" ALTER COLUMN "recommended_response" SET NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    UPDATE "platform_changes" SET "confidence_score" = 50 WHERE "confidence_score" IS NULL;
    ALTER TABLE "platform_changes" ALTER COLUMN "confidence_score" SET NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    UPDATE "platform_changes" SET "source" = 'migration' WHERE "source" IS NULL;
    ALTER TABLE "platform_changes" ALTER COLUMN "source" SET NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    UPDATE "platform_changes" SET "affected_recommendations" = '[]'::jsonb WHERE "affected_recommendations" IS NULL;
    ALTER TABLE "platform_changes" ALTER COLUMN "affected_recommendations" SET NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================================
-- Fix geo_alerts table
-- ============================================================================

-- Add is_read column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Add related_changes column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ADD COLUMN "related_changes" jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Change id from varchar to uuid
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;
EXCEPTION WHEN others THEN null;
END $$;

-- Set default for id
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
EXCEPTION WHEN others THEN null;
END $$;

-- Change organization_id to uuid
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ALTER COLUMN "organization_id" TYPE uuid USING "organization_id"::uuid;
EXCEPTION WHEN others THEN null;
END $$;

-- Change brand_id to uuid
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ALTER COLUMN "brand_id" TYPE uuid USING "brand_id"::uuid;
EXCEPTION WHEN others THEN null;
END $$;

-- Change platform_change_id to uuid
DO $$ BEGIN
    ALTER TABLE "geo_alerts" ALTER COLUMN "platform_change_id" TYPE uuid USING "platform_change_id"::uuid;
EXCEPTION WHEN others THEN null;
END $$;

-- Update is_read based on read_at if applicable
DO $$ BEGIN
    UPDATE "geo_alerts" SET "is_read" = true WHERE "read_at" IS NOT NULL;
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================================
-- Create missing indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_platform_changes_confidence" ON "platform_changes" ("confidence_score" DESC);
CREATE INDEX IF NOT EXISTS "idx_geo_alerts_unread" ON "geo_alerts" ("is_read") WHERE "is_read" = false;
