/**
 * Social Scanner Types
 *
 * Normalized data types for service-level social media scanning.
 * These types provide a consistent interface across all platforms.
 */

// ============================================================================
// Platform Types
// ============================================================================

export type ScannerPlatform = "twitter" | "youtube" | "facebook";

export type ScanStatus = "pending" | "scanning" | "completed" | "failed" | "rate_limited";

// ============================================================================
// Profile Types
// ============================================================================

export interface SocialProfile {
  platform: ScannerPlatform;
  platformId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface TwitterProfile extends SocialProfile {
  platform: "twitter";
  metadata: {
    location?: string;
    website?: string;
    pinnedTweetId?: string;
    listedCount?: number;
  };
}

export interface YouTubeProfile extends SocialProfile {
  platform: "youtube";
  metadata: {
    customUrl?: string;
    country?: string;
    viewCount?: number;
    videoCount?: number;
    hiddenSubscriberCount?: boolean;
  };
}

export interface FacebookProfile extends SocialProfile {
  platform: "facebook";
  metadata: {
    category?: string;
    about?: string;
    website?: string;
    fanCount?: number;
    talkingAboutCount?: number;
  };
}

// ============================================================================
// Post/Content Types
// ============================================================================

export interface SocialPost {
  platform: ScannerPlatform;
  postId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  postUrl: string;
  publishedAt: Date;
  metrics: PostMetrics;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  metadata: Record<string, unknown>;
}

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number | null;
  engagementRate: number | null;
}

export interface TwitterPost extends SocialPost {
  platform: "twitter";
  metadata: {
    replyToTweetId?: string;
    quotedTweetId?: string;
    retweetedTweetId?: string;
    conversationId?: string;
    isRetweet?: boolean;
    isQuote?: boolean;
    isReply?: boolean;
  };
}

export interface YouTubeVideo extends SocialPost {
  platform: "youtube";
  metadata: {
    title: string;
    description: string;
    thumbnailUrl?: string;
    duration?: string;
    categoryId?: string;
    tags?: string[];
    privacyStatus?: string;
    defaultLanguage?: string;
  };
}

export interface FacebookPost extends SocialPost {
  platform: "facebook";
  metadata: {
    type?: string;
    attachments?: Array<{
      type: string;
      url?: string;
      title?: string;
    }>;
    reactions?: {
      like?: number;
      love?: number;
      haha?: number;
      wow?: number;
      sad?: number;
      angry?: number;
    };
  };
}

// ============================================================================
// Search/Mention Types
// ============================================================================

export interface BrandMention {
  platform: ScannerPlatform;
  postId: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorFollowers: number;
  postUrl: string;
  publishedAt: Date;
  sentiment: "positive" | "neutral" | "negative" | "unrecognized" | null;
  metrics: PostMetrics;
  matchedKeywords: string[];
  metadata: Record<string, unknown>;
}

// ============================================================================
// Scan Result Types
// ============================================================================

export interface ScanResult<T> {
  success: boolean;
  platform: ScannerPlatform;
  data: T | null;
  error: ScanError | null;
  scannedAt: Date;
  rateLimitInfo: RateLimitInfo | null;
}

export interface ScanError {
  code: string;
  message: string;
  retryable: boolean;
  retryAfter: number | null;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface ProfileScanResult extends ScanResult<SocialProfile> {
  data: SocialProfile | null;
}

export interface PostsScanResult extends ScanResult<SocialPost[]> {
  data: SocialPost[] | null;
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number | null;
  } | null;
}

export interface MentionsScanResult extends ScanResult<BrandMention[]> {
  data: BrandMention[] | null;
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number | null;
  } | null;
}

// ============================================================================
// Batch Scan Types
// ============================================================================

export interface BatchScanRequest {
  brandId: string;
  platforms: ScannerPlatform[];
  handles: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
  };
  options?: {
    includeProfile?: boolean;
    includePosts?: boolean;
    includeMentions?: boolean;
    postsLimit?: number;
    mentionsLimit?: number;
    keywords?: string[];
  };
}

export interface BatchScanResult {
  brandId: string;
  startedAt: Date;
  completedAt: Date;
  results: {
    twitter?: PlatformScanResult;
    youtube?: PlatformScanResult;
    facebook?: PlatformScanResult;
  };
  summary: {
    totalFollowers: number;
    totalPosts: number;
    totalEngagement: number;
    averageEngagementRate: number;
    platformsScanned: number;
    platformsFailed: number;
  };
}

export interface PlatformScanResult {
  status: ScanStatus;
  profile: SocialProfile | null;
  recentPosts: SocialPost[];
  mentions: BrandMention[];
  error: ScanError | null;
  scannedAt: Date;
}

// ============================================================================
// Scanner Interface
// ============================================================================

export interface SocialScanner {
  platform: ScannerPlatform;

  isConfigured(): boolean;

  getProfile(handle: string): Promise<ProfileScanResult>;

  getRecentPosts(
    userId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PostsScanResult>;

  searchMentions(
    keywords: string[],
    options?: { limit?: number; cursor?: string; since?: Date }
  ): Promise<MentionsScanResult>;
}

// ============================================================================
// Database Types (for storing scan results)
// ============================================================================

export interface ServiceScanRecord {
  id: string;
  brandId: string;
  platform: ScannerPlatform;
  handle: string;
  status: ScanStatus;
  profileData: SocialProfile | null;
  postsData: SocialPost[] | null;
  mentionsData: BrandMention[] | null;
  errorMessage: string | null;
  scannedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Engagement Calculation Helpers
// ============================================================================

export function calculateEngagementRate(
  metrics: PostMetrics,
  followerCount: number
): number {
  if (followerCount === 0) return 0;

  const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
  return (totalEngagement / followerCount) * 100;
}

export function aggregateMetrics(posts: SocialPost[]): {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  averageEngagement: number;
} {
  const totals = posts.reduce(
    (acc, post) => ({
      totalLikes: acc.totalLikes + post.metrics.likes,
      totalComments: acc.totalComments + post.metrics.comments,
      totalShares: acc.totalShares + post.metrics.shares,
      totalViews: acc.totalViews + (post.metrics.views || 0),
    }),
    { totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0 }
  );

  const averageEngagement = posts.length > 0
    ? (totals.totalLikes + totals.totalComments + totals.totalShares) / posts.length
    : 0;

  return { ...totals, averageEngagement };
}
