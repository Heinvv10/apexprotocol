import { db } from "../src/lib/db";
import { audits } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCrawler, analyzeAuditResults } from "../src/lib/audit";

async function main() {
  const auditId = "cclvalb2orst7m8qhmf8z8s8";
  const row = await db.query.audits.findFirst({ where: eq(audits.id, auditId) });
  if (!row) { console.log("audit not found"); return; }
  console.log("Re-crawling", row.url);
  const crawler = createCrawler(row.url, { depth: "single", maxPages: 1, timeout: 30000 });
  const result = await crawler.crawl();
  const analysis = analyzeAuditResults(result);
  const meta = (row.metadata as Record<string, unknown>) || {};
  const updated = { ...meta, contentAnalysis: analysis.contentAnalysis };
  await db.update(audits).set({ metadata: updated as typeof audits.$inferInsert["metadata"] }).where(eq(audits.id, auditId));
  console.log("Backfilled contentAnalysis:", analysis.contentAnalysis);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
