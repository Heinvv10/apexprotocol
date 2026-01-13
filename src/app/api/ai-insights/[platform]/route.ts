import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * AI Insights Platform-Specific API
 * GET /api/ai-insights/[platform] - Retrieve platform-specific insights
 *
 * Returns historical insights filtered by a specific AI platform (ChatGPT, Claude, Gemini, or Perplexity),
 * allowing users to analyze how their brand performs on individual platforms over time.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parsePlatformQueryParams, isValidPlatform } from "@/lib/ai/validation";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

interface RouteParams {
  params: Promise<{ platform: string }>;
}

/**
 * GET /api/ai-insights/[platform]
 * Retrieve platform-specific insights with pagination
 *
 * Path parameters:
 * - platform: AI platform name (chatgpt, claude, gemini, perplexity)
 *
 * Query parameters:
 * - brandId (optional): Filter by specific brand
 * - limit (optional): Number of records to return (default: 10, max: 100)
 * - offset (optional): Number of records to skip (default: 0)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get and validate platform parameter
    const { platform } = await params;

    if (!isValidPlatform(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid platform",
          details: "Platform must be one of: chatgpt, claude, gemini, perplexity",
        },
        { status: 400 }
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
    const { brandId, limit, offset } = parsePlatformQueryParams(
      platform,
      searchParams
    );

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const {
      platformInsights,
      platformQueries,
      citationRecords,
      brands,
    } = await import("@/lib/db/schema");
    const { eq, and, desc, count } = await import("drizzle-orm");

    // Build where clause - filter by userId, platform, and optionally brandId
    const whereConditions = [
      eq(platformInsights.userId, userId),
      eq(platformInsights.platform, platform as any), // Type assertion for enum
    ];

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

      whereConditions.push(eq(platformInsights.brandId, brandId));
    }

    const whereClause =
      whereConditions.length > 1
        ? and(...whereConditions)
        : whereConditions[0];

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: count() })
      .from(platformInsights)
      .where(whereClause);

    const total = totalCountResult[0]?.count ?? 0;

    // Fetch insights with related query, brand, and citation info
    const insights = await db.query.platformInsights.findMany({
      where: whereClause,
      orderBy: [desc(platformInsights.createdAt)],
      limit,
      offset,
      with: {
        query: {
          columns: {
            id: true,
            queryText: true,
            brandContext: true,
            platforms: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        },
        brand: {
          columns: {
            id: true,
            name: true,
            domain: true,
            logoUrl: true,
          },
        },
        citations: {
          orderBy: [citationRecords.position],
          limit: 10, // Limit citations per insight for performance
        },
      },
    });

    // Transform data for response
    const platformData = insights.map((insight) => {
      const citations = (insight.citations || []).map((citation) => ({
        type: citation.citationType,
        text: citation.citationText,
        sourceUrl: citation.sourceUrl,
        sourceTitle: citation.sourceTitle,
        position: citation.position,
        context: citation.context,
        contentType: citation.contentType,
        relevanceScore: citation.relevanceScore,
      }));

      return {
        id: insight.id,
        queryId: insight.queryId,
        platform: insight.platform,
        visibilityScore: insight.visibilityScore,
        citationCount: insight.citationCount,
        mentionCount: insight.mentionCount,
        prominenceScore: insight.prominenceScore,
        contentTypePerformance: insight.contentTypePerformance,
        recommendations: insight.recommendations,
        metadata: insight.metadata,
        createdAt: insight.createdAt,
        query: insight.query,
        brand: insight.brand,
        citations,
      };
    });

    // Calculate aggregate statistics for this platform
    const aggregateStats = insights.length > 0 ? {
      averageVisibilityScore: Math.round(
        insights.reduce((sum, insight) => sum + (insight.visibilityScore || 0), 0) / insights.length
      ),
      totalCitations: insights.reduce(
        (sum, insight) => sum + (insight.citationCount || 0),
        0
      ),
      totalMentions: insights.reduce(
        (sum, insight) => sum + (insight.mentionCount || 0),
        0
      ),
      totalAnalyses: insights.length,
      averageProminenceScore: Math.round(
        insights.reduce((sum, insight) => sum + (insight.prominenceScore || 0), 0) / insights.length
      ),
    } : {
      averageVisibilityScore: 0,
      totalCitations: 0,
      totalMentions: 0,
      totalAnalyses: 0,
      averageProminenceScore: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        platform,
        insights: platformData,
        aggregateStats,
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
        error: "Failed to fetch platform insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
