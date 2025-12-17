/**
 * YouTube Scanner
 *
 * Service-level YouTube scanning using Data API v3 with API Key.
 * Uses googleapis package for API access.
 *
 * Free tier limits:
 * - 10,000 quota units per day
 * - Channel lookup: 1 unit, Search: 100 units, Videos list: 1 unit
 */

import { google, youtube_v3 } from "googleapis";
import type {
  SocialScanner,
  ProfileScanResult,
  PostsScanResult,
  MentionsScanResult,
  YouTubeProfile,
  YouTubeVideo,
  BrandMention,
  ScanError,
  RateLimitInfo,
} from "../types";
import {
  getYouTubeApiKey,
  YOUTUBE_CONFIG,
  PLATFORM_URLS,
  ERROR_CODES,
} from "../config";

// ============================================================================
// YouTube Scanner Implementation
// ============================================================================

class YouTubeScannerImpl implements SocialScanner {
  platform = "youtube" as const;
  private client: youtube_v3.Youtube | null = null;

  isConfigured(): boolean {
    return YOUTUBE_CONFIG.isConfigured;
  }

  private getClient(): youtube_v3.Youtube {
    if (!this.client) {
      const apiKey = getYouTubeApiKey();
      if (!apiKey) {
        throw new Error("YouTube API Key not configured");
      }
      this.client = google.youtube({
        version: "v3",
        auth: apiKey,
      });
    }
    return this.client;
  }

