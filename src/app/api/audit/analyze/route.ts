import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Audit Analyze API (F104-F105) - Enhanced with Phase 3
 * POST /api/audit/analyze - Analyze a URL directly
 * Returns readability score (0-100) with breakdown, categorized issues,
 * schema validation, and Core Web Vitals
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { quickAudit, analyzeSchemas, analyzeCoreWebVitals } from "@/lib/audit";
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
 * POST /api/audit/analyze - Quick analysis of a URL
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

    // Run quick audit
    const { crawlResult, analysis } = await quickAudit(normalizedUrl);

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

    // Run Phase 3 enhanced analysis
    const page = crawlResult.pages[0];
    const schemaAnalysis = analyzeSchemas(page.schemaMarkup);
    const coreWebVitals = analyzeCoreWebVitals(page);

    // Return analysis results with Phase 3 enhancements
    return NextResponse.json({
      success: true,
      url: normalizedUrl,
      crawl: {
        pagesAnalyzed: crawlResult.totalPages,
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
      // Phase 3: Schema validation
      schemaValidation: {
        totalSchemas: schemaAnalysis.totalSchemas,
        validSchemas: schemaAnalysis.validSchemas,
        invalidSchemas: schemaAnalysis.invalidSchemas,
        overallScore: schemaAnalysis.overallScore,
        schemaTypes: schemaAnalysis.schemaTypes,
        missingRecommendedSchemas: schemaAnalysis.missingRecommendedSchemas,
        results: schemaAnalysis.results.map((r) => ({
          type: r.type,
          isValid: r.isValid,
          score: r.score,
          googleRichResultsEligible: r.googleRichResultsEligible,
          aiRelevance: r.aiRelevance,
          errors: r.errors,
          warnings: r.warnings,
        })),
        recommendations: schemaAnalysis.recommendations,
      },
      // Phase 3: Core Web Vitals
      coreWebVitals: {
        lcp: {
          value: coreWebVitals.lcp.value,
          unit: coreWebVitals.lcp.unit,
          rating: coreWebVitals.lcp.rating,
          score: coreWebVitals.lcp.score,
          description: coreWebVitals.lcp.description,
        },
        fid: {
          value: coreWebVitals.fid.value,
          unit: coreWebVitals.fid.unit,
          rating: coreWebVitals.fid.rating,
          score: coreWebVitals.fid.score,
          description: coreWebVitals.fid.description,
        },
        cls: {
          value: coreWebVitals.cls.value,
          unit: coreWebVitals.cls.unit,
          rating: coreWebVitals.cls.rating,
          score: coreWebVitals.cls.score,
          description: coreWebVitals.cls.description,
        },
        overall: coreWebVitals.overall,
        recommendations: coreWebVitals.recommendations,
        aiImpact: coreWebVitals.aiImpact,
      },
      issues: {
        total: analysis.summary.totalIssues,
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
          recommendation: issue.recommendation,
          aiRelevance: issue.aiRelevance,
          impact: issue.impact,
        })),
      },
      recommendations: [
        ...analysis.recommendations,
        ...schemaAnalysis.recommendations.slice(0, 3),
        ...coreWebVitals.recommendations.slice(0, 3),
      ],
      topPriorities: analysis.summary.topPriorities,
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
