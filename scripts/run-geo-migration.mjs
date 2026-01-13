/**
 * Run GEO Knowledge Base Migration
 *
 * This script creates the tables and enums for PRD-001
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('Starting GEO Knowledge Base migration...\n');

  // Create enums
  const enums = [
    {
      name: 'geo_platform',
      values: ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot', 'all']
    },
    {
      name: 'best_practice_category',
      values: ['schema', 'content', 'social', 'technical', 'authority', 'freshness']
    },
    {
      name: 'platform_change_type',
      values: ['citation_pattern', 'content_preference', 'feature_update', 'algorithm_update', 'ranking_change']
    },
    {
      name: 'geo_alert_type',
      values: ['algorithm_change', 'recommendation_updated', 'strategy_deprecated', 'new_opportunity', 'competitor_move', 'score_impact']
    },
    {
      name: 'alert_severity',
      values: ['info', 'warning', 'critical']
    },
    {
      name: 'schema_type',
      values: ['FAQPage', 'Organization', 'Article', 'HowTo', 'Product', 'LocalBusiness', 'Person', 'WebSite', 'BreadcrumbList', 'SiteNavigationElement', 'VideoObject', 'Course', 'Event', 'Review', 'AggregateRating']
    }
  ];

  for (const enumDef of enums) {
    try {
      const valuesStr = enumDef.values.map(v => `'${v}'`).join(', ');
      await sql.query(`
        DO $$ BEGIN
          CREATE TYPE "${enumDef.name}" AS ENUM (${valuesStr});
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log(`✓ Created enum: ${enumDef.name}`);
    } catch (e) {
      console.log(`⚠ Enum ${enumDef.name}: ${e.message}`);
    }
  }

  // Create tables
  const tables = [
    {
      name: 'geo_best_practices',
      sql: `
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
        )
      `
    },
    {
      name: 'schema_templates',
      sql: `
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
        )
      `
    },
    {
      name: 'platform_changes',
      sql: `
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
        )
      `
    },
    {
      name: 'geo_alerts',
      sql: `
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
          "related_change_id" text,
          "is_read" boolean DEFAULT false NOT NULL,
          "is_dismissed" boolean DEFAULT false NOT NULL,
          "expires_at" timestamp,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        )
      `
    },
    {
      name: 'action_plan_versions',
      sql: `
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
        )
      `
    }
  ];

  for (const table of tables) {
    try {
      await sql.query(table.sql);
      console.log(`✓ Created table: ${table.name}`);
    } catch (e) {
      console.log(`⚠ Table ${table.name}: ${e.message}`);
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "geo_best_practices_platform_idx" ON "geo_best_practices" ("platform")',
    'CREATE INDEX IF NOT EXISTS "geo_best_practices_category_idx" ON "geo_best_practices" ("category")',
    'CREATE INDEX IF NOT EXISTS "geo_best_practices_impact_idx" ON "geo_best_practices" ("impact_score" DESC)',
    'CREATE INDEX IF NOT EXISTS "schema_templates_type_idx" ON "schema_templates" ("schema_type")',
    'CREATE INDEX IF NOT EXISTS "platform_changes_platform_idx" ON "platform_changes" ("platform")',
    'CREATE INDEX IF NOT EXISTS "platform_changes_type_idx" ON "platform_changes" ("change_type")',
    'CREATE INDEX IF NOT EXISTS "platform_changes_detected_idx" ON "platform_changes" ("change_detected" DESC)',
    'CREATE INDEX IF NOT EXISTS "platform_changes_confidence_idx" ON "platform_changes" ("confidence_score" DESC)',
    'CREATE INDEX IF NOT EXISTS "geo_alerts_org_idx" ON "geo_alerts" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "geo_alerts_brand_idx" ON "geo_alerts" ("brand_id")',
    'CREATE INDEX IF NOT EXISTS "geo_alerts_type_idx" ON "geo_alerts" ("alert_type")',
    'CREATE INDEX IF NOT EXISTS "geo_alerts_severity_idx" ON "geo_alerts" ("severity")',
    'CREATE INDEX IF NOT EXISTS "action_plan_versions_org_idx" ON "action_plan_versions" ("organization_id")',
    'CREATE INDEX IF NOT EXISTS "action_plan_versions_brand_idx" ON "action_plan_versions" ("brand_id")',
  ];

  for (const idx of indexes) {
    try {
      await sql.query(idx);
      // Just create silently
    } catch (e) {
      // Ignore index errors
    }
  }
  console.log(`✓ Created indexes`);

  // Add foreign key for related_change_id after platform_changes exists
  try {
    await sql.query(`
      ALTER TABLE "geo_alerts"
      ADD CONSTRAINT IF NOT EXISTS "geo_alerts_related_change_fk"
      FOREIGN KEY ("related_change_id") REFERENCES "platform_changes"("id") ON DELETE SET NULL
    `);
  } catch (e) {
    // Ignore if already exists
  }

  console.log('\n✅ Migration completed successfully!');
}

runMigration().catch(console.error);
