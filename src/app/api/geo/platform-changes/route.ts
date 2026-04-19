/**
 * Platform Changes API
 *
 * GET /api/geo/platform-changes - Get recent platform changes
 * GET /api/geo/platform-changes?platform=chatgpt - Filter by platform
 * POST /api/geo/platform-changes/analyze - Trigger platform analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/supabase-server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  getRecentPlatformChanges,
  getPlatformChangesByType,
  getHighConfidenceChanges,
} from "@/lib/geo/knowledge-base";
import {
  runFullPlatformAnalysis,
  getPlatformMetrics,
  MONITORED_PLATFORMS,
} from "@/lib/geo/platform-monitor";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const changeType = searchParams.get("type");
    const highConfidenceOnly = searchParams.get("high-confidence") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let changes;
    if (highConfidenceOnly) {
      changes = await getHighConfidenceChanges();
    } else if (changeType) {
      changes = await getPlatformChangesByType(changeType);
    } else {
      changes = await getRecentPlatformChanges(platform || undefined, limit);
    }

    return NextResponse.json({
      success: true,
      data: changes,
      metadata: {
        total: changes.length,
        filters: { platform, changeType, highConfidenceOnly, limit },
        monitoredPlatforms: MONITORED_PLATFORMS,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Platform Changes API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch platform changes",
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

    // Only admins can trigger analysis
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, platform } = body;

    if (action === "analyze") {
      // Run full analysis or single platform
      if (platform && MONITORED_PLATFORMS.includes(platform)) {
        const metrics = await getPlatformMetrics(platform);
        return NextResponse.json({
          success: true,
          data: {
            platform,
            metrics,
          },
        });
      } else {
        const analysis = await runFullPlatformAnalysis();
        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Platform Changes POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to run analysis",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
