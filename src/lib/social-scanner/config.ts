/**
 * Social Scanner Configuration
 *
 * Service-level credentials and rate limit configuration.
 * These credentials belong to Apex (not individual users).
 */

import type { ServiceScanPlatform, RateLimitConfig } from "./types";

// ============================================================================
// Service Credentials
// ============================================================================

interface TwitterCredentials {
  bearerToken: string;
}

interface YouTubeCredentials {
  apiKey: string;
}

interface FacebookCredentials {
  appId: string;
  appSecret: string;
  appAccessToken: string;
}

export const getTwitterCredentials = (): TwitterCredentials | null => {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) return null;
  return { bearerToken };
};

export const getYouTubeCredentials = (): YouTubeCredentials | null => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  return { apiKey };
};

export const getFacebookCredentials = (): FacebookCredentials | null => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) return null;

  // App Access Token is simply appId|appSecret
  const appAccessToken = `${appId}|${appSecret}`;
  return { appId, appSecret, appAccessToken };
};

export const isServiceConfigured = (platform: ServiceScanPlatform): boolean => {
  switch (platform) {
    case "twitter":
      return getTwitterCredentials() !== null;
    case "youtube":
      return getYouTubeCredentials() !== null;
    case "facebook":
      return getFacebookCredentials() !== null;
    default:
      return false;
  }
};

export const getConfiguredPlatforms = (): ServiceScanPlatform[] => {
  const platforms: ServiceScanPlatform[] = ["twitter", "youtube", "facebook"];
  return platforms.filter(isServiceConfigured);
};

// ============================================================================
// Rate Limit Configuration
// ============================================================================

// Twitter API v2 Free Tier limits
// https://developer.twitter.com/en/docs/twitter-api/rate-limits
export const TWITTER_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // User lookup: 300 requests per 15 minutes
  userLookup: {
    requestsPerWindow: 300,
    windowDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  // User timeline: 1500 requests per 15 minutes
  userTimeline: {
    requestsPerWindow: 1500,
    windowDurationMs: 15 * 60 * 1000,
  },
  // Search tweets: 450 requests per 15 minutes
  searchTweets: {
    requestsPerWindow: 450,
    windowDurationMs: 15 * 60 * 1000,
  },
};

// YouTube Data API v3 limits
// https://developers.google.com/youtube/v3/getting-started#quota
export const YOUTUBE_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Daily quota: 10,000 units
  // Search: 100 units per request
  search: {
    requestsPerWindow: 100, // Max 100 searches per day (100 * 100 = 10,000 units)
    windowDurationMs: 24 * 60 * 60 * 1000, // 24 hours
    dailyLimit: 10000,
  },
  // Channels.list: 1 unit per request
  channelsList: {
    requestsPerWindow: 10000,
    windowDurationMs: 24 * 60 * 60 * 1000,
    dailyLimit: 10000,
  },
  // Videos.list: 1 unit per request
  videosList: {
    requestsPerWindow: 10000,
    windowDurationMs: 24 * 60 * 60 * 1000,
    dailyLimit: 10000,
  },
};

// Facebook Graph API limits
// https://developers.facebook.com/docs/graph-api/overview/rate-limiting
export const FACEBOOK_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // App-level: 200 requests per hour per user
  default: {
    requestsPerWindow: 200,
    windowDurationMs: 60 * 60 * 1000, // 1 hour
  },
};

export const getRateLimitConfig = (
  platform: ServiceScanPlatform,
  endpoint: string
): RateLimitConfig => {
  switch (platform) {
    case "twitter":
      return TWITTER_RATE_LIMITS[endpoint] || TWITTER_RATE_LIMITS.userLookup;
    case "youtube":
      return YOUTUBE_RATE_LIMITS[endpoint] || YOUTUBE_RATE_LIMITS.channelsList;
    case "facebook":
      return FACEBOOK_RATE_LIMITS[endpoint] || FACEBOOK_RATE_LIMITS.default;
    default:
      return { requestsPerWindow: 60, windowDurationMs: 60 * 1000 };
  }
};

// ============================================================================
// Platform Display Configuration
// ============================================================================

export const PLATFORM_CONFIG: Record<
  ServiceScanPlatform,
  {
    name: string;
    color: string;
    icon: string;
    baseUrl: string;
    profileUrlPattern: string;
  }
> = {
  twitter: {
    name: "Twitter/X",
    color: "#1DA1F2",
    icon: "twitter",
    baseUrl: "https://twitter.com",
    profileUrlPattern: "https://twitter.com/{handle}",
  },
  youtube: {
    name: "YouTube",
    color: "#FF0000",
    icon: "youtube",
    baseUrl: "https://youtube.com",
    profileUrlPattern: "https://youtube.com/@{handle}",
  },
  facebook: {
    name: "Facebook",
    color: "#1877F2",
    icon: "facebook",
    baseUrl: "https://facebook.com",
    profileUrlPattern: "https://facebook.com/{handle}",
  },
};

export const getProfileUrl = (platform: ServiceScanPlatform, handle: string): string => {
  return PLATFORM_CONFIG[platform].profileUrlPattern.replace("{handle}", handle);
};

// ============================================================================
// Scan Scheduling Configuration
// ============================================================================

export const SCAN_CONFIG = {
  // Default interval between automatic scans (in hours)
  defaultScanIntervalHours: 6,

  // Maximum age of cached data before re-scan (in hours)
  maxCacheAgeHours: 12,

  // Maximum number of posts to fetch per scan
  defaultMaxPosts: 50,

  // Maximum number of mentions to search for
  defaultMaxMentions: 100,

  // Days to look back for mentions
  defaultMentionDays: 7,

  // Priority order for scanning (if rate limited, which platform first)
  platformPriority: ["twitter", "youtube", "facebook"] as ServiceScanPlatform[],
};
