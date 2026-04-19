/**
 * OAuth Authorization Initiation Route
 * GET /api/oauth/[platform]/authorize
 *
 * Generates the OAuth authorization URL and redirects the user to the platform
 * Query params:
 * - brandId: Required - The brand to connect this account to
 * - returnUrl: Optional - URL to redirect to after OAuth completion
 * - includeExtended: Optional - Include extended scopes (e.g., publishing, uploads)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import {
  LinkedInProvider,
  TwitterProvider,
  FacebookProvider,
  YouTubeProvider,
  TikTokProvider,
} from "@/lib/oauth/providers";
import { isPlatformImplemented } from "@/lib/oauth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    const { platform } = await context.params;

    // Validate platform
    if (!isPlatformImplemented(platform)) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const returnUrl = searchParams.get("returnUrl");
    const includeExtended = searchParams.get("includeExtended") === "true";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    let authUrl: string;

    // Generate authorization URL using platform-specific provider
    switch (platform) {
      case "linkedin": {
        // LinkedIn requires state to be passed in, returns string
        const state = Buffer.from(
          JSON.stringify({
            organizationId: orgId,
            brandId,
            returnUrl,
            timestamp: Date.now(),
          })
        ).toString("base64url");
        authUrl = await LinkedInProvider.getAuthorizationUrl({
          state,
          includeOrganizationScopes: includeExtended,
          // Use the social channels callback path (registered in LinkedIn app settings)
          callbackPath: "/api/oauth/linkedin/callback",
        });
        break;
      }

      case "twitter": {
        const result = await TwitterProvider.getAuthorizationUrl({
          brandId,
          organizationId: orgId,
          scopes: includeExtended
            ? TwitterProvider.config.extendedScopes
            : undefined,
        });
        // Store returnUrl in a way Twitter can pass back
        // Twitter's state is managed internally, so we need to handle returnUrl separately
        authUrl = result.url;
        break;
      }

      case "facebook":
      case "instagram": {
        // Instagram uses Facebook OAuth
        const result = await FacebookProvider.getAuthorizationUrl({
          brandId,
          organizationId: orgId,
          returnUrl: returnUrl || undefined,
          includeInstagram: platform === "instagram" || includeExtended,
        });
        authUrl = result.url;
        break;
      }

      case "youtube": {
        const result = await YouTubeProvider.getAuthorizationUrl({
          brandId,
          organizationId: orgId,
          returnUrl: returnUrl || undefined,
          includeUploads: includeExtended,
        });
        authUrl = result.url;
        break;
      }

      case "tiktok": {
        const result = await TikTokProvider.getAuthorizationUrl({
          brandId,
          organizationId: orgId,
          returnUrl: returnUrl || undefined,
          includePublish: includeExtended,
        });
        authUrl = result.url;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported OAuth platform: ${platform}` },
          { status: 400 }
        );
    }

    if (!authUrl) {
      return NextResponse.json(
        { error: `Failed to generate authorization URL for ${platform}` },
        { status: 500 }
      );
    }

    // Redirect to platform authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[OAuth Authorize] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
