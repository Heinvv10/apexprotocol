/**
 * Social Scanner Platform Exports
 *
 * Barrel exports for all platform-specific scanners.
 */

// Platform Scanners
export { TwitterScanner, twitterScanner } from "./twitter-scanner";
export { YouTubeScanner, youtubeScanner } from "./youtube-scanner";
export { FacebookScanner, facebookScanner } from "./facebook-scanner";

import { twitterScanner } from "./twitter-scanner";
import { youtubeScanner } from "./youtube-scanner";
import { facebookScanner } from "./facebook-scanner";
import type { ServiceScanPlatform, ISocialScanner } from "../types";

// Scanner registry for dynamic access
const scannerRegistry: Record<ServiceScanPlatform, ISocialScanner> = {
  twitter: twitterScanner,
  youtube: youtubeScanner,
  facebook: facebookScanner,
};

/**
 * Get scanner for a specific platform
 */
export function getScanner(platform: ServiceScanPlatform): ISocialScanner {
  const scanner = scannerRegistry[platform];
  if (!scanner) {
    throw new Error(`No scanner available for platform: ${platform}`);
  }
  return scanner;
}

/**
 * Get all configured scanners
 */
export function getConfiguredScanners(): {
  platform: ServiceScanPlatform;
  scanner: ISocialScanner;
}[] {
  return Object.entries(scannerRegistry)
    .filter(([, scanner]) => scanner.isConfigured())
    .map(([platform, scanner]) => ({
      platform: platform as ServiceScanPlatform,
      scanner,
    }));
}

/**
 * Check if a platform scanner is configured
 */
export function isScannerConfigured(platform: ServiceScanPlatform): boolean {
  const scanner = scannerRegistry[platform];
  return scanner?.isConfigured() ?? false;
}

/**
 * Get list of all available platforms
 */
export function getAvailablePlatforms(): ServiceScanPlatform[] {
  return Object.keys(scannerRegistry) as ServiceScanPlatform[];
}

/**
 * Get list of configured platforms
 */
export function getConfiguredPlatforms(): ServiceScanPlatform[] {
  return getConfiguredScanners().map(({ platform }) => platform);
}
