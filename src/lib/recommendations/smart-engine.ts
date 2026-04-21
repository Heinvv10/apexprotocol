// smart-engine.ts — compatibility shim
// These types/functions live in engine.ts and types.ts

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recommendations, recommendationLift, brands } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { captureOnCompletion } from "./lift";
import type { RecommendationCategory } from "./types";

export type { RecommendationCategory };
export type ImpactLevel = "high" | "medium" | "low";
export type EffortLevel = "high" | "medium" | "low";

export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: number;
}

export { generateRecommendations as generateSmartRecommendations } from "./engine";

export interface CompletionFeedback {
  rating?: number;
  notes?: string;
}

export interface EffectivenessResult {
  completed: boolean;
  completedAt?: Date;
  projectedScoreDelta?: number;
  realizedScoreDelta?: number;
  projectionConfidence?: number;
  reconciliation?: "accurate" | "optimistic" | "pessimistic" | "unprojected";
  measurementWindowClosed: boolean;
  revenueCentsDelta?: number;
  userRating?: number;
}

/**
 * Mark a recommendation as completed, persist user feedback, and start the
 * lift measurement window. Returns the lift row id (or null if the rec was
 * already completed).
 */
export async function completeRecommendation(
  id: string,
  feedback?: CompletionFeedback,
): Promise<{ liftId: string | null }> {
  const [rec] = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.id, id))
    .limit(1);

  if (!rec) {
    throw new Error(`recommendation ${id} not found`);
  }
  if (rec.status === "completed") {
    return { liftId: null };
  }

  const now = new Date();
  const ratingValid =
    feedback?.rating !== undefined &&
    feedback.rating >= 1 &&
    feedback.rating <= 5
      ? feedback.rating
      : undefined;

  await db
    .update(recommendations)
    .set({
      status: "completed",
      completedAt: now,
      updatedAt: now,
      userRating: ratingValid ?? rec.userRating,
      userFeedback: feedback?.notes ?? rec.userFeedback,
      feedbackAt: feedback ? now : rec.feedbackAt,
    })
    .where(eq(recommendations.id, id));

  // Resolve organizationId via brand (recommendation_lift requires it)
  const [brand] = await db
    .select({ organizationId: brands.organizationId })
    .from(brands)
    .where(eq(brands.id, rec.brandId))
    .limit(1);

  if (!brand?.organizationId) {
    logger.warn("rec_complete.no_org", { recId: id, brandId: rec.brandId });
    return { liftId: null };
  }

  const liftId = await captureOnCompletion(
    { id: rec.id, brandId: rec.brandId, category: rec.category },
    brand.organizationId,
  );

  logger.info("rec_complete.done", { recId: id, liftId });
  return { liftId };
}

export async function getRecommendationEffectiveness(
  id: string,
): Promise<EffectivenessResult> {
  const [rec] = await db
    .select({
      status: recommendations.status,
      completedAt: recommendations.completedAt,
      userRating: recommendations.userRating,
    })
    .from(recommendations)
    .where(eq(recommendations.id, id))
    .limit(1);

  if (!rec) {
    return { completed: false, measurementWindowClosed: false };
  }

  const completed = rec.status === "completed";
  if (!completed) {
    return { completed: false, measurementWindowClosed: false };
  }

  const [lift] = await db
    .select()
    .from(recommendationLift)
    .where(eq(recommendationLift.recommendationId, id))
    .limit(1);

  if (!lift) {
    return {
      completed: true,
      completedAt: rec.completedAt ?? undefined,
      measurementWindowClosed: false,
      userRating: rec.userRating ?? undefined,
    };
  }

  return {
    completed: true,
    completedAt: rec.completedAt ?? undefined,
    projectedScoreDelta: lift.projectedScoreDelta ?? undefined,
    realizedScoreDelta: lift.scoreDelta ?? undefined,
    projectionConfidence: lift.projectionConfidence ?? undefined,
    reconciliation:
      (lift.reconciliation as EffectivenessResult["reconciliation"]) ??
      undefined,
    measurementWindowClosed: lift.postSnapshot !== null,
    revenueCentsDelta: lift.revenueCentsDelta ?? undefined,
    userRating: rec.userRating ?? undefined,
  };
}
