/**
 * Facebook Scanner
 *
 * Service-level Facebook scanner using Graph API with App Access Token.
 * Limited to public page data (no user profiles without OAuth).
 *
 * Rate Limits:
 * - 200 requests per hour for app-level requests
 *
 * Limitations:
 * - Can only access public Facebook Pages
 * - Cannot access personal profiles
 * - Cannot search across all posts
 * - Must know the Page ID or username
 */

import { SocialScannerBase } from "../scanner-base";
import { getFacebookCredentials } from "../config";
import type {
  ServiceScanPlatform,
  SocialProfile,
  FacebookProfile,
  SocialPost,
  FacebookPost,
  SocialMention,
  PostType,
  MentionSentiment,
} from "../types";

const GRAPH_API_VERSION = "v22.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface FacebookPageResponse {
  id: string;
  name: string;
  username?: string;
  about?: string;
  description?: string;
  fan_count?: number;
  followers_count?: number;
  category?: string;
  category_list?: Array<{ id: string; name: string }>;
  link?: string;
  website?: string;
  location?: {
    city?: string;
    country?: string;
    street?: string;
  };
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
  cover?: {
    source: string;
  };
  verification_status?: string;
  is_verified?: boolean;
  checkins?: number;
}

interface FacebookPostResponse {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  full_picture?: string;
  permalink_url?: string;
  shares?: { count: number };
  reactions?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  status_type?: string;
  type?: string;
  attachments?: {
    data: Array<{
      type: string;
      url?: string;
      media?: { image: { src: string } };
    }>;
  };
}

interface FacebookFeedResponse {
  data: FacebookPostResponse[];
  paging?: {
    next?: string;
    cursors?: { before: string; after: string };
  };
}

export class FacebookScanner extends SocialScannerBase {
  platform: ServiceScanPlatform = "facebook";
  private accessToken: string | null = null;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient(): void {
    const credentials = getFacebookCredentials();
    if (credentials) {
      this.accessToken = credentials.appAccessToken;
    }
  }

  isConfigured(): boolean {
    return this.accessToken !== null;
  }

  // ============================================================================
  // API Helper
  // ============================================================================

