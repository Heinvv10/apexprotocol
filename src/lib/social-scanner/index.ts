/**
 * Social Scanner Module
 *
 * Service-level social media scanning for public data.
 * Uses Apex's own API keys to scan ANY brand without user OAuth.
 *
 * Supported Platforms:
 * - Twitter/X: Bearer Token (450 req/15min)
 * - YouTube: API Key (10K units/day)
 * - Facebook: App Token (200 req/hour)
 *
 * Usage:
 * ```typescript
 * import { scanBrand, TwitterScanner, isServiceScannerConfigured } from "@/lib/social-scanner";
 *
 * // Single platform scan
 * const profile = await TwitterScanner.getProfile("elonmusk");
 *
 * // Full brand scan across all configured platforms
 * const result = await scanBrand({
 *   brandId: "brand_123",
 *   handles: { twitter: "elonmusk", youtube: "@mkbhd" }
 * });
 * ```
 */

// ============================================================================
// Re-exports
// ============================================================================

// Types
export type {
  ScannerPlatform,
  ScanStatus,
  SocialProfile,
  TwitterProfile,
  YouTubeProfile,
  FacebookProfile,
  SocialPost,
  PostMetrics,
  TwitterPost,
  YouTubeVideo,
  FacebookPost,
  BrandMention,
  ScanResult,
  ScanError,
  RateLimitInfo,
  ProfileScanResult,
  PostsScanResult,
  MentionsScanResult,
  BatchScanRequest,
  BatchScanResult,
  PlatformScanResult,
  SocialScanner,
  ServiceScanRecord,
} from "./types";

export { calculateEngagementRate, aggregateMetrics } from "./types";

// Config
export {
  TWITTER_CONFIG,
  YOUTUBE_CONFIG,
  FACEBOOK_CONFIG,
  getTwitterBearerToken,
  getYouTubeApiKey,
  getFacebookAppToken,
  getPlatformConfig,
  isServiceScannerConfigured,
  getConfiguredPlatforms,
  getUnconfiguredPlatforms,
  PLATFORM_URLS,
  CACHE_TTL,
  DEFAULT_SCAN_OPTIONS,
  ERROR_CODES,
  API_DOCS,
} from "./config";

// Platforms
export {
  TwitterScanner,
  YouTubeScanner,
  FacebookScanner,
  getScanner,
  getAllScanners,
  getConfiguredScanners,
  isScannerConfigured,
  getConfiguredPlatformNames,
  getUnconfiguredPlatformNames,
  getProfile,
  getRecentPosts,
  searchMentions,
} from "./platforms";

// ============================================================================
// Batch Scanning Service
// ============================================================================

import type {
  BatchScanRequest,
  BatchScanResult,
  PlatformScanResult,
  ScannerPlatform,
} from "./types";
import { DEFAULT_SCAN_OPTIONS } from "./config";
import { getScanner, getConfiguredPlatformNames } from "./platforms";

/**
 * Scan a brand across multiple social platforms in parallel
 */
