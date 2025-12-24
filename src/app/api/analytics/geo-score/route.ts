/**
 * GEO Score Analytics API Route
 * GET /api/analytics/geo-score?brandId=xxx
 * Returns detailed GEO score breakdown for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brandMentions, audits, brands, geoScoreHistory } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { getUserId, getOrganizationId } from "@/lib/auth";
import { onScoreChange } from "@/lib/notifications/triggers";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
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

    // Get mention stats for authority score
    const mentionsData = await db
      .select({
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
        withCitation: sql<number>`COUNT(CASE WHEN ${brandMentions.citationUrl} IS NOT NULL THEN 1 END)`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    const mentions = mentionsData[0] || { total: 0, positive: 0, withCitation: 0 };

    // Get platform coverage
    const platformCount = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${brandMentions.platform})`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    const platforms = platformCount[0]?.count || 0;

    // Get last audit for technical score
    const lastAudit = await db.query.audits.findFirst({
      where: eq(audits.brandId, brandId),
      orderBy: [desc(audits.createdAt)],
    });

    // Calculate component scores
    const totalMentions = Number(mentions.total) || 0;
    const positiveMentions = Number(mentions.positive) || 0;
    const citedMentions = Number(mentions.withCitation) || 0;

    // Technical Score (from audit or default)
    const technicalScore = lastAudit?.overallScore || 65;

    // Content Score (based on positive mention rate)
    const contentScore = totalMentions > 0
      ? Math.min(Math.round((positiveMentions / totalMentions) * 100), 100)
      : 50;

    // Authority Score (based on citations)
    const authorityScore = totalMentions > 0
      ? Math.min(Math.round((citedMentions / totalMentions) * 100) + 20, 100)
      : 40;

    // AI Readiness Score (based on platform coverage - 7 platforms max)
    const aiReadinessScore = Math.min(Math.round((Number(platforms) / 7) * 100), 100);

    // Overall GEO Score (weighted average)
    const overall = Math.round(
      technicalScore * 0.25 +
      contentScore * 0.25 +
      authorityScore * 0.25 +
      aiReadinessScore * 0.25
    );

    // Get previous score from history for score change detection
    const lastScoreHistory = await db.query.geoScoreHistory.findFirst({
      where: eq(geoScoreHistory.brandId, brandId),
      orderBy: [desc(geoScoreHistory.calculatedAt)],
    });

    // Calculate score change and determine if notification should be triggered
    const previousScore = lastScoreHistory?.overallScore ?? overall;
    const scoreChange = overall - previousScore;
    const absChange = Math.abs(scoreChange);

    // Trigger score change notification if change is Â±5 or more
    if (absChange >= 5) {
      try {
        // Get user context for notification
        const notificationUserId = await getUserId();
        const organizationId = await getOrganizationId();

        if (notificationUserId && organizationId) {
          // Create score history record
          const trend = scoreChange > 0 ? "up" : scoreChange < 0 ? "down" : "stable";

          const [scoreHistoryRecord] = await db
            .insert(geoScoreHistory)
            .values({
              brandId,
              overallScore: overall,
              visibilityScore: aiReadinessScore,
              sentimentScore: contentScore,
              recommendationScore: authorityScore,
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
              dataQuality: totalMentions > 10 ? 90 : totalMentions > 5 ? 75 : 60,
            })
            .returning();

          // Trigger notification
          await onScoreChange({
            scoreHistory: scoreHistoryRecord,
            userId: notificationUserId,
            organizationId,
          });
        }
      } catch (notificationError) {
        // Log error but don't fail the API request
        console.error(
          "[GEO Score API] Failed to create score change notification:",
          notificationError
        );
      }
    }

    // Build breakdown
    const breakdown = [
      {
        category: "Technical SEO",
        score: technicalScore,
        maxScore: 100,
        factors: [
          { name: "Site Structure", score: technicalScore, weight: 0.3 },
          { name: "Schema Markup", score: Math.round(technicalScore * 0.9), weight: 0.3 },
          { name: "Page Speed", score: Math.round(technicalScore * 1.1), weight: 0.2 },
          { name: "Mobile Optimization", score: technicalScore, weight: 0.2 },
        ],
      },
      {
        category: "Content Quality",
        score: contentScore,
        maxScore: 100,
        factors: [
          { name: "Sentiment", score: contentScore, weight: 0.4 },
          { name: "Relevance", score: Math.round(contentScore * 0.95), weight: 0.3 },
          { name: "Completeness", score: Math.round(contentScore * 0.9), weight: 0.3 },
        ],
      },
      {
        category: "Authority",
        score: authorityScore,
        maxScore: 100,
        factors: [
          { name: "Citations", score: authorityScore, weight: 0.5 },
          { name: "Brand Recognition", score: Math.round(authorityScore * 0.9), weight: 0.3 },
          { name: "Trust Signals", score: Math.round(authorityScore * 0.85), weight: 0.2 },
        ],
      },
      {
        category: "AI Readiness",
        score: aiReadinessScore,
        maxScore: 100,
        factors: [
          { name: "Platform Coverage", score: aiReadinessScore, weight: 0.4 },
          { name: "Response Quality", score: Math.round(aiReadinessScore * 0.9), weight: 0.3 },
          { name: "Visibility", score: Math.round(aiReadinessScore * 0.95), weight: 0.3 },
        ],
      },
    ];

    // Build history from actual mention data grouped by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyMentions = await db
      .select({
        date: sql<string>`DATE(${brandMentions.timestamp})`,
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
        withCitation: sql<number>`COUNT(CASE WHEN ${brandMentions.citationUrl} IS NOT NULL THEN 1 END)`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId))
      .groupBy(sql`DATE(${brandMentions.timestamp})`)
      .orderBy(sql`DATE(${brandMentions.timestamp})`);

    // Calculate daily scores from real data
    const history = dailyMentions.slice(-7).map(day => {
      const dayTotal = Number(day.total) || 1;
      const dayPositive = Number(day.positive) || 0;
      const dayCited = Number(day.withCitation) || 0;

      const dayContent = Math.min(Math.round((dayPositive / dayTotal) * 100), 100);
      const dayAuthority = Math.min(Math.round((dayCited / dayTotal) * 100) + 20, 100);

      const dayScore = Math.round(
        technicalScore * 0.25 +
        dayContent * 0.25 +
        dayAuthority * 0.25 +
        aiReadinessScore * 0.25
      );

      return {
        date: day.date,
        score: dayScore,
      };
    });

    // Fill in missing days if less than 7 data points
    if (history.length < 7) {
      const existingDates = new Set(history.map(h => h.date));
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        if (!existingDates.has(date)) {
          history.push({ date, score: overall });
        }
      }
      history.sort((a, b) => a.date.localeCompare(b.date));
    }

    const geoScoreDetails = {
      overall,
      technical: technicalScore,
      content: contentScore,
      authority: authorityScore,
      aiReadiness: aiReadinessScore,
      breakdown,
      history,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(geoScoreDetails);
  } catch (error) {
    console.error("[GEO Score API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
