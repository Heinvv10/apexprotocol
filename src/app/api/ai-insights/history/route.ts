/**
 * AI Insights History API
 * GET /api/ai-insights/history - Retrieve user's past AI platform analyses
 *
 * Returns historical platform queries with their insights, allowing users to
 * review past analyses and track brand visibility trends over time.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { parseHistoryQueryParams } from "@/lib/ai/validation";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

/**
 * GET /api/ai-insights/history
 * Retrieve user's past AI platform analyses with pagination
 *
 * Query parameters:
 * - brandId (optional): Filter by specific brand
 * - limit (optional): Number of records to return (default: 10, max: 100)
 * - offset (optional): Number of records to skip (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Database is required
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const { brandId, limit, offset } = parseHistoryQueryParams(searchParams);

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const {
      platformQueries,
      platformInsights,
      citationRecords,
      brands,
    } = await import("@/lib/db/schema");
    const { eq, and, desc, count } = await import("drizzle-orm");

    // Build where clause - filter by userId and optionally brandId
    const whereConditions = [eq(platformQueries.userId, userId)];
    if (brandId) {
      // Verify brand exists and user has access
      const brand = await db
        .select()
        .from(brands)
        .where(eq(brands.id, brandId))
        .limit(1);

      if (brand.length === 0) {
        return NextResponse.json(
          { success: false, error: "Brand not found" },
          { status: 404 }
        );
      }

      whereConditions.push(eq(platformQueries.brandId, brandId));
    }

    const whereClause =
      whereConditions.length > 1
        ? and(...whereConditions)
        : whereConditions[0];

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: count() })
      .from(platformQueries)
      .where(whereClause);

    const total = totalCountResult[0]?.count ?? 0;

    // Fetch queries with related insights and brand info
    const queries = await db.query.platformQueries.findMany({
      where: whereClause,
      orderBy: [desc(platformQueries.createdAt)],
      limit,
      offset,
      with: {
        brand: {
          columns: {
            id: true,
            name: true,
            domain: true,
            logoUrl: true,
          },
        },
        insights: {
          orderBy: [desc(platformInsights.createdAt)],
          with: {
            citations: {
              orderBy: [citationRecords.position],
              limit: 5, // Limit citations per insight for performance
            },
          },
        },
      },
    });

    // Transform data for response
    const history = queries.map((query) => {
      // Calculate summary statistics from insights
      const insights = query.insights || [];
      const avgVisibilityScore =
        insights.length > 0
          ? Math.round(
              insights.reduce(
                (sum, insight) => sum + (insight.visibilityScore || 0),
                0
              ) / insights.length
            )
          : 0;

      const totalCitations = insights.reduce(
        (sum, insight) => sum + (insight.citationCount || 0),
        0
      );

      const totalMentions = insights.reduce(
        (sum, insight) => sum + (insight.mentionCount || 0),
        0
      );

      // Platform breakdown
      const platformBreakdown = insights.map((insight) => ({
        platform: insight.platform,
        visibilityScore: insight.visibilityScore,
        citationCount: insight.citationCount,
        mentionCount: insight.mentionCount,
        prominenceScore: insight.prominenceScore,
        topCitations: (insight.citations || []).slice(0, 3).map((citation) => ({
          type: citation.citationType,
          text: citation.citationText,
          sourceUrl: citation.sourceUrl,
          sourceTitle: citation.sourceTitle,
          relevanceScore: citation.relevanceScore,
        })),
      }));

      return {
        id: query.id,
        queryText: query.queryText,
        brandContext: query.brandContext,
        platforms: query.platforms,
        status: query.status,
        createdAt: query.createdAt,
        completedAt: query.completedAt,
        brand: query.brand,
        summary: {
          platformsAnalyzed: insights.length,
          averageVisibilityScore: avgVisibilityScore,
          totalCitations,
          totalMentions,
        },
        platformBreakdown,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        history,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analysis history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
