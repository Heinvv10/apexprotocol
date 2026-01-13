/**
 * GEO Best Practices API Route
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Endpoints:
 * - GET: Retrieve best practices for a platform/category
 * - POST: Create new best practice (admin/internal use)
 * - PUT: Update existing best practice
 * - DELETE: Soft delete (deprecate) a best practice
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { geoBestPractices } from "@/lib/db/schema/geo-knowledge-base";
import { eq, and, isNull, desc, or, sql } from "drizzle-orm";
import { z } from "zod";

// Implementation step schema
const implementationStepSchema = z.object({
  stepNumber: z.number(),
  instruction: z.string(),
  codeSnippet: z.string().optional(),
  platformNotes: z.record(z.string(), z.string()).optional(),
});

// Request schema for creating best practices
const createBestPracticeSchema = z.object({
  platform: z.enum(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot", "all"]),
  category: z.enum(["schema", "content", "social", "technical", "authority", "freshness"]),
  practiceTitle: z.string().min(1).max(255),
  practiceDescription: z.string().min(1).max(2000),
  implementationSteps: z.array(implementationStepSchema).optional(),
  impactScore: z.number().min(1).max(10),
  effortScore: z.number().min(1).max(10),
  effectiveSince: z.string().datetime().optional(),
});

// Request schema for updating best practices
const updateBestPracticeSchema = z.object({
  id: z.string(),
  practiceTitle: z.string().min(1).max(255).optional(),
  practiceDescription: z.string().min(1).max(2000).optional(),
  implementationSteps: z.array(implementationStepSchema).optional(),
  impactScore: z.number().min(1).max(10).optional(),
  effortScore: z.number().min(1).max(10).optional(),
  deprecatedAt: z.string().datetime().optional(),
  deprecationReason: z.string().optional(),
});

// Query params schema
const querySchema = z.object({
  platform: z.enum(["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot", "all"]).optional(),
  category: z.enum(["schema", "content", "social", "technical", "authority", "freshness", "all"]).optional(),
  includeDeprecated: z.coerce.boolean().optional(),
  minImpactScore: z.coerce.number().min(1).max(10).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/geo/best-practices
 *
 * Retrieve best practices filtered by platform and category
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
      category: searchParams.get("category") || undefined,
      includeDeprecated: searchParams.get("includeDeprecated") || undefined,
      minImpactScore: searchParams.get("minImpactScore") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    // Build query conditions
    const conditions: ReturnType<typeof eq>[] = [];

    // Filter by platform if specified and not "all"
    if (query.platform && query.platform !== "all") {
      // Include both platform-specific and "all" platforms practices
      conditions.push(
        or(
          eq(geoBestPractices.platform, query.platform),
          eq(geoBestPractices.platform, "all")
        )!
      );
    }

    // Filter by category if specified and not "all"
    if (query.category && query.category !== "all") {
      conditions.push(eq(geoBestPractices.category, query.category));
    }

    // Filter out deprecated unless requested
    if (!query.includeDeprecated) {
      conditions.push(isNull(geoBestPractices.deprecatedAt));
    }

    // Filter by minimum impact score
    if (query.minImpactScore) {
      conditions.push(sql`${geoBestPractices.impactScore} >= ${query.minImpactScore}`);
    }

    // Execute query
    const practices = await db
      .select()
      .from(geoBestPractices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(geoBestPractices.impactScore), desc(geoBestPractices.updatedAt))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(geoBestPractices)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = countResult[0]?.count || 0;

    // Get summary statistics
    const allActivePractices = await db
      .select()
      .from(geoBestPractices)
      .where(isNull(geoBestPractices.deprecatedAt));

    const summary = {
      totalActive: allActivePractices.length,
      byPlatform: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      avgImpactScore: 0,
    };

    // Calculate statistics
    let totalImpact = 0;
    for (const practice of allActivePractices) {
      summary.byPlatform[practice.platform] = (summary.byPlatform[practice.platform] || 0) + 1;
      summary.byCategory[practice.category] = (summary.byCategory[practice.category] || 0) + 1;
      totalImpact += practice.impactScore;
    }
    summary.avgImpactScore = allActivePractices.length > 0
      ? Math.round((totalImpact / allActivePractices.length) * 10) / 10
      : 0;

    return NextResponse.json({
      practices,
      pagination: {
        total: totalCount,
        limit: query.limit || 50,
        offset: query.offset || 0,
        hasMore: (query.offset || 0) + practices.length < totalCount,
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching best practices:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch best practices" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo/best-practices
 *
 * Create a new best practice
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
    const data = createBestPracticeSchema.parse(body);

    const [practice] = await db
      .insert(geoBestPractices)
      .values({
        platform: data.platform,
        category: data.category,
        practiceTitle: data.practiceTitle,
        practiceDescription: data.practiceDescription,
        implementationSteps: data.implementationSteps as typeof geoBestPractices.$inferInsert.implementationSteps,
        impactScore: data.impactScore,
        effortScore: data.effortScore,
        effectiveSince: data.effectiveSince || new Date().toISOString().split("T")[0],
      })
      .returning();

    return NextResponse.json({ practice }, { status: 201 });
  } catch (error) {
    console.error("Error creating best practice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create best practice" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/geo/best-practices
 *
 * Update an existing best practice
 */
export async function PUT(request: NextRequest) {
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
    const data = updateBestPracticeSchema.parse(body);

    // Check if practice exists
    const existing = await db
      .select()
      .from(geoBestPractices)
      .where(eq(geoBestPractices.id, data.id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Best practice not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.practiceTitle !== undefined) updateData.practiceTitle = data.practiceTitle;
    if (data.practiceDescription !== undefined) updateData.practiceDescription = data.practiceDescription;
    if (data.implementationSteps !== undefined) updateData.implementationSteps = data.implementationSteps;
    if (data.impactScore !== undefined) updateData.impactScore = data.impactScore;
    if (data.effortScore !== undefined) updateData.effortScore = data.effortScore;
    if (data.deprecatedAt !== undefined) updateData.deprecatedAt = data.deprecatedAt;
    if (data.deprecationReason !== undefined) updateData.deprecationReason = data.deprecationReason;

    // Increment version
    updateData.version = (existing[0].version || 1) + 1;

    const [updatedPractice] = await db
      .update(geoBestPractices)
      .set(updateData)
      .where(eq(geoBestPractices.id, data.id))
      .returning();

    return NextResponse.json({ practice: updatedPractice });
  } catch (error) {
    console.error("Error updating best practice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update best practice" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/geo/best-practices
 *
 * Soft delete (deprecate) a best practice
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const reason = searchParams.get("reason") || "No longer effective";

    if (!id) {
      return NextResponse.json({ error: "Missing practice ID" }, { status: 400 });
    }

    // Check if practice exists
    const existing = await db
      .select()
      .from(geoBestPractices)
      .where(eq(geoBestPractices.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Best practice not found" }, { status: 404 });
    }

    // Soft delete by setting deprecatedAt
    const now = new Date().toISOString();
    const [deprecatedPractice] = await db
      .update(geoBestPractices)
      .set({
        deprecatedAt: now,
        deprecationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(geoBestPractices.id, id))
      .returning();

    return NextResponse.json({
      practice: deprecatedPractice,
      message: "Best practice has been deprecated"
    });
  } catch (error) {
    console.error("Error deprecating best practice:", error);

    return NextResponse.json(
      { error: "Failed to deprecate best practice" },
      { status: 500 }
    );
  }
}
