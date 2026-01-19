import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getBrandPlatformIntegrations,
  enablePlatformForBrand,
  disablePlatformForBrand,
} from "@/lib/monitoring/platform-registry";

/**
 * Get brand's platform integrations
 *
 * GET /api/platforms/integrations/[brandId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const integrations = await getBrandPlatformIntegrations(params.brandId);

    return NextResponse.json({
      success: true,
      data: integrations,
      count: integrations.length,
    });
  } catch (error) {
    console.error("Get integrations error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch integrations",
      },
      { status: 500 }
    );
  }
}

/**
 * Enable/disable platform for brand
 *
 * POST /api/platforms/integrations/[brandId]
 *
 * Request body:
 * {
 *   "platformId": "platform_id",
 *   "enabled": true/false
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { platformId, enabled } = await request.json();

    if (!platformId) {
      return NextResponse.json(
        { error: "Missing required field: platformId" },
        { status: 400 }
      );
    }

    let result;

    if (enabled) {
      result = await enablePlatformForBrand(params.brandId, platformId);
    } else {
      await disablePlatformForBrand(params.brandId, platformId);
      result = { status: "disabled" };
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Update integration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update integration",
      },
      { status: 500 }
    );
  }
}
