/**
 * Dashboard Analytics API Route
 * GET /api/analytics/dashboard?brandId=xxx
 * Returns aggregated dashboard metrics for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandMentions, recommendations, audits, content, brands, geoScoreHistory, activityLog } from "@/lib/db/schema";
import { eq, and, count, sql, desc, gte, lte, avg, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    // Fetch brand to verify access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Aggregate mentions data
    const mentionsData = await db
      .select({
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
        neutral: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'neutral' THEN 1 END)`,
        negative: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'negative' THEN 1 END)`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    const mentions = mentionsData[0] || { total: 0, positive: 0, neutral: 0, negative: 0 };

    // Aggregate recommendations data
    const recsData = await db
      .select({
        total: count(),
        completed: sql<number>`COUNT(CASE WHEN ${recommendations.status} = 'completed' THEN 1 END)`,
        pending: sql<number>`COUNT(CASE WHEN ${recommendations.status} = 'pending' THEN 1 END)`,
        highPriority: sql<number>`COUNT(CASE WHEN ${recommendations.priority} IN ('critical', 'high') THEN 1 END)`,
      })
      .from(recommendations)
      .where(eq(recommendations.brandId, brandId));

    const recs = recsData[0] || { total: 0, completed: 0, pending: 0, highPriority: 0 };
    const completionRate = recs.total > 0 ? Math.round((recs.completed / recs.total) * 100) : 0;

    // Aggregate audits data
    const auditsData = await db
      .select({
        total: count(),
        completed: sql<number>`COUNT(CASE WHEN ${audits.status} = 'completed' THEN 1 END)`,
        inProgress: sql<number>`COUNT(CASE WHEN ${audits.status} = 'in_progress' THEN 1 END)`,
      })
      .from(audits)
      .where(eq(audits.brandId, brandId));

    const auditStats = auditsData[0] || { total: 0, completed: 0, inProgress: 0 };

    // Get last audit score
    const lastAudit = await db.query.audits.findFirst({
      where: and(eq(audits.brandId, brandId), eq(audits.status, "completed")),
      orderBy: [desc(audits.createdAt)],
    });

    // Aggregate content data
    const contentData = await db
      .select({
        total: count(),
        published: sql<number>`COUNT(CASE WHEN ${content.status} = 'published' THEN 1 END)`,
        draft: sql<number>`COUNT(CASE WHEN ${content.status} = 'draft' THEN 1 END)`,
      })
      .from(content)
      .where(eq(content.brandId, brandId));

    const contentStats = contentData[0] || { total: 0, published: 0, draft: 0 };

    // Get platform breakdown from mentions
    const platformBreakdown = await db
      .select({
        name: brandMentions.platform,
        mentions: count(),
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId))
      .groupBy(brandMentions.platform);

    // Get top recommendations
    const topRecs = await db.query.recommendations.findMany({
      where: and(
        eq(recommendations.brandId, brandId),
        eq(recommendations.status, "pending")
      ),
      orderBy: [desc(recommendations.priority)],
      limit: 5,
    });

    // Calculate content created this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const contentThisWeek = await db
      .select({ count: count() })
      .from(content)
      .where(
        and(
          eq(content.brandId, brandId),
          gte(content.createdAt, oneWeekAgo)
        )
      );
    const thisWeekContentCount = contentThisWeek[0]?.count ?? 0;

    // Calculate GEO score based on mention sentiment and coverage
    const totalMentions = Number(mentions.total) || 0;
    const positiveMentions = Number(mentions.positive) || 0;
    const negativeMentions = Number(mentions.negative) || 0;
    const sentimentScore = totalMentions > 0 ? Math.round((positiveMentions / totalMentions) * 50) : 0;
    const coverageScore = Math.min(platformBreakdown.length * 10, 50);
    const geoScore = sentimentScore + coverageScore;

    // Get mentions from last week for trend calculation
    const mentionsLastWeek = await db
      .select({ count: count() })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, brandId),
          lte(brandMentions.timestamp, oneWeekAgo)
        )
      );
    const lastWeekMentionCount = mentionsLastWeek[0]?.count ?? 0;
    const mentionsChange = lastWeekMentionCount > 0
      ? Math.round(((totalMentions - lastWeekMentionCount) / lastWeekMentionCount) * 100)
      : totalMentions > 0 ? 100 : 0;
    const mentionsTrend = mentionsChange > 0 ? "up" : mentionsChange < 0 ? "down" : "stable";

    // Calculate per-platform sentiment
    const platformSentiment = await db
      .select({
        platform: brandMentions.platform,
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId))
      .groupBy(brandMentions.platform);

    const platformSentimentMap = new Map(
      platformSentiment.map(p => [
        p.platform,
        Number(p.total) > 0 ? Number(p.positive) / Number(p.total) : 0.5
      ])
    );

    // Get GEO score history for trend data
    const geoHistory = await db
      .select({
        score: geoScoreHistory.overallScore,
        date: geoScoreHistory.calculatedAt,
      })
      .from(geoScoreHistory)
      .where(eq(geoScoreHistory.brandId, brandId))
      .orderBy(desc(geoScoreHistory.calculatedAt))
      .limit(30);

    // Calculate GEO score from latest history or fallback to calculated score
    const latestGeoScore = geoHistory.length > 0 ? geoHistory[0].score : geoScore;
    const previousGeoScore = geoHistory.length > 1 ? geoHistory[1].score : latestGeoScore;
    const geoScoreChange = latestGeoScore - previousGeoScore;
    const geoTrend = geoScoreChange > 0 ? "up" : geoScoreChange < 0 ? "down" : "stable";

    // Format history for trend chart (oldest to newest)
    const scoreHistory = geoHistory
      .map(h => ({ score: h.score, date: h.date.toISOString() }))
      .reverse();

    // Get recent activity from activity log
    const recentActivityData = await db
      .select({
        id: activityLog.id,
        type: activityLog.activityType,
        description: activityLog.description,
        timestamp: activityLog.timestamp,
        metadata: activityLog.metadata,
      })
      .from(activityLog)
      .where(eq(activityLog.brandId, brandId))
      .orderBy(desc(activityLog.timestamp))
      .limit(10);

    // Get historical platform mention data (one week ago)
    const platformHistorical = await db
      .select({
        platform: brandMentions.platform,
        count: count(),
      })
      .from(brandMentions)
      .where(
        and(
          eq(brandMentions.brandId, brandId),
          lte(brandMentions.timestamp, oneWeekAgo)
        )
      )
      .groupBy(brandMentions.platform);

    const platformHistoricalMap = new Map(
      platformHistorical.map(p => [p.platform, Number(p.count) || 0])
    );

    // Build response
    const dashboardMetrics = {
      geoScore: {
        current: latestGeoScore,
        change: geoScoreChange,
        trend: geoTrend as "up" | "down" | "stable",
        history: scoreHistory,
      },
      mentions: {
        total: Number(mentions.total) || 0,
        positive: Number(mentions.positive) || 0,
        neutral: Number(mentions.neutral) || 0,
        negative: Number(mentions.negative) || 0,
        change: mentionsChange,
        trend: mentionsTrend as "up" | "down" | "stable",
      },
      audits: {
        total: Number(auditStats.total) || 0,
        completed: Number(auditStats.completed) || 0,
        inProgress: Number(auditStats.inProgress) || 0,
        lastScore: lastAudit?.overallScore || 0,
        averageScore: lastAudit?.overallScore || 0,
      },
      recommendations: {
        total: Number(recs.total) || 0,
        completed: Number(recs.completed) || 0,
        pending: Number(recs.pending) || 0,
        highPriority: Number(recs.highPriority) || 0,
        completionRate,
      },
      content: {
        total: Number(contentStats.total) || 0,
        published: Number(contentStats.published) || 0,
        draft: Number(contentStats.draft) || 0,
        thisWeek: thisWeekContentCount,
      },
      platforms: platformBreakdown.map((p) => {
        const currentCount = Number(p.mentions) || 0;
        const historicalCount = platformHistoricalMap.get(p.name) || 0;
        const platformChange = historicalCount > 0
          ? Math.round(((currentCount - historicalCount) / historicalCount) * 100)
          : currentCount > 0 ? 100 : 0;
        return {
          name: p.name,
          mentions: currentCount,
          sentiment: platformSentimentMap.get(p.name) ?? 0.5,
          change: platformChange,
        };
      }),
      recentActivity: recentActivityData.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        timestamp: a.timestamp.toISOString(),
        metadata: a.metadata,
      })),
      topRecommendations: topRecs.map((r) => {
        // Calculate impact based on priority
        const priorityImpact: Record<string, number> = {
          critical: 95,
          high: 80,
          medium: 60,
          low: 40,
        };
        return {
          id: r.id,
          title: r.title,
          priority: r.priority as "critical" | "high" | "medium" | "low",
          impact: priorityImpact[r.priority || "medium"] || 60,
          category: r.category,
        };
      }),
    };

    return NextResponse.json(dashboardMetrics);
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
