/**
 * GEO Update Pipeline API
 *
 * GET /api/geo/pipeline - Get pipeline run history
 * POST /api/geo/pipeline - Trigger pipeline run (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  runUpdatePipeline,
  getPipelineHistory,
  getLastSuccessfulRun,
} from "@/lib/geo/update-pipeline";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const lastSuccessful = searchParams.get("last-successful") === "true";

    if (lastSuccessful) {
      const lastRun = await getLastSuccessfulRun();
      return NextResponse.json({
        success: true,
        data: lastRun,
      });
    }

    const history = await getPipelineHistory(limit);
    return NextResponse.json({
      success: true,
      data: history,
      metadata: {
        total: history.length,
        limit,
      },
    });
  } catch (error) {
    console.error("Pipeline API GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pipeline history",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can trigger pipeline
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dryRun, skipAlerts, platforms } = body;

    const result = await runUpdatePipeline({
      dryRun: dryRun || false,
      skipAlerts: skipAlerts || false,
      platforms: platforms || undefined,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error("Pipeline API POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to run pipeline",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
