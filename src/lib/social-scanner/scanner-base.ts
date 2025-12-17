/**
 * Social Scanner Base Class
 *
 * Abstract base class providing common functionality for all platform scanners.
 * Handles rate limiting, error handling, and result formatting.
 *
 * NOTE: This is currently unused - platform scanners implement SocialScanner directly.
 * Kept for potential future refactoring.
 */

import type {
  ScannerPlatform,
  SocialProfile,
  SocialPost,
  BrandMention,
  ScanError,
  RateLimitInfo,
  ProfileScanResult,
  PostsScanResult,
  MentionsScanResult,
} from "./types";
import { DEFAULT_SCAN_OPTIONS } from "./config";

// Type aliases for compatibility
type ServiceScanPlatform = ScannerPlatform;
type SocialMention = BrandMention;

interface ScanOptions {
  maxPosts?: number;
  maxMentions?: number;
  sinceDays?: number;
  includeRetweets?: boolean;
}

interface FullScanResult {
  success: boolean;
  platform: ScannerPlatform;
  scanType: "full";
  data: {
    profile: SocialProfile;
    recentPosts: SocialPost[];
    mentions: BrandMention[];
  };
  scannedAt: Date;
  error?: ScanError;
}

// Configuration for rate limiting
const SCAN_CONFIG = {
  defaultMaxPosts: DEFAULT_SCAN_OPTIONS.postsLimit,
  defaultMaxMentions: DEFAULT_SCAN_OPTIONS.mentionsLimit ?? 50,
  defaultMentionDays: 7,
};

// Rate limit configuration per platform/endpoint
interface RateLimitConfig {
  requestsPerWindow: number;
  windowDurationMs: number;
}

function getRateLimitConfig(_platform: ScannerPlatform, _endpoint: string): RateLimitConfig {
  // Default rate limits - can be customized per platform
  return {
    requestsPerWindow: 100,
    windowDurationMs: 15 * 60 * 1000, // 15 minutes
  };
}

// In-memory rate limit tracking (shared across all scanner instances)
interface RateLimitBucket {
  platform: ServiceScanPlatform;
  endpoint: string;
  requestCount: number;
  windowStartMs: number;
}

const rateLimitBuckets: Map<string, RateLimitBucket> = new Map();

/**
 * Abstract base class for social scanners.
 * Note: Does not implement SocialScanner directly due to different method signatures.
 * Platform-specific scanners should implement SocialScanner interface directly.
 */
export abstract class SocialScannerBase {
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

  async getProfile(handle: string): Promise<ProfileScanResult> {
    const normalizedHandle = this.normalizeHandle(handle);

    try {
      await this.checkRateLimit("userLookup");

      const profile = await this.fetchProfile(normalizedHandle);

      return {
        success: true,
        platform: this.platform,
        data: profile,
        error: null,
        scannedAt: new Date(),
        rateLimitInfo: this.getRateLimitInfo("userLookup"),
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        data: null,
        scannedAt: new Date(),
        error: this.handleError(error),
        rateLimitInfo: null,
      };
    }
  }

