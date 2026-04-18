import { db } from "../src/lib/db";
import { audits, recommendations, brands } from "../src/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

async function main() {
  const recent = await db.select({
    id: audits.id, brandId: audits.brandId, status: audits.status,
    issueCount: audits.issueCount, createdAt: audits.createdAt,
  }).from(audits).orderBy(desc(audits.createdAt)).limit(10);
  const brandIds = Array.from(new Set(recent.map(r => r.brandId)));
  const brandRows = await db.select({ id: brands.id, name: brands.name }).from(brands).where(inArray(brands.id, brandIds));
  const brandMap = new Map(brandRows.map(b => [b.id, b.name]));
  console.log("[recent audits]");
  for (const a of recent) {
    console.log(`  ${a.id} | ${brandMap.get(a.brandId) ?? a.brandId} | status=${a.status} issues=${a.issueCount}`);
  }
  const ids = recent.map(a => a.id);
  const recs = await db.select().from(recommendations).where(inArray(recommendations.auditId, ids));
  const byAudit = recs.reduce<Record<string, number>>((acc, r) => {
    const k = r.auditId ?? "null";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log("[recommendations by audit]", byAudit);
  console.log("[total recs across recent audits]", recs.length);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
