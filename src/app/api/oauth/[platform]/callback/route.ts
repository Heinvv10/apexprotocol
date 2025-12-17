/**
 * OAuth Callback Route
 * GET /api/oauth/[platform]/callback
 *
 * Handles the OAuth callback from the platform after user authorization
 * Query params:
 * - code: Authorization code from the platform
 * - state: State token we sent (contains brandId, organizationId, timestamp)
 * - error: Error message if authorization failed
 * - error_description: Detailed error description
 */

import { NextRequest, NextResponse } from "next/server";
import { LinkedInProvider, TwitterProvider } from "@/lib/oauth";
import { isPlatformImplemented } from "@/lib/oauth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  const { searchParams } = new URL(request.url);
  const { platform } = await context.params;

  // Get base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Check for OAuth error from provider
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error(`[OAuth Callback] ${platform} error:`, error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Get code and state from callback
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent("Authorization code not received")}`
    );
  }

  if (!state) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent("Invalid OAuth state")}`
    );
  }

  // Validate platform
  if (!isPlatformImplemented(platform)) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent(`Unsupported platform: ${platform}`)}`
    );
  }

  try {
    let accountName = "";

    // Complete the OAuth flow using platform-specific provider
    if (platform === "linkedin") {
      // LinkedIn: parse state to get org/brand, then complete flow
      let stateData: { organizationId: string; brandId: string };
      try {
        stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
      } catch {
        return NextResponse.redirect(
          `${baseUrl}/dashboard/social?error=${encodeURIComponent("Invalid state token")}`
        );
      }

      if (!stateData.organizationId || !stateData.brandId) {
        return NextResponse.redirect(
          `${baseUrl}/dashboard/social?error=${encodeURIComponent("Missing organization or brand in state")}`
        );
      }

      const result = await LinkedInProvider.completeOAuthFlow({
        code,
        organizationId: stateData.organizationId,
        brandId: stateData.brandId,
      });
      accountName = result.accountInfo?.accountName || "";
    } else if (platform === "twitter") {
      // Twitter: pass state directly, it parses internally
      const result = await TwitterProvider.completeOAuthFlow({
        code,
        state,
      });
      accountName = result.accountInfo?.accountName || "";
    } else {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/social?error=${encodeURIComponent(`Unsupported OAuth platform: ${platform}`)}`
      );
    }

    // Success! Redirect with success message
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?success=connected&platform=${platform}&account=${encodeURIComponent(accountName)}`
    );
  } catch (error) {
    console.error(`[OAuth Callback] ${platform} error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
