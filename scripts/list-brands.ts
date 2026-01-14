import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  const brands = await db.query.brands.findMany({
    columns: { id: true, name: true, organizationId: true }
  });
  console.log("All brands:");
  brands.forEach(b => console.log(`  - ${b.name} | ID: ${b.id}`));

  // Check competitive data counts
  const gaps = await db.query.competitiveGaps.findMany();
  const alerts = await db.query.competitiveAlerts.findMany();
  console.log(`\nCompetitive Gaps: ${gaps.length}`);
  console.log(`Competitive Alerts: ${alerts.length}`);

  // Show which brands have competitive data
  const brandIds = new Set(gaps.map(g => g.brandId));
  console.log("\nBrands with competitive gaps:");
  brands.filter(b => brandIds.has(b.id)).forEach(b => console.log(`  - ${b.name}`));
}

main();
