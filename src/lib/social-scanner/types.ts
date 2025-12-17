/**
 * Social Scanner Types
 *
 * Normalized data types for service-level social media scanning.
 * These types provide a consistent interface across all platforms.
 */

// Supported platforms for service-level scanning
export type ServiceScanPlatform = "twitter" | "youtube" | "facebook";

// All platforms (including those requiring user OAuth)
export type SocialPlatform =
  | ServiceScanPlatform
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "github"
  | "pinterest"
  | "medium"
  | "reddit";

// ============================================================================
// Profile Types
// ============================================================================

export interface SocialProfile {
  platform: SocialPlatform;
  platformId: string;
  handle: string;
  displayName: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isVerified: boolean;
  profileUrl: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  createdAt?: Date;
  platformSpecific?: Record<string, unknown>;
}

export interface TwitterProfile extends SocialProfile {
  platform: "twitter";
  platformSpecific?: {
    listedCount?: number;
    pinnedTweetId?: string;
    protected?: boolean;
  };
}

export interface YouTubeProfile extends SocialProfile {
  platform: "youtube";
  platformSpecific?: {
    channelId: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    customUrl?: string;
    country?: string;
  };
}

export interface FacebookProfile extends SocialProfile {
  platform: "facebook";
  platformSpecific?: {
    pageId: string;
    fanCount: number;
    category?: string;
    categoryList?: string[];
    about?: string;
    checkins?: number;
  };
}

// ============================================================================
// Post/Content Types
// ============================================================================

export type PostType =
  | "text"
  | "image"
  | "video"
  | "link"
  | "carousel"
  | "poll"
  | "retweet"
  | "quote"
  | "thread";

export interface SocialPost {
  platform: SocialPlatform;
  postId: string;
  authorId: string;
  authorHandle: string;
  authorName?: string;
  content: string;
  postType: PostType;
  publishedAt: Date;
  engagement: PostEngagement;
  postUrl: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  isRepost?: boolean;
  originalPostId?: string;
  platformSpecific?: Record<string, unknown>;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  impressions?: number;
  saves?: number;
  clicks?: number;
}

export interface TwitterPost extends SocialPost {
  platform: "twitter";
  platformSpecific?: {
    retweetCount: number;
    quoteCount: number;
    replyCount: number;
    bookmarkCount?: number;
    conversationId?: string;
    inReplyToUserId?: string;
    language?: string;
  };
}

export interface YouTubeVideo extends SocialPost {
  platform: "youtube";
  postType: "video";
  platformSpecific?: {
    videoId: string;
    channelId: string;
    duration?: string;
    definition?: "hd" | "sd";
    categoryId?: string;
    tags?: string[];
    thumbnail?: string;
  };
}

export interface FacebookPost extends SocialPost {
  platform: "facebook";
  platformSpecific?: {
    reactionsBreakdown?: {
      like: number;
      love: number;
      haha: number;
      wow: number;
      sad: number;
      angry: number;
    };
    statusType?: string;
  };
}

// ============================================================================
// Mention/Search Types
// ============================================================================

export type MentionSentiment = "positive" | "neutral" | "negative";

export interface SocialMention {
  platform: SocialPlatform;
  postId: string;
  authorId: string;
  authorHandle: string;
  authorName?: string;
  authorFollowers?: number;
  authorVerified?: boolean;
  content: string;
  sentiment?: MentionSentiment;
  sentimentScore?: number; // -1 to 1
  engagement: PostEngagement;
  mentionedAt: Date;
  postUrl: string;
  matchedKeywords?: string[];
  mentionType?: "direct" | "hashtag" | "keyword";
}

// ============================================================================
// Scan Request/Response Types
// ============================================================================

export interface ScanRequest {
  brandId: string;
  platform: ServiceScanPlatform;
  handle?: string;
  keywords?: string[];
  scanType: ScanType;
  options?: ScanOptions;
}

export type ScanType = "profile" | "posts" | "mentions" | "full";

export interface ScanOptions {
  maxPosts?: number;
  maxMentions?: number;
  sinceDays?: number;
  includeRetweets?: boolean;
  includeReplies?: boolean;
}

export interface ScanResult<T = unknown> {
  success: boolean;
  platform: ServiceScanPlatform;
  scanType: ScanType;
  data: T;
  scannedAt: Date;
  rateLimitInfo?: RateLimitInfo;
  error?: ScanError;
}

export interface ProfileScanResult extends ScanResult<SocialProfile> {
  scanType: "profile";
}

export interface PostsScanResult extends ScanResult<SocialPost[]> {
  scanType: "posts";
}

export interface MentionsScanResult extends ScanResult<SocialMention[]> {
  scanType: "mentions";
}

export interface FullScanResult extends ScanResult<{
  profile: SocialProfile;
  recentPosts: SocialPost[];
  mentions: SocialMention[];
}> {
  scanType: "full";
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  platform: ServiceScanPlatform;
  endpoint: string;
  limit: number;
  remaining: number;
  resetsAt: Date;
}

export interface RateLimitConfig {
  requestsPerWindow: number;
  windowDurationMs: number;
  dailyLimit?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export type ScanErrorCode =
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PRIVATE_ACCOUNT"
  | "SUSPENDED"
  | "API_ERROR"
  | "INVALID_CREDENTIALS"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface ScanError {
  code: ScanErrorCode;
  message: string;
  retryAfter?: number; // seconds
  platform: ServiceScanPlatform;
  details?: Record<string, unknown>;
}

// ============================================================================
// Scanner Interface
// ============================================================================

export interface ISocialScanner {
  platform: ServiceScanPlatform;
  isConfigured(): boolean;

  // Profile scanning
  getProfile(handle: string): Promise<ScanResult<SocialProfile>>;

  // Posts scanning
  getRecentPosts(handle: string, options?: ScanOptions): Promise<ScanResult<SocialPost[]>>;

  // Mention scanning
  searchMentions(query: string, options?: ScanOptions): Promise<ScanResult<SocialMention[]>>;

  // Full scan (combines all)
  fullScan(handle: string, options?: ScanOptions): Promise<FullScanResult>;
}

// ============================================================================
// Aggregated Types (for dashboard display)
// ============================================================================

export interface AggregatedSocialMetrics {
  totalFollowers: number;
  totalPosts: number;
  avgEngagementRate: number;
  platformBreakdown: {
    platform: ServiceScanPlatform;
    followers: number;
    posts: number;
    engagementRate: number;
    lastUpdated: Date;
  }[];
}

export interface BrandSocialPresence {
  brandId: string;
  profiles: SocialProfile[];
  totalFollowers: number;
  totalEngagement: number;
  platforms: ServiceScanPlatform[];
  lastScanAt: Date;
  nextScanAt?: Date;
}