export async function scanBrand(request: BatchScanRequest): Promise<BatchScanResult> {
  const startedAt = new Date();
  const options = { ...DEFAULT_SCAN_OPTIONS, ...request.options };

  // Determine which platforms to scan
  const configuredPlatforms = getConfiguredPlatformNames();
  const requestedPlatforms = request.platforms.length > 0
    ? request.platforms.filter((p) => configuredPlatforms.includes(p))
    : configuredPlatforms;

  // Filter to only platforms with handles provided
  const platformsToScan = requestedPlatforms.filter((platform) => {
    const handle = request.handles[platform];
    return handle && handle.trim().length > 0;
  });

  // Scan each platform in parallel
  const scanPromises = platformsToScan.map(async (platform) => {
    const handle = request.handles[platform]!;
    const result = await scanPlatform(platform, handle, options);
    return { platform, result };
  });

  const scanResults = await Promise.all(scanPromises);

  // Build results object
  const results: BatchScanResult["results"] = {};
  let totalFollowers = 0;
  let totalPosts = 0;
  let totalEngagement = 0;
  let platformsScanned = 0;
  let platformsFailed = 0;

  for (const { platform, result } of scanResults) {
    results[platform] = result;

    if (result.status === "completed" && result.profile) {
      platformsScanned++;
      totalFollowers += result.profile.followerCount;
      totalPosts += result.recentPosts.length;

      // Calculate engagement from posts
      for (const post of result.recentPosts) {
        totalEngagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
      }
    } else {
      platformsFailed++;
    }
  }

  const averageEngagementRate = totalFollowers > 0 && totalPosts > 0
    ? (totalEngagement / totalPosts / totalFollowers) * 100
    : 0;

  return {
    brandId: request.brandId,
    startedAt,
    completedAt: new Date(),
    results,
    summary: {
      totalFollowers,
      totalPosts,
      totalEngagement,
      averageEngagementRate,
      platformsScanned,
      platformsFailed,
    },
  };
}

/**
 * Scan a single platform for a brand
 */
async function scanPlatform(
  platform: ScannerPlatform,
  handle: string,
  options: typeof DEFAULT_SCAN_OPTIONS
): Promise<PlatformScanResult> {
  const scanner = getScanner(platform);
  const scannedAt = new Date();

  try {
    // Get profile
    const profileResult = await scanner.getProfile(handle);

    if (!profileResult.success || !profileResult.data) {
      return {
        status: profileResult.error?.code === "RATE_LIMIT_EXCEEDED" ? "rate_limited" : "failed",
        profile: null,
        recentPosts: [],
        mentions: [],
        error: profileResult.error,
        scannedAt,
      };
    }

    const profile = profileResult.data;
    const userId = profile.platformId;

    // Get recent posts (if requested)
    let recentPosts: PlatformScanResult["recentPosts"] = [];
    if (options.includePosts) {
      const postsResult = await scanner.getRecentPosts(userId, {
        limit: options.postsLimit,
      });
      if (postsResult.success && postsResult.data) {
        recentPosts = postsResult.data;
      }
    }

    // Skip mentions for now (expensive API calls)
    // Can be enabled per-request if needed

    return {
      status: "completed",
      profile,
      recentPosts,
      mentions: [],
      error: null,
      scannedAt,
    };
  } catch (error) {
    return {
      status: "failed",
      profile: null,
      recentPosts: [],
      mentions: [],
      error: {
        code: "SCAN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        retryable: true,
        retryAfter: 60,
      },
      scannedAt,
    };
  }
}

/**
 * Quick scan - just get profile info across all configured platforms
 */
export async function quickScan(
  handles: BatchScanRequest["handles"]
): Promise<Map<ScannerPlatform, PlatformScanResult>> {
  const configuredPlatforms = getConfiguredPlatformNames();
  const results = new Map<ScannerPlatform, PlatformScanResult>();

  const scanPromises = configuredPlatforms
    .filter((platform) => handles[platform])
    .map(async (platform) => {
      const handle = handles[platform]!;
      const result = await scanPlatform(platform, handle, {
        ...DEFAULT_SCAN_OPTIONS,
        includePosts: false,
        includeMentions: false,
      });
      return { platform, result };
    });

  const scanResults = await Promise.all(scanPromises);

  for (const { platform, result } of scanResults) {
    results.set(platform, result);
  }

  return results;
}

/**
 * Get scan status summary
 */
export function getScannerStatus(): {
  configured: ScannerPlatform[];
  unconfigured: ScannerPlatform[];
  ready: boolean;
} {
  const configured = getConfiguredPlatformNames();
  const allPlatforms: ScannerPlatform[] = ["twitter", "youtube", "facebook"];
  const unconfigured = allPlatforms.filter((p) => !configured.includes(p));

  return {
    configured,
    unconfigured,
    ready: configured.length > 0,
  };
}
