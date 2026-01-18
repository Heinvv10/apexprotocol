/**
 * Social Media Strategy API Endpoint
 *
 * GET /api/recommendations/social-media
 * - Query params: platform (optional), all (true/false)
 * - Returns platform-specific GEO recommendations for social media
 *
 * GET /api/recommendations/social-media/action-plan
 * - Query params: platform (required)
 * - Returns actionable social media implementation plan
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllSocialMediaStrategies,
  getSocialMediaStrategy,
  generateActionPlan,
  type SocialPlatform,
} from "@/lib/recommendations/social-media-guide";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getUserId } from "@/lib/auth/clerk";

/**
 * GET - Retrieve social media strategies
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform") as SocialPlatform | null;
    const all = searchParams.get("all") === "true";
    const actionPlan = searchParams.get("action-plan") === "true";

    // Validate platform parameter
    const validPlatforms = ["linkedin", "twitter", "youtube", "tiktok", "instagram", "facebook"];

    if (!all && !platform) {
      return NextResponse.json(
        { error: "Either 'platform' or 'all=true' parameter is required" },
        { status: 400 }
      );
    }

    if (platform && !validPlatforms.includes(platform)) {
      return NextResponse.json({ error: `Invalid platform: ${platform}` }, { status: 400 });
    }

    // Generate response based on request
    if (actionPlan && platform) {
      // Return action plan for specific platform
      const plan = generateActionPlan(platform);
      if (!plan) {
        return NextResponse.json({ error: `No action plan available for ${platform}` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: plan,
        metadata: {
          platform,
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    } else if (platform) {
      // Return strategy for single platform
      const strategy = getSocialMediaStrategy(platform);
      if (!strategy) {
        return NextResponse.json({ error: `Strategy not found for platform: ${platform}` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: strategy,
        metadata: {
          platform,
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    } else {
      // Return all strategies
      const strategies = getAllSocialMediaStrategies();

      return NextResponse.json({
        success: true,
        data: {
          strategies,
          summary: {
            totalPlatforms: strategies.length,
            platforms: strategies.map((s) => s.platform),
            coverage: "LinkedIn (full), Twitter/X (full), YouTube (full), TikTok (basic), Instagram (basic), Facebook (basic)",
          },
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    }
  } catch (error) {
    console.error("Social media strategy API error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve social media strategies",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
