/**
 * Script to fix GEO alerts table - change array columns to JSONB
 * Run with: npx tsx scripts/fix-geo-alerts-table.ts
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });
async function fixTable() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('Connecting to database...');
  try {
    // Drop the existing table
    console.log('Dropping existing geo_alerts table...');
    await db.execute(sql`DROP TABLE IF EXISTS geo_alerts CASCADE;`);

    // Recreate with JSONB columns
    console.log('Creating geo_alerts table with JSONB columns...');
    await db.execute(sql`
      CREATE TABLE geo_alerts (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organization_id VARCHAR(255) NOT NULL,
        brand_id VARCHAR(255),
        alert_type geo_alert_type NOT NULL,
        severity alert_severity NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        affected_platforms JSONB DEFAULT '[]'::jsonb NOT NULL,
        action_required BOOLEAN DEFAULT false NOT NULL,
        suggested_actions JSONB DEFAULT '[]'::jsonb,
        platform_change_id VARCHAR(255),
        read_at TIMESTAMP WITH TIME ZONE,
        dismissed_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    console.log('geo_alerts table recreated successfully');

    // Recreate indexes
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_org ON geo_alerts(organization_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_brand ON geo_alerts(brand_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_type ON geo_alerts(alert_type);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_unread ON geo_alerts(read_at);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_geo_alerts_created ON geo_alerts(created_at DESC);`);

    console.log('\n✅ geo_alerts table fixed successfully!');

  } catch (error) {
    console.error('Error fixing table:', error);
    process.exit(1);
  }
}

fixTable();
