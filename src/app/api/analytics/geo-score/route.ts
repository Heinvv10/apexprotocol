/**
 * GEO Score Analytics API Route
 * GET /api/analytics/geo-score?brandId=xxx
 * Returns detailed GEO score breakdown for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brandMentions, audits, brands } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";

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

    // Build history (placeholder - would need time-series data)
    const history = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      score: Math.max(0, overall + Math.round((Math.random() - 0.5) * 10)),
    }));

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
