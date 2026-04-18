/**
 * Backfill metadata.performance for completed audits using PSI API.
 * Skips audits that already have performance data.
 */
import { db } from "../src/lib/db";
import { audits } from "../src/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { checkPageSpeed } from "../src/lib/audit/checks/pagespeed-check";

const IDS = [
  "cclvalb2orst7m8qhmf8z8s8", // Capitec
  "nlxjppkhvtrreipjitvlzy4n", // Takealot
  "os718s1b82ctwgo943n0jqhh", // Discovery
];

async function main() {
  const rows = await db.select().from(audits).where(
    and(inArray(audits.id, IDS), eq(audits.status, "completed"))
  );
  for (const a of rows) {
    const meta = (a.metadata as Record<string, unknown>) ?? {};
    if (meta.performance) {
      console.log(`[skip] ${a.id} already has performance`);
      continue;
    }
    console.log(`[psi] ${a.id} ${a.url}`);
    const t0 = Date.now();
    const perf = await checkPageSpeed(a.url);
    console.log(`  took ${Date.now() - t0}ms → ${perf ? "ok" : "null"}`);
    if (!perf) continue;
    const updated = { ...meta, performance: perf };
    await db.update(audits)
      .set({ metadata: updated as typeof audits.$inferInsert["metadata"] })
      .where(eq(audits.id, a.id));
    console.log(`  FCP=${perf.firstContentfulPaint} LCP=${perf.largestContentfulPaint} TBT=${perf.totalBlockingTime} CLS=${perf.cumulativeLayoutShift} SI=${perf.speedIndex}`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
