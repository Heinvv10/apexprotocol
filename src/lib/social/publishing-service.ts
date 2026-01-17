/**
 * Social Media Publishing Service
 * Handles direct publishing to social platforms using stored OAuth tokens
 */

import { getTokens, updateTokenStatus, type SocialPlatform } from "@/lib/oauth/token-service";

// ============================================================================
// Types
// ============================================================================

export interface PublishRequest {
  brandId: string;
  platform: SocialPlatform;
  accountId?: string;
  content: {
    text: string;
    mediaUrls?: string[];
    mediaType?: "image" | "video";
    link?: string;
    linkTitle?: string;
    linkDescription?: string;
  };
  scheduledAt?: Date;
}

export interface PublishResult {
  success: boolean;
  platform: SocialPlatform;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
  errorCode?: string;
}

interface PlatformPublisher {
  publish(accessToken: string, content: PublishRequest["content"]): Promise<PublishResult>;
}

// ============================================================================
// Platform Publishers
// ============================================================================

/**
 * LinkedIn Publishing
 * Uses LinkedIn Marketing API
 */
async function publishToLinkedIn(
  accessToken: string,
  content: PublishRequest["content"],
  accountId?: string
): Promise<PublishResult> {
  try {
    // Get user/organization URN
    let authorUrn: string;

    if (accountId?.startsWith("urn:")) {
      authorUrn = accountId;
    } else {
      // Fetch user profile to get URN
      const profileRes = await fetch("https://api.linkedin.com/v2/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileRes.ok) {
        throw new Error("Failed to get LinkedIn profile");
      }

      const profile = await profileRes.json();
      authorUrn = `urn:li:person:${profile.id}`;
    }

    // Build post payload
    const payload: Record<string, unknown> = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content.text,
          },
          shareMediaCategory: content.mediaUrls?.length ? "IMAGE" : content.link ? "ARTICLE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // Add article if link provided
    if (content.link) {
      (payload.specificContent as any)["com.linkedin.ugc.ShareContent"].media = [{
        status: "READY",
        originalUrl: content.link,
        title: { text: content.linkTitle || "" },
        description: { text: content.linkDescription || "" },
      }];
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn API error: ${error}`);
    }

    const result = await response.json();
    const postId = result.id || result["X-RestLi-Id"];

    return {
      success: true,
      platform: "linkedin",
      platformPostId: postId,
      postUrl: postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      platform: "linkedin",
      error: error instanceof Error ? error.message : "Failed to publish to LinkedIn",
      errorCode: "LINKEDIN_PUBLISH_ERROR",
    };
  }
}

/**
 * Twitter/X Publishing
 * Uses Twitter API v2
 */
async function publishToTwitter(
  accessToken: string,
  content: PublishRequest["content"]
): Promise<PublishResult> {
  try {
    const payload: Record<string, unknown> = {
      text: content.text,
    };

    // Note: Media upload requires separate endpoint
    // For now, we only support text tweets

    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twitter API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const tweetId = result.data?.id;

    return {
      success: true,
      platform: "twitter",
      platformPostId: tweetId,
      postUrl: tweetId ? `https://twitter.com/i/status/${tweetId}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      platform: "twitter",
      error: error instanceof Error ? error.message : "Failed to publish to Twitter",
      errorCode: "TWITTER_PUBLISH_ERROR",
    };
  }
}

/**
 * Facebook Publishing
 * Uses Facebook Graph API
 */
