/**
 * Predictions summary endpoint
 *
 * One call that fills the four tiles on /dashboard/predictions without
 * forcing the client to stitch together predictions + competitive +
 * recommendations + platform-insights separately.
 *
 * Every card's shape includes `available: boolean` so the UI can render
 * an honest empty state per-card instead of showing a fabricated
 * number when a brand has no history yet.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  brands,
  predictions,
  recommendations,
  discoveredCompetitors,
  platformInsights,
  competitiveGaps,
} from "@/lib/db/schema";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getOrganizationId } from "@/lib/auth/clerk";

interface SummaryResponse {
  brandId: string;
  visibilityForecast: {
    available: boolean;
    currentScore?: number;
    predictedScore?: number;
    deltaPercent?: number;
    trend?: "up" | "down" | "stable";
    confidence?: number;
    horizonDays?: number;
    lastUpdated?: string;
  };
  mentionOpportunity: {
    available: boolean;
    level?: "high" | "medium" | "low";
    recentInsights?: number;
    platforms?: string[];
    note?: string;
  };
  competitorGap: {
    available: boolean;
    topicCount?: number;
    competitorCount?: number;
    topCompetitor?: string;
  };
  recommendedAction: {
    available: boolean;
    recommendationId?: string;
    title?: string;
    description?: string;
    priority?: "critical" | "high" | "medium" | "low";
    category?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandId = new URL(request.url).searchParams.get("brandId");
    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    const brand = await db.query.brands.findFirst({
      where: and(eq(brands.id, brandId), eq(brands.organizationId, orgId)),
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const [
      visibilityForecast,
      mentionOpportunity,
      competitorGap,
      recommendedAction,
    ] = await Promise.all([
      buildVisibilityForecast(brandId),
      buildMentionOpportunity(brandId),
      buildCompetitorGap(brandId),
      buildRecommendedAction(brandId),
    ]);

    const body: SummaryResponse = {
      brandId,
      visibilityForecast,
      mentionOpportunity,
      competitorGap,
      recommendedAction,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[predictions/summary] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function buildVisibilityForecast(
  brandId: string
): Promise<SummaryResponse["visibilityForecast"]> {
  // Latest active prediction at the ~30-day horizon. We pick the closest
  // target_date to now + 30d so callers get a "next month" story rather
  // than the full 90-day range.
  const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const activePredictions = await db
    .select()
    .from(predictions)
    .where(
      and(eq(predictions.brandId, brandId), eq(predictions.status, "active"))
    )
    .orderBy(
      sql`abs(extract(epoch from (${predictions.targetDate} - ${target.toISOString()}::timestamp)))`
    )
    .limit(1);
  const p = activePredictions[0];
  if (!p) return { available: false };

  // The model persists a "baseline" (last historical score) alongside
  // trendMagnitude, but the column isn't always populated for legacy
  // rows. Reconstruct current from predictedValue and trendMagnitude
  // when we can; otherwise fall back to just predictedValue.
  const predicted = Number(p.predictedValue);
  const trendPct = p.trendMagnitude != null ? Number(p.trendMagnitude) : null;
  const current =
    trendPct != null && trendPct !== -100
      ? Math.round((predicted / (1 + trendPct / 100)) * 10) / 10
      : undefined;

  return {
    available: true,
    currentScore: current,
    predictedScore: Math.round(predicted * 10) / 10,
    deltaPercent: trendPct != null ? Math.round(trendPct * 10) / 10 : undefined,
    trend: p.trend as "up" | "down" | "stable",
    confidence: Math.round(Number(p.confidence) * 100),
    horizonDays: Math.max(
      1,
      Math.round(
        (p.targetDate.getTime() - p.predictionDate.getTime()) / (24 * 60 * 60 * 1000)
      )
    ),
    lastUpdated: p.predictionDate.toISOString(),
  };
}

async function buildMentionOpportunity(
  brandId: string
): Promise<SummaryResponse["mentionOpportunity"]> {
  // "AI mention opportunity" is a snapshot of how many platform insights
  // we've captured in the last 14 days. Low/medium/high bucketing is
  // intentionally coarse — this card hints that monitoring is running,
  // it doesn't pretend to forecast mentions.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      platform: platformInsights.platform,
      count: count(),
    })
    .from(platformInsights)
    .where(
      and(
        eq(platformInsights.brandId, brandId),
        gte(platformInsights.createdAt, since)
      )
    )
    .groupBy(platformInsights.platform);

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  if (total === 0) {
    return {
      available: false,
      note: "No platform insights captured in the last 14 days.",
    };
  }
  const level: "high" | "medium" | "low" =
    total >= 20 ? "high" : total >= 5 ? "medium" : "low";
  return {
    available: true,
    level,
    recentInsights: total,
    platforms: rows.map((r) => r.platform as string),
  };
}

async function buildCompetitorGap(
  brandId: string
): Promise<SummaryResponse["competitorGap"]> {
  const [gapRow] = await db
    .select({ topicCount: count() })
    .from(competitiveGaps)
    .where(
      and(
        eq(competitiveGaps.brandId, brandId),
        eq(competitiveGaps.isResolved, false)
      )
    );
  const topicCount = Number(gapRow?.topicCount ?? 0);

  const competitorsRow = await db
    .select({
      id: discoveredCompetitors.id,
      name: discoveredCompetitors.competitorName,
    })
    .from(discoveredCompetitors)
    .where(eq(discoveredCompetitors.brandId, brandId))
    .orderBy(desc(discoveredCompetitors.createdAt))
    .limit(5);
  const competitorCount = competitorsRow.length;

  if (topicCount === 0 && competitorCount === 0) {
    return { available: false };
  }

  return {
    available: true,
    topicCount,
    competitorCount,
    topCompetitor: competitorsRow[0]?.name ?? undefined,
  };
}

async function buildRecommendedAction(
  brandId: string
): Promise<SummaryResponse["recommendedAction"]> {
  // Priority ordering: critical > high > medium > low. Drizzle's enum
  // comparison doesn't give us this out of the box, so we sort in JS.
  const priorityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const pending = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.brandId, brandId),
        eq(recommendations.status, "pending")
      )
    )
    .orderBy(desc(recommendations.createdAt))
    .limit(25);
  if (!pending.length) return { available: false };

  const top = [...pending].sort(
    (a, b) =>
      (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4)
  )[0];
  return {
    available: true,
    recommendationId: top.id,
    title: top.title,
    description: top.description,
    priority: top.priority as "critical" | "high" | "medium" | "low",
    category: top.category,
  };
}