  /**
   * Get YouTube channel profile by handle or channel ID
   */
  async getProfile(handle: string): Promise<ProfileScanResult> {
    const scannedAt = new Date();

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "youtube",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "YouTube API not configured. Set YOUTUBE_API_KEY environment variable.",
          retryable: false,
          retryAfter: null,
        },
        scannedAt,
        rateLimitInfo: null,
      };
    }

    try {
      const client = this.getClient();
      let channelResponse: youtube_v3.Schema$ChannelListResponse | undefined;

      // Normalize handle - remove @ if present
      const normalizedHandle = handle.replace(/^@/, "");

      // Try different lookup strategies
      if (handle.startsWith("UC") && handle.length === 24) {
        // Direct channel ID lookup
        const response = await client.channels.list({
          part: ["snippet", "statistics", "brandingSettings"],
          id: [handle],
        });
        channelResponse = response.data;
      } else {
        // Try handle lookup first (for @handles)
        const response = await client.channels.list({
          part: ["snippet", "statistics", "brandingSettings"],
          forHandle: normalizedHandle,
        });
        channelResponse = response.data;

        // If not found, try username lookup
        if (!channelResponse.items?.length) {
          const usernameResponse = await client.channels.list({
            part: ["snippet", "statistics", "brandingSettings"],
            forUsername: normalizedHandle,
          });
          channelResponse = usernameResponse.data;
        }

        // Last resort: search for the channel
        if (!channelResponse.items?.length) {
          const searchResponse = await client.search.list({
            part: ["snippet"],
            q: normalizedHandle,
            type: ["channel"],
            maxResults: 1,
          });

          if (searchResponse.data.items?.length) {
            const channelId = searchResponse.data.items[0].snippet?.channelId;
            if (channelId) {
              const channelDetailResponse = await client.channels.list({
                part: ["snippet", "statistics", "brandingSettings"],
                id: [channelId],
              });
              channelResponse = channelDetailResponse.data;
            }
          }
        }
      }

      if (!channelResponse?.items?.length) {
        return {
          success: false,
          platform: "youtube",
          data: null,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `YouTube channel "${normalizedHandle}" not found`,
            retryable: false,
            retryAfter: null,
          },
          scannedAt,
          rateLimitInfo: null,
        };
      }

      const channel = channelResponse.items[0];
      const snippet = channel.snippet || {};
      const statistics = channel.statistics || {};
      const branding = channel.brandingSettings?.channel || {};

      const profile: YouTubeProfile = {
        platform: "youtube",
        platformId: channel.id || "",
        username: snippet.customUrl || snippet.title || normalizedHandle,
        displayName: snippet.title || "",
        bio: snippet.description || null,
        avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
        profileUrl: channel.id
          ? PLATFORM_URLS.youtube.channel(channel.id)
          : PLATFORM_URLS.youtube.channelHandle(normalizedHandle),
        isVerified: false, // YouTube doesn't expose verification status via API
        followerCount: parseInt(statistics.subscriberCount || "0", 10),
        followingCount: 0, // YouTube doesn't have following concept
        postCount: parseInt(statistics.videoCount || "0", 10),
        createdAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
        metadata: {
          customUrl: snippet.customUrl,
          country: snippet.country || branding.country,
          viewCount: parseInt(statistics.viewCount || "0", 10),
          videoCount: parseInt(statistics.videoCount || "0", 10),
          hiddenSubscriberCount: statistics.hiddenSubscriberCount || false,
        },
      };

      return {
        success: true,
        platform: "youtube",
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
   * Get recent videos for a channel
   */
  async getRecentPosts(
    channelId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PostsScanResult> {
    const scannedAt = new Date();
    const limit = options?.limit || 20;

    if (!this.isConfigured()) {
      return {
        success: false,
        platform: "youtube",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "YouTube API not configured. Set YOUTUBE_API_KEY environment variable.",
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

      // Get channel's upload playlist
      const channelResponse = await client.channels.list({
        part: ["contentDetails", "snippet"],
        id: [channelId],
      });

      if (!channelResponse.data.items?.length) {
        return {
          success: false,
          platform: "youtube",
          data: null,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `YouTube channel ${channelId} not found`,
            retryable: false,
            retryAfter: null,
          },
          scannedAt,
          rateLimitInfo: null,
          pagination: null,
        };
      }

      const uploadsPlaylistId =
        channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return {
          success: true,
          platform: "youtube",
          data: [],
          error: null,
          scannedAt,
          rateLimitInfo: null,
          pagination: {
            hasMore: false,
            nextCursor: null,
            totalCount: 0,
          },
        };
      }

      const channelUsername =
        channelResponse.data.items[0].snippet?.customUrl ||
        channelResponse.data.items[0].snippet?.title ||
        channelId;

      // Get videos from uploads playlist
      const playlistResponse = await client.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(limit, 50),
        pageToken: options?.cursor,
      });

      const videoIds = (playlistResponse.data.items || [])
        .map((item) => item.contentDetails?.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length === 0) {
        return {
          success: true,
          platform: "youtube",
          data: [],
          error: null,
          scannedAt,
          rateLimitInfo: null,
          pagination: {
            hasMore: false,
            nextCursor: null,
            totalCount: 0,
          },
        };
      }

      // Get detailed video statistics
      const videosResponse = await client.videos.list({
        part: ["snippet", "statistics", "contentDetails"],
        id: videoIds,
      });

      const posts: YouTubeVideo[] = (videosResponse.data.items || []).map((video) => {
        const snippet = video.snippet || {};
        const statistics = video.statistics || {};

        // Extract hashtags from description and tags
        const hashtags: string[] = [];
        const description = snippet.description || "";
        const hashtagMatches = description.match(/#[\w]+/g) || [];
        hashtags.push(...hashtagMatches.map((h) => h.slice(1)));
        if (snippet.tags) {
          hashtags.push(...snippet.tags);
        }

        return {
          platform: "youtube" as const,
          postId: video.id || "",
          authorId: channelId,
          authorUsername: channelUsername,
          content: snippet.description || "",
          postUrl: PLATFORM_URLS.youtube.video(video.id || ""),
          publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
          metrics: {
            likes: parseInt(statistics.likeCount || "0", 10),
            comments: parseInt(statistics.commentCount || "0", 10),
            shares: 0, // YouTube doesn't expose share count
            views: parseInt(statistics.viewCount || "0", 10),
            engagementRate: null,
          },
          mediaUrls: [snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || ""].filter(Boolean),
          hashtags: [...new Set(hashtags)], // Deduplicate
          mentions: [], // YouTube doesn't have @ mentions
          metadata: {
            title: snippet.title || "",
            description: snippet.description || "",
            thumbnailUrl: snippet.thumbnails?.high?.url,
            duration: video.contentDetails?.duration,
            categoryId: snippet.categoryId,
            tags: snippet.tags,
            privacyStatus: video.status?.privacyStatus,
            defaultLanguage: snippet.defaultLanguage,
          },
        };
      });

      return {
        success: true,
        platform: "youtube",
        data: posts,
        error: null,
        scannedAt,
        rateLimitInfo: null,
        pagination: {
          hasMore: !!playlistResponse.data.nextPageToken,
          nextCursor: playlistResponse.data.nextPageToken || null,
          totalCount: playlistResponse.data.pageInfo?.totalResults || posts.length,
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
   * Search for brand mentions in video titles/descriptions
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
        platform: "youtube",
        data: null,
        error: {
          code: ERROR_CODES.NOT_CONFIGURED,
          message: "YouTube API not configured. Set YOUTUBE_API_KEY environment variable.",
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
        platform: "youtube",
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

      // Build search query
      const query = keywords.join(" | ");

      const searchResponse = await client.search.list({
        part: ["snippet"],
        q: query,
        type: ["video"],
        maxResults: Math.min(limit, 50),
        pageToken: options?.cursor,
        publishedAfter: options?.since?.toISOString(),
        order: "date",
      });

      const videoIds = (searchResponse.data.items || [])
        .map((item) => item.id?.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length === 0) {
        return {
          success: true,
          platform: "youtube",
          data: [],
          error: null,
          scannedAt,
          rateLimitInfo: null,
          pagination: {
            hasMore: false,
            nextCursor: null,
            totalCount: 0,
          },
        };
      }

      // Get video statistics
      const videosResponse = await client.videos.list({
        part: ["statistics"],
        id: videoIds,
      });

      const statsMap = new Map<string, youtube_v3.Schema$VideoStatistics>();
      for (const video of videosResponse.data.items || []) {
        if (video.id && video.statistics) {
          statsMap.set(video.id, video.statistics);
        }
      }

      // Get channel subscriber counts for the found videos
      const channelIds = [
        ...new Set(
          (searchResponse.data.items || [])
            .map((item) => item.snippet?.channelId)
            .filter((id): id is string => !!id)
        ),
      ];

      const channelStatsMap = new Map<string, number>();
      if (channelIds.length > 0) {
        const channelsResponse = await client.channels.list({
          part: ["statistics"],
          id: channelIds,
        });
        for (const channel of channelsResponse.data.items || []) {
          if (channel.id && channel.statistics?.subscriberCount) {
            channelStatsMap.set(
              channel.id,
              parseInt(channel.statistics.subscriberCount, 10)
            );
          }
        }
      }

      const mentions: BrandMention[] = (searchResponse.data.items || []).map(
        (item) => {
          const snippet = item.snippet || {};
          const videoId = item.id?.videoId || "";
          const stats = statsMap.get(videoId) || {};
          const channelSubscribers = channelStatsMap.get(snippet.channelId || "") || 0;

          // Determine which keywords matched
          const titleAndDesc = `${snippet.title || ""} ${snippet.description || ""}`.toLowerCase();
          const matchedKeywords = keywords.filter((kw) =>
            titleAndDesc.includes(kw.toLowerCase())
          );

          return {
            platform: "youtube" as const,
            postId: videoId,
            content: `${snippet.title || ""}\n\n${snippet.description || ""}`,
            authorId: snippet.channelId || "",
            authorUsername: snippet.channelTitle || "",
            authorDisplayName: snippet.channelTitle || "",
            authorFollowers: channelSubscribers,
            postUrl: PLATFORM_URLS.youtube.video(videoId),
            publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
            sentiment: null,
            metrics: {
              likes: parseInt(stats.likeCount || "0", 10),
              comments: parseInt(stats.commentCount || "0", 10),
              shares: 0,
              views: parseInt(stats.viewCount || "0", 10),
              engagementRate: null,
            },
            matchedKeywords,
            metadata: {
              title: snippet.title,
              thumbnailUrl: snippet.thumbnails?.high?.url,
            },
          };
        }
      );

      return {
        success: true,
        platform: "youtube",
        data: mentions,
        error: null,
        scannedAt,
        rateLimitInfo: null,
        pagination: {
          hasMore: !!searchResponse.data.nextPageToken,
          nextCursor: searchResponse.data.nextPageToken || null,
          totalCount: searchResponse.data.pageInfo?.totalResults || mentions.length,
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
      platform: "youtube",
      data: null,
      error: scanError,
      scannedAt,
      rateLimitInfo: null,
    };
  }

  private parseError(error: unknown): ScanError {
    if (error instanceof Error) {
      const message = error.message;

      // Quota exceeded
      if (
        message.includes("quotaExceeded") ||
        message.includes("dailyLimitExceeded")
      ) {
        return {
          code: ERROR_CODES.RATE_LIMITED,
          message: "YouTube API quota exceeded for today. Try again tomorrow.",
          retryable: true,
          retryAfter: 24 * 60 * 60, // 24 hours
        };
      }

      // Rate limited
      if (message.includes("403") || message.includes("rateLimitExceeded")) {
        return {
          code: ERROR_CODES.RATE_LIMITED,
          message: "YouTube rate limit exceeded. Try again later.",
          retryable: true,
          retryAfter: 60,
        };
      }

      // Unauthorized
      if (message.includes("401") || message.includes("invalid_api_key")) {
        return {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "YouTube API key is invalid. Check YOUTUBE_API_KEY.",
          retryable: false,
          retryAfter: null,
        };
      }

      // Not found
      if (message.includes("404") || message.includes("channelNotFound")) {
        return {
          code: ERROR_CODES.NOT_FOUND,
          message: "YouTube channel not found",
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
      message: "Unknown YouTube API error",
      retryable: true,
      retryAfter: 60,
    };
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const YouTubeScanner = new YouTubeScannerImpl();
