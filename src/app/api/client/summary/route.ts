/**
 * Client Summary API (Phase 4.2)
 * GET /api/client/summary?brandId=...
 *
 * Read-only roll-up for the simplified client dashboard. Returns only
 * what a `viewer` role should see — no raw mentions, no admin settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brandMentions, recommendations } from "@/lib/db/schema";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";

const PERIOD_DAYS = 30;

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - PERIOD_DAYS * 86_400_000);
    const prevPeriodStart = new Date(
      periodStart.getTime() - PERIOD_DAYS * 86_400_000,
    );

    const [
      latestAuditCurrent,
      latestAuditPrevious,
      currentMentions,
      recRows,
      recentWinRows,
    ] = await Promise.all([
      db
        .select({ overallScore: audits.overallScore })
        .from(audits)
        .where(
          and(
            eq(audits.brandId, brandId),
            eq(audits.status, "completed"),
            gte(audits.completedAt, periodStart),
          ),
        )
        .orderBy(desc(audits.completedAt))
        .limit(1),
      db
        .select({ overallScore: audits.overallScore })
        .from(audits)
        .where(
          and(
            eq(audits.brandId, brandId),
            eq(audits.status, "completed"),
            gte(audits.completedAt, prevPeriodStart),
            lt(audits.completedAt, periodStart),
          ),
        )
        .orderBy(desc(audits.completedAt))
        .limit(1),
      db
        .select({
          sentiment: brandMentions.sentiment,
          citationUrl: brandMentions.citationUrl,
        })
        .from(brandMentions)
        .where(
          and(
            eq(brandMentions.brandId, brandId),
            gte(brandMentions.timestamp, periodStart),
          ),
        ),
      db
        .select({
          id: recommendations.id,
          title: recommendations.title,
          priority: recommendations.priority,
          impact: recommendations.impact,
          status: recommendations.status,
          completedAt: recommendations.completedAt,
        })
        .from(recommendations)
        .where(eq(recommendations.brandId, brandId)),
      db
        .select({
          title: recommendations.title,
          completedAt: recommendations.completedAt,
        })
        .from(recommendations)
        .where(
          and(
            eq(recommendations.brandId, brandId),
            eq(recommendations.status, "completed"),
            gte(recommendations.completedAt, periodStart),
          ),
        )
        .orderBy(desc(recommendations.completedAt))
        .limit(5),
    ]);

    const geoScore = latestAuditCurrent[0]?.overallScore ?? null;
    const prevScore = latestAuditPrevious[0]?.overallScore ?? null;
    const geoScoreChange =
      geoScore !== null && prevScore !== null ? geoScore - prevScore : null;
    const trendDirection: "up" | "down" | "flat" =
      geoScoreChange === null
        ? "flat"
        : geoScoreChange > 0
          ? "up"
          : geoScoreChange < 0
            ? "down"
            : "flat";

    const mentionCount = currentMentions.length;
    const citationCount = currentMentions.filter((m) => m.citationUrl).length;
    const scored = currentMentions.filter((m) => m.sentiment !== "unrecognized");
    const positiveSentimentPct =
      scored.length > 0
        ? Math.round(
            (scored.filter((m) => m.sentiment === "positive").length /
              scored.length) *
              100,
          )
        : 0;

    const openRecs = recRows.filter((r) => r.status !== "completed" && r.status !== "dismissed");
    const openCriticalRecs = openRecs.filter((r) => r.priority === "critical").length;
    const openHighRecs = openRecs.filter((r) => r.priority === "high").length;
    const completedRecs = recRows.filter((r) => r.status === "completed").length;

    const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    const topRecommendations = openRecs
      .sort(
        (a, b) =>
          priorityRank[a.priority as keyof typeof priorityRank] -
          priorityRank[b.priority as keyof typeof priorityRank],
      )
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority as "critical" | "high" | "medium" | "low",
        impact: r.impact as "high" | "medium" | "low",
      }));

    return NextResponse.json({
      success: true,
      summary: {
        geoScore,
        geoScoreChange,
        trendDirection,
        mentionCount,
        citationCount,
        positiveSentimentPct,
        openCriticalRecs,
        openHighRecs,
        totalRecs: recRows.length,
        completedRecs,
        recentWins: recentWinRows
          .filter((w) => w.completedAt)
          .map((w) => ({
            title: w.title,
            completedAt: (w.completedAt as Date).toISOString(),
          })),
        topRecommendations,
        lastUpdated: now.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to build client summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
