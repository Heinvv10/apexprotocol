/**
 * AI Insights Analyze API
 * POST /api/ai-insights/analyze - Analyze brand visibility across AI platforms
 *
 * Analyzes how different AI platforms (ChatGPT, Claude, Gemini, Perplexity)
 * weight, surface, and cite brand content, generating actionable recommendations
 * for improving platform-specific visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { getInternalUserId } from "@/lib/auth/clerk";
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
    const userId = await getInternalUserId();

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
    let query;
    try {
      query = await db
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
    } catch (insertError: unknown) {
      const err = insertError as { message?: string; code?: string; detail?: string; cause?: unknown };
      console.error("[AI Insights] DB insert error:", {
        message: err.message,
        code: err.code,
        detail: err.detail,
        cause: err.cause,
      });
      throw insertError;
    }

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
        userId,
        brandId,
        query: queryText,
        brandContext: brandContext || `Analyze how AI platforms reference ${brandName}.`,
      });

      // Convert platforms map to results array for processing
      const platformResults = Object.entries(analysis.platforms).map(([platform, platformAnalysis]) => ({
        platform: platform as AIPlatform,
        status: platformAnalysis?.status || "failed",
        analysis: platformAnalysis,
        error: platformAnalysis?.error,
      }));

      // Determine final query status based on analysis.status
      const finalStatus = analysis.status as "completed" | "partial" | "failed";
      const successCount = platformResults.filter(
        (r) => r.status === "success"
      ).length;

      // Store platform insights and citations for each platform
      for (const result of platformResults) {
        if (result.status === "success" && result.analysis) {
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
              averageVisibilityScore: analysis.aggregate.avgVisibilityScore,
              totalCitations: analysis.aggregate.totalCitations,
              totalMentions: analysis.aggregate.totalMentions,
              platformsAnalyzed: successCount,
              platformsRequested: platforms.length,
              bestPlatform: analysis.aggregate.bestPlatform,
              worstPlatform: analysis.aggregate.worstPlatform,
            },
            platforms: platformResults.map((result) => ({
              platform: result.platform,
              status: result.status,
              error: result.error,
              analysis: result.analysis && result.analysis.response
                ? {
                    visibilityScore: result.analysis.visibilityScore,
                    citations: result.analysis.response.citations ?? [],
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

    console.error("[AI Insights] Analysis failed:", error);
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
