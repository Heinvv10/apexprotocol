/**
 * AI Rate Limiter - Redis-based rate limiting for AI API calls
 * F087: Prevents API abuse and manages costs per organization
 */

import { getRedisClient } from "../redis";

// Rate limit tiers
export interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerDay: number;
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  free: {
    name: "Free",
    requestsPerMinute: 5,
    requestsPerHour: 50,
    requestsPerDay: 200,
    tokensPerDay: 50000,
  },
  starter: {
    name: "Starter",
    requestsPerMinute: 20,
    requestsPerHour: 200,
    requestsPerDay: 1000,
    tokensPerDay: 500000,
  },
  professional: {
    name: "Professional",
    requestsPerMinute: 60,
    requestsPerHour: 600,
    requestsPerDay: 5000,
    tokensPerDay: 2000000,
  },
  enterprise: {
    name: "Enterprise",
    requestsPerMinute: 200,
    requestsPerHour: 2000,
    requestsPerDay: 20000,
    tokensPerDay: 10000000,
  },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limitType?: "minute" | "hour" | "day" | "tokens";
  limit?: number;
}

export interface RateLimitStatus {
  minute: { used: number; limit: number; resetAt: Date };
  hour: { used: number; limit: number; resetAt: Date };
  day: { used: number; limit: number; resetAt: Date };
  tokens: { used: number; limit: number; resetAt: Date };
}

/**
 * Check if request is allowed under rate limits
 */
export async function checkRateLimit(
  orgId: string,
  tier: string = "free"
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const limits = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;
  const now = Date.now();

  // Key patterns
  const minuteKey = `ratelimit:${orgId}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `ratelimit:${orgId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `ratelimit:${orgId}:day:${Math.floor(now / 86400000)}`;

  // Get current counts
  const [minuteCount, hourCount, dayCount] = await Promise.all([
    redis.get<string>(minuteKey),
    redis.get<string>(hourKey),
    redis.get<string>(dayKey),
  ]);

  const minute = parseInt(String(minuteCount || "0"), 10);
  const hour = parseInt(String(hourCount || "0"), 10);
  const day = parseInt(String(dayCount || "0"), 10);

  // Check limits
  if (minute >= limits.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date((Math.floor(now / 60000) + 1) * 60000),
      limitType: "minute",
      limit: limits.requestsPerMinute,
    };
  }

  if (hour >= limits.requestsPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date((Math.floor(now / 3600000) + 1) * 3600000),
      limitType: "hour",
      limit: limits.requestsPerHour,
    };
  }

  if (day >= limits.requestsPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date((Math.floor(now / 86400000) + 1) * 86400000),
      limitType: "day",
      limit: limits.requestsPerDay,
    };
  }

  // Request is allowed
  return {
    allowed: true,
    remaining: Math.min(
      limits.requestsPerMinute - minute - 1,
      limits.requestsPerHour - hour - 1,
      limits.requestsPerDay - day - 1
    ),
    resetAt: new Date((Math.floor(now / 60000) + 1) * 60000),
  };
}

/**
 * Increment rate limit counters after a request
 */
