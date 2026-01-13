/**
 * Dashboard Analytics API Route
 * GET /api/analytics/dashboard?brandId=xxx
 * Returns aggregated dashboard metrics for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandMentions, recommendations, audits, content, brands } from "@/lib/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";

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

    // Calculate GEO score based on mention sentiment and coverage
    const totalMentions = Number(mentions.total) || 0;
    const positiveMentions = Number(mentions.positive) || 0;
    const sentimentScore = totalMentions > 0 ? Math.round((positiveMentions / totalMentions) * 50) : 0;
    const coverageScore = Math.min(platformBreakdown.length * 10, 50);
    const geoScore = sentimentScore + coverageScore;

    // Build response
    const dashboardMetrics = {
      geoScore: {
        current: geoScore,
        change: 5, // Placeholder - would need historical data
        trend: "up" as const,
        history: [], // Would need time-series data
      },
      mentions: {
        total: Number(mentions.total) || 0,
        positive: Number(mentions.positive) || 0,
        neutral: Number(mentions.neutral) || 0,
        negative: Number(mentions.negative) || 0,
        change: 0,
        trend: "stable" as const,
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
        thisWeek: 0, // Would need date filtering
      },
      platforms: platformBreakdown.map((p) => ({
        name: p.name,
        mentions: Number(p.mentions) || 0,
        sentiment: 0.7, // Placeholder
        change: 0,
      })),
      recentActivity: [], // Would need activity tracking
      topRecommendations: topRecs.map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority as "critical" | "high" | "medium" | "low",
        impact: 80, // Placeholder
        category: r.category,
      })),
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
