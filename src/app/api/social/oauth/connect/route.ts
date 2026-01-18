/**
 * Social Media Channel Connection API
 * POST /api/social/oauth/connect
 *
 * Initiates the OAuth flow for connecting a social media channel.
 * Returns the authorization URL for the selected platform.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
import { isPlatformImplemented } from "@/lib/oauth";

const SUPPORTED_PLATFORMS = [
  "linkedin",
  "twitter",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
];

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { platform, brandId, returnUrl } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Validate platform is supported
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Platform '${platform}' is not supported` },
        { status: 400 }
      );
    }

    // Check if OAuth is implemented for this platform
    const isImplemented = isPlatformImplemented(platform);

    if (!isImplemented) {
      // For platforms not yet fully implemented, return a helpful message
      return NextResponse.json(
        {
          error: `OAuth for ${platform} is not yet configured. Please contact support to enable this integration.`,
          platformStatus: "not_configured",
        },
        { status: 501 }
      );
    }

    // Build the authorization URL
    // This redirects through our existing OAuth route which handles state generation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const authUrl = new URL(`/api/oauth/${platform}/authorize`, baseUrl);

    // Add brand context
    authUrl.searchParams.set("brandId", brandId);

    // Add return URL for redirecting back after OAuth completion
    if (returnUrl) {
      authUrl.searchParams.set("returnUrl", returnUrl);
    }

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      platform,
      message: `Redirecting to ${platform} authorization...`,
    });
  } catch (error) {
    console.error("[Social OAuth Connect] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    );
  }
}

// GET method for checking platform availability
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    if (platform) {
      // Check specific platform
      const isImplemented = isPlatformImplemented(platform);
      const isSupported = SUPPORTED_PLATFORMS.includes(platform);

      return NextResponse.json({
        platform,
        supported: isSupported,
        implemented: isImplemented,
        status: !isSupported
          ? "unsupported"
          : isImplemented
            ? "ready"
            : "not_configured",
      });
    }

    // Return all platform statuses
    const platforms = SUPPORTED_PLATFORMS.map((p) => ({
      id: p,
      name: p.charAt(0).toUpperCase() + p.slice(1),
      supported: true,
      implemented: isPlatformImplemented(p),
      status: isPlatformImplemented(p) ? "ready" : "not_configured",
    }));

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error("[Social OAuth Connect] Error:", error);
    return NextResponse.json(
      { error: "Failed to check platform status" },
      { status: 500 }
    );
  }
}
