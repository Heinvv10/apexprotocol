/**
 * GEO Platform Changes API Route
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Endpoints:
 * - GET: Retrieve platform changes (algorithm updates, behavior changes)
 * - POST: Create new platform change record
 * - PATCH: Update change confidence/assessment
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { platformChanges } from "@/lib/db/schema/geo-knowledge-base";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { z } from "zod";

// Request schema for creating platform changes
const createPlatformChangeSchema = z.object({
  platform: z.enum(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"]),
  changeType: z.enum(["citation_pattern", "content_preference", "feature_update", "algorithm_update", "ranking_change"]),
  description: z.string().min(1).max(2000),
  impactAssessment: z.string().min(1).max(2000),
  recommendedResponse: z.string().min(1).max(2000),
  confidenceScore: z.number().min(0).max(100),
  source: z.string().min(1).max(255),
  affectedCategories: z.array(z.string()).optional(),
  detectionMethod: z.enum(["automated", "manual", "community", "research"]).optional(),
});

// Request schema for updating platform changes
const updatePlatformChangeSchema = z.object({
  id: z.string(),
  confidenceScore: z.number().min(0).max(100).optional(),
  impactAssessment: z.string().min(1).max(2000).optional(),
  recommendedResponse: z.string().min(1).max(2000).optional(),
  verified: z.boolean().optional(),
});

// Query params schema
const querySchema = z.object({
  platform: z.enum(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot", "all"]).optional(),
  changeType: z.enum(["citation_pattern", "content_preference", "feature_update", "algorithm_update", "ranking_change", "all"]).optional(),
  minConfidence: z.coerce.number().min(0).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/geo/platform-changes
 *
 * Retrieve platform changes with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const devMode = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    let userId: string | null = null;

    if (devMode) {
      userId = "dev-user";
    } else {
      const authResult = await auth();
      userId = authResult.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      platform: searchParams.get("platform") || undefined,
      changeType: searchParams.get("changeType") || undefined,
      minConfidence: searchParams.get("minConfidence") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    // Build query conditions
    const conditions: ReturnType<typeof eq>[] = [];

    // Filter by platform if specified and not "all"
    if (query.platform && query.platform !== "all") {
      conditions.push(eq(platformChanges.platform, query.platform));
    }

    // Filter by change type if specified and not "all"
    if (query.changeType && query.changeType !== "all") {
      conditions.push(eq(platformChanges.changeType, query.changeType));
    }

    // Filter by minimum confidence score
    if (query.minConfidence) {
      conditions.push(sql`${platformChanges.confidenceScore} >= ${query.minConfidence}`);
    }

    // Filter by date range using SQL
    if (query.dateFrom) {
      conditions.push(sql`${platformChanges.changeDetected} >= ${query.dateFrom}`);
    }
    if (query.dateTo) {
      conditions.push(sql`${platformChanges.changeDetected} <= ${query.dateTo}`);
    }

    // Execute query
    const changes = await db
      .select()
      .from(platformChanges)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(platformChanges.changeDetected))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(platformChanges)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = countResult[0]?.count || 0;

    // Get summary statistics
    const allChanges = await db.select().from(platformChanges);

    const summary = {
      totalChanges: allChanges.length,
      byPlatform: {} as Record<string, number>,
      byChangeType: {} as Record<string, number>,
      recentHighImpact: [] as typeof changes,
      avgConfidence: 0,
    };

    // Calculate statistics
    let totalConfidence = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    for (const change of allChanges) {
      summary.byPlatform[change.platform] = (summary.byPlatform[change.platform] || 0) + 1;
      summary.byChangeType[change.changeType] = (summary.byChangeType[change.changeType] || 0) + 1;
      totalConfidence += change.confidenceScore || 0;
    }
    summary.avgConfidence = allChanges.length > 0
      ? Math.round((totalConfidence / allChanges.length) * 10) / 10
      : 0;

    // Get recent high-impact changes (last 7 days, confidence > 70)
    summary.recentHighImpact = allChanges
      .filter(c =>
        c.changeDetected >= sevenDaysAgoStr &&
        (c.confidenceScore || 0) >= 70
      )
      .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
      .slice(0, 5);

    return NextResponse.json({
      changes,
      pagination: {
        total: totalCount,
        limit: query.limit || 50,
        offset: query.offset || 0,
        hasMore: (query.offset || 0) + changes.length < totalCount,
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching platform changes:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch platform changes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo/platform-changes
 *
 * Create a new platform change record
 */
export async function POST(request: NextRequest) {
  try {
    const devMode = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    let userId: string | null = null;

    if (devMode) {
      userId = "dev-user";
    } else {
      const authResult = await auth();
      userId = authResult.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createPlatformChangeSchema.parse(body);

    const [change] = await db
      .insert(platformChanges)
      .values({
        platform: data.platform,
        changeType: data.changeType,
        description: data.description,
        impactAssessment: data.impactAssessment,
        recommendedResponse: data.recommendedResponse,
        confidenceScore: data.confidenceScore,
        source: data.source,
        changeDetected: new Date().toISOString().split("T")[0],
      })
      .returning();

    return NextResponse.json({ change }, { status: 201 });
  } catch (error) {
    console.error("Error creating platform change:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create platform change" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/geo/platform-changes
 *
 * Update an existing platform change
 */
export async function PATCH(request: NextRequest) {
  try {
    const devMode = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";
    let userId: string | null = null;

    if (devMode) {
      userId = "dev-user";
    } else {
      const authResult = await auth();
      userId = authResult.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updatePlatformChangeSchema.parse(body);

    // Check if change exists
    const existing = await db
      .select()
      .from(platformChanges)
      .where(eq(platformChanges.id, data.id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Platform change not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (data.confidenceScore !== undefined) updateData.confidenceScore = data.confidenceScore;
    if (data.impactAssessment !== undefined) updateData.impactAssessment = data.impactAssessment;
    if (data.recommendedResponse !== undefined) updateData.recommendedResponse = data.recommendedResponse;

    const [updatedChange] = await db
      .update(platformChanges)
      .set(updateData)
      .where(eq(platformChanges.id, data.id))
      .returning();

    return NextResponse.json({ change: updatedChange });
  } catch (error) {
    console.error("Error updating platform change:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update platform change" },
      { status: 500 }
    );
  }
}
