/**
 * OAuth Callback Route
 * GET /api/oauth/[platform]/callback
 *
 * Handles the OAuth callback from the platform after user authorization
 * Query params:
 * - code: Authorization code from the platform
 * - state: State token we sent (contains brandId, organizationId, timestamp, returnUrl)
 * - error: Error message if authorization failed
 * - error_description: Detailed error description
 */

import { NextRequest, NextResponse } from "next/server";
import {
  LinkedInProvider,
  TwitterProvider,
  FacebookProvider,
  YouTubeProvider,
  TikTokProvider,
} from "@/lib/oauth/providers";
import { isPlatformImplemented } from "@/lib/oauth";

// Default fallback redirect URL
const DEFAULT_REDIRECT = "/admin/social-media/channels";

interface StateData {
  organizationId: string;
  brandId: string;
  returnUrl?: string;
  timestamp?: number;
}

function parseState(state: string): StateData | null {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

function buildRedirectUrl(
  baseUrl: string,
  returnUrl: string | undefined,
  params: Record<string, string>
): string {
  // Use returnUrl if provided, otherwise default
  const targetPath = returnUrl || DEFAULT_REDIRECT;

  // Build full URL
  const url = new URL(targetPath, baseUrl);

  // Add query params
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

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
    console.error(
      `[OAuth Callback] ${platform} error:`,
      error,
      errorDescription
    );
    // Try to get returnUrl from state even on error
    const state = searchParams.get("state");
    const stateData = state ? parseState(state) : null;
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, stateData?.returnUrl, {
        error: errorDescription || error,
      })
    );
  }

  // Get code and state from callback
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, undefined, {
        error: "Authorization code not received",
      })
    );
  }

  if (!state) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, undefined, {
        error: "Invalid OAuth state",
      })
    );
  }

  // Validate platform
  if (!isPlatformImplemented(platform)) {
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, undefined, {
        error: `Unsupported platform: ${platform}`,
      })
    );
  }

  // Parse state for returnUrl
  const stateData = parseState(state);
  const returnUrl = stateData?.returnUrl;

  try {
    let accountName = "";
    let accountHandle = "";

    // Complete the OAuth flow using platform-specific provider
    switch (platform) {
      case "linkedin": {
        if (!stateData?.organizationId || !stateData?.brandId) {
          return NextResponse.redirect(
            buildRedirectUrl(baseUrl, returnUrl, {
              error: "Missing organization or brand in state",
            })
          );
        }

        const result = await LinkedInProvider.completeOAuthFlow({
          code,
          organizationId: stateData.organizationId,
          brandId: stateData.brandId,
        });
        accountName = result.accountInfo?.accountName || "";
        accountHandle = result.accountInfo?.accountHandle || "";
        break;
      }

      case "twitter": {
        const result = await TwitterProvider.completeOAuthFlow({
          code,
          state,
        });
        accountName = result.accountInfo?.accountName || "";
        accountHandle = result.accountInfo?.accountHandle || "";
        break;
      }

      case "facebook":
      case "instagram": {
        const result = await FacebookProvider.completeOAuthFlow({
          code,
          state,
        });
        accountName = result.accountInfo?.accountName || "";
        // For Facebook/Instagram, we may need to show page selection UI
        // For now, just store the user account
        break;
      }

      case "youtube": {
        const result = await YouTubeProvider.completeOAuthFlow({
          code,
          state,
        });
        accountName = result.accountInfo?.accountName || "";
        accountHandle = result.accountInfo?.accountHandle || "";
        break;
      }

      case "tiktok": {
        const result = await TikTokProvider.completeOAuthFlow({
          code,
          state,
        });
        accountName = result.accountInfo?.accountName || "";
        accountHandle = result.accountInfo?.accountHandle || "";
        break;
      }

      default:
        return NextResponse.redirect(
          buildRedirectUrl(baseUrl, returnUrl, {
            error: `Unsupported OAuth platform: ${platform}`,
          })
        );
    }

    // Success! Redirect with success message
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, returnUrl, {
        success: "connected",
        platform,
        account: accountHandle || accountName,
      })
    );
  } catch (err) {
    console.error(`[OAuth Callback] ${platform} error:`, err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      buildRedirectUrl(baseUrl, returnUrl, {
        error: errorMessage,
      })
    );
  }
}
