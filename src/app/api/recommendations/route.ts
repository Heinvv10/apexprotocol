import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendations, brands } from "@/lib/db/schema";
import { eq, and, desc, asc, inArray, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { detectRecommendationsReviewed } from "@/lib/onboarding/auto-detection";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for recommendation query parameters
const querySchema = z.object({
  brandId: z.string().optional(),
  category: z
    .enum([
      "technical_seo",
      "content_optimization",
      "schema_markup",
      "citation_building",
      "brand_consistency",
      "competitor_analysis",
      "content_freshness",
      "authority_building",
    ])
    .optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "dismissed"])
    .optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  effort: z.enum(["quick_win", "moderate", "major"]).optional(),
  impact: z.enum(["high", "medium", "low"]).optional(),
  source: z.enum(["audit", "monitoring", "content", "manual"]).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * GET /api/recommendations
 * Returns recommendations with filtering and pagination
 */
export async function GET(request: NextRequest) {
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
        data: [],
        meta: {
          total: 0,
          limit: params.limit,
          offset: params.offset,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Build query conditions
    const conditions = [inArray(recommendations.brandId, brandIds)];

    if (params.brandId) {
      conditions.push(eq(recommendations.brandId, params.brandId));
    }

    if (params.category) {
      conditions.push(eq(recommendations.category, params.category));
    }

    if (params.status) {
      conditions.push(eq(recommendations.status, params.status));
    }

    if (params.priority) {
      conditions.push(eq(recommendations.priority, params.priority));
    }

    if (params.effort) {
      conditions.push(eq(recommendations.effort, params.effort));
    }

    if (params.impact) {
      conditions.push(eq(recommendations.impact, params.impact));
    }

    if (params.source) {
      conditions.push(eq(recommendations.source, params.source));
    }

    if (params.dueBefore) {
      conditions.push(lte(recommendations.dueDate, new Date(params.dueBefore)));
    }

    if (params.dueAfter) {
      conditions.push(gte(recommendations.dueDate, new Date(params.dueAfter)));
    }

    // Execute query
    // Sort by priority (critical > high > medium > low) then by createdAt
    // The priority enum is defined in order: critical, high, medium, low
    // So ascending sort puts critical first
    const recommendationsList = await db
      .select()
      .from(recommendations)
      .where(and(...conditions))
      .orderBy(asc(recommendations.priority), desc(recommendations.createdAt))
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: recommendations.id })
      .from(recommendations)
      .where(and(...conditions));

    // Auto-detect: Mark "Review Recommendations" step as complete
    if (recommendationsList.length > 0 && orgId) {
      detectRecommendationsReviewed(orgId).catch((err: Error) => {
        console.error("Failed to auto-detect recommendations reviewed:", err.message);
      });
    }

    return NextResponse.json({
      success: true,
      data: recommendationsList,
      meta: {
        total: totalResult.length,
        limit: params.limit,
        offset: params.offset,
        timestamp: new Date().toISOString(),
      },
    });
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

// Validation schema for creating a recommendation
const createRecommendationSchema = z.object({
  brandId: z.string(),
  auditId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "technical_seo",
    "content_optimization",
    "schema_markup",
    "citation_building",
    "brand_consistency",
    "competitor_analysis",
    "content_freshness",
    "authority_building",
  ]),
  priority: z.enum(["critical", "high", "medium", "low"]).optional().default("medium"),
  status: z
    .enum(["pending", "in_progress", "completed", "dismissed"])
    .optional()
    .default("pending"),
  effort: z.enum(["quick_win", "moderate", "major"]).optional().default("moderate"),
  impact: z.enum(["high", "medium", "low"]).optional().default("medium"),
  estimatedTime: z.string().optional().nullable(),
  source: z.enum(["audit", "monitoring", "content", "manual"]).optional().default("manual"),
  relatedMentionId: z.string().optional().nullable(),
  steps: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/recommendations
 * Creates a new recommendation
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createRecommendationSchema.parse(body);

    // Verify brand belongs to organization
    const brand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, validatedData.brandId),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    const newRecommendation = await db
      .insert(recommendations)
      .values({
        brandId: validatedData.brandId,
        auditId: validatedData.auditId ?? null,
        assignedToId: validatedData.assignedToId ?? null,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        status: validatedData.status,
        effort: validatedData.effort,
        impact: validatedData.impact,
        estimatedTime: validatedData.estimatedTime ?? null,
        source: validatedData.source,
        relatedMentionId: validatedData.relatedMentionId ?? null,
        steps: validatedData.steps?.map((step, idx) => ({
          stepNumber: idx + 1,
          instruction: typeof step === 'string' ? step : (step as any).instruction || String(step),
        })),
        notes: validatedData.notes ?? null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newRecommendation[0],
      },
      { status: 201 }
    );
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

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
