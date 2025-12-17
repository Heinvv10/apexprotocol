/**
 * Twitter Scanner
 *
 * Service-level Twitter/X scanning using Bearer Token (App-Only Authentication).
 * Uses twitter-api-v2 package for API access.
 *
 * Free tier limits:
 * - 450 requests per 15-minute window
 * - User lookup, tweets, search available
 */

import { TwitterApi, type TweetV2, type ReferencedTweetV2 } from "twitter-api-v2";
import type {
  SocialScanner,
  ProfileScanResult,
  PostsScanResult,
  MentionsScanResult,
  TwitterProfile,
  TwitterPost,
  BrandMention,
  ScanError,
  RateLimitInfo,
} from "../types";
import {
  getTwitterBearerToken,
  TWITTER_CONFIG,
  PLATFORM_URLS,
  ERROR_CODES,
} from "../config";

// ============================================================================
// Twitter Scanner Implementation
// ============================================================================

class TwitterScannerImpl implements SocialScanner {
  platform = "twitter" as const;
  private client: TwitterApi | null = null;

  isConfigured(): boolean {
    return TWITTER_CONFIG.isConfigured;
  }

  private getClient(): TwitterApi {
    if (!this.client) {
      const bearerToken = getTwitterBearerToken();
      if (!bearerToken) {
        throw new Error("Twitter Bearer Token not configured");
      }
      this.client = new TwitterApi(bearerToken);
    }
    return this.client;
  }

