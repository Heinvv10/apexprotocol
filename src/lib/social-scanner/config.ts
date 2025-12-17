/**
 * Social Scanner Configuration
 *
 * Service-level credential configuration for scanning public social data.
 * These are Apex's own API keys, not user-specific OAuth tokens.
 */

import type { ScannerPlatform } from "./types";

// ============================================================================
// Environment Variable Configuration
// ============================================================================

export interface PlatformConfig {
  platform: ScannerPlatform;
  isConfigured: boolean;
  rateLimits: {
    requestsPerWindow: number;
    windowMs: number;
    dailyLimit: number | null;
  };
}

/**
 * Twitter/X API v2 Configuration
 * - Free tier: 450 requests per 15-minute window
 * - Uses Bearer Token for app-only authentication
 */
export const TWITTER_CONFIG: PlatformConfig = {
  platform: "twitter",
  isConfigured: !!process.env.TWITTER_BEARER_TOKEN,
  rateLimits: {
    requestsPerWindow: 450,
    windowMs: 15 * 60 * 1000, // 15 minutes
    dailyLimit: null,
  },
};

/**
 * YouTube Data API v3 Configuration
 * - Free tier: 10,000 quota units per day
 * - Uses API Key for public data access
 */
export const YOUTUBE_CONFIG: PlatformConfig = {
  platform: "youtube",
  isConfigured: !!process.env.YOUTUBE_API_KEY,
  rateLimits: {
    requestsPerWindow: 100, // Conservative estimate
    windowMs: 60 * 1000, // 1 minute
    dailyLimit: 10000, // Quota units
  },
};

/**
 * Facebook Graph API Configuration
 * - Uses App Access Token (app_id|app_secret)
 * - Rate limit: 200 requests per hour for page data
 */
export const FACEBOOK_CONFIG: PlatformConfig = {
  platform: "facebook",
  isConfigured: !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET,
  rateLimits: {
    requestsPerWindow: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
    dailyLimit: null,
  },
};

// ============================================================================
// Credential Accessors
// ============================================================================

export function getTwitterBearerToken(): string | null {
  return process.env.TWITTER_BEARER_TOKEN || null;
}

export function getYouTubeApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

export function getFacebookAppToken(): string | null {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) return null;

  // Facebook App Access Token format
  return `${appId}|${appSecret}`;
}

// ============================================================================
// Configuration Helpers
// ============================================================================

export function getPlatformConfig(platform: ScannerPlatform): PlatformConfig {
  switch (platform) {
    case "twitter":
      return TWITTER_CONFIG;
    case "youtube":
      return YOUTUBE_CONFIG;
    case "facebook":
      return FACEBOOK_CONFIG;
  }
}

export function isServiceScannerConfigured(platform: ScannerPlatform): boolean {
  return getPlatformConfig(platform).isConfigured;
}

export function getConfiguredPlatforms(): ScannerPlatform[] {
  const platforms: ScannerPlatform[] = ["twitter", "youtube", "facebook"];
  return platforms.filter(isServiceScannerConfigured);
}

export function getUnconfiguredPlatforms(): ScannerPlatform[] {
  const platforms: ScannerPlatform[] = ["twitter", "youtube", "facebook"];
  return platforms.filter((p) => !isServiceScannerConfigured(p));
}

// ============================================================================
// Platform URL Helpers
// ============================================================================

export const PLATFORM_URLS = {
  twitter: {
    profile: (handle: string) => `https://twitter.com/${handle}`,
    tweet: (handle: string, tweetId: string) => `https://twitter.com/${handle}/status/${tweetId}`,
  },
  youtube: {
    channel: (channelId: string) => `https://youtube.com/channel/${channelId}`,
    channelHandle: (handle: string) => `https://youtube.com/@${handle}`,
    video: (videoId: string) => `https://youtube.com/watch?v=${videoId}`,
  },
  facebook: {
    page: (pageId: string) => `https://facebook.com/${pageId}`,
    post: (pageId: string, postId: string) => `https://facebook.com/${pageId}/posts/${postId}`,
  },
};

// ============================================================================
// Cache TTL Configuration
// ============================================================================

export const CACHE_TTL = {
  profile: 6 * 60 * 60 * 1000, // 6 hours
  posts: 1 * 60 * 60 * 1000, // 1 hour
  mentions: 30 * 60 * 1000, // 30 minutes
};

// ============================================================================
// Default Scan Options
// ============================================================================

export const DEFAULT_SCAN_OPTIONS = {
  postsLimit: 20,
  mentionsLimit: 50,
  includeProfile: true,
  includePosts: true,
  includeMentions: true,
};

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  NOT_CONFIGURED: "SCANNER_NOT_CONFIGURED",
  RATE_LIMITED: "RATE_LIMIT_EXCEEDED",
  NOT_FOUND: "PROFILE_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED_ACCESS",
  API_ERROR: "API_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_HANDLE: "INVALID_HANDLE",
  PARSE_ERROR: "RESPONSE_PARSE_ERROR",
};

// ============================================================================
// Documentation Links
// ============================================================================

export const API_DOCS = {
  twitter: {
    portal: "https://developer.twitter.com/en/portal/dashboard",
    docs: "https://developer.twitter.com/en/docs/twitter-api",
    rateLimit: "https://developer.twitter.com/en/docs/twitter-api/rate-limits",
  },
  youtube: {
    console: "https://console.cloud.google.com/apis/credentials",
    docs: "https://developers.google.com/youtube/v3/docs",
    quota: "https://developers.google.com/youtube/v3/getting-started#quota",
  },
  facebook: {
    portal: "https://developers.facebook.com/apps",
    docs: "https://developers.facebook.com/docs/graph-api",
    rateLimit: "https://developers.facebook.com/docs/graph-api/overview/rate-limiting",
  },
};
