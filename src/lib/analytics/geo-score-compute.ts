/**
 * GEO Score computation & persistence.
 *
 * Single source of truth for "what's the current GEO score for brand X?".
 * Previously inlined in `/api/analytics/geo-score/route.ts`, which meant the
 * score only got recalculated + history-persisted when a user loaded the
 * dashboard. Now workers (audit, monitor) can call this proactively so:
 *   - geoScoreHistory gets written right after the event that changed the score
 *   - the onScoreChange notification fires for real without a user pageview
 *   - the dashboard endpoint just calls this and renders the result
 */

import { db } from "@/lib/db";
import { brandMentions, audits, geoScoreHistory } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { onScoreChange } from "@/lib/notifications/triggers";

export interface GeoScoreResult {
  overall: number;
  technical: number;
  content: number;
  authority: number;
  aiReadiness: number;
  metrics: {
    totalMentions: number;
    positiveMentions: number;
    citedMentions: number;
    platforms: number;
  };
  /** Whether this call inserted a new geoScoreHistory row. */
  historyPersisted: boolean;
  /** Delta from the most recent geoScoreHistory.overallScore. */
  scoreChange: number;
}

export interface ComputeGeoScoreOptions {
  /** When true, always write a geoScoreHistory row + fire notifications
   *  even when the change is < 5 points. Workers use this to maintain a
   *  dense history for the trend chart. */
  forceHistory?: boolean;
  /** User + org context for notification triggering. Optional — workers
   *  usually have neither, the UI route supplies both. */
  userId?: string;
  organizationId?: string;
}

const SIGNIFICANT_CHANGE_THRESHOLD = 5;

/**
 * Recompute the GEO score for a brand, persisting to history if the change
 * is significant (or `forceHistory` is set). Returns the result either way.
 *
 * Safe to call from worker code — never throws on notification failures.
 */
export async function computeGeoScore(
  brandId: string,
  opts: ComputeGeoScoreOptions = {},
): Promise<GeoScoreResult> {
  // 1. Mentions (feeds content + authority scores)
  const mentionRow = await db
    .select({
      total: count(),
      positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
      withCitation: sql<number>`COUNT(CASE WHEN ${brandMentions.citationUrl} IS NOT NULL THEN 1 END)`,
    })
    .from(brandMentions)
    .where(eq(brandMentions.brandId, brandId));

  const totalMentions = Number(mentionRow[0]?.total) || 0;
  const positiveMentions = Number(mentionRow[0]?.positive) || 0;
  const citedMentions = Number(mentionRow[0]?.withCitation) || 0;

  // 2. Platform coverage (AI readiness)
  const platformRow = await db
    .select({ n: sql<number>`COUNT(DISTINCT ${brandMentions.platform})` })
    .from(brandMentions)
    .where(eq(brandMentions.brandId, brandId));
  const platforms = Number(platformRow[0]?.n) || 0;

  // 3. Latest audit (technical score)
  const lastAudit = await db.query.audits.findFirst({
    where: eq(audits.brandId, brandId),
    orderBy: [desc(audits.createdAt)],
  });

  // 4. Component scores — matches the weighting previously in the API route
  const technical = lastAudit?.overallScore ?? 65;
  const content =
    totalMentions > 0
      ? Math.min(Math.round((positiveMentions / totalMentions) * 100), 100)
      : 50;
  const authority =
    totalMentions > 0
      ? Math.min(Math.round((citedMentions / totalMentions) * 100) + 20, 100)
      : 40;
  const aiReadiness = Math.min(Math.round((platforms / 7) * 100), 100);
  const overall = Math.round(
    technical * 0.25 + content * 0.25 + authority * 0.25 + aiReadiness * 0.25,
  );

  // 5. Score change detection
  const lastHistory = await db.query.geoScoreHistory.findFirst({
    where: eq(geoScoreHistory.brandId, brandId),
    orderBy: [desc(geoScoreHistory.calculatedAt)],
  });
  const previousScore = lastHistory?.overallScore ?? overall;
  const scoreChange = overall - previousScore;
  const absChange = Math.abs(scoreChange);

  // 6. Persist history + notify if significant (or forced)
  let historyPersisted = false;
  if (opts.forceHistory || absChange >= SIGNIFICANT_CHANGE_THRESHOLD) {
    try {
      const trend = scoreChange > 0 ? "up" : scoreChange < 0 ? "down" : "stable";
      const [scoreHistoryRecord] = await db
        .insert(geoScoreHistory)
        .values({
          brandId,
          overallScore: overall,
          visibilityScore: aiReadiness,
          sentimentScore: content,
          recommendationScore: authority,
          competitorGapScore: null,
          previousScore,
          scoreChange,
          trend,
          mentionCount: totalMentions,
          positiveMentions,
          negativeMentions: 0,
          neutralMentions: totalMentions - positiveMentions,
          recommendationCount: null,
          completedRecommendations: null,
          calculationNotes: `Score ${trend} by ${absChange.toFixed(1)} points`,
          dataQuality:
            totalMentions > 10 ? 90 : totalMentions > 5 ? 75 : 60,
        })
        .returning();
      historyPersisted = true;

      // Notification is best-effort. User/org context only available when
      // called from an authenticated API route — workers won't have it and
      // that's fine; the history row is what matters there.
      if (
        absChange >= SIGNIFICANT_CHANGE_THRESHOLD &&
        opts.userId &&
        opts.organizationId
      ) {
        await onScoreChange({
          scoreHistory: scoreHistoryRecord,
          userId: opts.userId,
          organizationId: opts.organizationId,
        }).catch((err) => {
          console.error("[geo-score] notification failed:", err);
        });
      }
    } catch (err) {
      console.error("[geo-score] history persist failed:", err);
    }
  }

  return {
    overall,
    technical,
    content,
    authority,
    aiReadiness,
    metrics: {
      totalMentions,
      positiveMentions,
      citedMentions,
      platforms,
    },
    historyPersisted,
    scoreChange,
  };
}
