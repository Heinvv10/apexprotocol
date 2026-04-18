import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const tables = [
    "predictions", "share_of_voice", "competitor_snapshots",
    "discovered_competitors", "opportunity_matches", "platform_insights",
    "platform_queries", "geo_score_history", "monitoring_jobs",
    "competitor_gaps_scored" /* guessed */,
  ];
  for (const t of tables) {
    try {
      const r = await db.execute(sql.raw(`SELECT COUNT(*) AS c FROM "${t}"`));
      const rows = (r as any).rows ?? r;
      console.log(`${t.padEnd(30)} ${rows[0]?.c ?? "?"}`);
    } catch {
      console.log(`${t.padEnd(30)} (missing)`);
    }
  }
  // Also look at the most recent predictions/share_of_voice rows
  try {
    const r = await db.execute(sql.raw(`
      SELECT brand_id, COUNT(*) n, MAX(created_at)::text last
      FROM predictions GROUP BY brand_id ORDER BY last DESC LIMIT 5
    `));
    const rows = (r as any).rows ?? r;
    console.log("\n[predictions] recent per brand:");
    for (const row of rows) console.log(`  ${row.brand_id} n=${row.n} last=${row.last}`);
  } catch (e) { console.log("predictions sample failed:", e); }
  try {
    const r = await db.execute(sql.raw(`
      SELECT brand_id, COUNT(*) n, MAX(created_at)::text last
      FROM share_of_voice GROUP BY brand_id ORDER BY last DESC LIMIT 5
    `));
    const rows = (r as any).rows ?? r;
    console.log("\n[share_of_voice] recent per brand:");
    for (const row of rows) console.log(`  ${row.brand_id} n=${row.n} last=${row.last}`);
  } catch (e) { console.log("sov sample failed:", e); }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
