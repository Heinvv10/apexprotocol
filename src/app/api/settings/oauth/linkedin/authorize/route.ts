/**
 * Global LinkedIn OAuth Authorization
 * GET /api/settings/oauth/linkedin/authorize
 *
 * Initiates the LinkedIn OAuth flow for global (system-wide) connection
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { LinkedInProvider } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Super-admin only
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Super-admin access required" },
        { status: 403 }
      );
    }

    // Create state for global OAuth (no brandId, scope=global)
    const state = Buffer.from(JSON.stringify({
      scope: "global",
      userId,
      timestamp: Date.now(),
    })).toString("base64url");

    // Generate LinkedIn authorization URL
    const authUrl = await LinkedInProvider.getAuthorizationUrl({ state });

    if (!authUrl) {
      return NextResponse.json(
        { error: "Failed to generate LinkedIn authorization URL" },
        { status: 500 }
      );
    }

    // Redirect to LinkedIn authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Global LinkedIn OAuth] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate LinkedIn OAuth flow" },
      { status: 500 }
    );
  }
}
