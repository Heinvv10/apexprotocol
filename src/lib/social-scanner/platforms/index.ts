/**
 * Social Scanner Platforms Index
 *
 * Factory and utilities for accessing platform-specific scanners.
 */

import type { SocialScanner, ScannerPlatform } from "../types";
import { TwitterScanner } from "./twitter-scanner";
import { YouTubeScanner } from "./youtube-scanner";
import { FacebookScanner } from "./facebook-scanner";

// ============================================================================
// Platform Scanner Exports
// ============================================================================

export { TwitterScanner } from "./twitter-scanner";
export { YouTubeScanner } from "./youtube-scanner";
export { FacebookScanner } from "./facebook-scanner";

// ============================================================================
// Scanner Factory
// ============================================================================

/**
 * Get a scanner instance for a specific platform
 */
export function getScanner(platform: ScannerPlatform): SocialScanner {
  switch (platform) {
    case "twitter":
      return TwitterScanner;
    case "youtube":
      return YouTubeScanner;
    case "facebook":
      return FacebookScanner;
  }
}

/**
 * Get all available scanners
 */
export function getAllScanners(): SocialScanner[] {
  return [TwitterScanner, YouTubeScanner, FacebookScanner];
}

/**
 * Get only configured (ready-to-use) scanners
 */
export function getConfiguredScanners(): SocialScanner[] {
  return getAllScanners().filter((scanner) => scanner.isConfigured());
}

/**
 * Check if a specific platform scanner is configured
 */
export function isScannerConfigured(platform: ScannerPlatform): boolean {
  return getScanner(platform).isConfigured();
}

/**
 * Get list of configured platform names
 */
export function getConfiguredPlatformNames(): ScannerPlatform[] {
  return getAllScanners()
    .filter((scanner) => scanner.isConfigured())
    .map((scanner) => scanner.platform);
}

/**
 * Get list of unconfigured platform names
 */
export function getUnconfiguredPlatformNames(): ScannerPlatform[] {
  return getAllScanners()
    .filter((scanner) => !scanner.isConfigured())
    .map((scanner) => scanner.platform);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick profile lookup across a specific platform
 */
export async function getProfile(platform: ScannerPlatform, handle: string) {
  const scanner = getScanner(platform);
  return scanner.getProfile(handle);
}

/**
 * Quick posts lookup across a specific platform
 */
export async function getRecentPosts(
  platform: ScannerPlatform,
  userId: string,
  options?: { limit?: number; cursor?: string }
) {
  const scanner = getScanner(platform);
  return scanner.getRecentPosts(userId, options);
}

/**
 * Quick mentions search across a specific platform
 */
export async function searchMentions(
  platform: ScannerPlatform,
  keywords: string[],
  options?: { limit?: number; cursor?: string; since?: Date }
) {
  const scanner = getScanner(platform);
  return scanner.searchMentions(keywords, options);
}
