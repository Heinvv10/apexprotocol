/**
 * Script to create GEO knowledge base tables
 * Run with: npx tsx scripts/create-geo-tables.ts
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });
async function createTables() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('Connecting to database...');
  try {
    // Create enums if they don't exist
    console.log('Creating enums...');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE geo_platform AS ENUM ('chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek', 'copilot');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE geo_alert_type AS ENUM ('algorithm_change', 'recommendation_updated', 'strategy_deprecated', 'new_opportunity', 'competitor_move', 'score_impact');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Enums created successfully');

    // Create geo_alerts table
    console.log('Creating geo_alerts table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS geo_alerts (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organization_id VARCHAR(255) NOT NULL,
        brand_id VARCHAR(255),
        alert_type geo_alert_type NOT NULL,
        severity alert_severity NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        affected_platforms TEXT[] DEFAULT '{}',
        action_required BOOLEAN DEFAULT false,
        suggested_actions TEXT[] DEFAULT '{}',
        platform_change_id VARCHAR(255),
        read_at TIMESTAMP,
        dismissed_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('geo_alerts table created successfully');

    // Create geo_best_practices table
    console.log('Creating geo_best_practices table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS geo_best_practices (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        platform VARCHAR(50),
        category VARCHAR(100) NOT NULL,
        practice_title VARCHAR(255) NOT NULL,
        practice_description TEXT NOT NULL,
        implementation_steps JSONB DEFAULT '[]',
        impact_score INTEGER DEFAULT 5,
        effort_score INTEGER DEFAULT 5,
        effective_since DATE DEFAULT CURRENT_DATE,
        deprecated_at DATE,
        deprecation_reason TEXT,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('geo_best_practices table created successfully');

    // Create schema_templates table
    console.log('Creating schema_templates table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schema_templates (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        schema_type VARCHAR(100) NOT NULL,
        platform_relevance JSONB DEFAULT '{}',
        template_code TEXT NOT NULL,
        usage_instructions TEXT,
        version INTEGER DEFAULT 1,
        is_current BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        superseded_by VARCHAR(255)
      );
    `);

    console.log('schema_templates table created successfully');

    // Create platform_changes table
    console.log('Creating platform_changes table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_changes (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        platform VARCHAR(50) NOT NULL,
        change_detected DATE NOT NULL,
        change_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        impact_assessment TEXT,
        recommended_response TEXT,
        confidence_score INTEGER DEFAULT 50,
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('platform_changes table created successfully');

    // Create action_plans table
    console.log('Creating action_plans table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS action_plans (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organization_id VARCHAR(255) NOT NULL,
        brand_id VARCHAR(255),
        version INTEGER DEFAULT 1,
        generated_at TIMESTAMP DEFAULT NOW(),
        knowledge_base_version VARCHAR(50),
        actions JSONB DEFAULT '[]',
        total_impact_estimate INTEGER DEFAULT 0,
        total_effort_hours INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('action_plans table created successfully');

    // Create action_plan_progress table
    console.log('Creating action_plan_progress table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS action_plan_progress (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        action_plan_id VARCHAR(255) NOT NULL,
        action_index INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('action_plan_progress table created successfully');

    // Create indexes
    console.log('Creating indexes...');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_org ON geo_alerts(organization_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_brand ON geo_alerts(brand_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_type ON geo_alerts(alert_type);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_created ON geo_alerts(created_at DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_best_practices_platform ON geo_best_practices(platform);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_best_practices_category ON geo_best_practices(category);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_platform_changes_platform ON platform_changes(platform);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_action_plans_org ON action_plans(organization_id);`);

    console.log('Indexes created successfully');

    console.log('\n✅ All GEO knowledge base tables created successfully!');

  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
