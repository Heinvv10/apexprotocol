/**
 * Social Media API Client
 * Centralized functions for calling Social Media-related backend APIs
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

// Social Account Types
export interface SocialAccount {
  id: string;
  platform: string;
  accountHandle?: string;
  accountName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  engagementRate?: number;
  isActive: boolean;
  isVerified?: boolean;
  connectionStatus?: string;
  lastSyncedAt?: string | null;
}

export interface SocialAccountsResponse {
  accounts: SocialAccount[];
  total: number;
}

// Social Mention Types
export interface SocialMention {
  id: string;
  platform: string;
  authorHandle?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content?: string;
  sentiment?: "positive" | "neutral" | "negative";
  sentimentScore?: number;
  engagementLikes?: number;
  engagementShares?: number;
  engagementComments?: number;
  engagementViews?: number;
  postTimestamp?: string;
  postUrl?: string;
}

export interface SocialMentionsResponse {
  mentions: SocialMention[];
  total: number;
}

// Social Metrics Types
export interface SocialMetric {
  id: string;
  platform: string;
  date: string;
  followersCount?: number;
  followersGain?: number;
  engagementRate?: number;
  impressions?: number;
  reach?: number;
  mentionsCount?: number;
  avgSentimentScore?: number;
}

export interface SocialMetricsResponse {
  metrics: SocialMetric[];
  total: number;
}

// Social Summary Types
export interface SocialSummary {
  brandId: string;
  brandName: string;
  summary: {
    smoScore: number;
    smoTrend: "up" | "down" | "stable";
    totalFollowers: number;
    totalEngagements: number;
    avgEngagementRate: number;
    avgSentiment: number;
    connectedAccounts: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
  };
  breakdown: {
    reach: number;
    engagement: number;
    sentiment: number;
    growth: number;
    consistency: number;
  };
  dataSource: "service_scan" | "oauth" | "stored" | "calculated";
  lastUpdated: string;
}

// Social Post Types
export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  publishedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostsResponse {
  posts: SocialPost[];
  total: number;
}

/**
 * Social Media API Functions
 */

export async function getSocialAccounts(brandId: string): Promise<SocialAccountsResponse> {
  // For now, return mock data since Social API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    accounts: [],
    total: 0,
  };
}

export async function getSocialMentions(brandId: string): Promise<SocialMentionsResponse> {
  // For now, return mock data since Social API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    mentions: [],
    total: 0,
  };
}

export async function getSocialMetrics(brandId: string): Promise<SocialMetricsResponse> {
  // For now, return mock data since Social API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    metrics: [],
    total: 0,
  };
}

export async function getSocialSummary(brandId: string): Promise<SocialSummary> {
  // For now, return mock data since Social API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    brandId,
    brandName: "",
    summary: {
      smoScore: 0,
      smoTrend: "stable",
      totalFollowers: 0,
      totalEngagements: 0,
      avgEngagementRate: 0,
      avgSentiment: 0,
      connectedAccounts: 0,
      positiveMentions: 0,
      negativeMentions: 0,
      neutralMentions: 0,
    },
    breakdown: {
      reach: 0,
      engagement: 0,
      sentiment: 50,
      growth: 50,
      consistency: 0,
    },
    dataSource: "calculated",
    lastUpdated: new Date().toISOString(),
  };
}

export async function getSocialPosts(brandId: string): Promise<SocialPostsResponse> {
  // For now, return mock data since Social API may not exist yet
  // TODO: Replace with actual API call when backend is ready
  return {
    posts: [],
    total: 0,
  };
}
