/**
 * One-time fix API to update LinkedIn tokens with broken profile URLs
 * POST /api/admin/fix-linkedin-url
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialOauthTokens } from "@/lib/db/schema/social";
import { eq, and, like } from "drizzle-orm";

export async function POST() {
  try {
    // Find LinkedIn tokens with member ID-based URLs (which don't work)
    // and set them to null
    const result = await db
      .update(socialOauthTokens)
      .set({ profileUrl: null })
      .where(
        and(
          eq(socialOauthTokens.platform, "linkedin"),
          // Match URLs that look like member IDs (short alphanumeric strings)
          like(socialOauthTokens.profileUrl, "https://linkedin.com/in/%")
        )
      )
      .returning({
        id: socialOauthTokens.id,
        accountName: socialOauthTokens.accountName,
        oldProfileUrl: socialOauthTokens.profileUrl,
      });

    return NextResponse.json({
      success: true,
      updated: result.length,
      tokens: result,
    });
  } catch (error) {
    console.error("[Fix LinkedIn URL] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fix URLs",
      },
      { status: 500 }
    );
  }
}
