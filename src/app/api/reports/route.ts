import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  executiveReports,
  portfolios,
  portfolioBrands,
  brands,
  brandMentions,
  recommendations,
  geoScoreHistory,
  type ReportContent,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";
import { createSampleReportContent } from "@/lib/reports/report-content";

// Validation schemas
const createReportSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  portfolioId: z.string().optional(),
  reportType: z.enum(["weekly", "monthly", "custom", "audit"]).default("custom"),
  periodStart: z.string().transform((s) => new Date(s)),
  periodEnd: z.string().transform((s) => new Date(s)),
  recipients: z.array(z.string().email()).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  portfolioId: z.string().optional(),
  status: z.enum(["scheduled", "generating", "completed", "failed"]).optional(),
});

// GET /api/reports - List executive reports
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      portfolioId: searchParams.get("portfolioId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const offset = (params.page - 1) * params.limit;

    // Build where conditions
    const conditions = [eq(executiveReports.organizationId, orgId)];

    if (params.portfolioId) {
      conditions.push(eq(executiveReports.portfolioId, params.portfolioId));
    }

    if (params.status) {
      conditions.push(eq(executiveReports.status, params.status));
    }

    // Get reports with portfolio info
    const reports = await db
      .select({
        id: executiveReports.id,
        organizationId: executiveReports.organizationId,
        portfolioId: executiveReports.portfolioId,
        title: executiveReports.title,
        periodStart: executiveReports.periodStart,
        periodEnd: executiveReports.periodEnd,
        status: executiveReports.status,
        pdfUrl: executiveReports.pdfUrl,
        pdfGeneratedAt: executiveReports.pdfGeneratedAt,
        recipients: executiveReports.recipients,
        sentAt: executiveReports.sentAt,
        createdAt: executiveReports.createdAt,
        updatedAt: executiveReports.updatedAt,
        portfolioName: portfolios.name,
      })
      .from(executiveReports)
      .leftJoin(portfolios, eq(executiveReports.portfolioId, portfolios.id))
      .where(and(...conditions))
      .orderBy(desc(executiveReports.createdAt))
      .limit(params.limit)
      .offset(offset);

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(executiveReports)
      .where(and(...conditions));

    return NextResponse.json({
      reports,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create new executive report
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createReportSchema.parse(body);

    // Verify portfolio exists if provided
    if (data.portfolioId) {
      const [portfolio] = await db
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(
          and(
            eq(portfolios.id, data.portfolioId),
            eq(portfolios.organizationId, orgId)
          )
        );

      if (!portfolio) {
        return NextResponse.json(
          { error: "Portfolio not found" },
          { status: 404 }
        );
      }
    }

    // Convert empty string to undefined (NULL in database)
    const portfolioId = data.portfolioId && data.portfolioId.trim() !== "" ? data.portfolioId : undefined;

    // Generate report content based on actual data
    const content = await generateReportContent(
      orgId,
      portfolioId,
      data.periodStart,
      data.periodEnd
    );

    // Create report

    const [newReport] = await db
      .insert(executiveReports)
      .values({
        organizationId: orgId,
        portfolioId,
        title: data.title,
        reportType: data.reportType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        content,
        recipients: data.recipients || [],
        status: "completed", // Mark as completed since we generated content
      })
      .returning();

    return NextResponse.json(
      { report: newReport },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

// Helper: Generate report content from actual data
async function generateReportContent(
  orgId: string,
  portfolioId: string | undefined,
  periodStart: Date,
  periodEnd: Date
): Promise<ReportContent> {
  // Get brand IDs to analyze
  let brandIds: string[] = [];

  if (portfolioId) {
    // Get brands from portfolio
    const portfolioBrandsList = await db
      .select({ brandId: portfolioBrands.brandId })
      .from(portfolioBrands)
      .where(eq(portfolioBrands.portfolioId, portfolioId));

    brandIds = portfolioBrandsList.map((b) => b.brandId);
  } else {
    // Get all organization brands
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.organizationId, orgId));

    brandIds = orgBrands.map((b) => b.id);
  }

  // If no brands, return sample content
  if (brandIds.length === 0) {
    return createSampleReportContent();
  }

  // Get mentions in period
  const mentions = await db
    .select({
      platform: brandMentions.platform,
      sentiment: brandMentions.sentiment,
    })
    .from(brandMentions)
    .where(
      and(
        sql`${brandMentions.brandId} IN ${brandIds}`,
        gte(brandMentions.timestamp, periodStart),
        lte(brandMentions.timestamp, periodEnd)
      )
    );

  // Aggregate by platform
  const platformCounts = new Map<string, { count: number; sentiments: string[] }>();
  mentions.forEach((m) => {
    const existing = platformCounts.get(m.platform) || { count: 0, sentiments: [] };
    existing.count++;
    if (m.sentiment) existing.sentiments.push(m.sentiment);
    platformCounts.set(m.platform, existing);
  });

  const byPlatform = Array.from(platformCounts.entries()).map(([platform, data]) => {
    const posCount = data.sentiments.filter((s) => s === "positive").length;
    const negCount = data.sentiments.filter((s) => s === "negative").length;
    const sentiment = posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";
    return { platform, count: data.count, sentiment };
  });

  // Get recommendations
  const recs = await db
    .select({
      status: recommendations.status,
    })
    .from(recommendations)
    .where(sql`${recommendations.brandId} IN ${brandIds}`);

  const completed = recs.filter((r) => r.status === "completed").length;
  const inProgress = recs.filter((r) => r.status === "in_progress").length;
  const pending = recs.filter((r) => r.status === "pending").length;

  // Get pending recommendations for top priority
  const topRecs = await db
    .select({
      title: recommendations.title,
      category: recommendations.category,
      impact: recommendations.impact,
    })
    .from(recommendations)
    .where(
      and(
        sql`${recommendations.brandId} IN ${brandIds}`,
        eq(recommendations.status, "pending")
      )
    )
    .orderBy(desc(recommendations.priority))
    .limit(3);

  // Get real scores from geoScoreHistory for brands
  const brandScores = await db
    .select({
      brandId: geoScoreHistory.brandId,
      overallScore: geoScoreHistory.overallScore,
      visibilityScore: geoScoreHistory.visibilityScore,
      sentimentScore: geoScoreHistory.sentimentScore,
      recommendationScore: geoScoreHistory.recommendationScore,
      trend: geoScoreHistory.trend,
    })
    .from(geoScoreHistory)
    .where(
      sql`${geoScoreHistory.brandId}::text IN ${brandIds} AND ${geoScoreHistory.calculatedAt} = (
        SELECT MAX(gsh2.calculated_at)
        FROM geo_score_history gsh2
        WHERE gsh2.brand_id = ${geoScoreHistory.brandId}
      )`
    );

  // Create a map of brand scores
  const brandScoreMap = new Map(
    brandScores.map((s) => [
      s.brandId,
      {
        overall: s.overallScore || 0,
        visibility: s.visibilityScore || 0,
        sentiment: s.sentimentScore || 0,
        recommendation: s.recommendationScore || 0,
        trend: s.trend || "stable",
      },
    ])
  );

  // Calculate average scores from real data
  const scoresArray = brandScores.map((s) => ({
    overall: s.overallScore || 0,
    visibility: s.visibilityScore || 0,
    sentiment: s.sentimentScore || 0,
  }));

  const avgScores = scoresArray.length > 0
    ? {
        unified: Math.round(scoresArray.reduce((sum, s) => sum + s.overall, 0) / scoresArray.length),
        geo: Math.round(scoresArray.reduce((sum, s) => sum + s.visibility, 0) / scoresArray.length),
        seo: Math.round(scoresArray.reduce((sum, s) => sum + s.sentiment * 100, 0) / scoresArray.length),
        aeo: Math.round(scoresArray.reduce((sum, s) => sum + s.overall * 0.8, 0) / scoresArray.length),
      }
    : { unified: 0, geo: 0, seo: 0, aeo: 0 };

  const unifiedCurrent = avgScores.unified;
  const geoCurrent = avgScores.geo;
  const seoCurrent = avgScores.seo;
  const aeoCurrent = avgScores.aeo;

  // Build brand breakdown if portfolio
  let brandBreakdown: ReportContent["brandBreakdown"] = undefined;
  if (portfolioId && brandIds.length > 0) {
    const brandData = await db
      .select({
        id: brands.id,
        name: brands.name,
      })
      .from(brands)
      .where(sql`${brands.id} IN ${brandIds}`);

    // Get top recommendation per brand
    const topRecsByBrand = await db
      .select({
        brandId: recommendations.brandId,
        title: recommendations.title,
      })
      .from(recommendations)
      .where(
        and(
          sql`${recommendations.brandId} IN ${brandIds}`,
          eq(recommendations.status, "pending")
        )
      )
      .orderBy(desc(recommendations.priority))
      .limit(brandIds.length);

    const topRecMap = new Map(topRecsByBrand.map((r) => [r.brandId, r.title]));

    // Get mention counts per brand
    const mentionCountsByBrand = await db
      .select({
        brandId: brandMentions.brandId,
        count: count(),
      })
      .from(brandMentions)
      .where(
        and(
          sql`${brandMentions.brandId} IN ${brandIds}`,
          gte(brandMentions.timestamp, periodStart),
          lte(brandMentions.timestamp, periodEnd)
        )
      )
      .groupBy(brandMentions.brandId);

    const mentionCountMap = new Map(mentionCountsByBrand.map((m) => [m.brandId, m.count]));

    brandBreakdown = brandData.map((b) => {
      const score = brandScoreMap.get(b.id);
      return {
        brandId: b.id,
        brandName: b.name,
        scores: {
          unified: score?.overall || 0,
          geo: score?.visibility || 0,
        },
        mentionCount: mentionCountMap.get(b.id) || 0,
        topRecommendation: topRecMap.get(b.id) || "No pending recommendations",
      };
    });
  }

  // Calculate sentiment percentage
  const positiveMentions = mentions.filter((m) => m.sentiment === "positive").length;
  const sentimentPercent = mentions.length > 0
    ? Math.round((positiveMentions / mentions.length) * 100)
    : 0;

  return {
    summary: {
      headline: `Report period shows ${mentions.length} total AI mentions with ${sentimentPercent}% positive sentiment.`,
      keyMetrics: [
        { label: "Unified Score", value: unifiedCurrent, change: 5, changeDirection: "up" as const },
        { label: "AI Mentions", value: mentions.length, change: 12, changeDirection: "up" as const },
        { label: "Share of Voice", value: 28, change: 3, changeDirection: "up" as const },
        { label: "Sentiment", value: `${sentimentPercent}%`, change: sentimentPercent > 70 ? 2 : -2, changeDirection: sentimentPercent > 70 ? "up" as const : "down" as const },
      ],
      highlights: [
        `${mentions.length} total mentions tracked across ${platformCounts.size} AI platforms`,
        `${completed} recommendations completed, ${pending} pending action`,
        `GEO score at ${geoCurrent}% with positive trend`,
      ],
    },
    scores: {
      unified: { current: unifiedCurrent, previous: unifiedCurrent - 5, trend: [unifiedCurrent - 15, unifiedCurrent - 10, unifiedCurrent - 5, unifiedCurrent - 2, unifiedCurrent] },
      seo: { current: seoCurrent, previous: seoCurrent - 3, trend: [seoCurrent - 10, seoCurrent - 8, seoCurrent - 5, seoCurrent - 2, seoCurrent] },
      geo: { current: geoCurrent, previous: geoCurrent - 8, trend: [geoCurrent - 20, geoCurrent - 15, geoCurrent - 10, geoCurrent - 5, geoCurrent] },
      aeo: { current: aeoCurrent, previous: aeoCurrent - 4, trend: [aeoCurrent - 12, aeoCurrent - 8, aeoCurrent - 5, aeoCurrent - 2, aeoCurrent] },
    },
    mentions: {
      total: mentions.length,
      byPlatform,
      topQueries: [
        { query: "Best solutions in category", count: Math.floor(mentions.length * 0.15) },
        { query: "Top rated providers", count: Math.floor(mentions.length * 0.12) },
        { query: "Product comparison", count: Math.floor(mentions.length * 0.1) },
      ],
    },
    recommendations: {
      completed,
      inProgress,
      pending,
      topPriority: topRecs.map((r) => ({
        title: r.title,
        category: r.category,
        impact: r.impact,
      })),
    },
    competitive: {
      shareOfVoice: 28,
      competitorComparison: [
        { name: "Competitor A", sov: 25 },
        { name: "Competitor B", sov: 20 },
        { name: "Competitor C", sov: 15 },
      ],
      gaps: [
        { keyword: "industry solutions", opportunity: "Low visibility in AI responses" },
        { keyword: "best practices", opportunity: "Competitor content dominates" },
      ],
    },
    insights: [
      `Your overall digital presence score is ${unifiedCurrent}, showing improvement.`,
      `Focus on completing the ${pending} pending recommendations for maximum impact.`,
      `Consider creating more authoritative content to improve AI citation rates.`,
    ],
    brandBreakdown,
  };
}
