/**
 * API Rate Limiter for Public API (Edge-compatible)
 *
 * Lightweight rate limiter for API key authenticated requests.
 * Uses Upstash Redis for distributed rate limiting.
 * Falls back to allowing requests when Redis is unavailable.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Rate limits per tier (requests per minute)
const RATE_LIMITS = {
  free: { perMinute: 10, perHour: 100, perDay: 500 },
  starter: { perMinute: 60, perHour: 1000, perDay: 10000 },
  professional: { perMinute: 300, perHour: 5000, perDay: 50000 },
  enterprise: { perMinute: 1000, perHour: 20000, perDay: 200000 },
} as const;

export type ApiTier = keyof typeof RATE_LIMITS;

// Singleton rate limiter (per-minute window)
let rateLimiter: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (rateLimiter) return rateLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const redis = new Redis({ url, token });
    rateLimiter = new Ratelimit({
      redis,
      // Default: 60 requests per minute (starter tier)
      // Actual limit is enforced via the limit parameter in checkRateLimit()
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "apex:api:rl",
    });
    return rateLimiter;
  } catch {
    return null;
  }
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Check rate limit for an API key request.
 *
 * @param orgId - Organization ID (rate limits are per-org)
 * @param tier - The org's subscription tier (defaults to "starter")
 * @returns Rate limit result with remaining count and reset time
 */
export async function checkApiRateLimit(
  orgId: string,
  tier: ApiTier = "starter"
): Promise<RateLimitCheckResult> {
  const limiter = getRateLimiter();

  if (!limiter) {
    // Redis not configured - allow request but return mock limits
    const limits = RATE_LIMITS[tier] || RATE_LIMITS.starter;
    return {
      allowed: true,
      limit: limits.perMinute,
      remaining: limits.perMinute - 1,
      resetMs: Date.now() + 60000,
    };
  }

  const limits = RATE_LIMITS[tier] || RATE_LIMITS.starter;

  try {
    const result = await limiter.limit(`${orgId}:min`, {
      rate: limits.perMinute,
    });

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetMs: result.reset,
    };
  } catch {
    // On error, allow the request (fail open)
    return {
      allowed: true,
      limit: limits.perMinute,
      remaining: limits.perMinute - 1,
      resetMs: Date.now() + 60000,
    };
  }
}

/**
 * Get rate limit headers for API responses
 */
export function getRateLimitHeaders(result: RateLimitCheckResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": new Date(result.resetMs).toISOString(),
  };
}
