import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Audit Analyze API (F104-F105) - Real web analysis
 * POST /api/audit/analyze - Analyze a URL directly
 * Returns readability score (0-100) with breakdown, categorized issues
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCrawler, analyzeAuditResults } from "@/lib/audit";
import { z } from "zod";

// Request schema
const analyzeRequestSchema = z.object({
  url: z.string().min(1, "URL is required").refine(
    (val) => {
      try {
        new URL(val.startsWith("http") ? val : `https://${val}`);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid URL format" }
  ),
});

/**
 * POST /api/audit/analyze - Analyze a URL directly
 * Returns readability score and issues without storing in database
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { url } = analyzeRequestSchema.parse(body);

    // Normalize URL
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    // Create crawler
    const crawler = createCrawler(normalizedUrl, {
      depth: "section",
      maxPages: 25,
    });

    // Run crawl
    const crawlResult = await crawler.crawl();

    // Check for crawl errors
    if (!crawlResult.success || crawlResult.pages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to crawl URL",
          details: crawlResult.errors.length > 0
            ? crawlResult.errors[0].error
            : "Could not fetch page content",
        },
        { status: 422 }
      );
    }

    // Analyze results
    const analysis = analyzeAuditResults(crawlResult);

    // Return analysis results
    return NextResponse.json({
      success: true,
      url: normalizedUrl,
      crawl: {
        pagesAnalyzed: crawlResult.pages.length,
        duration: crawlResult.duration,
        errors: crawlResult.errors.length,
      },
      readability: {
        overall: analysis.readability.overall,
        grade: analysis.readability.grade,
        breakdown: {
          structure: {
            score: analysis.readability.breakdown.structure.score,
            maxScore: analysis.readability.breakdown.structure.maxScore,
          },
          schema: {
            score: analysis.readability.breakdown.schema.score,
            maxScore: analysis.readability.breakdown.schema.maxScore,
          },
          clarity: {
            score: analysis.readability.breakdown.clarity.score,
            maxScore: analysis.readability.breakdown.clarity.maxScore,
          },
          metadata: {
            score: analysis.readability.breakdown.metadata.score,
            maxScore: analysis.readability.breakdown.metadata.maxScore,
          },
          accessibility: {
            score: analysis.readability.breakdown.accessibility.score,
            maxScore: analysis.readability.breakdown.accessibility.maxScore,
          },
        },
      },
      issues: {
        total: analysis.issues.length,
        critical: analysis.summary.criticalCount,
        high: analysis.summary.highCount,
        medium: analysis.summary.mediumCount,
        low: analysis.summary.lowCount,
        items: analysis.issues.map((issue) => ({
          id: issue.id,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          affectedPages: issue.affectedPages,
          recommendation: issue.recommendation,
          impact: issue.impact,
        })),
      },
      aiReadiness: analysis.aiReadiness,
      recommendations: analysis.recommendations,
      contentAnalysis: analysis.contentAnalysis,
      technicalSEO: analysis.technicalSEO,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