async function publishToFacebook(
  accessToken: string,
  content: PublishRequest["content"],
  accountId?: string
): Promise<PublishResult> {
  try {
    // Use page ID if provided, otherwise post to user's feed
    const pageId = accountId || "me";

    const payload = new URLSearchParams();
    payload.append("message", content.text);
    payload.append("access_token", accessToken);

    if (content.link) {
      payload.append("link", content.link);
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      body: payload,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const postId = result.id;

    return {
      success: true,
      platform: "facebook",
      platformPostId: postId,
      postUrl: postId ? `https://www.facebook.com/${postId}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      platform: "facebook",
      error: error instanceof Error ? error.message : "Failed to publish to Facebook",
      errorCode: "FACEBOOK_PUBLISH_ERROR",
    };
  }
}

/**
 * Instagram Publishing
 * Uses Instagram Graph API (requires business account)
 */
async function publishToInstagram(
  accessToken: string,
  content: PublishRequest["content"],
  accountId?: string
): Promise<PublishResult> {
  try {
    // Instagram requires media for posts
    if (!content.mediaUrls?.length) {
      return {
        success: false,
        platform: "instagram",
        error: "Instagram requires at least one image or video",
        errorCode: "INSTAGRAM_MEDIA_REQUIRED",
      };
    }

    const igUserId = accountId;
    if (!igUserId) {
      return {
        success: false,
        platform: "instagram",
        error: "Instagram account ID required",
        errorCode: "INSTAGRAM_ACCOUNT_REQUIRED",
      };
    }

    // Step 1: Create media container
    const containerPayload = new URLSearchParams();
    containerPayload.append("image_url", content.mediaUrls[0]);
    containerPayload.append("caption", content.text);
    containerPayload.append("access_token", accessToken);

    const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: "POST",
      body: containerPayload,
    });

    if (!containerRes.ok) {
      const error = await containerRes.json();
      throw new Error(`Instagram container creation failed: ${JSON.stringify(error)}`);
    }

    const containerData = await containerRes.json();
    const containerId = containerData.id;

    // Step 2: Publish the container
    const publishPayload = new URLSearchParams();
    publishPayload.append("creation_id", containerId);
    publishPayload.append("access_token", accessToken);

    const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
      method: "POST",
      body: publishPayload,
    });

    if (!publishRes.ok) {
      const error = await publishRes.json();
      throw new Error(`Instagram publish failed: ${JSON.stringify(error)}`);
    }

    const result = await publishRes.json();
    const mediaId = result.id;

    return {
      success: true,
      platform: "instagram",
      platformPostId: mediaId,
      postUrl: mediaId ? `https://www.instagram.com/p/${mediaId}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      platform: "instagram",
      error: error instanceof Error ? error.message : "Failed to publish to Instagram",
      errorCode: "INSTAGRAM_PUBLISH_ERROR",
    };
  }
}

/**
 * YouTube Publishing
 * Uses YouTube Data API v3
 * Note: Full video upload requires resumable upload which is complex
 * This is a simplified version for setting video metadata
 */
async function publishToYouTube(
  accessToken: string,
  content: PublishRequest["content"]
): Promise<PublishResult> {
  // YouTube video upload is complex and requires different handling
  // This would need resumable uploads for actual video content
  return {
    success: false,
    platform: "youtube",
    error: "YouTube video upload requires direct API integration. Use YouTube Studio for full upload capabilities.",
    errorCode: "YOUTUBE_NOT_IMPLEMENTED",
  };
}

/**
 * TikTok Publishing
 * Uses TikTok Content Posting API
 */
async function publishToTikTok(
  accessToken: string,
  content: PublishRequest["content"]
): Promise<PublishResult> {
  // TikTok video posting requires their Content Posting API
  // which has specific requirements for video format
  return {
    success: false,
    platform: "tiktok",
    error: "TikTok video posting requires direct API integration with their Content Posting API.",
    errorCode: "TIKTOK_NOT_IMPLEMENTED",
  };
}

// ============================================================================
// Main Publishing Service
// ============================================================================

/**
 * Publish content to a social media platform
 */
export async function publishToSocial(request: PublishRequest): Promise<PublishResult> {
  const { brandId, platform, accountId, content } = request;

  // Get stored tokens
  const tokens = await getTokens({
    brandId,
    platform,
    accountId,
  });

  if (!tokens) {
    return {
      success: false,
      platform,
      error: `No connected ${platform} account found for this brand`,
      errorCode: "NO_TOKEN",
    };
  }

  // Check if token is valid
  if (tokens.connectionStatus !== "active") {
    return {
      success: false,
      platform,
      error: `${platform} connection is ${tokens.connectionStatus}. Please reconnect.`,
      errorCode: "TOKEN_INVALID",
    };
  }

  // Check if token is expired
  if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
    await updateTokenStatus({
      tokenId: tokens.id,
      status: "expired",
      error: "Token has expired",
    });

    return {
      success: false,
      platform,
      error: `${platform} token has expired. Please reconnect.`,
      errorCode: "TOKEN_EXPIRED",
    };
  }

  const accessToken = tokens.decryptedAccessToken;

  // Route to appropriate platform publisher
  let result: PublishResult;

  switch (platform) {
    case "linkedin":
      result = await publishToLinkedIn(accessToken, content, tokens.accountId || undefined);
      break;
    case "twitter":
      result = await publishToTwitter(accessToken, content);
      break;
    case "facebook":
      result = await publishToFacebook(accessToken, content, tokens.accountId || undefined);
      break;
    case "instagram":
      result = await publishToInstagram(accessToken, content, tokens.accountId || undefined);
      break;
    case "youtube":
      result = await publishToYouTube(accessToken, content);
      break;
    case "tiktok":
      result = await publishToTikTok(accessToken, content);
      break;
    default:
      result = {
        success: false,
        platform,
        error: `Platform ${platform} is not supported for publishing`,
        errorCode: "UNSUPPORTED_PLATFORM",
      };
  }

  // Update connection status if there was an error
  if (!result.success && result.errorCode?.includes("API")) {
    await updateTokenStatus({
      tokenId: tokens.id,
      status: "error",
      error: result.error,
    });
  }

  return result;
}

/**
 * Publish content to multiple platforms
 */
export async function publishToMultiplePlatforms(
  brandId: string,
  platforms: SocialPlatform[],
  content: PublishRequest["content"]
): Promise<Record<SocialPlatform, PublishResult>> {
  const results: Record<string, PublishResult> = {};

  await Promise.all(
    platforms.map(async (platform) => {
      results[platform] = await publishToSocial({
        brandId,
        platform,
        content,
      });
    })
  );

  return results as Record<SocialPlatform, PublishResult>;
}

/**
 * Validate content for a specific platform
 */
export function validateContent(
  platform: SocialPlatform,
  content: PublishRequest["content"]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Platform-specific character limits
  const charLimits: Partial<Record<SocialPlatform, number>> = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    tiktok: 2200,
    youtube: 5000,
  };

  const limit = charLimits[platform];
  if (limit && content.text.length > limit) {
    errors.push(`Text exceeds ${platform} character limit of ${limit}`);
  }

  // Platform-specific requirements
  if (platform === "instagram" && !content.mediaUrls?.length) {
    errors.push("Instagram requires at least one image or video");
  }

  if (platform === "youtube" && !content.mediaUrls?.length) {
    errors.push("YouTube requires a video");
  }

  if (platform === "tiktok" && !content.mediaUrls?.length) {
    errors.push("TikTok requires a video");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
