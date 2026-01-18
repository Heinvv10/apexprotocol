/**
 * Action Plans API Endpoint
 *
 * GET /api/recommendations/action-plans
 * - Query params: guideId (optional), brand-id (optional), current-score (optional)
 * - Returns actionable implementation guides
 *
 * GET /api/recommendations/action-plans?all=true
 * - Returns all available implementation guides
 *
 * GET /api/recommendations/action-plans?guideId=schema
 * - Returns specific implementation guide
 *
 * GET /api/recommendations/action-plans?brand-id=123&current-score=67
 * - Returns brand-specific action plan with timeline and ROI
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllImplementationGuides,
  getImplementationGuide,
  generateBrandActionPlan,
} from "@/lib/recommendations/action-plan-generator";
import { getUserId } from "@/lib/auth/clerk";

/**
 * GET - Retrieve action plans and implementation guides
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const guideId = searchParams.get("guideId");
    const all = searchParams.get("all") === "true";
    const brandId = searchParams.get("brand-id");
    const currentScore = searchParams.get("current-score");

    // Return all guides
    if (all) {
      const guides = getAllImplementationGuides();

      return NextResponse.json({
        success: true,
        data: {
          guides,
          summary: {
            totalGuides: guides.length,
            titles: guides.map((g) => g.title),
            totalEstimatedTime: "2-4 hours",
            projectedGeoImprovement: "+16-25 GEO points",
          },
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    }

    // Return specific guide
    if (guideId) {
      const guide = getImplementationGuide(guideId);
      if (!guide) {
        return NextResponse.json(
          { error: `Implementation guide not found: ${guideId}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: guide,
        metadata: {
          guideId,
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    }

    // Return brand-specific action plan
    if (brandId && currentScore) {
      const score = parseInt(currentScore, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: "Invalid current-score parameter (must be 0-100)" },
          { status: 400 }
        );
      }

      const actionPlan = generateBrandActionPlan("Brand", brandId, score);

      return NextResponse.json({
        success: true,
        data: actionPlan,
        metadata: {
          brandId,
          currentScore: score,
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    }

    // No parameters provided
    return NextResponse.json(
      {
        error:
          "Either 'all=true', 'guideId', or 'brand-id' + 'current-score' parameters are required",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Action plans API error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve action plans",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
