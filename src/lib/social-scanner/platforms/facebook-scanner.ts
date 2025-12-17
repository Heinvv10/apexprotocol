/**
 * Facebook Scanner
 *
 * Service-level Facebook scanning using Graph API with App Token.
 * Uses direct HTTP calls to Graph API.
 *
 * Free tier limits:
 * - 200 requests per hour for page data
 * - App Access Token (app_id|app_secret) for public page data
 *
 * Note: Facebook Graph API only allows access to PUBLIC pages.
 * Personal profiles require user OAuth tokens.
 */

import type {
  SocialScanner,
  ProfileScanResult,
  PostsScanResult,
  MentionsScanResult,
  FacebookProfile,
  FacebookPost,
  BrandMention,
  ScanError,
} from "../types";
import {
  getFacebookAppToken,
  FACEBOOK_CONFIG,
  PLATFORM_URLS,
  ERROR_CODES,
} from "../config";

// ============================================================================
// Types for Facebook Graph API Responses
// ============================================================================

interface FacebookPageResponse {
  id: string;
  name: string;
  username?: string;
  about?: string;
  description?: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
  picture?: {
    data: {
      url: string;
    };
  };
  link?: string;
  website?: string;
  talking_about_count?: number;
  posts_count?: number;
}

interface FacebookPostResponse {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  shares?: {
    count: number;
  };
  reactions?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  type?: string;
  permalink_url?: string;
  attachments?: {
    data: Array<{
      type: string;
      url?: string;
      title?: string;
    }>;
  };
}

interface FacebookPagingResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

interface FacebookSearchResponse {
  data: Array<{
    id: string;
    name: string;
    category?: string;
    picture?: {
      data: {
        url: string;
      };
    };
    link?: string;
    fan_count?: number;
  }>;
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

// ============================================================================
// Facebook Scanner Implementation
// ============================================================================

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

class FacebookScannerImpl implements SocialScanner {
  platform = "facebook" as const;

  isConfigured(): boolean {
    return FACEBOOK_CONFIG.isConfigured;
  }

  /**
   * Get Facebook page profile by ID or username
   */
  async getProfile(handle: string): Promise<ProfileScanResult> {
    const scannedAt = new Date();

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Facebook API not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
      };
    }

