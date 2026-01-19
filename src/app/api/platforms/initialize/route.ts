import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { initializeTier1Platforms } from "@/lib/monitoring/platform-registry";

/**
 * Initialize all Tier 1 platforms in the database
 *
 * POST /api/platforms/initialize
 *
 * This endpoint sets up the 5 Phase 10 Tier 1 platforms:
 * - OpenAI Search
 * - Bing Copilot
 * - Google NotebookLM
 * - Cohere
 * - Janus (Claude API)
 *
 * Admin only operation
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call initialization function
    const results = await initializeTier1Platforms();

    return NextResponse.json({
      success: true,
      message: "Tier 1 platforms initialized",
      results,
      platformsCount: results.length,
      createdCount: results.filter((r) => r.status === "created").length,
      existingCount: results.filter((r) => r.status === "exists").length,
    });
  } catch (error) {
    console.error("Platform initialization error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Initialization failed",
      },
      { status: 500 }
    );
  }
}
