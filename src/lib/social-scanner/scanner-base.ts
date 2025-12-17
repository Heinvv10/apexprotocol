/**
 * Social Scanner Base Class
 *
 * Abstract base class providing common functionality for all platform scanners.
 * Handles rate limiting, error handling, and result formatting.
 */

import type {
  ServiceScanPlatform,
  SocialProfile,
  SocialPost,
  SocialMention,
  ScanResult,
  FullScanResult,
  ScanOptions,
  ScanError,
  ScanErrorCode,
  RateLimitInfo,
  ISocialScanner,
} from "./types";
import { getRateLimitConfig, SCAN_CONFIG } from "./config";

// In-memory rate limit tracking (shared across all scanner instances)
interface RateLimitBucket {
  platform: ServiceScanPlatform;
  endpoint: string;
  requestCount: number;
  windowStartMs: number;
}

const rateLimitBuckets: Map<string, RateLimitBucket> = new Map();

export abstract class SocialScannerBase implements ISocialScanner {
  abstract platform: ServiceScanPlatform;

  // Abstract methods that must be implemented by each platform
  abstract isConfigured(): boolean;
  protected abstract fetchProfile(handle: string): Promise<SocialProfile>;
  protected abstract fetchRecentPosts(
    handle: string,
    maxPosts: number
  ): Promise<SocialPost[]>;
  protected abstract fetchMentions(
    query: string,
    maxMentions: number,
    sinceDays: number
  ): Promise<SocialMention[]>;

  // ============================================================================
  // Public API Methods
  // ============================================================================

  async getProfile(handle: string): Promise<ScanResult<SocialProfile>> {
    const normalizedHandle = this.normalizeHandle(handle);

    try {
      await this.checkRateLimit("userLookup");

      const profile = await this.fetchProfile(normalizedHandle);

      return {
        success: true,
        platform: this.platform,
        scanType: "profile",
        data: profile,
        scannedAt: new Date(),
        rateLimitInfo: this.getRateLimitInfo("userLookup"),
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        scanType: "profile",
        data: null as unknown as SocialProfile,
        scannedAt: new Date(),
        error: this.handleError(error),
      };
    }
  }

  async getRecentPosts(
    handle: string,
    options?: ScanOptions
  ): Promise<ScanResult<SocialPost[]>> {
    const normalizedHandle = this.normalizeHandle(handle);
    const maxPosts = options?.maxPosts || SCAN_CONFIG.defaultMaxPosts;

    try {
      await this.checkRateLimit("userTimeline");

      const posts = await this.fetchRecentPosts(normalizedHandle, maxPosts);

      // Filter based on options
      let filteredPosts = posts;
      if (options?.includeRetweets === false) {
        filteredPosts = filteredPosts.filter((p) => !p.isRepost);
      }

      return {
        success: true,
        platform: this.platform,
        scanType: "posts",
        data: filteredPosts,
        scannedAt: new Date(),
        rateLimitInfo: this.getRateLimitInfo("userTimeline"),
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        scanType: "posts",
        data: [],
        scannedAt: new Date(),
        error: this.handleError(error),
      };
    }
  }

  async searchMentions(
    query: string,
    options?: ScanOptions
  ): Promise<ScanResult<SocialMention[]>> {
    const maxMentions = options?.maxMentions || SCAN_CONFIG.defaultMaxMentions;
    const sinceDays = options?.sinceDays || SCAN_CONFIG.defaultMentionDays;

    try {
      await this.checkRateLimit("searchTweets");

      const mentions = await this.fetchMentions(query, maxMentions, sinceDays);

      return {
        success: true,
        platform: this.platform,
        scanType: "mentions",
        data: mentions,
        scannedAt: new Date(),
        rateLimitInfo: this.getRateLimitInfo("searchTweets"),
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        scanType: "mentions",
        data: [],
        scannedAt: new Date(),
        error: this.handleError(error),
      };
    }
  }

