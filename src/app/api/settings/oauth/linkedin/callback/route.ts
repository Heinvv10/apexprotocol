/**
 * Global LinkedIn OAuth Callback
 * GET /api/settings/oauth/linkedin/callback
 *
 * Handles the OAuth callback from LinkedIn and stores tokens globally
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/supabase-server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { LinkedInProvider } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("[Global LinkedIn OAuth] LinkedIn error:", error);
      return NextResponse.redirect(
        new URL(`/admin/integrations?oauth_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/admin/integrations?oauth_error=missing_parameters", request.url)
      );
    }

    // Parse state
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString()
    ) as {
      scope: string;
      userId: string;
      timestamp: number;
    };

    // Verify this is a global OAuth flow
    if (stateData.scope !== "global") {
      return NextResponse.redirect(
        new URL("/admin/integrations?oauth_error=invalid_scope", request.url)
      );
    }

    // Verify user
    const userId = await getUserId();
    if (!userId || userId !== stateData.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin only
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.redirect(
        new URL("/admin/integrations?oauth_error=super_admin_required", request.url)
      );
    }

    // Complete OAuth flow with LinkedIn
    const result = await LinkedInProvider.completeOAuthFlow({
      code,
      state,
    });

    if (!result.success || !result.tokens) {
      console.error("[Global LinkedIn OAuth] Flow failed:", result.error);
      return NextResponse.redirect(
        new URL(`/admin/integrations?oauth_error=${encodeURIComponent(result.error || "oauth_failed")}`, request.url)
      );
    }

    // Use account info from completeOAuthFlow (already fetched via OIDC userinfo)
    const accountInfo = {
      accountId: result.accountInfo?.accountId || "unknown",
      accountName: result.accountInfo?.accountName || "LinkedIn User",
      accountEmail: result.email || undefined,
      profileUrl: result.accountInfo?.profileUrl || undefined,
    };


    // Calculate expiry time (LinkedIn tokens typically expire in 60 days)
    const expiresAt = result.tokens.expiresAt ? result.tokens.expiresAt.getTime() : Date.now() + 5184000 * 1000;

    // Store tokens using our API endpoint
    const storeResponse = await fetch(
      new URL("/api/settings/oauth/linkedin", request.url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt,
          ...accountInfo,
        }),
      }
    );

    if (!storeResponse.ok) {
      console.error("[Global LinkedIn OAuth] Failed to store tokens");
      return NextResponse.redirect(
        new URL("/admin/integrations?oauth_error=storage_failed", request.url)
      );
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL("/admin/integrations?oauth_success=linkedin_connected", request.url)
    );
  } catch (error) {
    console.error("[Global LinkedIn OAuth Callback] Error:", error);
    return NextResponse.redirect(
      new URL(`/admin/integrations?oauth_error=${encodeURIComponent(String(error))}`, request.url)
    );
  }
}
