import { db } from "../src/lib/db";
import { predictions, recommendations, discoveredCompetitors, platformInsights, competitiveGaps, brands } from "../src/lib/db/schema";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";

async function main() {
  const brandId = "mhxj77xbcba7eapgku6isbkf";
  const brand = await db.query.brands.findFirst({ where: eq(brands.id, brandId) });
  console.log("Brand:", brand?.name ?? "unknown", brandId);

  const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const p = await db.select().from(predictions)
    .where(and(eq(predictions.brandId, brandId), eq(predictions.status, "active")))
    .orderBy(sql`abs(extract(epoch from (${predictions.targetDate} - ${target.toISOString()}::timestamp)))`)
    .limit(1);
  console.log("[visibility]", p.length ? { targetDate: p[0].targetDate.toISOString(), predicted: p[0].predictedValue, trend: p[0].trend, trendMag: p[0].trendMagnitude, confidence: p[0].confidence } : "NONE");

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const mi = await db.select({ platform: platformInsights.platform, c: count() })
    .from(platformInsights).where(and(eq(platformInsights.brandId, brandId), gte(platformInsights.createdAt, since)))
    .groupBy(platformInsights.platform);
  console.log("[mentions]", mi);

  const [g] = await db.select({ c: count() }).from(competitiveGaps)
    .where(and(eq(competitiveGaps.brandId, brandId), eq(competitiveGaps.isResolved, false)));
  const comp = await db.select({ name: discoveredCompetitors.competitorName })
    .from(discoveredCompetitors).where(eq(discoveredCompetitors.brandId, brandId)).limit(5);
  console.log("[competitor gap] topics=", g?.c, "competitors:", comp.map(c => c.name));

  const rec = await db.select().from(recommendations)
    .where(and(eq(recommendations.brandId, brandId), eq(recommendations.status, "pending")))
    .orderBy(desc(recommendations.createdAt)).limit(5);
  console.log("[rec]", rec[0] ? { title: rec[0].title, priority: rec[0].priority } : "NONE");
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
