/**
 * Rate Limit Service
 * Tracks API rate limits per platform/endpoint and implements backoff strategies
 */

import { db } from "@/lib/db";
import { apiRateLimits, socialPlatformEnum } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

// Derive type from enum
export type SocialPlatform = (typeof socialPlatformEnum.enumValues)[number];

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  platform: SocialPlatform;
  endpoint: string;
  requestsLimit: number;
  windowDurationSeconds: number;
}

export interface RateLimitStatus {
  canMakeRequest: boolean;
  remainingRequests: number;
  resetAt: Date | null;
  backoffUntil: Date | null;
  waitMs?: number; // How long to wait before making request
}

export interface RateLimitRecord {
  id: string;
  platform: SocialPlatform;
  endpoint: string;
  requestsMade: number | null;
  requestsLimit: number;
  windowStartAt: Date | null;
  windowDurationSeconds: number | null;
  resetAt: Date | null;
  consecutiveErrors: number | null;
  backoffUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Default Rate Limits per Platform
// ============================================================================

/**
 * Default rate limits based on platform API documentation
 * These are conservative estimates - actual limits vary by endpoint
 */
export const PLATFORM_RATE_LIMITS: Record<SocialPlatform, RateLimitConfig[]> = {
  linkedin: [
    { platform: "linkedin", endpoint: "default", requestsLimit: 100, windowDurationSeconds: 86400 }, // 100/day
    { platform: "linkedin", endpoint: "profile", requestsLimit: 50, windowDurationSeconds: 86400 },
    { platform: "linkedin", endpoint: "posts", requestsLimit: 200, windowDurationSeconds: 86400 },
    { platform: "linkedin", endpoint: "analytics", requestsLimit: 100, windowDurationSeconds: 86400 },
  ],
  twitter: [
    { platform: "twitter", endpoint: "default", requestsLimit: 300, windowDurationSeconds: 900 }, // 300/15min
    { platform: "twitter", endpoint: "user/timeline", requestsLimit: 1500, windowDurationSeconds: 900 },
    { platform: "twitter", endpoint: "search", requestsLimit: 450, windowDurationSeconds: 900 },
    { platform: "twitter", endpoint: "mentions", requestsLimit: 450, windowDurationSeconds: 900 },
  ],
  instagram: [
    { platform: "instagram", endpoint: "default", requestsLimit: 200, windowDurationSeconds: 3600 }, // 200/hour
    { platform: "instagram", endpoint: "media", requestsLimit: 200, windowDurationSeconds: 3600 },
    { platform: "instagram", endpoint: "insights", requestsLimit: 200, windowDurationSeconds: 3600 },
  ],
  facebook: [
    { platform: "facebook", endpoint: "default", requestsLimit: 200, windowDurationSeconds: 3600 }, // 200/hour
    { platform: "facebook", endpoint: "page", requestsLimit: 4800, windowDurationSeconds: 3600 },
    { platform: "facebook", endpoint: "insights", requestsLimit: 200, windowDurationSeconds: 3600 },
  ],
  youtube: [
    { platform: "youtube", endpoint: "default", requestsLimit: 10000, windowDurationSeconds: 86400 }, // 10k/day quota
    { platform: "youtube", endpoint: "search", requestsLimit: 100, windowDurationSeconds: 86400 }, // 100 units
    { platform: "youtube", endpoint: "videos", requestsLimit: 10000, windowDurationSeconds: 86400 },
  ],
  tiktok: [
    { platform: "tiktok", endpoint: "default", requestsLimit: 1000, windowDurationSeconds: 86400 }, // Conservative
    { platform: "tiktok", endpoint: "user", requestsLimit: 100, windowDurationSeconds: 86400 },
    { platform: "tiktok", endpoint: "videos", requestsLimit: 500, windowDurationSeconds: 86400 },
  ],
  // Platforms we may not have API access for (defaults)
  pinterest: [
    { platform: "pinterest", endpoint: "default", requestsLimit: 1000, windowDurationSeconds: 3600 },
  ],
  github: [
    { platform: "github", endpoint: "default", requestsLimit: 5000, windowDurationSeconds: 3600 }, // 5k/hour authenticated
  ],
  medium: [
    { platform: "medium", endpoint: "default", requestsLimit: 100, windowDurationSeconds: 86400 }, // Conservative
  ],
  reddit: [
    { platform: "reddit", endpoint: "default", requestsLimit: 600, windowDurationSeconds: 600 }, // 60/min with OAuth
  ],
  discord: [
    { platform: "discord", endpoint: "default", requestsLimit: 50, windowDurationSeconds: 1 }, // 50/sec global
  ],
  threads: [
    { platform: "threads", endpoint: "default", requestsLimit: 200, windowDurationSeconds: 3600 },
  ],
  bluesky: [
    { platform: "bluesky", endpoint: "default", requestsLimit: 5000, windowDurationSeconds: 300 }, // 5k/5min
  ],
  mastodon: [
    { platform: "mastodon", endpoint: "default", requestsLimit: 300, windowDurationSeconds: 300 }, // 300/5min
  ],
};

// ============================================================================
// Backoff Configuration
// ============================================================================

const BACKOFF_CONFIG = {
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 3600000, // 1 hour max backoff
  multiplier: 2, // Exponential backoff
  maxConsecutiveErrors: 10, // After this, stop trying
};

/**
 * Calculate backoff delay based on consecutive errors
 */
function calculateBackoffDelay(consecutiveErrors: number): number {
  if (consecutiveErrors >= BACKOFF_CONFIG.maxConsecutiveErrors) {
    return BACKOFF_CONFIG.maxDelayMs;
  }

  const delay = BACKOFF_CONFIG.initialDelayMs * Math.pow(BACKOFF_CONFIG.multiplier, consecutiveErrors);
  return Math.min(delay, BACKOFF_CONFIG.maxDelayMs);
}

// ============================================================================
// Rate Limit Operations
// ============================================================================

/**
 * Get or create rate limit record for a platform/endpoint
 */
export async function getOrCreateRateLimit(params: {
  platform: SocialPlatform;
  endpoint?: string;
}): Promise<RateLimitRecord> {
  const { platform, endpoint = "default" } = params;

  // Check if record exists
  const existing = await db.query.apiRateLimits.findFirst({
    where: and(
      eq(apiRateLimits.platform, platform),
      eq(apiRateLimits.endpoint, endpoint)
    ),
  });

  if (existing) {
    return existing as RateLimitRecord;
  }

  // Get default config for this platform/endpoint
  const platformLimits = PLATFORM_RATE_LIMITS[platform] || [];
  const config = platformLimits.find((c) => c.endpoint === endpoint) ||
    platformLimits.find((c) => c.endpoint === "default") ||
    { requestsLimit: 100, windowDurationSeconds: 3600 }; // Fallback

  // Create new record
  const [created] = await db
    .insert(apiRateLimits)
    .values({
      platform,
      endpoint,
      requestsLimit: config.requestsLimit,
      windowDurationSeconds: config.windowDurationSeconds,
      requestsMade: 0,
      windowStartAt: new Date(),
      resetAt: new Date(Date.now() + config.windowDurationSeconds * 1000),
    })
    .returning();

  return created as RateLimitRecord;
}

/**
 * Check if a request can be made within rate limits
 */
export async function checkRateLimit(params: {
  platform: SocialPlatform;
  endpoint?: string;
}): Promise<RateLimitStatus> {
  const record = await getOrCreateRateLimit(params);
  const now = new Date();

  // Check if in backoff period
  if (record.backoffUntil && now < record.backoffUntil) {
    return {
      canMakeRequest: false,
      remainingRequests: 0,
      resetAt: record.resetAt,
      backoffUntil: record.backoffUntil,
      waitMs: record.backoffUntil.getTime() - now.getTime(),
    };
  }

  // Check if window has reset
  if (record.resetAt && now >= record.resetAt) {
    // Window has passed, can make request (will reset counter on recordRequest)
    return {
      canMakeRequest: true,
      remainingRequests: record.requestsLimit,
      resetAt: record.resetAt,
      backoffUntil: null,
    };
  }

  // Check remaining requests in current window
  const requestsMade = record.requestsMade || 0;
  const remaining = record.requestsLimit - requestsMade;

  if (remaining <= 0) {
    // Rate limited
    const waitMs = record.resetAt ? record.resetAt.getTime() - now.getTime() : 0;
    return {
      canMakeRequest: false,
      remainingRequests: 0,
      resetAt: record.resetAt,
      backoffUntil: null,
      waitMs: Math.max(0, waitMs),
    };
  }

  return {
    canMakeRequest: true,
    remainingRequests: remaining,
    resetAt: record.resetAt,
    backoffUntil: null,
  };
}

/**
 * Record a successful API request
 */
export async function recordRequest(params: {
  platform: SocialPlatform;
  endpoint?: string;
}): Promise<RateLimitRecord> {
  const record = await getOrCreateRateLimit(params);
  const now = new Date();

  // Check if window has reset
  const windowDuration = record.windowDurationSeconds || 3600;
  const windowExpired = record.resetAt && now >= record.resetAt;

  if (windowExpired) {
    // Start new window
    const [updated] = await db
      .update(apiRateLimits)
      .set({
        requestsMade: 1,
        windowStartAt: now,
        resetAt: new Date(now.getTime() + windowDuration * 1000),
        consecutiveErrors: 0,
        backoffUntil: null,
        updatedAt: now,
      })
      .where(eq(apiRateLimits.id, record.id))
      .returning();

    return updated as RateLimitRecord;
  }

  // Increment counter in current window
  const [updated] = await db
    .update(apiRateLimits)
    .set({
      requestsMade: (record.requestsMade || 0) + 1,
      consecutiveErrors: 0, // Reset errors on success
      backoffUntil: null,
      updatedAt: now,
    })
    .where(eq(apiRateLimits.id, record.id))
    .returning();

  return updated as RateLimitRecord;
}

/**
 * Record an API error and apply backoff if needed
 */
export async function recordError(params: {
  platform: SocialPlatform;
  endpoint?: string;
  isRateLimitError?: boolean;
}): Promise<RateLimitRecord> {
  const { isRateLimitError = false } = params;
  const record = await getOrCreateRateLimit(params);
  const now = new Date();

  const consecutiveErrors = (record.consecutiveErrors || 0) + 1;
  const backoffDelay = calculateBackoffDelay(consecutiveErrors);
  const backoffUntil = new Date(now.getTime() + backoffDelay);

  // If it's a rate limit error, also set reset time further out
  const resetAt = isRateLimitError
    ? new Date(now.getTime() + (record.windowDurationSeconds || 3600) * 1000)
    : record.resetAt;

  const [updated] = await db
    .update(apiRateLimits)
    .set({
      consecutiveErrors,
      backoffUntil,
      resetAt,
      requestsMade: isRateLimitError ? record.requestsLimit : record.requestsMade, // Mark as exhausted
      updatedAt: now,
    })
    .where(eq(apiRateLimits.id, record.id))
    .returning();

  return updated as RateLimitRecord;
}

/**
 * Update rate limits from API response headers
 */
export async function updateFromHeaders(params: {
  platform: SocialPlatform;
  endpoint?: string;
  headers: {
    remaining?: number;
    limit?: number;
    reset?: number; // Unix timestamp
  };
}): Promise<RateLimitRecord> {
  const { headers } = params;
  const record = await getOrCreateRateLimit(params);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (headers.remaining !== undefined) {
    updateData.requestsMade = (headers.limit || record.requestsLimit) - headers.remaining;
  }

  if (headers.limit !== undefined) {
    updateData.requestsLimit = headers.limit;
  }

  if (headers.reset !== undefined) {
    updateData.resetAt = new Date(headers.reset * 1000);
  }

  const [updated] = await db
    .update(apiRateLimits)
    .set(updateData)
    .where(eq(apiRateLimits.id, record.id))
    .returning();

  return updated as RateLimitRecord;
}

/**
 * Clear all rate limit records for a platform (useful for testing)
 */
export async function clearRateLimits(platform: SocialPlatform): Promise<void> {
  await db
    .delete(apiRateLimits)
    .where(eq(apiRateLimits.platform, platform));
}

/**
 * Get all rate limit records for a platform
 */
export async function getPlatformRateLimits(platform: SocialPlatform): Promise<RateLimitRecord[]> {
  const records = await db.query.apiRateLimits.findMany({
    where: eq(apiRateLimits.platform, platform),
  });

  return records as RateLimitRecord[];
}

/**
 * Get all rate limits that are currently in backoff
 */
export async function getBackoffRecords(): Promise<RateLimitRecord[]> {
  const now = new Date();
  const records = await db.query.apiRateLimits.findMany({
    where: and(
      lte(apiRateLimits.backoffUntil, now)
    ),
  });

  // Filter to only those still in backoff (GT not supported in all Drizzle versions)
  return (records as RateLimitRecord[]).filter(
    (r) => r.backoffUntil && r.backoffUntil > now
  );
}

// ============================================================================
// Rate Limit Decorator / Wrapper
// ============================================================================

/**
 * Wrapper function that respects rate limits before making API calls
 * Returns a function that can be called to make the rate-limited request
 */
export function withRateLimit<T>(
  platform: SocialPlatform,
  endpoint: string,
  apiCall: () => Promise<T>
): () => Promise<{ success: true; data: T } | { success: false; error: string; retryAfterMs?: number }> {
  return async () => {
    // Check rate limit
    const status = await checkRateLimit({ platform, endpoint });

    if (!status.canMakeRequest) {
      return {
        success: false,
        error: status.backoffUntil
          ? `In backoff period until ${status.backoffUntil.toISOString()}`
          : `Rate limited. Resets at ${status.resetAt?.toISOString()}`,
        retryAfterMs: status.waitMs,
      };
    }

    try {
      // Make the API call
      const data = await apiCall();

      // Record successful request
      await recordRequest({ platform, endpoint });

      return { success: true, data };
    } catch (error) {
      // Check if it's a rate limit error (429 or similar)
      const isRateLimitError =
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("too many requests"));

      // Record the error
      await recordError({ platform, endpoint, isRateLimitError });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

export const RateLimitService = {
  // Configuration
  PLATFORM_RATE_LIMITS,

  // Operations
  getOrCreateRateLimit,
  checkRateLimit,
  recordRequest,
  recordError,
  updateFromHeaders,
  clearRateLimits,
  getPlatformRateLimits,
  getBackoffRecords,

  // Wrapper
  withRateLimit,
};

export default RateLimitService;
