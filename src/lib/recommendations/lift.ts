/**
 * Recommendation lift measurement service (🏆 FR-REC-007/013).
 *
 * Two entry points:
 *   - captureOnCompletion(rec) — called when a rec flips to 'completed'.
 *     Snapshots pre-state + writes projected-delta from heuristic deltas
 *     (which themselves come from the what-if simulator's pattern library).
 *   - closeWindow(liftId) — called by a scheduled job after windowDays has
 *     elapsed. Snapshots post-state, computes realized deltas, reconciles.
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  recommendationLift,
  audits,
  brandMentions,
  type LiftSnapshot,
  type Recommendation,
} from "@/lib/db/schema";
import { logger } from "@/lib/logger";

/**
 * Simple heuristic projections keyed by recommendation category. Refined
 * over time as realized-lift data accumulates (closeWindow reconciles).
 */
const CATEGORY_PROJECTIONS: Record<
  string,
  { scoreDelta: number; revenueCents: number; confidence: number }
> = {
  technical_seo: { scoreDelta: 6, revenueCents: 0, confidence: 70 },
  content_optimization: {
    scoreDelta: 8,
    revenueCents: 0,
    confidence: 65,
  },
  schema_markup: { scoreDelta: 12, revenueCents: 0, confidence: 80 },
  citation_building: { scoreDelta: 5, revenueCents: 0, confidence: 60 },
  brand_consistency: { scoreDelta: 4, revenueCents: 0, confidence: 55 },
  competitor_analysis: { scoreDelta: 3, revenueCents: 0, confidence: 50 },
  content_freshness: { scoreDelta: 6, revenueCents: 0, confidence: 65 },
  authority_building: { scoreDelta: 7, revenueCents: 0, confidence: 60 },
};

export async function captureOnCompletion(
  rec: Pick<Recommendation, "id" | "brandId" | "category">,
  organizationId: string,
  options: { windowDays?: number } = {},
): Promise<string> {
  const windowDays = options.windowDays ?? 30;
  const pre = await takeSnapshot(rec.brandId);
  const projection =
    CATEGORY_PROJECTIONS[rec.category] ?? {
      scoreDelta: 5,
      revenueCents: 0,
      confidence: 50,
    };

  const [created] = await db
    .insert(recommendationLift)
    .values({
      recommendationId: rec.id,
      brandId: rec.brandId,
      organizationId,
      completedAt: new Date(),
      windowDays,
      preSnapshot: pre,
      projectedScoreDelta: projection.scoreDelta,
      projectedRevenueCentsDelta: projection.revenueCents,
      projectionConfidence: projection.confidence,
    })
    .returning();

  logger.info("rec_lift.captured", {
    liftId: created.id,
    recId: rec.id,
    brandId: rec.brandId,
    windowDays,
  });

  return created.id;
}

export async function closeWindow(liftId: string): Promise<void> {
  const rows = await db
    .select()
    .from(recommendationLift)
    .where(eq(recommendationLift.id, liftId))
    .limit(1);
  if (rows.length === 0) {
    throw new Error(`lift ${liftId} not found`);
  }
  const lift = rows[0];
  if (lift.postSnapshot) {
    return; // already closed
  }

  const post = await takeSnapshot(lift.brandId);
  const preScore = lift.preSnapshot.overallScore;
  const postScore = post.overallScore;
  const scoreDelta = postScore - preScore;
  const revenueDelta =
    lift.preSnapshot.revenueCents !== null &&
    post.revenueCents !== null
      ? post.revenueCents - lift.preSnapshot.revenueCents
      : null;

  // Reconciliation bucket
  const reconciliation = lift.projectedScoreDelta
    ? bucketReconciliation(scoreDelta, lift.projectedScoreDelta)
    : "unprojected";

  await db
    .update(recommendationLift)
    .set({
      postSnapshot: post,
      scoreDelta,
      revenueCentsDelta: revenueDelta,
      reconciliation,
      updatedAt: new Date(),
    })
    .where(eq(recommendationLift.id, liftId));

  logger.info("rec_lift.closed", {
    liftId,
    scoreDelta,
    projected: lift.projectedScoreDelta,
    reconciliation,
  });
}

/**
 * Find all lift rows whose window is past due but still open. Scheduled
 * job calls this once/hour.
 */
export async function findDueMeasurements(): Promise<string[]> {
  const rows = await db
    .select({ id: recommendationLift.id })
    .from(recommendationLift)
    .where(
      and(
        sql`${recommendationLift.postSnapshot} IS NULL`,
        sql`${recommendationLift.completedAt} + (${recommendationLift.windowDays} || ' days')::interval <= NOW()`,
      ),
    );
  return rows.map((r) => r.id);
}

async function takeSnapshot(brandId: string): Promise<LiftSnapshot> {
  // Most recent completed audit score
  const auditRows = await db
    .select({ score: audits.overallScore })
    .from(audits)
    .where(
      and(eq(audits.brandId, brandId), eq(audits.status, "completed")),
    )
    .orderBy(desc(audits.completedAt))
    .limit(1);

  // Mention rate over the last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const mentionRows = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      mentioned: sql<number>`COUNT(*) FILTER (WHERE position IS NOT NULL)::int`,
    })
    .from(brandMentions)
    .where(
      and(eq(brandMentions.brandId, brandId), gte(brandMentions.timestamp, since)),
    );
  const total = mentionRows[0]?.total ?? 0;
  const mentioned = mentionRows[0]?.mentioned ?? 0;
  const mentionedRate = total === 0 ? null : mentioned / total;

  return {
    overallScore: auditRows[0]?.score ?? 0,
    mentionedRate,
    // Revenue snapshot deferred to attribution worker — schema supports it
    revenueCents: null,
    recordedAt: new Date().toISOString(),
  };
}

function bucketReconciliation(
  realized: number,
  projected: number,
): "accurate" | "optimistic" | "pessimistic" {
  if (projected === 0) return "accurate";
  const ratio = realized / projected;
  if (ratio >= 0.7 && ratio <= 1.3) return "accurate";
  if (ratio < 0.7) return "optimistic"; // we projected too high
  return "pessimistic"; // we projected too low
}