  async fullScan(handle: string, options?: ScanOptions): Promise<FullScanResult> {
    const normalizedHandle = this.normalizeHandle(handle);

    try {
      // Run all scans in parallel
      const [profileResult, postsResult, mentionsResult] = await Promise.all([
        this.getProfile(normalizedHandle),
        this.getRecentPosts(normalizedHandle, options),
        this.searchMentions(normalizedHandle, options),
      ]);

      const success =
        profileResult.success || postsResult.success || mentionsResult.success;

      return {
        success,
        platform: this.platform,
        scanType: "full",
        data: {
          profile: profileResult.data,
          recentPosts: postsResult.data || [],
          mentions: mentionsResult.data || [],
        },
        scannedAt: new Date(),
        error: !success
          ? profileResult.error || postsResult.error || mentionsResult.error
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        scanType: "full",
        data: {
          profile: null as unknown as SocialProfile,
          recentPosts: [],
          mentions: [],
        },
        scannedAt: new Date(),
        error: this.handleError(error),
      };
    }
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  protected async checkRateLimit(endpoint: string): Promise<void> {
    const bucketKey = `${this.platform}:${endpoint}`;
    const config = getRateLimitConfig(this.platform, endpoint);
    const now = Date.now();

    let bucket = rateLimitBuckets.get(bucketKey);

    // Create new bucket if doesn't exist or window expired
    if (!bucket || now - bucket.windowStartMs >= config.windowDurationMs) {
      bucket = {
        platform: this.platform,
        endpoint,
        requestCount: 0,
        windowStartMs: now,
      };
      rateLimitBuckets.set(bucketKey, bucket);
    }

    // Check if rate limited
    if (bucket.requestCount >= config.requestsPerWindow) {
      const waitMs = config.windowDurationMs - (now - bucket.windowStartMs);
      throw this.createError("RATE_LIMITED", `Rate limited. Retry after ${Math.ceil(waitMs / 1000)} seconds`, Math.ceil(waitMs / 1000));
    }

    // Increment counter
    bucket.requestCount++;
  }

  protected getRateLimitInfo(endpoint: string): RateLimitInfo {
    const bucketKey = `${this.platform}:${endpoint}`;
    const config = getRateLimitConfig(this.platform, endpoint);
    const bucket = rateLimitBuckets.get(bucketKey);

    if (!bucket) {
      return {
        platform: this.platform,
        endpoint,
        limit: config.requestsPerWindow,
        remaining: config.requestsPerWindow,
        resetsAt: new Date(Date.now() + config.windowDurationMs),
      };
    }

    const remaining = Math.max(0, config.requestsPerWindow - bucket.requestCount);
    const resetsAt = new Date(bucket.windowStartMs + config.windowDurationMs);

    return {
      platform: this.platform,
      endpoint,
      limit: config.requestsPerWindow,
      remaining,
      resetsAt,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  protected normalizeHandle(handle: string): string {
    // Remove @ prefix if present
    let normalized = handle.trim();
    if (normalized.startsWith("@")) {
      normalized = normalized.slice(1);
    }

    // Remove URL prefix if provided
    const urlPatterns = [
      /^https?:\/\/(www\.)?twitter\.com\//,
      /^https?:\/\/(www\.)?x\.com\//,
      /^https?:\/\/(www\.)?youtube\.com\/@?/,
      /^https?:\/\/(www\.)?facebook\.com\//,
    ];

    for (const pattern of urlPatterns) {
      if (pattern.test(normalized)) {
        normalized = normalized.replace(pattern, "");
        break;
      }
    }

    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, "");

    return normalized;
  }

  protected createError(
    code: ScanErrorCode,
    message: string,
    retryAfter?: number
  ): ScanError {
    return {
      code,
      message,
      platform: this.platform,
      retryAfter,
    };
  }

  protected handleError(error: unknown): ScanError {
    // Handle known API error patterns
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("rate limit") || message.includes("429")) {
        return this.createError("RATE_LIMITED", "Rate limit exceeded", 900); // 15 min default
      }

      if (message.includes("not found") || message.includes("404")) {
        return this.createError("NOT_FOUND", "Account not found");
      }

      if (message.includes("private") || message.includes("protected")) {
        return this.createError("PRIVATE_ACCOUNT", "Account is private");
      }

      if (message.includes("suspended") || message.includes("banned")) {
        return this.createError("SUSPENDED", "Account is suspended");
      }

      if (message.includes("unauthorized") || message.includes("401")) {
        return this.createError("INVALID_CREDENTIALS", "Invalid API credentials");
      }

      if (message.includes("network") || message.includes("ECONNREFUSED")) {
        return this.createError("NETWORK_ERROR", "Network connection failed");
      }

      return this.createError("API_ERROR", error.message);
    }

    return this.createError("UNKNOWN", "An unknown error occurred");
  }

  protected calculateEngagementRate(
    likes: number,
    comments: number,
    shares: number,
    followers: number
  ): number {
    if (followers === 0) return 0;
    const totalEngagement = likes + comments + shares;
    return (totalEngagement / followers) * 100;
  }
}
