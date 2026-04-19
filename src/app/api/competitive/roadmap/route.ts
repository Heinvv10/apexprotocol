/**
 * Improvement Roadmap API
 * GET /api/competitive/roadmap - Get active roadmap with milestones
 * POST /api/competitive/roadmap - Generate new improvement roadmap
 * PATCH /api/competitive/roadmap - Update roadmap status (start/pause/complete)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands, improvementRoadmaps } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateRoadmap,
  getActiveRoadmap,
  getRoadmapById,
  updateRoadmapStatus,
  getBrandRoadmaps,
  createProgressSnapshot,
  getProgressSnapshots,
  type RoadmapGenerationOptions,
} from "@/lib/competitive";

/**
 * GET /api/competitive/roadmap
 * Get roadmap(s) for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const roadmapId = searchParams.get("roadmapId");
    const includeHistory = searchParams.get("includeHistory") === "true";
    const includeSnapshots = searchParams.get("includeSnapshots") === "true";

    if (!brandId && !roadmapId) {
      return NextResponse.json(
        { error: "brandId or roadmapId is required" },
        { status: 400 }
      );
    }

    // If specific roadmap requested
    if (roadmapId) {
      const roadmap = await getRoadmapById(roadmapId);
      if (!roadmap) {
        return NextResponse.json(
          { error: "Roadmap not found" },
          { status: 404 }
        );
      }

      let snapshots = undefined;
      if (includeSnapshots) {
        snapshots = await getProgressSnapshots(roadmapId);
      }

      return NextResponse.json({
        roadmap,
        snapshots,
      });
    }

    // Get roadmaps for brand
    if (brandId) {
      // Verify brand exists
      const brand = await db.query.brands.findFirst({
        where: eq(brands.id, brandId),
      });

      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }

      // Get active roadmap
      const activeRoadmap = await getActiveRoadmap(brandId);

      // Optionally include history
      let allRoadmaps = undefined;
      if (includeHistory) {
        allRoadmaps = await getBrandRoadmaps(brandId);
      }

      // Get progress snapshots if active roadmap exists
      let snapshots = undefined;
      if (activeRoadmap && includeSnapshots) {
        snapshots = await getProgressSnapshots(activeRoadmap.id);
      }

      return NextResponse.json({
        brandId,
        brandName: brand.name,
        activeRoadmap,
        allRoadmaps,
        snapshots,
        hasActiveRoadmap: !!activeRoadmap,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error in roadmap GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitive/roadmap
 * Generate new improvement roadmap
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      brandId,
      targetPosition = "competitive",
      targetCompetitor,
      focusAreas,
      aiEnhanced = false,
    } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if there's already an active roadmap
    const existingActive = await getActiveRoadmap(brandId);
    if (existingActive) {
      return NextResponse.json(
        {
          error: "An active roadmap already exists. Complete or pause it first.",
          existingRoadmapId: existingActive.id,
        },
        { status: 409 }
      );
    }

    // Validate targetPosition
    if (!["leader", "top3", "competitive"].includes(targetPosition)) {
      return NextResponse.json(
        { error: "targetPosition must be 'leader', 'top3', or 'competitive'" },
        { status: 400 }
      );
    }

    // Validate focusAreas if provided
    const validFocusAreas = ["geo", "seo", "aeo", "smo", "ppo"];
    if (focusAreas && !focusAreas.every((area: string) => validFocusAreas.includes(area))) {
      return NextResponse.json(
        { error: `focusAreas must be from: ${validFocusAreas.join(", ")}` },
        { status: 400 }
      );
    }

    const options: RoadmapGenerationOptions = {
      targetPosition,
      targetCompetitor,
      focusAreas,
      aiEnhanced,
    };

    // Generate the roadmap
    const roadmap = await generateRoadmap(brandId, options);

    return NextResponse.json({
      success: true,
      roadmap,
      message: "Roadmap generated successfully",
    });
  } catch (error) {
    console.error("Error in roadmap POST:", error);
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Failed to generate roadmap",
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/competitive/roadmap
 * Update roadmap status
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roadmapId, action, brandId } = body;

    if (!roadmapId) {
      return NextResponse.json(
        { error: "roadmapId is required" },
        { status: 400 }
      );
    }

    // Verify roadmap exists
    const roadmap = await getRoadmapById(roadmapId);
    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "start":
        await updateRoadmapStatus(roadmapId, "active");
        // Create initial snapshot
        if (brandId) {
          await createProgressSnapshot(roadmapId, brandId);
        }
        return NextResponse.json({
          success: true,
          message: "Roadmap started",
          status: "active",
        });

      case "pause":
        await updateRoadmapStatus(roadmapId, "paused");
        return NextResponse.json({
          success: true,
          message: "Roadmap paused",
          status: "paused",
        });

      case "resume":
        await updateRoadmapStatus(roadmapId, "active");
        return NextResponse.json({
          success: true,
          message: "Roadmap resumed",
          status: "active",
        });

      case "complete":
        await updateRoadmapStatus(roadmapId, "completed");
        // Create final snapshot
        if (brandId) {
          await createProgressSnapshot(roadmapId, brandId);
        }
        return NextResponse.json({
          success: true,
          message: "Roadmap completed",
          status: "completed",
        });

      case "snapshot":
        // Create progress snapshot
        if (!brandId) {
          return NextResponse.json(
            { error: "brandId is required for snapshots" },
            { status: 400 }
          );
        }
        await createProgressSnapshot(roadmapId, brandId);
        return NextResponse.json({
          success: true,
          message: "Progress snapshot created",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'start', 'pause', 'resume', 'complete', or 'snapshot'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in roadmap PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update roadmap" },
      { status: 500 }
    );
  }
}