  async getRecentPosts(
    userId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PostsScanResult> {
    const normalizedHandle = this.normalizeHandle(userId);
    const maxPosts = options?.limit || SCAN_CONFIG.defaultMaxPosts;

    try {
      await this.checkRateLimit("userTimeline");

      const posts = await this.fetchRecentPosts(normalizedHandle, maxPosts);

      return {
        success: true,
        platform: this.platform,
        data: posts,
        error: null,
        scannedAt: new Date(),
        rateLimitInfo: this.getRateLimitInfo("userTimeline"),
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalCount: posts.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        data: null,
        scannedAt: new Date(),
        error: this.handleError(error),
        rateLimitInfo: null,
        pagination: null,
      };
    }
  }

  async searchMentions(
    keywords: string[],
    options?: { limit?: number; cursor?: string; since?: Date }
  ): Promise<MentionsScanResult> {
    const maxMentions = options?.limit || SCAN_CONFIG.defaultMaxMentions;
    const sinceDays = options?.since
      ? Math.ceil((Date.now() - options.since.getTime()) / (1000 * 60 * 60 * 24))
      : SCAN_CONFIG.defaultMentionDays;
    const query = keywords.join(" OR ");

    try {
      await this.checkRateLimit("searchTweets");

      const mentions = await this.fetchMentions(query, maxMentions, sinceDays);

      return {
        success: true,
        platform: this.platform,
        data: mentions,
        error: null,
        scannedAt: new Date(),
        rateLimitInfo: this.getRateLimitInfo("searchTweets"),
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalCount: mentions.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        data: null,
        scannedAt: new Date(),
        error: this.handleError(error),
        rateLimitInfo: null,
        pagination: null,
      };
    }
  }

  async fullScan(handle: string, options?: ScanOptions): Promise<FullScanResult> {
    const normalizedHandle = this.normalizeHandle(handle);

    try {
      // Run all scans in parallel
      const [profileResult, postsResult, mentionsResult] = await Promise.all([
        this.getProfile(normalizedHandle),
        this.getRecentPosts(normalizedHandle, { limit: options?.maxPosts }),
        this.searchMentions([normalizedHandle], { limit: options?.maxMentions }),
      ]);

      const success =
        profileResult.success || postsResult.success || mentionsResult.success;

      // Handle null profile case - create empty profile
      const profile = profileResult.data ?? {
        platform: this.platform,
        platformId: "",
        username: normalizedHandle,
        displayName: normalizedHandle,
        bio: null,
        avatarUrl: null,
        profileUrl: "",
        isVerified: false,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        createdAt: null,
        metadata: {},
      };

      // Get error if any failed
      const firstError = !success
        ? (profileResult.error ?? postsResult.error ?? mentionsResult.error ?? undefined)
        : undefined;

      return {
        success,
        platform: this.platform,
        scanType: "full",
        data: {
          profile,
          recentPosts: postsResult.data || [],
          mentions: mentionsResult.data || [],
        },
        scannedAt: new Date(),
        error: firstError,
      };
    } catch (error) {
      return {
        success: false,
        platform: this.platform,
        scanType: "full",
        data: {
          profile: {
            platform: this.platform,
            platformId: "",
            username: normalizedHandle,
            displayName: normalizedHandle,
            bio: null,
            avatarUrl: null,
            profileUrl: "",
            isVerified: false,
            followerCount: 0,
            followingCount: 0,
            postCount: 0,
            createdAt: null,
            metadata: {},
          },
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
      throw this.createError("RATE_LIMITED", `Rate limited. Retry after ${Math.ceil(waitMs / 1000)} seconds`, Math.ceil(waitMs / 1000), true);
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
        limit: config.requestsPerWindow,
        remaining: config.requestsPerWindow,
        resetAt: new Date(Date.now() + config.windowDurationMs),
      };
    }

    const remaining = Math.max(0, config.requestsPerWindow - bucket.requestCount);
    const resetAt = new Date(bucket.windowStartMs + config.windowDurationMs);

    return {
      limit: config.requestsPerWindow,
      remaining,
      resetAt,
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
    code: string,
    message: string,
    retryAfter?: number | null,
    retryable: boolean = false
  ): ScanError {
    return {
      code,
      message,
      retryable,
      retryAfter: retryAfter ?? null,
    };
  }

  protected handleError(error: unknown): ScanError {
    // Handle known API error patterns
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("rate limit") || message.includes("429")) {
        return this.createError("RATE_LIMITED", "Rate limit exceeded", 900, true); // retryable
      }

      if (message.includes("not found") || message.includes("404")) {
        return this.createError("NOT_FOUND", "Account not found", null, false);
      }

      if (message.includes("private") || message.includes("protected")) {
        return this.createError("PRIVATE_ACCOUNT", "Account is private", null, false);
      }

      if (message.includes("suspended") || message.includes("banned")) {
        return this.createError("SUSPENDED", "Account is suspended", null, false);
      }

      if (message.includes("unauthorized") || message.includes("401")) {
        return this.createError("INVALID_CREDENTIALS", "Invalid API credentials", null, false);
      }

      if (message.includes("network") || message.includes("ECONNREFUSED")) {
        return this.createError("NETWORK_ERROR", "Network connection failed", null, true); // retryable
      }

      return this.createError("API_ERROR", error.message, null, true);
    }

    return this.createError("UNKNOWN", "An unknown error occurred", null, false);
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
