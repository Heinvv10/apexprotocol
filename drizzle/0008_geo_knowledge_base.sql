-- GEO Knowledge Base Migration
-- PRD: PRD-001 - User Deliverables & Dynamic Adaptability System

-- ============================================================================
-- Create Enums
-- ============================================================================

-- GEO Platform enum (skip if already exists)
DO $$ BEGIN
    CREATE TYPE "geo_platform" AS ENUM (
        'chatgpt',
        'claude',
        'gemini',
        'perplexity',
        'grok',
        'deepseek',
        'copilot',
        'all'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Best Practice Category enum
DO $$ BEGIN
    CREATE TYPE "best_practice_category" AS ENUM (
        'schema',
        'content',
        'social',
        'technical',
        'authority',
        'freshness'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Platform Change Type enum
DO $$ BEGIN
    CREATE TYPE "platform_change_type" AS ENUM (
        'citation_pattern',
        'content_preference',
        'feature_update',
        'algorithm_update',
        'ranking_change'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- GEO Alert Type enum
DO $$ BEGIN
    CREATE TYPE "geo_alert_type" AS ENUM (
        'algorithm_change',
        'recommendation_updated',
        'strategy_deprecated',
        'new_opportunity',
        'competitor_move',
        'score_impact'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alert Severity enum
DO $$ BEGIN
    CREATE TYPE "alert_severity" AS ENUM (
        'info',
        'warning',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Schema Type enum
DO $$ BEGIN
    CREATE TYPE "schema_type" AS ENUM (
        'FAQPage',
        'Organization',
        'Article',
        'HowTo',
        'Product',
        'LocalBusiness',
        'Person',
        'WebSite',
        'BreadcrumbList',
        'SiteNavigationElement',
        'VideoObject',
        'Course',
        'Event',
        'Review',
        'AggregateRating'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Create Tables
-- ============================================================================

-- GEO Best Practices table
CREATE TABLE IF NOT EXISTS "geo_best_practices" (
    "id" text PRIMARY KEY NOT NULL,
    "platform" "geo_platform" NOT NULL,
    "category" "best_practice_category" NOT NULL,
    "practice_title" text NOT NULL,
    "practice_description" text NOT NULL,
    "implementation_steps" jsonb,
    "impact_score" integer NOT NULL,
    "effort_score" integer NOT NULL,
    "effective_since" date,
    "deprecated_at" date,
    "source" text,
    "auto_updated" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Schema Templates table
CREATE TABLE IF NOT EXISTS "schema_templates" (
    "id" text PRIMARY KEY NOT NULL,
    "schema_type" "schema_type" NOT NULL,
    "version" text NOT NULL,
    "template_json" jsonb NOT NULL,
    "variables" jsonb NOT NULL,
    "platform_relevance" jsonb,
    "usage_notes" text,
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "schema_templates_type_version_unique" UNIQUE ("schema_type", "version")
);

-- Platform Changes table
CREATE TABLE IF NOT EXISTS "platform_changes" (
    "id" text PRIMARY KEY NOT NULL,
    "platform" "geo_platform" NOT NULL,
    "change_type" "platform_change_type" NOT NULL,
    "description" text NOT NULL,
    "impact_assessment" text NOT NULL,
    "recommended_response" text NOT NULL,
    "confidence_score" integer NOT NULL,
    "source" text NOT NULL,
    "change_detected" date DEFAULT CURRENT_DATE NOT NULL,
    "verified_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- GEO Alerts table
CREATE TABLE IF NOT EXISTS "geo_alerts" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text REFERENCES "organizations"("id") ON DELETE CASCADE,
    "brand_id" text REFERENCES "brands"("id") ON DELETE CASCADE,
    "alert_type" "geo_alert_type" NOT NULL,
    "severity" "alert_severity" NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "action_url" text,
    "related_platform" "geo_platform",
    "related_change_id" text REFERENCES "platform_changes"("id") ON DELETE SET NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "is_dismissed" boolean DEFAULT false NOT NULL,
    "expires_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Action Plan Versions table
CREATE TABLE IF NOT EXISTS "action_plan_versions" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
    "version_number" integer NOT NULL,
    "export_format" text NOT NULL,
    "content" jsonb NOT NULL,
    "generated_by" text REFERENCES "users"("id") ON DELETE SET NULL,
    "notes" text,
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Create Indexes
-- ============================================================================

-- geo_best_practices indexes
CREATE INDEX IF NOT EXISTS "geo_best_practices_platform_idx" ON "geo_best_practices" ("platform");
CREATE INDEX IF NOT EXISTS "geo_best_practices_category_idx" ON "geo_best_practices" ("category");
CREATE INDEX IF NOT EXISTS "geo_best_practices_impact_idx" ON "geo_best_practices" ("impact_score" DESC);

-- schema_templates indexes
CREATE INDEX IF NOT EXISTS "schema_templates_type_idx" ON "schema_templates" ("schema_type");
CREATE INDEX IF NOT EXISTS "schema_templates_current_idx" ON "schema_templates" ("is_current") WHERE "is_current" = true;

-- platform_changes indexes
CREATE INDEX IF NOT EXISTS "platform_changes_platform_idx" ON "platform_changes" ("platform");
CREATE INDEX IF NOT EXISTS "platform_changes_type_idx" ON "platform_changes" ("change_type");
CREATE INDEX IF NOT EXISTS "platform_changes_detected_idx" ON "platform_changes" ("change_detected" DESC);
CREATE INDEX IF NOT EXISTS "platform_changes_confidence_idx" ON "platform_changes" ("confidence_score" DESC);

-- geo_alerts indexes
CREATE INDEX IF NOT EXISTS "geo_alerts_org_idx" ON "geo_alerts" ("organization_id");
CREATE INDEX IF NOT EXISTS "geo_alerts_brand_idx" ON "geo_alerts" ("brand_id");
CREATE INDEX IF NOT EXISTS "geo_alerts_type_idx" ON "geo_alerts" ("alert_type");
CREATE INDEX IF NOT EXISTS "geo_alerts_severity_idx" ON "geo_alerts" ("severity");
CREATE INDEX IF NOT EXISTS "geo_alerts_unread_idx" ON "geo_alerts" ("is_read") WHERE "is_read" = false;
CREATE INDEX IF NOT EXISTS "geo_alerts_active_idx" ON "geo_alerts" ("is_dismissed", "expires_at");

-- action_plan_versions indexes
CREATE INDEX IF NOT EXISTS "action_plan_versions_org_idx" ON "action_plan_versions" ("organization_id");
CREATE INDEX IF NOT EXISTS "action_plan_versions_brand_idx" ON "action_plan_versions" ("brand_id");
CREATE INDEX IF NOT EXISTS "action_plan_versions_current_idx" ON "action_plan_versions" ("is_current") WHERE "is_current" = true;
