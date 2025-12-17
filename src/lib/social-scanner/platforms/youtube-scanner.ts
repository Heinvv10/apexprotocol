/**
 * YouTube Scanner
 *
 * Service-level YouTube scanner using YouTube Data API v3 with API Key.
 * No user OAuth required for public data access.
 *
 * Quota Usage (Free: 10,000 units/day):
 * - Search: 100 units per request
 * - Channels.list: 1 unit per request
 * - Videos.list: 1 unit per request
 */

import { google, youtube_v3 } from "googleapis";
import { SocialScannerBase } from "../scanner-base";
import { getYouTubeCredentials } from "../config";
import type {
  ServiceScanPlatform,
  SocialProfile,
  YouTubeProfile,
  SocialPost,
  YouTubeVideo,
  SocialMention,
  MentionSentiment,
} from "../types";

export class YouTubeScanner extends SocialScannerBase {
  platform: ServiceScanPlatform = "youtube";
  private client: youtube_v3.Youtube | null = null;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient(): void {
    const credentials = getYouTubeCredentials();
    if (credentials) {
      this.client = google.youtube({
        version: "v3",
        auth: credentials.apiKey,
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  // ============================================================================
  // Profile Fetching
  // ============================================================================

  protected async fetchProfile(handle: string): Promise<SocialProfile> {
    if (!this.client) {
      throw new Error("YouTube API not configured");
    }

    // Try to find channel by custom URL or handle
    let channelId: string | null = null;

    // If handle looks like a channel ID (starts with UC), use it directly
    if (handle.startsWith("UC") && handle.length === 24) {
      channelId = handle;
    } else {
      // Search for the channel
      const searchResponse = await this.client.search.list({
        part: ["snippet"],
        q: handle,
        type: ["channel"],
        maxResults: 5,
      });

      // Find exact match by custom URL or title
      const normalizedHandle = handle.toLowerCase().replace(/^@/, "");
      const channel = searchResponse.data.items?.find((item) => {
        const title = item.snippet?.channelTitle?.toLowerCase() || "";
        const customUrl = item.snippet?.customUrl?.toLowerCase().replace(/^@/, "") || "";
        return (
          customUrl === normalizedHandle ||
          title === normalizedHandle ||
          title.includes(normalizedHandle)
        );
      });

      channelId = channel?.snippet?.channelId || searchResponse.data.items?.[0]?.snippet?.channelId || null;
    }

    if (!channelId) {
      throw new Error("Channel not found");
    }

    // Get full channel details
    const channelResponse = await this.client.channels.list({
      part: ["snippet", "statistics", "brandingSettings", "contentDetails"],
      id: [channelId],
    });

    const channelData = channelResponse.data.items?.[0];
    if (!channelData) {
      throw new Error("Channel not found");
    }

    return this.transformChannelToProfile(channelData);
  }

  private transformChannelToProfile(
    channel: youtube_v3.Schema$Channel
  ): YouTubeProfile {
    const snippet = channel.snippet || {};
    const statistics = channel.statistics || {};
    const branding = channel.brandingSettings?.channel || {};

    return {
      platform: "youtube",
      platformId: channel.id || "",
      handle: snippet.customUrl?.replace(/^@/, "") || channel.id || "",
      displayName: snippet.title || "",
      bio: snippet.description || undefined,
      followerCount: parseInt(statistics.subscriberCount || "0", 10),
      followingCount: 0, // YouTube doesn't have following concept
      postCount: parseInt(statistics.videoCount || "0", 10),
      isVerified: false, // YouTube verification not available via API
      profileUrl: `https://youtube.com/channel/${channel.id}`,
      avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      bannerUrl: branding.bannerExternalUrl,
      location: snippet.country,
      website: branding.unsubscribedTrailer, // Not ideal, but closest to website
      createdAt: snippet.publishedAt ? new Date(snippet.publishedAt) : undefined,
      platformSpecific: {
        channelId: channel.id || "",
        subscriberCount: parseInt(statistics.subscriberCount || "0", 10),
        videoCount: parseInt(statistics.videoCount || "0", 10),
        viewCount: parseInt(statistics.viewCount || "0", 10),
        customUrl: snippet.customUrl,
        country: snippet.country,
      },
    };
  }

  // ============================================================================
  // Videos Fetching
  // ============================================================================

  protected async fetchRecentPosts(
    handle: string,
    maxPosts: number
  ): Promise<SocialPost[]> {
    if (!this.client) {
      throw new Error("YouTube API not configured");
    }

    // Get channel ID first
    const profile = await this.fetchProfile(handle);
    const channelId = profile.platformSpecific?.channelId as string;

    if (!channelId) {
      throw new Error("Channel ID not found");
    }

    // Get channel's uploads playlist
    const channelResponse = await this.client.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });

    const uploadsPlaylistId =
      channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return [];
    }

    // Get videos from uploads playlist
    const playlistResponse = await this.client.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(maxPosts, 50), // API max is 50
    });

    if (!playlistResponse.data.items) {
      return [];
    }

