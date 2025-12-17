/**
 * Twitter/X Scanner
 *
 * Service-level Twitter scanner using Twitter API v2 with Bearer Token.
 * No user OAuth required for public data access.
 *
 * Rate Limits (Free Tier):
 * - User lookup: 300 requests/15 min
 * - User timeline: 1500 requests/15 min
 * - Search tweets: 450 requests/15 min
 */

import { TwitterApi, TweetV2, UserV2 } from "twitter-api-v2";
import { SocialScannerBase } from "../scanner-base";
import { getTwitterCredentials } from "../config";
import type {
  ServiceScanPlatform,
  SocialProfile,
  TwitterProfile,
  SocialPost,
  TwitterPost,
  SocialMention,
  PostType,
  MentionSentiment,
} from "../types";

export class TwitterScanner extends SocialScannerBase {
  platform: ServiceScanPlatform = "twitter";
  private client: TwitterApi | null = null;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient(): void {
    const credentials = getTwitterCredentials();
    if (credentials) {
      this.client = new TwitterApi(credentials.bearerToken);
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
      throw new Error("Twitter API not configured");
    }

    const user = await this.client.v2.userByUsername(handle, {
      "user.fields": [
        "id",
        "name",
        "username",
        "description",
        "profile_image_url",
        "public_metrics",
        "verified",
        "verified_type",
        "location",
        "url",
        "created_at",
        "protected",
        "pinned_tweet_id",
      ],
    });

    if (!user.data) {
      throw new Error("User not found");
    }

    return this.transformUserToProfile(user.data);
  }

  private transformUserToProfile(user: UserV2): TwitterProfile {
    const metrics = user.public_metrics || {
      followers_count: 0,
      following_count: 0,
      tweet_count: 0,
      listed_count: 0,
    };

    return {
      platform: "twitter",
      platformId: user.id,
      handle: user.username,
      displayName: user.name,
      bio: user.description,
      followerCount: metrics.followers_count ?? 0,
      followingCount: metrics.following_count ?? 0,
      postCount: metrics.tweet_count ?? 0,
      isVerified: user.verified || false,
      profileUrl: `https://twitter.com/${user.username}`,
      avatarUrl: user.profile_image_url?.replace("_normal", "_400x400"),
      location: user.location,
      website: user.url,
      createdAt: user.created_at ? new Date(user.created_at) : undefined,
      platformSpecific: {
        listedCount: metrics.listed_count,
        pinnedTweetId: user.pinned_tweet_id,
        protected: user.protected,
      },
    };
  }

  // ============================================================================
  // Posts/Tweets Fetching
  // ============================================================================

  protected async fetchRecentPosts(
    handle: string,
    maxPosts: number
  ): Promise<SocialPost[]> {
    if (!this.client) {
      throw new Error("Twitter API not configured");
    }

    // First get user ID
    const user = await this.client.v2.userByUsername(handle);
    if (!user.data) {
      throw new Error("User not found");
    }

    // Get user's tweets
    const tweets = await this.client.v2.userTimeline(user.data.id, {
      max_results: Math.min(maxPosts, 100), // API max is 100
      "tweet.fields": [
        "id",
        "text",
        "created_at",
        "public_metrics",
        "entities",
        "attachments",
        "conversation_id",
        "in_reply_to_user_id",
        "referenced_tweets",
        "lang",
      ],
      expansions: ["referenced_tweets.id", "attachments.media_keys"],
      "media.fields": ["type", "url", "preview_image_url"],
    });

    if (!tweets.data?.data) {
      return [];
    }

    return tweets.data.data.map((tweet) =>
      this.transformTweetToPost(tweet, user.data!)
    );
  }

