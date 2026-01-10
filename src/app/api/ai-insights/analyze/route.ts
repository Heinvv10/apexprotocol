/**
 * AI Insights Analyze API
 * POST /api/ai-insights/analyze - Analyze brand visibility across AI platforms
 *
 * Analyzes how different AI platforms (ChatGPT, Claude, Gemini, Perplexity)
 * weight, surface, and cite brand content, generating actionable recommendations
 * for improving platform-specific visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { AnalysisEngine } from "@/lib/ai/analysis-engine";
import { analyzeRequestSchema } from "@/lib/ai/validation";
import type { AIPlatform, PlatformAnalysis } from "@/lib/ai/types";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

/**
 * POST /api/ai-insights/analyze
 * Analyze brand visibility across AI platforms
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = analyzeRequestSchema.parse(body);

    const {
      queryText,
      brandContext,
      brandId,
      brandName,
      brandKeywords,
      platforms,
    } = validatedData;

    // Database is required
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const {
      brands,
      platformQueries,
      platformInsights,
      citationRecords,
    } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

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

    // Create platform query record
    const query = await db
      .insert(platformQueries)
      .values({
        brandId,
        userId,
        queryText,
        brandContext: brandContext || null,
        platforms,
        status: "pending",
      })
      .returning();

    const queryId = query[0].id;

    try {
      // Initialize analysis engine
      const engine = new AnalysisEngine({
        brandName,
        brandKeywords,
        platforms: platforms as AIPlatform[],
        timeout: 30000, // 30 second timeout per platform
        recommendationCount: { min: 3, max: 5 },
      });

      // Run analysis across all platforms
      const analysis = await engine.analyze({
        query: queryText,
        context: brandContext || `Analyze how AI platforms reference ${brandName}.`,
      });

      // Determine final query status
      let finalStatus: "completed" | "partial" | "failed" = "completed";
      const successCount = analysis.platformResults.filter(
        (r) => r.status === "completed"
      ).length;

      if (successCount === 0) {
        finalStatus = "failed";
      } else if (successCount < platforms.length) {
        finalStatus = "partial";
      }

      // Store platform insights and citations for each platform
      for (const result of analysis.platformResults) {
        if (result.status === "completed" && result.analysis) {
          const platformAnalysis = result.analysis;

          // Insert platform insight
          const insight = await db
            .insert(platformInsights)
            .values({
              queryId,
              brandId,
              userId,
              platform: result.platform as any, // Type assertion for enum
              responseContent: platformAnalysis.response.content,
              visibilityScore: platformAnalysis.visibilityScore.total,
              citationCount: platformAnalysis.response.citations.length,
              mentionCount: platformAnalysis.visibilityScore.metrics.totalMentions,
              prominenceScore: platformAnalysis.visibilityScore.breakdown.prominence,
              contentTypePerformance: platformAnalysis.contentTypePerformance,
              recommendations: platformAnalysis.recommendations.map((r) => r.id),
              metadata: {
                model: platformAnalysis.response.metadata.model,
                modelVersion: platformAnalysis.response.metadata.version,
                temperature: platformAnalysis.response.metadata.temperature,
                tokensUsed: platformAnalysis.response.metadata.tokensUsed,
                responseTime: platformAnalysis.response.metadata.responseTimeMs,
                searchResults: platformAnalysis.response.metadata.searchResults,
              },
            })
            .returning();

          const insightId = insight[0].id;

          // Insert citation records
          if (platformAnalysis.response.citations.length > 0) {
            const citationValues = platformAnalysis.response.citations.map(
              (citation, index) => ({
                insightId,
                brandId,
                citationType: citation.type as any, // Type assertion for enum
                citationText: citation.text || null,
                sourceUrl: citation.sourceUrl || null,
                sourceTitle: citation.sourceTitle || null,
                position: citation.position ?? index,
                context: citation.context || null,
                contentType: citation.contentType || null,
                relevanceScore: citation.relevanceScore
                  ? Math.round(citation.relevanceScore * 100)
                  : null,
              })
            );

            await db.insert(citationRecords).values(citationValues);
          }
        }
      }

      // Update query status
      await db
        .update(platformQueries)
        .set({
          status: finalStatus,
          completedAt: new Date(),
        })
        .where(eq(platformQueries.id, queryId));

      // Return analysis results
      return NextResponse.json({
        success: true,
        data: {
          queryId,
          status: finalStatus,
          analysis: {
            summary: {
              averageVisibilityScore: analysis.aggregateStats.averageScore,
              totalCitations: analysis.aggregateStats.totalCitations,
              totalMentions: analysis.aggregateStats.totalMentions,
              platformsAnalyzed: successCount,
              platformsRequested: platforms.length,
              bestPlatform: analysis.aggregateStats.bestPlatform,
              worstPlatform: analysis.aggregateStats.worstPlatform,
            },
            platforms: analysis.platformResults.map((result) => ({
              platform: result.platform,
              status: result.status,
              error: result.error,
              analysis: result.analysis
                ? {
                    visibilityScore: result.analysis.visibilityScore,
                    citations: result.analysis.response.citations,
                    contentTypePerformance: result.analysis.contentTypePerformance,
                    recommendations: result.analysis.recommendations,
                  }
                : null,
            })),
          },
        },
      });
    } catch (analysisError) {
      // Update query status to failed
      await db
        .update(platformQueries)
        .set({
          status: "failed",
          completedAt: new Date(),
        })
        .where(eq(platformQueries.id, queryId));

      throw analysisError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
