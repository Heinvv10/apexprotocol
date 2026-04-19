import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
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
    const userId = await getUserId();
    const orgId = await getOrganizationId();
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

    // Generate history from actual mention data grouped by week
    const history = await generateScoreHistoryFromData(brandId, score, seoInput, aeoInput);

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
 * Generate history data from actual database records
 */
async function generateScoreHistoryFromData(
  brandId: string,
  currentScore: UnifiedScoreResult,
  seoInput: ReturnType<typeof createDefaultSEOInput>,
  aeoInput: ReturnType<typeof createDefaultAEOInput>
): Promise<UnifiedScoreResponse["history"]> {
  const history: UnifiedScoreResponse["history"] = [];

  // Get weekly mention aggregates for past 30 days
  const weeklyMentions = await db
    .select({
      weekStart: sql<string>`DATE_TRUNC('week', ${brandMentions.timestamp})::date`,
      total: count(),
      positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
      neutral: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'neutral' THEN 1 END)`,
      negative: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'negative' THEN 1 END)`,
      cited: sql<number>`COUNT(CASE WHEN ${brandMentions.citationUrl} IS NOT NULL THEN 1 END)`,
      platforms: sql<number>`COUNT(DISTINCT ${brandMentions.platform})`,
    })
    .from(brandMentions)
    .where(eq(brandMentions.brandId, brandId))
    .groupBy(sql`DATE_TRUNC('week', ${brandMentions.timestamp})`)
    .orderBy(sql`DATE_TRUNC('week', ${brandMentions.timestamp})`);

  // Calculate scores for each week from real data
  for (const week of weeklyMentions.slice(-7)) {
    const weekGeoInput: GEOScoreInput = {
      totalMentions: Number(week.total) || 0,
      positiveMentions: Number(week.positive) || 0,
      neutralMentions: Number(week.neutral) || 0,
      negativeMentions: Number(week.negative) || 0,
      citationCount: Number(week.cited) || 0,
      platformCount: Number(week.platforms) || 0,
      uniquePlatforms: [],
    };

    const weekScore = calculateUnifiedScore({
      seo: seoInput,
      geo: weekGeoInput,
      aeo: aeoInput,
    });

    const date = new Date(week.weekStart);
    history.push({
      date: date.toISOString(),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      unified: weekScore.overall,
      seo: weekScore.components.seo.score,
      geo: weekScore.components.geo.score,
      aeo: weekScore.components.aeo.score,
    });
  }

  // If less than 7 data points, add current score for missing weeks
  if (history.length < 7) {
    const now = new Date();
    for (let i = 6; i >= 0 && history.length < 7; i--) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const exists = history.some(h => h.date.split("T")[0] === dateStr);
      if (!exists) {
        history.push({
          date: date.toISOString(),
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          unified: currentScore.overall,
          seo: currentScore.components.seo.score,
          geo: currentScore.components.geo.score,
          aeo: currentScore.components.aeo.score,
        });
      }
    }
    history.sort((a, b) => a.date.localeCompare(b.date));
  }

  return history;
}
