import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const migration = fs.readFileSync(
  path.join(process.cwd(), "drizzle/0015_add_hot_table_indexes.sql"),
  "utf-8"
);

const statements = migration
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"))
  .map((s) => s.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n"))
  .filter((s) => s.trim().length > 0);

async function main() {
  console.log(`Applying ${statements.length} statements to Neon...`);
  for (const stmt of statements) {
    const name = stmt.match(/INDEX IF NOT EXISTS (\w+)/)?.[1] ?? stmt.slice(0, 40);
    process.stdout.write(`  ${name}... `);
    try {
      await sql.query(stmt);
      console.log("ok");
    } catch (e) {
      console.log("FAIL");
      console.error("    ", e instanceof Error ? e.message : e);
      throw e;
    }
  }
  console.log("\nVerifying indexes exist:");
  const rows = (await sql.query(`
    SELECT tablename, indexname FROM pg_indexes
    WHERE indexname LIKE '%_idx'
      AND tablename IN ('brand_mentions','brands','audits')
    ORDER BY tablename, indexname
  `)) as Array<{ tablename: string; indexname: string }>;
  rows.forEach((r) => console.log(`  ${r.tablename}.${r.indexname}`));
  console.log(`\nTotal: ${rows.length} indexes present`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
