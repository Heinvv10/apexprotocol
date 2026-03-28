-- Migration: Add platform visibility scores to audits and extend recommendations
-- Generated: 2026-03-28

-- Add platform_scores column to audits table
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "platform_scores" jsonb DEFAULT '[]'::jsonb;

-- Add platform tags and impact fields to recommendations table
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "platform_tags" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "estimated_impact_low" integer;
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "estimated_impact_high" integer;
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "impact_source" text;
