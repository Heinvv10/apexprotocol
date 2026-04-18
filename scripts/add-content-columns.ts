/**
 * Add missing columns to content table
 * Run with: npx tsx scripts/add-content-columns.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}
async function addMissingColumns() {
  console.log("Adding missing columns to content table...\n");

  const alterStatements = [
    // Organization ID (required for multi-tenant support)
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS organization_id TEXT`,

    // URL for SEO tracking
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS url TEXT`,

    // SEO fields
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS meta_description TEXT`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT false`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS indexing_errors JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS visits INTEGER DEFAULT 0`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITH TIME ZONE`,

    // SEO/AI optimization fields
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS ai_score INTEGER`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS readability_score INTEGER`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS seo_score INTEGER`,

    // Target platform
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS target_platform TEXT`,

    // Versioning
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`,
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS parent_id TEXT`,

    // AI generation metadata
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb`,

    // Timestamps
    `ALTER TABLE content ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE`,
  ];

  for (const statement of alterStatements) {
    const columnName = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1];
    try {
      // Use sql.query for dynamic SQL
      await sql.query(statement, []);
      console.log(`✓ Added column: ${columnName}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log(`- Column already exists: ${columnName}`);
      } else {
        console.error(`✗ Error adding ${columnName}:`, error);
      }
    }
  }

  // Verify columns
  console.log("\n--- Verifying content table columns ---\n");
  const columns = await db.execute(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'content'
    ORDER BY ordinal_position
  `);

  console.log("Content table columns:");
  for (const col of columns.rows) {
    console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "not null"})`);
  }

  console.log(`\nTotal columns: ${columns.rows.length}`);
  console.log("\n✓ Migration complete!");
}

addMissingColumns().catch(console.error);