  /**
   * Get Twitter profile by handle
   */
  async getProfile(handle: string): Promise<ProfileScanResult> {
    const scannedAt = new Date();

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "twitter",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Twitter API not configured. Set TWITTER_BEARER_TOKEN environment variable.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
      };
    }

    // Normalize handle (remove @ if present)
    const normalizedHandle = handle.replace(/^@/, "");

    try {
      const client = this.getClient();
      const response = await client.v2.userByUsername(normalizedHandle, {
        "user.fields": [
          "id",
          "name",
          "username",
          "description",
          "profile_image_url",
          "verified",
          "public_metrics",
          "created_at",
          "location",
          "url",
          "pinned_tweet_id",
        ],
      });

      if (!response.data) {
        return {
          success: false,
          platform: "twitter",
          data: null,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `Twitter user @${normalizedHandle} not found`,
            retryable: false,
            retryAfter: null,
          },
          scannedAt,
          rateLimitInfo: null,
        };
      }

      const user = response.data;
      const metrics = user.public_metrics || {
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
        listed_count: 0,
      };

      const profile: TwitterProfile = {
        platform: "twitter",
        platformId: user.id,
        username: user.username,
        displayName: user.name,
        bio: user.description || null,
        avatarUrl: user.profile_image_url?.replace("_normal", "_400x400") || null,
        profileUrl: PLATFORM_URLS.twitter.profile(user.username),
        isVerified: user.verified || false,
        followerCount: metrics.followers_count ?? 0,
        followingCount: metrics.following_count ?? 0,
        postCount: metrics.tweet_count ?? 0,
        createdAt: user.created_at ? new Date(user.created_at) : null,
        metadata: {
          location: user.location,
          website: user.url,
          pinnedTweetId: user.pinned_tweet_id,
          listedCount: metrics.listed_count,
        },
      };

      return {
        success: true,
        platform: "twitter",
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
   * Get recent tweets for a user
   */
  async getRecentPosts(
    userId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PostsScanResult> {
    const scannedAt = new Date();
    const limit = options?.limit || 20;

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "twitter",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Twitter API not configured. Set TWITTER_BEARER_TOKEN environment variable.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
        pagination: null,
      };
    }

    try {
      const client = this.getClient();
      const response = await client.v2.userTimeline(userId, {
        max_results: Math.min(limit, 100),
        pagination_token: options?.cursor,
        "tweet.fields": [
          "id",
          "text",
          "created_at",
          "public_metrics",
          "entities",
          "referenced_tweets",
          "conversation_id",
          "author_id",
        ],
        expansions: ["author_id"],
        "user.fields": ["username"],
      });

      const authorMap = new Map<string, string>();
      if (response.includes?.users) {
        for (const user of response.includes.users) {
          authorMap.set(user.id, user.username);
        }
      }

      // Access tweets from paginator - response.data.data contains the array
      const tweets: TweetV2[] = response.data?.data ?? [];
      const posts: TwitterPost[] = tweets.map((tweet: TweetV2) => {
        const metrics = tweet.public_metrics || {
          like_count: 0,
          reply_count: 0,
          retweet_count: 0,
          impression_count: 0,
        };

        const authorUsername = authorMap.get(tweet.author_id || userId) || "unknown";

        // Extract hashtags and mentions
        const hashtags: string[] = [];
        const mentions: string[] = [];
        const mediaUrls: string[] = [];

        if (tweet.entities) {
          if (tweet.entities.hashtags) {
            for (const h of tweet.entities.hashtags) {
              hashtags.push(h.tag);
            }
          }
          if (tweet.entities.mentions) {
            for (const m of tweet.entities.mentions) {
              mentions.push(m.username);
            }
          }
          if (tweet.entities.urls) {
            for (const u of tweet.entities.urls) {
              if (u.media_key) {
                mediaUrls.push(u.expanded_url || u.url);
              }
            }
          }
        }

        // Check for retweets, quotes, replies
        const referencedTweets: ReferencedTweetV2[] = tweet.referenced_tweets || [];
        const isRetweet = referencedTweets.some((rt: ReferencedTweetV2) => rt.type === "retweeted");
        const isQuote = referencedTweets.some((rt: ReferencedTweetV2) => rt.type === "quoted");
        const isReply = referencedTweets.some((rt: ReferencedTweetV2) => rt.type === "replied_to");

        return {
          platform: "twitter" as const,
          postId: tweet.id,
          authorId: tweet.author_id || userId,
          authorUsername,
          content: tweet.text,
          postUrl: PLATFORM_URLS.twitter.tweet(authorUsername, tweet.id),
          publishedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          metrics: {
            likes: metrics.like_count,
            comments: metrics.reply_count,
            shares: metrics.retweet_count,
            views: metrics.impression_count || null,
            engagementRate: null,
          },
          mediaUrls,
          hashtags,
          mentions,
          metadata: {
            conversationId: tweet.conversation_id,
            isRetweet,
            isQuote,
            isReply,
            replyToTweetId: referencedTweets.find((rt: ReferencedTweetV2) => rt.type === "replied_to")?.id,
            quotedTweetId: referencedTweets.find((rt: ReferencedTweetV2) => rt.type === "quoted")?.id,
            retweetedTweetId: referencedTweets.find((rt: ReferencedTweetV2) => rt.type === "retweeted")?.id,
          },
        };
      });

      return {
        success: true,
        platform: "twitter",
        data: posts,
        error: null,
        scannedAt,
        rateLimitInfo: null,
        pagination: {
          hasMore: !!response.meta?.next_token,
          nextCursor: response.meta?.next_token || null,
          totalCount: response.meta?.result_count || posts.length,
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
        platform: "twitter",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "Twitter API not configured. Set TWITTER_BEARER_TOKEN environment variable.",
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
        platform: "twitter",
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

    try {
      const client = this.getClient();

      // Build query: combine keywords with OR
      const query = keywords.map((k) => `"${k}"`).join(" OR ");

      const response = await client.v2.search(query, {
        max_results: Math.min(limit, 100),
        next_token: options?.cursor,
        start_time: options?.since?.toISOString(),
        "tweet.fields": [
          "id",
          "text",
          "created_at",
          "public_metrics",
          "entities",
          "author_id",
        ],
        expansions: ["author_id"],
        "user.fields": ["username", "name", "public_metrics"],
      });

      const userMap = new Map<string, { username: string; name: string; followers: number }>();
      if (response.includes?.users) {
        for (const user of response.includes.users) {
          userMap.set(user.id, {
            username: user.username,
            name: user.name,
            followers: user.public_metrics?.followers_count || 0,
          });
        }
      }

      // Access tweets from search response - response.data.data contains the array
      const searchTweets: TweetV2[] = response.data?.data ?? [];
      const mentions: BrandMention[] = searchTweets.map((tweet: TweetV2) => {
        const metrics = tweet.public_metrics || {
          like_count: 0,
          reply_count: 0,
          retweet_count: 0,
          impression_count: 0,
        };

        const author = userMap.get(tweet.author_id || "") || {
          username: "unknown",
          name: "Unknown",
          followers: 0,
        };

        // Determine which keywords matched
        const matchedKeywords = keywords.filter((kw) =>
          tweet.text.toLowerCase().includes(kw.toLowerCase())
        );

        return {
          platform: "twitter" as const,
          postId: tweet.id,
          content: tweet.text,
          authorId: tweet.author_id || "",
          authorUsername: author.username,
          authorDisplayName: author.name,
          authorFollowers: author.followers,
          postUrl: PLATFORM_URLS.twitter.tweet(author.username, tweet.id),
          publishedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          sentiment: null, // Would need AI analysis
          metrics: {
            likes: metrics.like_count,
            comments: metrics.reply_count,
            shares: metrics.retweet_count,
            views: metrics.impression_count || null,
            engagementRate: null,
          },
          matchedKeywords,
          metadata: {},
        };
      });

      return {
        success: true,
        platform: "twitter",
        data: mentions,
        error: null,
        scannedAt,
        rateLimitInfo: null,
        pagination: {
          hasMore: !!response.meta?.next_token,
          nextCursor: response.meta?.next_token || null,
          totalCount: response.meta?.result_count || mentions.length,
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
  private handleError(
    error: unknown,
    scannedAt: Date
  ): ProfileScanResult {
    const scanError = this.parseError(error);
    return {
      success: false,
      platform: "twitter",
      data: null,
      error: scanError,
      scannedAt,
      rateLimitInfo: this.extractRateLimitInfo(error),
    };
  }

  private parseError(error: unknown): ScanError {
    if (error instanceof Error) {
      const message = error.message;

      // Twitter API v2 rate limit error
      if (message.includes("429") || message.includes("Too Many Requests")) {
        return {
          code: ERROR_CODES.RATE_LIMITED,
          message: "Twitter rate limit exceeded. Try again later.",
          retryable: true,
          retryAfter: 15 * 60, // 15 minutes
        };
      }

      // Unauthorized error
      if (message.includes("401") || message.includes("Unauthorized")) {
        return {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "Twitter API authorization failed. Check Bearer Token.",
          retryable: false,
          retryAfter: null,
        };
      }

      // User not found
      if (message.includes("404") || message.includes("Not Found")) {
        return {
          code: ERROR_CODES.NOT_FOUND,
          message: "Twitter user not found",
          retryable: false,
          retryAfter: null,
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
      message: "Unknown Twitter API error",
      retryable: true,
      retryAfter: 60,
    };
  }

  private extractRateLimitInfo(error: unknown): RateLimitInfo | null {
    // Twitter API v2 includes rate limit headers in errors
    // This would need to be extracted from the error response headers
    // For now, return estimated limits
    return null;
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const TwitterScanner = new TwitterScannerImpl();
