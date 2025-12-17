/**
 * OAuth Authorization Initiation Route
 * GET /api/oauth/[platform]/authorize
 *
 * Generates the OAuth authorization URL and redirects the user to the platform
 * Query params:
 * - brandId: Required - The brand to connect this account to
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateAuthorizationUrl, isPlatformSupported, type SocialPlatform } from "@/lib/oauth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    const { platform } = await context.params;

    // Validate platform
    if (!isPlatformSupported(platform)) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    // Get brandId from query params
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Generate authorization URL
    const result = generateAuthorizationUrl({
      platform: platform as SocialPlatform,
      organizationId: orgId,
      brandId,
    });

    if (!result) {
      return NextResponse.json(
        { error: `Failed to generate authorization URL for ${platform}` },
        { status: 500 }
      );
    }

    // Redirect to platform authorization page
    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("[OAuth Authorize] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
