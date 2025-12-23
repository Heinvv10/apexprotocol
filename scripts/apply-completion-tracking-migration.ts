/**
 * Script to apply completion tracking migration directly
 * Run with: npx tsx scripts/apply-completion-tracking-migration.ts
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log("Starting completion tracking migration...\n");

  // Run each ALTER TABLE statement
  console.log("Adding started_at column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone`;
  console.log("  ✓ Success\n");

  console.log("Adding baseline_score column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "baseline_score" integer`;
  console.log("  ✓ Success\n");

  console.log("Adding post_implementation_score column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "post_implementation_score" integer`;
  console.log("  ✓ Success\n");

  console.log("Adding score_improvement column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "score_improvement" integer`;
  console.log("  ✓ Success\n");

  console.log("Adding effectiveness_score column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "effectiveness_score" integer`;
  console.log("  ✓ Success\n");

  console.log("Adding user_rating column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "user_rating" integer`;
  console.log("  ✓ Success\n");

  console.log("Adding user_feedback column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "user_feedback" text`;
  console.log("  ✓ Success\n");

  console.log("Adding feedback_at column...");
  await sql`ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "feedback_at" timestamp with time zone`;
  console.log("  ✓ Success\n");

  // Verify the columns were added
  console.log("Verifying migration...");
  const result = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'recommendations'
    AND column_name IN (
      'started_at', 'baseline_score', 'post_implementation_score',
      'score_improvement', 'effectiveness_score', 'user_rating',
      'user_feedback', 'feedback_at'
    )
    ORDER BY column_name;
  `;

  console.log("\nNew columns in recommendations table:");
  console.table(result);

  console.log("\n✓ Migration completed successfully!");
}

runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