    const appToken = getFacebookAppToken();
    if (!appToken) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Facebook App Token could not be generated.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
      };
    }

    try {
      // Try direct page lookup
      const fields = [
        "id",
        "name",
        "username",
        "about",
        "description",
        "category",
        "fan_count",
        "followers_count",
        "picture.type(large)",
        "link",
        "website",
        "talking_about_count",
      ].join(",");

      const url = `${GRAPH_API_BASE}/${encodeURIComponent(handle)}?fields=${fields}&access_token=${appToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error) {
        // If not found by ID/username, try searching
        if (data.error?.code === 803 || data.error?.code === 100) {
          return this.searchAndGetProfile(handle, appToken, scannedAt);
        }

        return {
          success: false,
          platform: "facebook",
          data: null,
          error: this.parseGraphApiError(data.error),
          scannedAt,
          rateLimitInfo: null,
        };
      }

      const page = data as FacebookPageResponse;
      const profile: FacebookProfile = {
        platform: "facebook",
        platformId: page.id,
        username: page.username || page.id,
        displayName: page.name,
        bio: page.about || page.description || null,
        avatarUrl: page.picture?.data?.url || null,
        profileUrl: page.link || PLATFORM_URLS.facebook.page(page.id),
        isVerified: false, // Not available via basic Graph API
        followerCount: page.followers_count || page.fan_count || 0,
        followingCount: 0, // Pages don't follow others
        postCount: 0, // Not directly available
        createdAt: null, // Not available via basic Graph API
        metadata: {
          category: page.category,
          about: page.about,
          website: page.website,
          fanCount: page.fan_count,
          talkingAboutCount: page.talking_about_count,
        },
      };

      return {
        success: true,
        platform: "facebook",
        data: profile,
        error: null,
        scannedAt,
        rateLimitInfo: null,
      };
    } catch (error) {
      return this.handleError(error, scannedAt);
    }
  }

  /**
   * Search for page and get profile
   */
  private async searchAndGetProfile(
    query: string,
    appToken: string,
    scannedAt: Date
  ): Promise<ProfileScanResult> {
    try {
      const searchUrl = `${GRAPH_API_BASE}/pages/search?q=${encodeURIComponent(query)}&fields=id,name,category,picture,link,fan_count&access_token=${appToken}`;

      const searchResponse = await fetch(searchUrl);
      const searchData = (await searchResponse.json()) as FacebookSearchResponse;

      if (!searchResponse.ok || !searchData.data?.length) {
        return {
          success: false,
          platform: "facebook",
          data: null,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `Facebook page "${query}" not found`,
            retryable: false,
            retryAfter: null,
          },
          scannedAt,
          rateLimitInfo: null,
        };
      }

      // Get full details for the first match
      const pageId = searchData.data[0].id;
      const fields = [
        "id",
        "name",
        "username",
        "about",
        "description",
        "category",
        "fan_count",
        "followers_count",
        "picture.type(large)",
        "link",
        "website",
        "talking_about_count",
      ].join(",");

      const pageUrl = `${GRAPH_API_BASE}/${pageId}?fields=${fields}&access_token=${appToken}`;
      const pageResponse = await fetch(pageUrl);
      const page = (await pageResponse.json()) as FacebookPageResponse;

      if (!pageResponse.ok) {
        return {
          success: false,
          platform: "facebook",
          data: null,
          error: {
            code: ERROR_CODES.API_ERROR,
            message: "Failed to fetch page details",
            retryable: true,
            retryAfter: 60,
          },
          scannedAt,
          rateLimitInfo: null,
        };
      }

      const profile: FacebookProfile = {
        platform: "facebook",
        platformId: page.id,
        username: page.username || page.id,
        displayName: page.name,
        bio: page.about || page.description || null,
        avatarUrl: page.picture?.data?.url || null,
        profileUrl: page.link || PLATFORM_URLS.facebook.page(page.id),
        isVerified: false,
        followerCount: page.followers_count || page.fan_count || 0,
        followingCount: 0,
        postCount: 0,
        createdAt: null,
        metadata: {
          category: page.category,
          about: page.about,
          website: page.website,
          fanCount: page.fan_count,
          talkingAboutCount: page.talking_about_count,
        },
      };

      return {
        success: true,
        platform: "facebook",
        data: profile,
        error: null,
        scannedAt,
        rateLimitInfo: null,
      };
    } catch (error) {
      return this.handleError(error, scannedAt);
    }
  }

  /**
   * Get recent posts for a page
   *
   * Note: With App Token, you can only get PUBLIC posts from PUBLIC pages.
   * Private pages or user profiles require user OAuth tokens.
   */
  async getRecentPosts(
    pageId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PostsScanResult> {
    const scannedAt = new Date();
    const limit = options?.limit || 20;

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Facebook API not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
        pagination: null,
      };
    }

    const appToken = getFacebookAppToken();
    if (!appToken) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Facebook App Token could not be generated.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
        pagination: null,
      };
    }

    try {
      const fields = [
        "id",
        "message",
        "created_time",
        "full_picture",
        "shares",
        "reactions.summary(true)",
        "comments.summary(true)",
        "type",
        "permalink_url",
        "attachments{type,url,title}",
      ].join(",");

      let url = `${GRAPH_API_BASE}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${appToken}`;

      if (options?.cursor) {
        url += `&after=${options.cursor}`;
      }

      const response = await fetch(url);
      const data = (await response.json()) as FacebookPagingResponse<FacebookPostResponse> & { error?: { message: string; code: number } };

      if (!response.ok || data.error) {
        return {
          success: false,
          platform: "facebook",
          data: null,
          error: this.parseGraphApiError(data.error),
          scannedAt,
          rateLimitInfo: null,
          pagination: null,
        };
      }

      // Get page name for author info
      const pageInfoUrl = `${GRAPH_API_BASE}/${pageId}?fields=name,username&access_token=${appToken}`;
      const pageInfoResponse = await fetch(pageInfoUrl);
      const pageInfo = (await pageInfoResponse.json()) as { name?: string; username?: string };
      const pageName = pageInfo.name || pageInfo.username || pageId;

      const posts: FacebookPost[] = (data.data || []).map((post) => {
        const mediaUrls: string[] = [];
        if (post.full_picture) {
          mediaUrls.push(post.full_picture);
        }

        // Extract hashtags from message
        const hashtags: string[] = [];
        const mentions: string[] = [];
        if (post.message) {
          const hashtagMatches = post.message.match(/#[\w]+/g) || [];
          hashtags.push(...hashtagMatches.map((h) => h.slice(1)));

          // Extract @mentions
          const mentionMatches = post.message.match(/@[\w.]+/g) || [];
          mentions.push(...mentionMatches.map((m) => m.slice(1)));
        }

        return {
          platform: "facebook" as const,
          postId: post.id,
          authorId: pageId,
          authorUsername: pageName,
          content: post.message || "",
          postUrl: post.permalink_url || PLATFORM_URLS.facebook.post(pageId, post.id.split("_")[1] || post.id),
          publishedAt: new Date(post.created_time),
          metrics: {
            likes: post.reactions?.summary?.total_count || 0,
            comments: post.comments?.summary?.total_count || 0,
            shares: post.shares?.count || 0,
            views: null,
            engagementRate: null,
          },
          mediaUrls,
          hashtags,
          mentions,
          metadata: {
            type: post.type,
            attachments: post.attachments?.data,
          },
        };
      });

      return {
        success: true,
        platform: "facebook",
        data: posts,
        error: null,
        scannedAt,
        rateLimitInfo: null,
        pagination: {
          hasMore: !!data.paging?.next,
          nextCursor: data.paging?.cursors?.after || null,
          totalCount: null, // Facebook doesn't provide total count
        },
      };
    } catch (error) {
      const result = this.handleError(error, scannedAt);
      return {
        ...result,
        data: null,
        pagination: null,
      };
    }
  }

  /**
   * Search for brand mentions
   *
   * Note: Facebook's public content search is very limited.
   * This primarily searches for public pages mentioning keywords.
   */
  async searchMentions(
    keywords: string[],
    options?: { limit?: number; cursor?: string; since?: Date }
  ): Promise<MentionsScanResult> {
    const scannedAt = new Date();
    const limit = options?.limit || 50;

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Facebook API not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
        pagination: null,
      };
    }

    if (keywords.length === 0) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.INVALID_HANDLE,
          message: "At least one keyword is required for mention search",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
        pagination: null,
      };
    }

    const appToken = getFacebookAppToken();
    if (!appToken) {
      return {
        success: false,
        platform: "facebook",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Facebook App Token could not be generated.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
        pagination: null,
      };
    }

    try {
      // Facebook Graph API doesn't support general content search with App Token
      // We can only search for pages. For actual post mentions, you'd need
      // user OAuth or Facebook's Business API with special permissions.

      // Search for pages mentioning the keywords
      const query = keywords.join(" ");
      const searchUrl = `${GRAPH_API_BASE}/pages/search?q=${encodeURIComponent(query)}&fields=id,name,category,picture,link,fan_count,about&limit=${limit}&access_token=${appToken}`;

      const response = await fetch(searchUrl);
      const data = (await response.json()) as FacebookSearchResponse & { error?: { message: string; code: number } };

      if (!response.ok || data.error) {
        return {
          success: false,
          platform: "facebook",
          data: null,
          error: this.parseGraphApiError(data.error),
          scannedAt,
          rateLimitInfo: null,
          pagination: null,
        };
      }

      // Convert page results to "mentions" (pages that might be related)
      const mentions: BrandMention[] = (data.data || []).map((page) => {
        const matchedKeywords = keywords.filter(
          (kw) =>
            page.name?.toLowerCase().includes(kw.toLowerCase()) ||
            page.category?.toLowerCase().includes(kw.toLowerCase())
        );

        return {
          platform: "facebook" as const,
          postId: page.id,
          content: `Page: ${page.name}${page.category ? ` (${page.category})` : ""}`,
          authorId: page.id,
          authorUsername: page.name,
          authorDisplayName: page.name,
          authorFollowers: page.fan_count || 0,
          postUrl: page.link || PLATFORM_URLS.facebook.page(page.id),
          publishedAt: new Date(), // Pages don't have a published date
          sentiment: null,
          metrics: {
            likes: page.fan_count || 0,
            comments: 0,
            shares: 0,
            views: null,
            engagementRate: null,
          },
          matchedKeywords,
          metadata: {
            type: "page",
            category: page.category,
          },
        };
      });

      return {
        success: true,
        platform: "facebook",
        data: mentions,
        error: null,
        scannedAt,
        rateLimitInfo: null,
        pagination: {
          hasMore: !!data.paging?.next,
          nextCursor: data.paging?.cursors?.after || null,
          totalCount: null,
        },
      };
    } catch (error) {
      const result = this.handleError(error, scannedAt);
      return {
        ...result,
        data: null,
        pagination: null,
      };
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, scannedAt: Date): ProfileScanResult {
    const scanError = this.parseError(error);
    return {
      success: false,
      platform: "facebook",
      data: null,
      error: scanError,
      scannedAt,
      rateLimitInfo: null,
    };
  }

  private parseGraphApiError(error?: { message: string; code: number }): ScanError {
    if (!error) {
      return {
        code: ERROR_CODES.API_ERROR,
        message: "Unknown Facebook API error",
        retryable: true,
        retryAfter: 60,
      };
    }

    // Rate limit
    if (error.code === 4 || error.code === 17 || error.code === 341) {
      return {
        code: ERROR_CODES.RATE_LIMITED,
        message: "Facebook rate limit exceeded. Try again later.",
        retryable: true,
        retryAfter: 60 * 60, // 1 hour
      };
    }

    // Unauthorized / Invalid token
    if (error.code === 190 || error.code === 102) {
      return {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Facebook API authorization failed. Check App ID and Secret.",
        retryable: false,
        retryAfter: null,
      };
    }

    // Not found
    if (error.code === 803 || error.code === 100) {
      return {
        code: ERROR_CODES.NOT_FOUND,
        message: "Facebook page not found",
        retryable: false,
        retryAfter: null,
      };
    }

    return {
      code: ERROR_CODES.API_ERROR,
      message: error.message || "Facebook API error",
      retryable: true,
      retryAfter: 60,
    };
  }

  private parseError(error: unknown): ScanError {
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("ETIMEDOUT") || message.includes("ECONNREFUSED")) {
        return {
          code: ERROR_CODES.NETWORK_ERROR,
          message: "Network error connecting to Facebook API",
          retryable: true,
          retryAfter: 30,
        };
      }

      return {
        code: ERROR_CODES.API_ERROR,
        message: message,
        retryable: true,
        retryAfter: 60,
      };
    }

    return {
      code: ERROR_CODES.API_ERROR,
      message: "Unknown Facebook API error",
      retryable: true,
      retryAfter: 60,
    };
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const FacebookScanner = new FacebookScannerImpl();