export async function incrementRateLimit(
  orgId: string,
  tokenCount: number = 0
): Promise<void> {
  const redis = getRedisClient();
  const now = Date.now();

  // Key patterns
  const minuteKey = `ratelimit:${orgId}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `ratelimit:${orgId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `ratelimit:${orgId}:day:${Math.floor(now / 86400000)}`;
  const tokenKey = `ratelimit:${orgId}:tokens:${Math.floor(now / 86400000)}`;

  // Increment all counters with appropriate TTLs
  await Promise.all([
    redis.incr(minuteKey).then(() => redis.expire(minuteKey, 120)), // 2 minutes TTL
    redis.incr(hourKey).then(() => redis.expire(hourKey, 7200)), // 2 hours TTL
    redis.incr(dayKey).then(() => redis.expire(dayKey, 172800)), // 2 days TTL
    tokenCount > 0
      ? redis
          .incrby(tokenKey, tokenCount)
          .then(() => redis.expire(tokenKey, 172800))
      : Promise.resolve(),
  ]);
}

/**
 * Check token limit specifically
 */
export async function checkTokenLimit(
  orgId: string,
  tier: string = "free",
  estimatedTokens: number = 0
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const limits = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;
  const now = Date.now();

  const tokenKey = `ratelimit:${orgId}:tokens:${Math.floor(now / 86400000)}`;
  const tokenCountRaw = await redis.get<string>(tokenKey);
  const tokenCount = parseInt(String(tokenCountRaw || "0"), 10);

  if (tokenCount + estimatedTokens > limits.tokensPerDay) {
    return {
      allowed: false,
      remaining: Math.max(0, limits.tokensPerDay - tokenCount),
      resetAt: new Date((Math.floor(now / 86400000) + 1) * 86400000),
      limitType: "tokens",
      limit: limits.tokensPerDay,
    };
  }

  return {
    allowed: true,
    remaining: limits.tokensPerDay - tokenCount - estimatedTokens,
    resetAt: new Date((Math.floor(now / 86400000) + 1) * 86400000),
  };
}

/**
 * Get current rate limit status for an organization
 */
export async function getRateLimitStatus(
  orgId: string,
  tier: string = "free"
): Promise<RateLimitStatus> {
  const redis = getRedisClient();
  const limits = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;
  const now = Date.now();

  // Key patterns
  const minuteKey = `ratelimit:${orgId}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `ratelimit:${orgId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `ratelimit:${orgId}:day:${Math.floor(now / 86400000)}`;
  const tokenKey = `ratelimit:${orgId}:tokens:${Math.floor(now / 86400000)}`;

  const [minuteCount, hourCount, dayCount, tokenCount] = await Promise.all([
    redis.get<string>(minuteKey),
    redis.get<string>(hourKey),
    redis.get<string>(dayKey),
    redis.get<string>(tokenKey),
  ]);

  return {
    minute: {
      used: parseInt(String(minuteCount || "0"), 10),
      limit: limits.requestsPerMinute,
      resetAt: new Date((Math.floor(now / 60000) + 1) * 60000),
    },
    hour: {
      used: parseInt(String(hourCount || "0"), 10),
      limit: limits.requestsPerHour,
      resetAt: new Date((Math.floor(now / 3600000) + 1) * 3600000),
    },
    day: {
      used: parseInt(String(dayCount || "0"), 10),
      limit: limits.requestsPerDay,
      resetAt: new Date((Math.floor(now / 86400000) + 1) * 86400000),
    },
    tokens: {
      used: parseInt(String(tokenCount || "0"), 10),
      limit: limits.tokensPerDay,
      resetAt: new Date((Math.floor(now / 86400000) + 1) * 86400000),
    },
  };
}

/**
 * Reset rate limits for an organization (admin function)
 */
export async function resetRateLimits(orgId: string): Promise<void> {
  const redis = getRedisClient();
  const now = Date.now();

  // Key patterns for current windows
  const minuteKey = `ratelimit:${orgId}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `ratelimit:${orgId}:hour:${Math.floor(now / 3600000)}`;
  const dayKey = `ratelimit:${orgId}:day:${Math.floor(now / 86400000)}`;
  const tokenKey = `ratelimit:${orgId}:tokens:${Math.floor(now / 86400000)}`;

  await Promise.all([
    redis.del(minuteKey),
    redis.del(hourKey),
    redis.del(dayKey),
    redis.del(tokenKey),
  ]);
}

/**
 * Middleware helper for rate limiting
 */
export async function withRateLimit<T>(
  orgId: string,
  tier: string,
  fn: () => Promise<T>,
  estimatedTokens: number = 1000
): Promise<T> {
  // Check request limit
  const requestLimit = await checkRateLimit(orgId, tier);
  if (!requestLimit.allowed) {
    throw new RateLimitError(
      `Rate limit exceeded (${requestLimit.limitType}). Resets at ${requestLimit.resetAt.toISOString()}`,
      requestLimit.limitType || "minute",
      requestLimit.resetAt
    );
  }

  // Check token limit
  const tokenLimit = await checkTokenLimit(orgId, tier, estimatedTokens);
  if (!tokenLimit.allowed) {
    throw new RateLimitError(
      `Token limit exceeded. Resets at ${tokenLimit.resetAt.toISOString()}`,
      "tokens",
      tokenLimit.resetAt
    );
  }

  // Execute the function
  const result = await fn();

  // Increment counters (token count should be updated with actual value later)
  await incrementRateLimit(orgId, estimatedTokens);

  return result;
}

/**
 * Custom error class for rate limiting
 */
export class RateLimitError extends Error {
  public limitType: "minute" | "hour" | "day" | "tokens";
  public resetAt: Date;

  constructor(
    message: string,
    limitType: "minute" | "hour" | "day" | "tokens",
    resetAt: Date
  ) {
    super(message);
    this.name = "RateLimitError";
    this.limitType = limitType;
    this.resetAt = resetAt;
  }
}