  private async graphRequest<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("Facebook API not configured");
    }

    const url = new URL(`${GRAPH_API_BASE}${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage =
        error.error?.message || `Facebook API error: ${response.status}`;

      if (response.status === 404) {
        throw new Error("Page not found");
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (response.status === 190 || response.status === 401) {
        throw new Error("Invalid access token");
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ============================================================================
  // Profile Fetching
  // ============================================================================

  protected async fetchProfile(handle: string): Promise<SocialProfile> {
    // Try to fetch page by ID or username
    const fields = [
      "id",
      "name",
      "username",
      "about",
      "description",
      "fan_count",
      "followers_count",
      "category",
      "category_list",
      "link",
      "website",
      "location",
      "picture.width(400).height(400)",
      "cover",
      "verification_status",
      "is_verified",
      "checkins",
    ].join(",");

    const page = await this.graphRequest<FacebookPageResponse>(`/${handle}`, {
      fields,
    });

    return this.transformPageToProfile(page);
  }

  private transformPageToProfile(page: FacebookPageResponse): FacebookProfile {
    const location = page.location
      ? [page.location.city, page.location.country].filter(Boolean).join(", ")
      : undefined;

    return {
      platform: "facebook",
      platformId: page.id,
      handle: page.username || page.id,
      displayName: page.name,
      bio: page.about || page.description,
      followerCount: page.followers_count || page.fan_count || 0,
      followingCount: 0, // Pages don't follow others
      postCount: 0, // Would require additional API call
      isVerified: page.is_verified || false,
      profileUrl: page.link || `https://facebook.com/${page.username || page.id}`,
      avatarUrl: page.picture?.data?.url,
      bannerUrl: page.cover?.source,
      location,
      website: page.website,
      platformSpecific: {
        pageId: page.id,
        fanCount: page.fan_count || 0,
        category: page.category,
        categoryList: page.category_list?.map((c) => c.name),
        about: page.about,
        checkins: page.checkins,
      },
    };
  }

  // ============================================================================
  // Posts Fetching
  // ============================================================================

  protected async fetchRecentPosts(
    handle: string,
    maxPosts: number
  ): Promise<SocialPost[]> {
    const fields = [
      "id",
      "message",
      "story",
      "created_time",
      "full_picture",
      "permalink_url",
      "shares",
      "reactions.summary(true)",
      "comments.summary(true)",
      "status_type",
      "type",
      "attachments{type,url,media}",
    ].join(",");

    const feed = await this.graphRequest<FacebookFeedResponse>(
      `/${handle}/posts`,
      {
        fields,
        limit: Math.min(maxPosts, 100).toString(),
      }
    );

    // Get page info for author details
    const profile = await this.fetchProfile(handle);

    return feed.data.map((post) => this.transformPostToSocialPost(post, profile));
  }

  private transformPostToSocialPost(
    post: FacebookPostResponse,
    profile: FacebookProfile
  ): FacebookPost {
    // Determine post type
    let postType: PostType = "text";
    if (post.type === "photo" || post.full_picture) {
      postType = "image";
    } else if (post.type === "video") {
      postType = "video";
    } else if (post.type === "link") {
      postType = "link";
    }

    // Extract media URLs
    const mediaUrls: string[] = [];
    if (post.full_picture) {
      mediaUrls.push(post.full_picture);
    }
    if (post.attachments?.data) {
      for (const attachment of post.attachments.data) {
        if (attachment.media?.image?.src) {
          mediaUrls.push(attachment.media.image.src);
        }
      }
    }

    return {
      platform: "facebook",
      postId: post.id,
      authorId: profile.platformId,
      authorHandle: profile.handle,
      authorName: profile.displayName,
      content: post.message || post.story || "",
      postType,
      publishedAt: new Date(post.created_time),
      engagement: {
        likes: post.reactions?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
      },
      postUrl:
        post.permalink_url ||
        `https://facebook.com/${profile.handle}/posts/${post.id.split("_")[1]}`,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      hashtags: this.extractHashtags(post.message || ""),
      mentions: this.extractMentions(post.message || ""),
      isRepost: false,
      platformSpecific: {
        statusType: post.status_type,
      },
    };
  }

  private extractHashtags(text: string): string[] {
    const matches = text.match(/#\w+/g);
    return matches ? matches.map((h) => h.slice(1)) : [];
  }

  private extractMentions(text: string): string[] {
    const matches = text.match(/@\w+/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
  }

  // ============================================================================
  // Mentions/Search
  // ============================================================================

  protected async fetchMentions(
    query: string,
    maxMentions: number,
    _sinceDays: number
  ): Promise<SocialMention[]> {
    // Facebook Graph API doesn't support searching across all public posts
    // with just an App Access Token. This would require:
    // 1. User OAuth to search their feed
    // 2. Page Insights for page-specific data
    // 3. Third-party services for broader search

    // For now, return empty array with a note about limitations
    console.warn(
      "Facebook mention search requires user OAuth or third-party service. " +
        "Returning empty results for service-level scan."
    );

    // We could potentially search for tagged posts on a known page
    // but that's very limited. For comprehensive Facebook mentions,
    // users would need to connect their accounts (Premium feature).

    return [];
  }

  // ============================================================================
  // Additional Methods
  // ============================================================================

  /**
   * Get page insights (requires Page Access Token, not App Token)
   * This is a placeholder for when user OAuth is available
   */
  async getPageInsights(
    _pageId: string,
    _metrics: string[]
  ): Promise<Record<string, unknown> | null> {
    // This would require a Page Access Token from user OAuth
    console.warn("Page insights require user OAuth (Premium feature)");
    return null;
  }

  /**
   * Search for public pages by name
   */
  async searchPages(query: string, limit = 10): Promise<FacebookProfile[]> {
    try {
      const response = await this.graphRequest<{
        data: FacebookPageResponse[];
      }>("/search", {
        q: query,
        type: "page",
        limit: limit.toString(),
        fields: "id,name,username,fan_count,category,picture.width(400)",
      });

      return response.data.map((page) => this.transformPageToProfile(page));
    } catch {
      // Page search might be restricted
      return [];
    }
  }

  // ============================================================================
  // Sentiment Analysis (Basic)
  // ============================================================================

  private analyzeSentiment(text: string): {
    label: MentionSentiment;
    score: number;
  } {
    const lowercaseText = text.toLowerCase();

    const positiveWords = [
      "love",
      "amazing",
      "great",
      "awesome",
      "excellent",
      "thank",
      "perfect",
      "best",
      "happy",
      "wonderful",
    ];

    const negativeWords = [
      "hate",
      "terrible",
      "awful",
      "worst",
      "bad",
      "disappointed",
      "angry",
      "poor",
      "scam",
      "avoid",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowercaseText.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lowercaseText.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { label: "neutral", score: 0 };
    }

    const score = (positiveCount - negativeCount) / total;

    if (score > 0.2) {
      return { label: "positive", score };
    } else if (score < -0.2) {
      return { label: "negative", score };
    }

    return { label: "neutral", score };
  }
}

// Export singleton instance
export const facebookScanner = new FacebookScanner();
