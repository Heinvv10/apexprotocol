import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendations, brands } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import {
  calculateAggregateMetrics,
  getEffectivenessLevel,
  type AggregateMetrics,
} from "@/lib/analytics/effectiveness";

// Validation schema for effectiveness query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(5),
});

// Response types
interface TopPerformer {
  id: string;
  title: string;
  category: string;
  effectivenessScore: number;
  scoreImprovement: number;
  effectivenessLevel: "excellent" | "good" | "moderate" | "poor" | "ineffective";
  completedAt: string | null;
}

interface EffectivenessResponse {
  success: boolean;
  data: {
    metrics: AggregateMetrics;
    topPerformers: TopPerformer[];
  };
  meta: {
    brandId?: string;
    timestamp: string;
  };
}

/**
 * GET /api/recommendations/effectiveness
 * Returns aggregated effectiveness metrics for completed recommendations
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // Get brand IDs for this organization
    const orgBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(and(eq(brands.organizationId, orgId), eq(brands.isActive, true)));

    const brandIds = orgBrands.map((b) => b.id);

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            totalCompleted: 0,
            averageEffectiveness: 0,
            averageScoreImprovement: 0,
            totalPositiveImprovements: 0,
            totalNegativeImprovements: 0,
          },
          topPerformers: [],
        },
        meta: {
          brandId: params.brandId,
          timestamp: new Date().toISOString(),
        },
      } satisfies EffectivenessResponse);
    }

    // Build query conditions for completed recommendations
    const conditions = [
      inArray(recommendations.brandId, brandIds),
      eq(recommendations.status, "completed"),
    ];

    // Filter by specific brand if provided
    if (params.brandId) {
      // Verify the brand belongs to the organization
      if (!brandIds.includes(params.brandId)) {
        return NextResponse.json(
          { success: false, error: "Brand not found or access denied" },
          { status: 403 }
        );
      }
      conditions.push(eq(recommendations.brandId, params.brandId));
    }

    // Fetch all completed recommendations for aggregate metrics
    const completedRecommendations = await db
      .select({
        id: recommendations.id,
        title: recommendations.title,
        category: recommendations.category,
        effectivenessScore: recommendations.effectivenessScore,
        scoreImprovement: recommendations.scoreImprovement,
        completedAt: recommendations.completedAt,
      })
      .from(recommendations)
      .where(and(...conditions));

    // Calculate aggregate metrics using the utility function
    const metrics = calculateAggregateMetrics(completedRecommendations);

    // Get top performers (sorted by effectiveness score, descending)
    const topPerformers: TopPerformer[] = completedRecommendations
      .filter((r) => r.effectivenessScore !== null)
      .sort((a, b) => (b.effectivenessScore || 0) - (a.effectivenessScore || 0))
      .slice(0, params.limit)
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        effectivenessScore: r.effectivenessScore || 0,
        scoreImprovement: r.scoreImprovement || 0,
        effectivenessLevel: getEffectivenessLevel(r.effectivenessScore || 0),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      }));

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        topPerformers,
      },
      meta: {
        brandId: params.brandId,
        timestamp: new Date().toISOString(),
      },
    } satisfies EffectivenessResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
