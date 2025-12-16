import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brandMentions, audits, recommendations } from "@/lib/db/schema";
import { eq, and, count, sql, desc, gte } from "drizzle-orm";
import {
  calculateUnifiedScore,
  calculateGEOScore,
  createDefaultSEOInput,
  createDefaultAEOInput,
  type GEOScoreInput,
  type UnifiedScoreResult,
} from "@/lib/scoring";

export interface UnifiedScoreResponse {
  score: UnifiedScoreResult;
  history: {
    date: string;
    label: string;
    unified: number;
    seo: number;
    geo: number;
    aeo: number;
  }[];
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Get time boundaries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch mentions data for GEO score
    const mentionsData = await db
      .select({
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)`,
        neutral: sql<number>`COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END)`,
        negative: sql<number>`COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)`,
        cited: sql<number>`COUNT(CASE WHEN citation_url IS NOT NULL THEN 1 END)`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    // Get unique platforms
    const platformsData = await db
      .selectDistinct({ platform: brandMentions.platform })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    const uniquePlatforms = platformsData.map((p) => p.platform);

    // Build GEO score input
    const geoInput: GEOScoreInput = {
      totalMentions: Number(mentionsData[0]?.total || 0),
      positiveMentions: Number(mentionsData[0]?.positive || 0),
      neutralMentions: Number(mentionsData[0]?.neutral || 0),
      negativeMentions: Number(mentionsData[0]?.negative || 0),
      citationCount: Number(mentionsData[0]?.cited || 0),
      platformCount: uniquePlatforms.length,
      uniquePlatforms,
    };

    // Get latest audit for SEO data
    const latestAudit = await db
      .select()
      .from(audits)
      .where(
        and(eq(audits.brandId, brandId), eq(audits.status, "completed"))
      )
      .orderBy(desc(audits.completedAt))
      .limit(1);

    // Build SEO score input from audit data (or use defaults)
    let seoInput = createDefaultSEOInput();
    if (latestAudit.length > 0) {
      const audit = latestAudit[0];
      const categoryScores = audit.categoryScores || [];

      // Map audit category scores to SEO input
      const technicalScore =
        categoryScores.find((c) => c.category === "technical")?.score || 70;
      const contentScore =
        categoryScores.find((c) => c.category === "content")?.score || 60;
      const onPageScore =
        categoryScores.find((c) => c.category === "on_page")?.score || 65;

      // Adjust default input based on audit scores
      seoInput = {
        ...seoInput,
        pageSpeedScore: Math.round(technicalScore * 1.1), // Approximate
        hasStructuredData:
          (categoryScores.find((c) => c.category === "schema")?.score || 0) > 50,
        averageContentLength: contentScore > 70 ? 1500 : contentScore > 50 ? 1000 : 500,
        imageAltCoverage: onPageScore > 70 ? 90 : onPageScore > 50 ? 70 : 50,
      };
    }

    // Build AEO score input
    // For now, use defaults with adjustments based on available data
    let aeoInput = createDefaultAEOInput();
    if (latestAudit.length > 0) {
      const audit = latestAudit[0];
      const hasSchema = audit.metadata?.pageInfo?.h1Count ? audit.metadata.pageInfo.h1Count > 0 : false;
      aeoInput = {
        ...aeoInput,
        hasFAQSchema: hasSchema,
        hasArticleSchema: hasSchema,
      };
    }

    // Calculate unified score
    const score = calculateUnifiedScore({
      seo: seoInput,
      geo: geoInput,
      aeo: aeoInput,
    });

    // Generate history data (simplified - in production, this would come from stored snapshots)
    const history = generateScoreHistory(score, 30);

    const response: UnifiedScoreResponse = {
      score,
      history,
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error calculating unified score:", error);
    return NextResponse.json(
      { error: "Failed to calculate unified score" },
      { status: 500 }
    );
  }
}

/**
 * Generate mock history data based on current score
 * In production, this would be actual stored historical data
 */
function generateScoreHistory(
  currentScore: UnifiedScoreResult,
  days: number
): UnifiedScoreResponse["history"] {
  const history: UnifiedScoreResponse["history"] = [];
  const now = new Date();

  // Generate data points with slight variations
  for (let i = days; i >= 0; i -= 5) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Add some variation to simulate historical changes
    const variation = Math.sin(i / 10) * 5 + (Math.random() - 0.5) * 3;
    const unified = Math.max(
      0,
      Math.min(100, Math.round(currentScore.overall - variation * 0.5 - i * 0.1))
    );
    const seo = Math.max(
      0,
      Math.min(100, Math.round(currentScore.components.seo.score - variation * 0.3 - i * 0.05))
    );
    const geo = Math.max(
      0,
      Math.min(100, Math.round(currentScore.components.geo.score - variation * 0.4 - i * 0.15))
    );
    const aeo = Math.max(
      0,
      Math.min(100, Math.round(currentScore.components.aeo.score - variation * 0.2 - i * 0.08))
    );

    history.push({
      date: date.toISOString(),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      unified,
      seo,
      geo,
      aeo,
    });
  }

  return history;
}
