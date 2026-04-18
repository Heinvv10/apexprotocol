import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

import { config } from "dotenv";
config({ path: ".env.local" });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
async function main() {
  console.log("Adding unique index to share_of_voice table...");

  const result = await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS sov_brand_date_platform_idx
    ON share_of_voice (brand_id, date, platform)
  `);

  console.log("Success:", result);
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
