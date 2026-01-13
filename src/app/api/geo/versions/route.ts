/**
 * GEO Action Plan Versions API Route
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Endpoints:
 * - GET: Retrieve version history for a brand
 * - POST: Create new version (internal use)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  getVersionHistory,
  getLatestVersion,
  compareVersions,
  hasNewerVersion,
  markVersionDownloaded,
  createActionPlanVersion,
} from "@/lib/geo/version-tracker";
import type { EnrichedRecommendation } from "@/lib/ai/step-generator";

// Query params schema
const querySchema = z.object({
  brandId: z.string(),
  limit: z.coerce.number().min(1).max(50).optional(),
  compare: z.enum(["true", "false"]).optional(),
  fromVersion: z.coerce.number().optional(),
  toVersion: z.coerce.number().optional(),
});

// Request schema for creating versions
const createVersionSchema = z.object({
  brandId: z.string(),
  actions: z.array(
    z.object({
      templateId: z.string(),
      title: z.string(),
      description: z.string(),
      steps: z.array(z.any()).optional(),
      platformRelevance: z.record(z.string(), z.number()).optional(),
      schemaCode: z.string().optional(),
      estimatedTime: z.string().optional(),
      expectedScoreImpact: z.number().optional(),
      priority: z.number(),
      impact: z.enum(["high", "medium", "low"]),
      difficulty: z.enum(["easy", "moderate", "hard"]),
    })
  ),
  knowledgeBaseVersion: z.string().optional(),
});

/**
 * GET /api/geo/versions
 *
 * Retrieve version history for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      brandId: searchParams.get("brandId"),
      limit: searchParams.get("limit") || "10",
      compare: searchParams.get("compare"),
      fromVersion: searchParams.get("fromVersion"),
      toVersion: searchParams.get("toVersion"),
    });

    // Handle version comparison
    if (
      query.compare === "true" &&
      query.fromVersion !== undefined &&
      query.toVersion !== undefined
    ) {
      const diff = await compareVersions(
        query.brandId,
        query.fromVersion,
        query.toVersion
      );

      if (!diff) {
        return NextResponse.json(
          { error: "Could not compare versions" },
          { status: 404 }
        );
      }

      return NextResponse.json({ diff });
    }

    // Get version history
    const versions = await getVersionHistory(query.brandId, query.limit);
    const latest = versions[0] || null;
    const newerVersionInfo = await hasNewerVersion(query.brandId);

    return NextResponse.json({
      versions,
      latest,
      hasNewerVersion: newerVersionInfo.hasNewer,
      latestVersion: newerVersionInfo.latestVersion,
      lastDownloaded: newerVersionInfo.lastDownloaded,
    });
  } catch (error) {
    console.error("Error fetching versions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo/versions
 *
 * Create a new version of the action plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createVersionSchema.parse(body);

    // Create the new version
    const version = await createActionPlanVersion({
      brandId: data.brandId,
      actions: data.actions as EnrichedRecommendation[],
      knowledgeBaseVersion: data.knowledgeBaseVersion,
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/geo/versions
 *
 * Mark a version as downloaded
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { versionId } = z
      .object({ versionId: z.string() })
      .parse(body);

    await markVersionDownloaded(versionId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating version:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 }
    );
  }
}
