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
import { completeOAuthFlow, parseOAuthState, isPlatformSupported, type SocialPlatform } from "@/lib/oauth";

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
  if (!isPlatformSupported(platform)) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent(`Unsupported platform: ${platform}`)}`
    );
  }

  // Parse state to validate
  const stateData = parseOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent("Invalid OAuth state token")}`
    );
  }

  // Verify platform matches state
  if (stateData.platform !== platform) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent("Platform mismatch in OAuth state")}`
    );
  }

  try {
    // Complete the OAuth flow
    const result = await completeOAuthFlow({
      platform: platform as SocialPlatform,
      code,
      state,
    });

    if (!result.success) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/social?error=${encodeURIComponent(result.error || "OAuth flow failed")}`
      );
    }

    // Success! Redirect with success message
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?success=connected&platform=${platform}&account=${encodeURIComponent(result.accountInfo?.accountName || "")}`
    );
  } catch (error) {
    console.error(`[OAuth Callback] ${platform} error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      `${baseUrl}/dashboard/social?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
