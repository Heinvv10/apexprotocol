import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const r = await db.execute(sql.raw(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `));
  const rows = ((r as unknown as { rows?: Array<{ table_name: string }> }).rows) ?? (r as any);
  for (const row of rows) console.log(row.table_name);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
