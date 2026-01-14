-- GEO Dynamic Adaptability System - Complete Migration
-- PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
-- This migration creates or updates all tables for the GEO knowledge base system

-- ============================================================================
-- Create Enums (if not exist)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "geo_platform" AS ENUM (
        'chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'all'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "best_practice_category" AS ENUM (
        'schema', 'content', 'social', 'technical'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "platform_change_type" AS ENUM (
        'citation_pattern', 'content_preference', 'feature_update', 'algorithm_change'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "geo_alert_type" AS ENUM (
        'algorithm_change', 'strategy_deprecated', 'new_opportunity',
        'competitor_move', 'score_impact', 'recommendation_updated'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "alert_severity" AS ENUM (
        'info', 'warning', 'critical'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "schema_type" AS ENUM (
        'FAQPage', 'Organization', 'Article', 'HowTo', 'Product',
        'LocalBusiness', 'Person', 'Event', 'Review', 'BreadcrumbList'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Update existing tables to UUID (if they exist with text type)
-- ============================================================================

-- Check and update geo_best_practices
DO $$ BEGIN
    ALTER TABLE IF EXISTS "geo_best_practices"
        ALTER COLUMN "id" TYPE uuid USING "id"::uuid;
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================================
-- Create Tables (if not exist)
-- ============================================================================

-- GEO Best Practices table
CREATE TABLE IF NOT EXISTS "geo_best_practices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "platform" varchar(50) NOT NULL,
    "category" varchar(100) NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text NOT NULL,
    "implementation_steps" jsonb NOT NULL,
    "impact_score" integer NOT NULL,
    "effort_score" integer NOT NULL,
    "effective_since" timestamp with time zone NOT NULL,
    "deprecated_at" timestamp with time zone,
    "deprecation_reason" text,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Schema Templates table
CREATE TABLE IF NOT EXISTS "schema_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "schema_type" varchar(100) NOT NULL,
    "platform_relevance" jsonb NOT NULL,
    "template_code" text NOT NULL,
    "usage_instructions" text NOT NULL,
    "version" integer NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "superseded_by_id" uuid REFERENCES "schema_templates"("id"),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Platform Changes table
CREATE TABLE IF NOT EXISTS "platform_changes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "platform" varchar(50) NOT NULL,
    "change_detected" timestamp with time zone NOT NULL,
    "change_type" varchar(100) NOT NULL,
    "description" text NOT NULL,
    "impact_assessment" text NOT NULL,
    "recommended_response" text NOT NULL,
    "confidence_score" integer NOT NULL,
    "source" varchar(255) NOT NULL,
    "affected_recommendations" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- GEO Alerts table
CREATE TABLE IF NOT EXISTS "geo_alerts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL,
    "brand_id" uuid,
    "alert_type" varchar(50) NOT NULL,
    "severity" varchar(20) NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text NOT NULL,
    "affected_platforms" jsonb NOT NULL,
    "action_required" boolean DEFAULT false NOT NULL,
    "suggested_actions" jsonb NOT NULL,
    "related_changes" jsonb,
    "platform_change_id" uuid REFERENCES "platform_changes"("id"),
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "dismissed_at" timestamp with time zone
);

-- Recommendation Versions table
CREATE TABLE IF NOT EXISTS "recommendation_versions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "recommendation_id" varchar(255) NOT NULL,
    "version" integer NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text NOT NULL,
    "impact_score" integer NOT NULL,
    "effort_score" integer NOT NULL,
    "steps" jsonb NOT NULL,
    "platform_relevance" jsonb NOT NULL,
    "changes_summary" jsonb,
    "reason" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Action Plan Versions table
CREATE TABLE IF NOT EXISTS "action_plan_versions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL,
    "version_number" integer NOT NULL,
    "knowledge_base_version" varchar(50) NOT NULL,
    "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "actions_snapshot" jsonb NOT NULL,
    "changes_from_previous" jsonb,
    "downloaded_at" timestamp with time zone,
    "downloaded_by" uuid
);

-- Update Log table
CREATE TABLE IF NOT EXISTS "update_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "update_type" varchar(100) NOT NULL,
    "description" text NOT NULL,
    "items_added" integer DEFAULT 0 NOT NULL,
    "items_updated" integer DEFAULT 0 NOT NULL,
    "items_deprecated" integer DEFAULT 0 NOT NULL,
    "affected_platforms" jsonb NOT NULL,
    "data_source" varchar(255) NOT NULL,
    "success" boolean DEFAULT true NOT NULL,
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- Create Indexes
-- ============================================================================

-- geo_best_practices indexes
CREATE INDEX IF NOT EXISTS "idx_best_practices_platform" ON "geo_best_practices" ("platform");
CREATE INDEX IF NOT EXISTS "idx_best_practices_category" ON "geo_best_practices" ("category");
CREATE INDEX IF NOT EXISTS "idx_best_practices_active" ON "geo_best_practices" ("deprecated_at") WHERE "deprecated_at" IS NULL;

-- schema_templates indexes
CREATE INDEX IF NOT EXISTS "idx_schema_templates_type" ON "schema_templates" ("schema_type");
CREATE INDEX IF NOT EXISTS "idx_schema_templates_current" ON "schema_templates" ("is_current") WHERE "is_current" = true;

-- platform_changes indexes
CREATE INDEX IF NOT EXISTS "idx_platform_changes_platform" ON "platform_changes" ("platform");
CREATE INDEX IF NOT EXISTS "idx_platform_changes_type" ON "platform_changes" ("change_type");
CREATE INDEX IF NOT EXISTS "idx_platform_changes_detected" ON "platform_changes" ("change_detected" DESC);
CREATE INDEX IF NOT EXISTS "idx_platform_changes_confidence" ON "platform_changes" ("confidence_score" DESC);

-- geo_alerts indexes
CREATE INDEX IF NOT EXISTS "idx_geo_alerts_org" ON "geo_alerts" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_geo_alerts_brand" ON "geo_alerts" ("brand_id");
CREATE INDEX IF NOT EXISTS "idx_geo_alerts_type" ON "geo_alerts" ("alert_type");
CREATE INDEX IF NOT EXISTS "idx_geo_alerts_unread" ON "geo_alerts" ("is_read") WHERE "is_read" = false;

-- recommendation_versions indexes
CREATE INDEX IF NOT EXISTS "idx_rec_versions_rec_id" ON "recommendation_versions" ("recommendation_id");
CREATE INDEX IF NOT EXISTS "idx_rec_versions_version" ON "recommendation_versions" ("version" DESC);

-- action_plan_versions indexes
CREATE INDEX IF NOT EXISTS "idx_action_plan_brand" ON "action_plan_versions" ("brand_id");
CREATE INDEX IF NOT EXISTS "idx_action_plan_version" ON "action_plan_versions" ("version_number" DESC);

-- update_log indexes
CREATE INDEX IF NOT EXISTS "idx_update_log_type" ON "update_log" ("update_type");
CREATE INDEX IF NOT EXISTS "idx_update_log_created" ON "update_log" ("created_at" DESC);