    // Get video statistics (need separate call)
    const videoIds = playlistResponse.data.items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id);

    const videosResponse = await this.client.videos.list({
      part: ["statistics", "contentDetails", "snippet"],
      id: videoIds,
    });

    const videoStats = new Map<string, youtube_v3.Schema$Video>();
    for (const video of videosResponse.data.items || []) {
      if (video.id) {
        videoStats.set(video.id, video);
      }
    }

    return playlistResponse.data.items.map((item) => {
      const videoId = item.contentDetails?.videoId || "";
      const stats = videoStats.get(videoId);
      return this.transformVideoToPost(item, stats, profile);
    });
  }

  private transformVideoToPost(
    playlistItem: youtube_v3.Schema$PlaylistItem,
    video: youtube_v3.Schema$Video | undefined,
    profile: YouTubeProfile
  ): YouTubeVideo {
    const snippet = playlistItem.snippet || {};
    const videoSnippet = video?.snippet || {};
    const statistics = video?.statistics || {};
    const contentDetails = video?.contentDetails || {};
    const videoId = playlistItem.contentDetails?.videoId || "";

    return {
      platform: "youtube",
      postId: videoId,
      authorId: profile.platformId,
      authorHandle: profile.handle,
      authorName: profile.displayName,
      content: snippet.title || "",
      postType: "video",
      publishedAt: snippet.publishedAt
        ? new Date(snippet.publishedAt)
        : new Date(),
      engagement: {
        likes: parseInt(statistics.likeCount || "0", 10),
        comments: parseInt(statistics.commentCount || "0", 10),
        shares: 0, // YouTube doesn't expose share count
        views: parseInt(statistics.viewCount || "0", 10),
      },
      postUrl: `https://youtube.com/watch?v=${videoId}`,
      mediaUrls: [snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || ""],
      hashtags: videoSnippet.tags || [],
      mentions: [],
      isRepost: false,
      platformSpecific: {
        videoId,
        channelId: profile.platformId,
        duration: contentDetails.duration,
        definition: contentDetails.definition as "hd" | "sd" | undefined,
        categoryId: videoSnippet.categoryId,
        tags: videoSnippet.tags,
        thumbnail: snippet.thumbnails?.high?.url,
      },
    };
  }

  // ============================================================================
  // Mentions/Search (Comment Search)
  // ============================================================================

  protected async fetchMentions(
    query: string,
    maxMentions: number,
    _sinceDays: number
  ): Promise<SocialMention[]> {
    if (!this.client) {
      throw new Error("YouTube API not configured");
    }

    // Search for videos mentioning the brand
    // Note: YouTube search is expensive (100 quota units per request)
    const searchResponse = await this.client.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults: Math.min(maxMentions, 25), // Limit to conserve quota
      order: "date",
      publishedAfter: new Date(Date.now() - _sinceDays * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!searchResponse.data.items) {
      return [];
    }

    // Get video statistics
    const videoIds = searchResponse.data.items
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    const videosResponse = await this.client.videos.list({
      part: ["statistics", "snippet"],
      id: videoIds,
    });

    const videoStats = new Map<string, youtube_v3.Schema$Video>();
    for (const video of videosResponse.data.items || []) {
      if (video.id) {
        videoStats.set(video.id, video);
      }
    }

    return searchResponse.data.items.map((item) => {
      const videoId = item.id?.videoId || "";
      const video = videoStats.get(videoId);
      return this.transformSearchResultToMention(item, video, query);
    });
  }

  private transformSearchResultToMention(
    searchItem: youtube_v3.Schema$SearchResult,
    video: youtube_v3.Schema$Video | undefined,
    searchQuery: string
  ): SocialMention {
    const snippet = searchItem.snippet || {};
    const statistics = video?.statistics || {};
    const videoId = searchItem.id?.videoId || "";

    // Basic sentiment from title/description
    const combinedText = `${snippet.title || ""} ${snippet.description || ""}`;
    const sentiment = this.analyzeSentiment(combinedText);

    return {
      platform: "youtube",
      postId: videoId,
      authorId: snippet.channelId || "",
      authorHandle: snippet.channelTitle || "",
      authorName: snippet.channelTitle,
      authorFollowers: undefined, // Would require additional API call
      authorVerified: false,
      content: snippet.title || "",
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      engagement: {
        likes: parseInt(statistics.likeCount || "0", 10),
        comments: parseInt(statistics.commentCount || "0", 10),
        shares: 0,
        views: parseInt(statistics.viewCount || "0", 10),
      },
      mentionedAt: snippet.publishedAt
        ? new Date(snippet.publishedAt)
        : new Date(),
      postUrl: `https://youtube.com/watch?v=${videoId}`,
      matchedKeywords: [searchQuery],
      mentionType: "keyword",
    };
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
      "awesome",
      "best",
      "great",
      "excellent",
      "fantastic",
      "incredible",
      "review",
      "recommend",
      "tutorial",
      "how to",
    ];

    const negativeWords = [
      "hate",
      "worst",
      "terrible",
      "scam",
      "avoid",
      "bad",
      "poor",
      "fail",
      "don't buy",
      "disappointed",
      "problem",
      "issue",
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
export const youtubeScanner = new YouTubeScanner();
