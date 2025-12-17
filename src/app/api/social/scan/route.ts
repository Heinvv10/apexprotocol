/**
 * Social Scan API Route
 *
 * Service-level social media scanning endpoint.
 * Uses Apex's own API keys to scan ANY brand's public social data.
 *
 * POST /api/social/scan - Trigger a brand scan
 * GET /api/social/scan - Get scanner status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  scanBrand,
  quickScan,
  getScannerStatus,
  getConfiguredPlatformNames,
  type ScannerPlatform,
} from "@/lib/social-scanner";

// ============================================================================
// Request Validation
// ============================================================================

const scanRequestSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  handles: z.object({
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    facebook: z.string().optional(),
  }),
  platforms: z.array(z.enum(["twitter", "youtube", "facebook"])).optional(),
  options: z.object({
    includeProfile: z.boolean().optional(),
    includePosts: z.boolean().optional(),
    includeMentions: z.boolean().optional(),
    postsLimit: z.number().min(1).max(100).optional(),
    mentionsLimit: z.number().min(1).max(100).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  quickScan: z.boolean().optional(),
});

// ============================================================================
// GET - Scanner Status
// ============================================================================

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getScannerStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        documentation: {
          twitter: "Set TWITTER_BEARER_TOKEN in environment",
          youtube: "Set YOUTUBE_API_KEY in environment",
          facebook: "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment",
        },
      },
    });
  } catch (error) {
    console.error("Error getting scanner status:", error);
    return NextResponse.json(
      { error: "Failed to get scanner status" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Trigger Scan
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const parseResult = scanRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { brandId, handles, platforms, options, quickScan: isQuickScan } = parseResult.data;

    // Check if any scanners are configured
    const configuredPlatforms = getConfiguredPlatformNames();
    if (configuredPlatforms.length === 0) {
      return NextResponse.json(
        {
          error: "No social scanners configured",
          message: "Set up API credentials for Twitter, YouTube, or Facebook to enable scanning.",
          documentation: {
            twitter: "Set TWITTER_BEARER_TOKEN in environment",
            youtube: "Set YOUTUBE_API_KEY in environment",
            facebook: "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment",
          },
        },
        { status: 503 }
      );
    }

    // Check if any handles were provided
    const providedHandles = Object.entries(handles).filter(
      ([, value]) => value && value.trim().length > 0
    );

    if (providedHandles.length === 0) {
      return NextResponse.json(
        {
          error: "No social handles provided",
          message: "Provide at least one social handle to scan (twitter, youtube, or facebook).",
        },
        { status: 400 }
      );
    }

    // Perform scan
    if (isQuickScan) {
      // Quick scan - profiles only
      const results = await quickScan(handles);

      const resultsObject: Record<string, unknown> = {};
      results.forEach((value, key) => {
        resultsObject[key] = value;
      });

      return NextResponse.json({
        success: true,
        data: {
          type: "quick_scan",
          brandId,
          results: resultsObject,
          scannedAt: new Date().toISOString(),
        },
      });
    }

    // Full scan
    const result = await scanBrand({
      brandId,
      platforms: (platforms || []) as ScannerPlatform[],
      handles,
      options,
    });

    return NextResponse.json({
      success: true,
      data: {
        type: "full_scan",
        ...result,
      },
    });
  } catch (error) {
    console.error("Error performing social scan:", error);
    return NextResponse.json(
      {
        error: "Failed to perform social scan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
