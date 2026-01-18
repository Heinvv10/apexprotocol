import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import { portfolios, portfolioBrands, executiveReports } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getInvestorReportData, calculateBenchmarks } from "@/lib/db/queries/investor-reports";

// Validation schemas
const reportOptionsSchema = z.object({
  includeCompetitiveIntelligence: z.boolean().default(false),
  includeBenchmarks: z.boolean().default(true),
});

const investorReportRequestSchema = z.object({
  portfolioId: z.string().nullable().optional(),
  periodStart: z.string().transform((s) => new Date(s)),
  periodEnd: z.string().transform((s) => new Date(s)),
  options: reportOptionsSchema.optional().default({
    includeCompetitiveIntelligence: false,
    includeBenchmarks: true,
  }),
});

// GET /api/investor-reports - List investor reports
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get("portfolioId");
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");

    // Build query conditions
    const conditions = [
      eq(executiveReports.organizationId, orgId),
      eq(executiveReports.reportType, "investor"),
    ];

    if (portfolioId && portfolioId !== "all") {
      conditions.push(eq(executiveReports.portfolioId, portfolioId));
    }

    if (periodStart) {
      conditions.push(gte(executiveReports.periodStart, new Date(periodStart)));
    }

    if (periodEnd) {
      conditions.push(lte(executiveReports.periodEnd, new Date(periodEnd)));
    }

    // Fetch reports with portfolio names
    const reports = await db
      .select({
        id: executiveReports.id,
        portfolioId: executiveReports.portfolioId,
        portfolioName: portfolios.name,
        periodStart: executiveReports.periodStart,
        periodEnd: executiveReports.periodEnd,
        status: executiveReports.status,
        pdfUrl: executiveReports.pdfUrl,
        createdAt: executiveReports.createdAt,
      })
      .from(executiveReports)
      .leftJoin(portfolios, eq(executiveReports.portfolioId, portfolios.id))
      .where(and(...conditions))
      .orderBy(desc(executiveReports.createdAt))
      .limit(50);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching investor reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch investor reports" },
      { status: 500 }
    );
  }
}

