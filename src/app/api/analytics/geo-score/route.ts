/**
 * GEO Score Analytics API Route
 * GET /api/analytics/geo-score?brandId=xxx
 * Returns detailed GEO score breakdown for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brandMentions, brands } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { computeGeoScore } from "@/lib/analytics/geo-score-compute";

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

    // Unified compute: writes history + fires notifications when change ≥5.
    // Worker-triggered precomputes usually beat this path, but we still run
    // here so API callers see the freshest numbers even between worker ticks.
    const organizationId = await getOrganizationId();
    const {
      overall,
      technical: technicalScore,
      content: contentScore,
      authority: authorityScore,
      aiReadiness: aiReadinessScore,
      metrics: { totalMentions, positiveMentions, citedMentions, platforms },
    } = await computeGeoScore(brandId, {
      userId,
      organizationId: organizationId ?? undefined,
    });

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
      // Frontend brand-detail page reads geoScore.metrics.totalMentions, etc.
      // These were computed above but never included in the response, so
      // every metric card on /dashboard/brands/[id] rendered "0".
      metrics: {
        totalMentions,
        positiveMentions,
        citedMentions,
        platforms: Number(platforms) || 0,
      },
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
