/**
 * Social Media Publishing API
 * POST /api/social/publish
 *
 * Publishes content to connected social media platforms
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth";
import {
  publishToSocial,
  publishToMultiplePlatforms,
  validateContent,
  type PublishRequest,
} from "@/lib/social/publishing-service";
import { type SocialPlatform } from "@/lib/oauth/token-service";

const SUPPORTED_PLATFORMS: SocialPlatform[] = [
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
    const { brandId, platform, platforms, content, accountId, validate } = body;

    // Validate required fields
    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    if (!content || !content.text) {
      return NextResponse.json(
        { error: "Content with text is required" },
        { status: 400 }
      );
    }

    // Determine target platforms
    const targetPlatforms: SocialPlatform[] = platforms || (platform ? [platform] : []);

    if (targetPlatforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform is required" },
        { status: 400 }
      );
    }

    // Validate all platforms are supported
    for (const p of targetPlatforms) {
      if (!SUPPORTED_PLATFORMS.includes(p as SocialPlatform)) {
        return NextResponse.json(
          { error: `Platform '${p}' is not supported` },
          { status: 400 }
        );
      }
    }

    // Validate content if requested
    if (validate) {
      const validationResults: Record<string, { valid: boolean; errors: string[] }> = {};
      let hasErrors = false;

      for (const p of targetPlatforms) {
        const result = validateContent(p as SocialPlatform, content);
        validationResults[p] = result;
        if (!result.valid) {
          hasErrors = true;
        }
      }

      if (hasErrors) {
        return NextResponse.json(
          {
            success: false,
            message: "Content validation failed",
            validation: validationResults,
          },
          { status: 400 }
        );
      }

      // If only validating, return success
      if (validate === "only") {
        return NextResponse.json({
          success: true,
          message: "Content validation passed",
          validation: validationResults,
        });
      }
    }

    // Publish to single platform
    if (targetPlatforms.length === 1) {
      const result = await publishToSocial({
        brandId,
        platform: targetPlatforms[0] as SocialPlatform,
        accountId,
        content,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            errorCode: result.errorCode,
            platform: result.platform,
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully published to ${result.platform}`,
        result,
      });
    }

    // Publish to multiple platforms
    const results = await publishToMultiplePlatforms(
      brandId,
      targetPlatforms as SocialPlatform[],
      content
    );

    // Count successes and failures
    const successCount = Object.values(results).filter((r) => r.success).length;
    const failureCount = Object.values(results).filter((r) => !r.success).length;

    const status = successCount > 0 ? 200 : 422;

    return NextResponse.json(
      {
        success: successCount > 0,
        message:
          failureCount === 0
            ? `Successfully published to ${successCount} platform(s)`
            : successCount > 0
              ? `Published to ${successCount} platform(s), failed on ${failureCount}`
              : `Failed to publish to all ${failureCount} platform(s)`,
        results,
        summary: {
          total: targetPlatforms.length,
          successful: successCount,
          failed: failureCount,
        },
      },
      { status }
    );
  } catch (error) {
    console.error("[Social Publish] Error:", error);
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/publish
 * Get publishing capabilities and limits for each platform
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return platform publishing capabilities
    const platforms = {
      linkedin: {
        supported: true,
        characterLimit: 3000,
        mediaSupport: {
          images: true,
          videos: true,
          maxImages: 9,
        },
        features: ["text", "link", "images", "video"],
      },
      twitter: {
        supported: true,
        characterLimit: 280,
        mediaSupport: {
          images: true,
          videos: true,
          maxImages: 4,
        },
        features: ["text", "images", "video", "polls"],
      },
      facebook: {
        supported: true,
        characterLimit: 63206,
        mediaSupport: {
          images: true,
          videos: true,
          maxImages: 10,
        },
        features: ["text", "link", "images", "video"],
      },
      instagram: {
        supported: true,
        characterLimit: 2200,
        mediaSupport: {
          images: true,
          videos: true,
          maxImages: 10,
        },
        features: ["images", "video", "reels", "stories"],
        requirements: ["Media is required for all posts"],
      },
      youtube: {
        supported: false,
        characterLimit: 5000,
        mediaSupport: {
          images: false,
          videos: true,
          maxImages: 0,
        },
        features: ["video"],
        requirements: ["Video upload requires YouTube Studio"],
        note: "Full video upload not yet implemented. Use YouTube Studio.",
      },
      tiktok: {
        supported: false,
        characterLimit: 2200,
        mediaSupport: {
          images: false,
          videos: true,
          maxImages: 0,
        },
        features: ["video"],
        requirements: ["Video required for all posts"],
        note: "Video upload not yet implemented. Use TikTok app.",
      },
    };

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error("[Social Publish] Error:", error);
    return NextResponse.json(
      { error: "Failed to get publishing capabilities" },
      { status: 500 }
    );
  }
}