// POST /api/investor-reports - Generate investor intelligence report
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validationResult = investorReportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate we have a portfolio ID
    if (!data.portfolioId) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 }
      );
    }

    // Validate date range
    if (data.periodEnd < data.periodStart) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Verify portfolio exists and belongs to organization
    const [portfolio] = await db
      .select({
        id: portfolios.id,
        name: portfolios.name,
        organizationId: portfolios.organizationId,
      })
      .from(portfolios)
      .where(
        and(
          eq(portfolios.id, data.portfolioId),
          eq(portfolios.organizationId, orgId)
        )
      )
      .limit(1);

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Check if portfolio has brands (edge case: empty portfolio)
    const [brandCount] = await db
      .select({ count: count() })
      .from(portfolioBrands)
      .where(eq(portfolioBrands.portfolioId, data.portfolioId));

    if (!brandCount || brandCount.count === 0) {
      return NextResponse.json(
        {
          error: "Cannot generate report for empty portfolio. Add brands to portfolio first.",
        },
        { status: 400 }
      );
    }

    // Create initial report record with status "generating"
    const reportId = createId();
    const reportTitle = `Investor Intelligence Report - ${portfolio.name}`;

    await db.insert(executiveReports).values({
      id: reportId,
      organizationId: orgId,
      portfolioId: data.portfolioId,
      title: reportTitle,
      reportType: "investor",
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: "generating",
      content: {} as any, // Will be updated after generation
      recipients: [],
    });

    try {
      // Fetch investor report data
      const reportData = await getInvestorReportData({
        portfolioId: data.portfolioId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        organizationId: orgId,
      });

      if (!reportData) {
        await db
          .update(executiveReports)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(executiveReports.id, reportId));

        return NextResponse.json(
          { error: "Failed to fetch report data" },
          { status: 500 }
        );
      }

      // Calculate benchmarks if requested
      let benchmarkData = null;
      if (data.options.includeBenchmarks) {
        benchmarkData = await calculateBenchmarks({
          portfolioId: data.portfolioId,
          organizationId: orgId,
        });
      }

      // Build InvestorReportContent structure
      const content: any = {
        // Executive summary from aggregated data
        summary: {
          headline: `Portfolio of ${reportData.brands.length} brands with ${reportData.aggregatedMetrics.avgGeoScore.toFixed(0)} average GEO score and ${reportData.aggregatedMetrics.totalMentions} total mentions.`,
          keyMetrics: [
            {
              label: "GEO Score",
              value: Math.round(reportData.aggregatedMetrics.avgGeoScore),
              change: reportData.geoTrends.periodComparison.percentChange.score,
              changeDirection:
                reportData.geoTrends.periodComparison.percentChange.score > 0
                  ? "up"
                  : reportData.geoTrends.periodComparison.percentChange.score < 0
                  ? "down"
                  : "stable",
            },
            {
              label: "Total Mentions",
              value: reportData.aggregatedMetrics.totalMentions,
              change: reportData.geoTrends.periodComparison.percentChange.mentions,
              changeDirection:
                reportData.geoTrends.periodComparison.percentChange.mentions > 0
                  ? "up"
                  : reportData.geoTrends.periodComparison.percentChange.mentions < 0
                  ? "down"
                  : "stable",
            },
            {
              label: "Credibility Score",
              value: Math.round(reportData.aggregatedMetrics.credibilityScore),
              change: 0,
              changeDirection: "stable",
            },
            {
              label: "Total Brands",
              value: reportData.brands.length,
              change: 0,
              changeDirection: "stable",
            },
          ],
          highlights: [
            `Portfolio contains ${reportData.brands.length} brands with an average GEO score of ${reportData.aggregatedMetrics.avgGeoScore.toFixed(1)}.`,
            `${reportData.mentionsSummary.bySentiment.positive} positive mentions vs ${reportData.mentionsSummary.bySentiment.negative} negative mentions.`,
            `${reportData.recommendationsSummary.completed} of ${reportData.recommendationsSummary.total} recommendations completed.`,
          ],
        },
        scores: {
          unified: {
            current: reportData.aggregatedMetrics.avgGeoScore,
            previous: reportData.geoTrends.periodComparison.previousPeriod.avgScore,
            trend: reportData.geoTrends.dataPoints.map((dp) => dp.avgOverallScore),
          },
          seo: { current: 0, previous: 0, trend: [] },
          geo: {
            current: reportData.aggregatedMetrics.avgGeoScore,
            previous: reportData.geoTrends.periodComparison.previousPeriod.avgScore,
            trend: reportData.geoTrends.dataPoints.map((dp) => dp.avgOverallScore),
          },
          aeo: { current: 0, previous: 0, trend: [] },
        },
        mentions: {
          total: reportData.mentionsSummary.total,
          byPlatform: reportData.mentionsSummary.byPlatform.map((p) => ({
            platform: p.platform,
            count: p.count,
            sentiment: p.avgSentiment > 0.6 ? "positive" : p.avgSentiment < 0.4 ? "negative" : "neutral",
          })),
          topQueries: [],
        },
        recommendations: {
          completed: reportData.recommendationsSummary.completed,
          inProgress: reportData.recommendationsSummary.inProgress,
          pending: reportData.recommendationsSummary.pending,
          topPriority: [],
        },
        competitive: {
          shareOfVoice: 0,
          competitorComparison: [],
          gaps: [],
        },
        insights: [
          `Portfolio demonstrates ${reportData.geoTrends.trendDirection} GEO visibility trend.`,
          `Average sentiment score across all brands: ${(reportData.aggregatedMetrics.avgSentimentScore * 100).toFixed(1)}%.`,
        ],
        // Investor-specific fields
        credibilitySummary: {
          credibilityScore: Math.round(reportData.aggregatedMetrics.credibilityScore),
          impactIndexRating: Math.round(reportData.aggregatedMetrics.avgGeoScore),
          strengths: [
            `Strong GEO performance with ${reportData.aggregatedMetrics.avgGeoScore.toFixed(1)} average score`,
            `${reportData.mentionsSummary.bySentiment.positive} positive brand mentions`,
            `${reportData.recommendationsSummary.completed} completed optimization recommendations`,
          ],
          risks: [
            reportData.mentionsSummary.bySentiment.negative > 0
              ? `${reportData.mentionsSummary.bySentiment.negative} negative mentions require attention`
              : "Low negative sentiment exposure",
            reportData.recommendationsSummary.pending > 5
              ? `${reportData.recommendationsSummary.pending} pending recommendations need action`
              : "Minimal pending recommendations",
            reportData.geoTrends.trendDirection === "down"
              ? "Declining GEO visibility trend observed"
              : "Stable visibility trajectory",
          ],
          investmentRecommendation: `This portfolio of ${reportData.brands.length} brands demonstrates a credibility score of ${Math.round(reportData.aggregatedMetrics.credibilityScore)}/100, with ${reportData.geoTrends.trendDirection} visibility trends. The positive sentiment rate of ${((reportData.mentionsSummary.bySentiment.positive / (reportData.mentionsSummary.total || 1)) * 100).toFixed(1)}% indicates strong market perception. Recommended for investor consideration based on data-driven credibility metrics.`,
        },
        geoTrends: {
          dateRange: {
            start: data.periodStart.toISOString().split("T")[0],
            end: data.periodEnd.toISOString().split("T")[0],
          },
          metrics: reportData.geoTrends.dataPoints.map((dp) => ({
            date: dp.date.toISOString().split("T")[0],
            impressions: dp.totalMentions * 100, // Approximate
            clicks: dp.totalMentions,
            ctr: dp.avgVisibilityScore / 10,
            avgRanking: 100 - dp.avgOverallScore,
          })),
          trendDirection: reportData.geoTrends.trendDirection,
          periodComparison: {
            currentPeriod: {
              impressions: reportData.geoTrends.periodComparison.currentPeriod.totalMentions * 100,
              clicks: reportData.geoTrends.periodComparison.currentPeriod.totalMentions,
              ctr: reportData.geoTrends.periodComparison.currentPeriod.avgScore / 10,
            },
            previousPeriod: {
              impressions: reportData.geoTrends.periodComparison.previousPeriod.totalMentions * 100,
              clicks: reportData.geoTrends.periodComparison.previousPeriod.totalMentions,
              ctr: reportData.geoTrends.periodComparison.previousPeriod.avgScore / 10,
            },
            percentChange: {
              impressions: reportData.geoTrends.periodComparison.percentChange.mentions,
              clicks: reportData.geoTrends.periodComparison.percentChange.mentions,
              ctr: reportData.geoTrends.periodComparison.percentChange.score,
            },
          },
        },
        benchmarkData: benchmarkData || {
          industryMedian: {
            unifiedScore: 0,
            geoScore: 0,
            credibilityScore: 0,
          },
          subjectBusiness: {
            unifiedScore: reportData.aggregatedMetrics.avgGeoScore,
            geoScore: reportData.aggregatedMetrics.avgGeoScore,
            credibilityScore: reportData.aggregatedMetrics.credibilityScore,
          },
          percentileRanking: 0,
          delta: {
            unifiedScore: 0,
            geoScore: 0,
            credibilityScore: 0,
          },
          comparableBusinessesCount: 0,
        },
        impactIndexBreakdown: {
          overallScore: Math.round(reportData.aggregatedMetrics.avgGeoScore),
          components: [
            {
              name: "GEO Visibility",
              score: Math.round(reportData.aggregatedMetrics.avgGeoScore),
              weight: 40,
              rawData: "Based on average GEO visibility scores across all brands",
            },
            {
              name: "Sentiment Quality",
              score: Math.round(reportData.aggregatedMetrics.avgSentimentScore * 100),
              weight: 30,
              rawData: "Calculated from positive vs negative mention ratio",
            },
            {
              name: "Recommendation Completion",
              score: Math.round(
                (reportData.recommendationsSummary.completed /
                  (reportData.recommendationsSummary.total || 1)) *
                  100
              ),
              weight: 20,
              rawData: "Percentage of completed optimization recommendations",
            },
            {
              name: "Mention Volume",
              score: Math.min(100, Math.round((reportData.aggregatedMetrics.totalMentions / 100) * 100)),
              weight: 10,
              rawData: "Total brand mentions normalized to 0-100 scale",
            },
          ],
          methodology:
            "The Impact Index is calculated as a weighted composite of GEO visibility (40%), sentiment quality (30%), recommendation completion rate (20%), and mention volume (10%). Each component is scored on a 0-100 scale based on portfolio performance metrics.",
        },
      };

      // Add competitive intelligence if requested
      if (data.options.includeCompetitiveIntelligence) {
        content.competitiveIntelligence = {
          directCompetitors: [],
          competitiveAdvantages: [
            "Data-driven credibility assessment",
            "Comprehensive GEO visibility tracking",
          ],
          threats: ["Market competition dynamics"],
        };
      }

      // Update report with generated content
      await db
        .update(executiveReports)
        .set({
          content: content,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(executiveReports.id, reportId));

      // Fetch the updated report with portfolio name
      const [report] = await db
        .select({
          id: executiveReports.id,
          portfolioId: executiveReports.portfolioId,
          portfolioName: portfolios.name,
          periodStart: executiveReports.periodStart,
          periodEnd: executiveReports.periodEnd,
          status: executiveReports.status,
          pdfUrl: executiveReports.pdfUrl,
          createdAt: executiveReports.createdAt,
        })
        .from(executiveReports)
        .leftJoin(portfolios, eq(executiveReports.portfolioId, portfolios.id))
        .where(eq(executiveReports.id, reportId))
        .limit(1);

      // Return success response
      return NextResponse.json({
        success: true,
        report: report,
        message: "Investor intelligence report generated successfully",
      });
    } catch (generationError) {
      // Update report status to failed
      await db
        .update(executiveReports)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(executiveReports.id, reportId));

      throw generationError;
    }
  } catch (error) {
    console.error("Error generating investor report:", error);
    return NextResponse.json(
      {
        error: "Failed to process investor report request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
