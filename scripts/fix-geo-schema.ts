/**
 * Fix GEO Schema Column Mismatches
 * Run with: npx tsx scripts/fix-geo-schema.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function runStatement(description: string, statement: string) {
  try {
    await db.execute(sql.raw(statement));
    console.log(`✅ ${description}`);
    return true;
  } catch (err: any) {
    // Some errors are expected (column doesn't exist, already exists, etc.)
    if (err.message?.includes("does not exist") ||
        err.message?.includes("already exists") ||
        err.code === "42703" || // undefined column
        err.code === "42701" // duplicate column
    ) {
      console.log(`⏭️  ${description} (skipped - already done or not needed)`);
      return true;
    }
    console.log(`❌ ${description}: ${err.message || err}`);
    return false;
  }
}

async function main() {
  console.log("🔧 Fixing GEO Schema Column Mismatches\n");

  // ============================================================================
  // Fix platform_changes table
  // ============================================================================
  console.log("--- platform_changes table ---");

  // Rename affected_practices to affected_recommendations
  await runStatement(
    "Rename affected_practices → affected_recommendations",
    `ALTER TABLE "platform_changes" RENAME COLUMN "affected_practices" TO "affected_recommendations"`
  );

  // ============================================================================
  // Fix geo_alerts table
  // ============================================================================
  console.log("\n--- geo_alerts table ---");

  // Add is_read column
  await runStatement(
    "Add is_read column",
    `ALTER TABLE "geo_alerts" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL`
  );

  // Add related_changes column
  await runStatement(
    "Add related_changes column",
    `ALTER TABLE "geo_alerts" ADD COLUMN "related_changes" jsonb`
  );

  // Update is_read based on read_at
  await runStatement(
    "Update is_read based on read_at",
    `UPDATE "geo_alerts" SET "is_read" = true WHERE "read_at" IS NOT NULL`
  );

  // ============================================================================
  // Create indexes
  // ============================================================================
  console.log("\n--- Creating indexes ---");

  await runStatement(
    "Create idx_platform_changes_confidence",
    `CREATE INDEX IF NOT EXISTS "idx_platform_changes_confidence" ON "platform_changes" ("confidence_score" DESC)`
  );

  await runStatement(
    "Create idx_geo_alerts_unread",
    `CREATE INDEX IF NOT EXISTS "idx_geo_alerts_unread" ON "geo_alerts" ("is_read") WHERE "is_read" = false`
  );

  console.log("\n✅ Schema fix complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