  private transformTweetToPost(tweet: TweetV2, user: UserV2): TwitterPost {
    const metrics = tweet.public_metrics || {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
      bookmark_count: 0,
    };

    // Determine post type
    let postType: PostType = "text";
    let isRepost = false;
    let originalPostId: string | undefined;

    if (tweet.referenced_tweets) {
      const refType = tweet.referenced_tweets[0]?.type;
      if (refType === "retweeted") {
        postType = "retweet";
        isRepost = true;
        originalPostId = tweet.referenced_tweets[0]?.id;
      } else if (refType === "quoted") {
        postType = "quote";
      }
    }

    // Extract hashtags and mentions
    const hashtags = tweet.entities?.hashtags?.map((h) => h.tag) || [];
    const mentions = tweet.entities?.mentions?.map((m) => m.username) || [];

    // Extract media URLs
    const mediaUrls = tweet.entities?.urls
      ?.filter((u) => u.expanded_url?.includes("pic.twitter.com"))
      .map((u) => u.expanded_url || "") || [];

    return {
      platform: "twitter",
      postId: tweet.id,
      authorId: user.id,
      authorHandle: user.username,
      authorName: user.name,
      content: tweet.text,
      postType,
      publishedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
      engagement: {
        likes: metrics.like_count,
        comments: metrics.reply_count,
        shares: metrics.retweet_count + metrics.quote_count,
        impressions: (tweet.public_metrics as Record<string, number> | undefined)?.impression_count,
      },
      postUrl: `https://twitter.com/${user.username}/status/${tweet.id}`,
      mediaUrls,
      hashtags,
      mentions,
      isRepost,
      originalPostId,
      platformSpecific: {
        retweetCount: metrics.retweet_count,
        quoteCount: metrics.quote_count,
        replyCount: metrics.reply_count,
        bookmarkCount: metrics.bookmark_count,
        conversationId: tweet.conversation_id,
        inReplyToUserId: tweet.in_reply_to_user_id,
        language: tweet.lang,
      },
    };
  }

  // ============================================================================
  // Mentions/Search
  // ============================================================================

  protected async fetchMentions(
    query: string,
    maxMentions: number,
    sinceDays: number
  ): Promise<SocialMention[]> {
    if (!this.client) {
      throw new Error("Twitter API not configured");
    }

    // Calculate start time
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - sinceDays);

    // Search for mentions of the brand
    // Exclude retweets to get unique mentions
    const searchQuery = `${query} -is:retweet`;

    const searchResult = await this.client.v2.search(searchQuery, {
      max_results: Math.min(maxMentions, 100),
      start_time: startTime.toISOString(),
      "tweet.fields": [
        "id",
        "text",
        "created_at",
        "public_metrics",
        "author_id",
        "entities",
        "lang",
      ],
      expansions: ["author_id"],
      "user.fields": [
        "id",
        "username",
        "name",
        "public_metrics",
        "verified",
        "profile_image_url",
      ],
    });

    if (!searchResult.data?.data) {
      return [];
    }

    // Create user lookup map
    const userMap = new Map<string, UserV2>();
    if (searchResult.includes?.users) {
      for (const user of searchResult.includes.users) {
        userMap.set(user.id, user);
      }
    }

    return searchResult.data.data.map((tweet) => {
      const author = userMap.get(tweet.author_id || "");
      return this.transformTweetToMention(tweet, author, query);
    });
  }

  private transformTweetToMention(
    tweet: TweetV2,
    author: UserV2 | undefined,
    searchQuery: string
  ): SocialMention {
    const metrics = tweet.public_metrics || {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
    };

    const authorMetrics = author?.public_metrics || {
      followers_count: 0,
    };

    // Basic sentiment analysis based on common patterns
    const sentiment = this.analyzeSentiment(tweet.text);

    return {
      platform: "twitter",
      postId: tweet.id,
      authorId: author?.id || tweet.author_id || "unknown",
      authorHandle: author?.username || "unknown",
      authorName: author?.name,
      authorFollowers: authorMetrics.followers_count,
      authorVerified: author?.verified || false,
      content: tweet.text,
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      engagement: {
        likes: metrics.like_count,
        comments: metrics.reply_count,
        shares: metrics.retweet_count + metrics.quote_count,
      },
      mentionedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
      postUrl: `https://twitter.com/${author?.username || "i"}/status/${tweet.id}`,
      matchedKeywords: [searchQuery],
      mentionType: tweet.text.includes(`@${searchQuery}`)
        ? "direct"
        : tweet.text.includes(`#${searchQuery}`)
          ? "hashtag"
          : "keyword",
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

    // Positive indicators
    const positiveWords = [
      "love",
      "great",
      "amazing",
      "awesome",
      "excellent",
      "fantastic",
      "wonderful",
      "best",
      "happy",
      "thank",
      "recommend",
      "impressed",
      "perfect",
      "brilliant",
    ];

    // Negative indicators
    const negativeWords = [
      "hate",
      "terrible",
      "awful",
      "worst",
      "bad",
      "poor",
      "disappointed",
      "frustrat",
      "annoyed",
      "angry",
      "scam",
      "avoid",
      "never",
      "horrible",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowercaseText.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lowercaseText.includes(word)) negativeCount++;
    }

    // Calculate score (-1 to 1)
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
export const twitterScanner = new TwitterScanner();
