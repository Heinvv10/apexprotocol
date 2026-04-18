import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import { config } from "dotenv";

config({ path: ".env.local" });
async function verify() {
  const cols = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'recommendations'
    AND column_name IN ('started_at', 'baseline_score', 'post_implementation_score',
        'score_improvement', 'effectiveness_score', 'user_rating', 'user_feedback', 'feedback_at')
    ORDER BY column_name
  `);
  console.log("Completion tracking columns verified:", cols.rows.length, "/8");
  console.log(cols.rows.map((c) => c.column_name).join(", "));
  if (cols.rows.length === 8) {
    console.log("\n✓ All completion tracking columns are present in the database");
    process.exit(0);
  } else {
    console.log("\n✗ Some columns are missing");
    process.exit(1);
  }
}

verify();
