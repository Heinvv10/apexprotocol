/**
 * Social Scanner Module
 *
 * Service-level social media scanning using Apex's own API credentials.
 * No user OAuth required for public data access.
 *
 * Supported Platforms:
 * - Twitter/X: Official API v2 with Bearer Token
 * - YouTube: Data API v3 with API Key
 * - Facebook: Graph API with App Access Token
 *
 * Usage:
 * ```typescript
 * import { scanBrand, twitterScanner, youtubeScanner } from "@/lib/social-scanner";
 *
 * // Scan a single platform
 * const twitterResult = await twitterScanner.getProfile("brandname");
 *
 * // Scan all configured platforms
 * const results = await scanBrand("brandname", ["twitter", "youtube", "facebook"]);
 * ```
 */

// Types
export type {
  // Platform types
  ServiceScanPlatform,
  SocialPlatform,
  // Profile types
  SocialProfile,
  TwitterProfile,
  YouTubeProfile,
  FacebookProfile,
  // Post types
  SocialPost,
  TwitterPost,
  YouTubeVideo,
  FacebookPost,
  PostType,
  PostEngagement,
  // Mention types
  SocialMention,
  MentionSentiment,
  // Scan types
  ScanRequest,
  ScanResult,
  ScanType,
  ScanOptions,
  ProfileScanResult,
  PostsScanResult,
  MentionsScanResult,
  FullScanResult,
  // Rate limiting
  RateLimitInfo,
  RateLimitConfig,
  // Errors
  ScanError,
  ScanErrorCode,
  // Interface
  ISocialScanner,
  // Aggregated
  AggregatedSocialMetrics,
  BrandSocialPresence,
} from "./types";

// Config
export {
  getTwitterCredentials,
  getYouTubeCredentials,
  getFacebookCredentials,
  isServiceConfigured,
  getConfiguredPlatforms,
  getRateLimitConfig,
  TWITTER_RATE_LIMITS,
  YOUTUBE_RATE_LIMITS,
  FACEBOOK_RATE_LIMITS,
  PLATFORM_CONFIG,
  getProfileUrl,
  SCAN_CONFIG,
} from "./config";

// Base scanner
export { SocialScannerBase } from "./scanner-base";

// Platform scanners
export {
  // Classes
  TwitterScanner,
  YouTubeScanner,
  FacebookScanner,
  // Singleton instances
  twitterScanner,
  youtubeScanner,
  facebookScanner,
  // Utilities
  getScanner,
  getConfiguredScanners,
  isScannerConfigured,
  getAvailablePlatforms,
} from "./platforms";

// ============================================================================
// Convenience Functions
// ============================================================================

import {
  twitterScanner,
  youtubeScanner,
  facebookScanner,
  getScanner,
  getConfiguredScanners,
} from "./platforms";
import type {
  ServiceScanPlatform,
  ScanOptions,
  FullScanResult,
  SocialProfile,
} from "./types";

/**
 * Scan a brand across multiple platforms
 *
 * @param handle - The social media handle to scan
 * @param platforms - Platforms to scan (defaults to all configured)
 * @param options - Scan options
 * @returns Map of platform to scan results
 */
export async function scanBrand(
  handle: string,
  platforms?: ServiceScanPlatform[],
  options?: ScanOptions
): Promise<Map<ServiceScanPlatform, FullScanResult>> {
  const results = new Map<ServiceScanPlatform, FullScanResult>();

  // Get platforms to scan
  const platformsToScan = platforms
    ? platforms.filter((p) => {
        const scanner = getScanner(p);
        return scanner.isConfigured();
      })
    : getConfiguredScanners().map(({ platform }) => platform);

  // Scan all platforms in parallel
  const scanPromises = platformsToScan.map(async (platform) => {
    const scanner = getScanner(platform);
    const result = await scanner.fullScan(handle, options);
    return { platform, result };
  });

  const scanResults = await Promise.all(scanPromises);

  for (const { platform, result } of scanResults) {
    results.set(platform, result);
  }

  return results;
}

/**
 * Get profile from all configured platforms
 *
 * @param handle - The social media handle
 * @returns Array of profiles from each platform
 */
export async function getProfilesFromAllPlatforms(
  handle: string
): Promise<{ platform: ServiceScanPlatform; profile: SocialProfile | null; error?: string }[]> {
  const configuredScanners = getConfiguredScanners();

  const results = await Promise.all(
    configuredScanners.map(async ({ platform, scanner }) => {
      try {
        const result = await scanner.getProfile(handle);
        return {
          platform,
          profile: result.success ? result.data : null,
          error: result.error?.message,
        };
      } catch (error) {
        return {
          platform,
          profile: null,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return results;
}

/**
 * Calculate aggregated metrics from scan results
 *
 * @param results - Map of platform to scan results
 * @returns Aggregated metrics across all platforms
 */
export function aggregateMetrics(
  results: Map<ServiceScanPlatform, FullScanResult>
): {
  totalFollowers: number;
  totalPosts: number;
  averageEngagement: number;
  platforms: ServiceScanPlatform[];
} {
  let totalFollowers = 0;
  let totalPosts = 0;
  let totalEngagement = 0;
  let engagementCount = 0;
  const platforms: ServiceScanPlatform[] = [];

  for (const [platform, result] of results) {
    if (result.success && result.data.profile) {
      platforms.push(platform);
      totalFollowers += result.data.profile.followerCount || 0;
      totalPosts += result.data.profile.postCount || 0;

      // Calculate engagement from recent posts
      if (result.data.recentPosts) {
        for (const post of result.data.recentPosts) {
          const engagement =
            (post.engagement.likes || 0) +
            (post.engagement.comments || 0) +
            (post.engagement.shares || 0);
          totalEngagement += engagement;
          engagementCount++;
        }
      }
    }
  }

  return {
    totalFollowers,
    totalPosts,
    averageEngagement: engagementCount > 0 ? totalEngagement / engagementCount : 0,
    platforms,
  };
}

/**
 * Check service health - verify all credentials are valid
 */
export async function checkServiceHealth(): Promise<{
  healthy: boolean;
  platforms: {
    platform: ServiceScanPlatform;
    configured: boolean;
    healthy: boolean;
    error?: string;
  }[];
}> {
  const platforms: ServiceScanPlatform[] = ["twitter", "youtube", "facebook"];
  const results: {
    platform: ServiceScanPlatform;
    configured: boolean;
    healthy: boolean;
    error?: string;
  }[] = [];

  for (const platform of platforms) {
    const scanner = getScanner(platform);
    const configured = scanner.isConfigured();

    if (!configured) {
      results.push({ platform, configured: false, healthy: false });
      continue;
    }

    // Try a simple API call to verify credentials
    try {
      // Use a known account for health check
      const testHandles: Record<ServiceScanPlatform, string> = {
        twitter: "twitter",
        youtube: "YouTube",
        facebook: "Meta",
      };

      const result = await scanner.getProfile(testHandles[platform]);
      results.push({
        platform,
        configured: true,
        healthy: result.success,
        error: result.error?.message,
      });
    } catch (error) {
      results.push({
        platform,
        configured: true,
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    healthy: results.every((r) => r.healthy),
    platforms: results,
  };
}
