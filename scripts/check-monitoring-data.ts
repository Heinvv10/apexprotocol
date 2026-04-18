import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const tables = [
    "mentions", "ai_platform_insights", "predictions",
    "competitor_benchmarks", "competitor_gaps", "share_of_voice",
    "query_runs", "insights_runs",
  ];
  for (const t of tables) {
    try {
      const r = await db.execute(sql.raw(`SELECT COUNT(*) AS c FROM "${t}"`));
      const row = (r as unknown as { rows: Array<{ c: string }> }).rows?.[0] ?? (r as any)[0];
      console.log(`${t.padEnd(28)} ${row?.c ?? "?"}`);
    } catch (e) {
      console.log(`${t.padEnd(28)} (not found or error)`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
