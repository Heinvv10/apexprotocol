/**
 * Rate Limiter (F140)
 * Generic rate limiting with multiple strategies and tier support
 */

import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, API_ERROR_CODES } from "./public-api";

export type RateLimitStrategy = "sliding_window" | "fixed_window" | "token_bucket";

export interface RateLimiterConfig {
  strategy: RateLimitStrategy;
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
  keyGenerator?: (request: NextRequest) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  tokens?: number;
  lastRefill?: number;
}

/**
 * Rate Limiter Class
 * Supports multiple rate limiting strategies
 */
export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private config: RateLimiterConfig;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = {
      strategy: config.strategy || "sliding_window",
      maxRequests: config.maxRequests || 100,
      windowMs: config.windowMs || 60000, // 1 minute
      burstLimit: config.burstLimit,
      keyGenerator: config.keyGenerator,
    };

    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  /**
   * Check if a request should be rate limited
   */
  check(key: string): RateLimitResult {
    const now = Date.now();

    switch (this.config.strategy) {
      case "sliding_window":
        return this.checkSlidingWindow(key, now);
      case "fixed_window":
        return this.checkFixedWindow(key, now);
      case "token_bucket":
        return this.checkTokenBucket(key, now);
      default:
        return this.checkSlidingWindow(key, now);
    }
  }

  /**
   * Sliding window rate limiting
   * More accurate but slightly more complex
   */
  private checkSlidingWindow(key: string, now: number): RateLimitResult {
    const entry = this.entries.get(key);
    const windowStart = now - this.config.windowMs;

    if (!entry || entry.windowStart < windowStart) {
      // New window
      this.entries.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now + this.config.windowMs),
      };
    }

    // Calculate weighted count based on how much of the previous window overlaps
    const overlap = (entry.windowStart + this.config.windowMs - windowStart) / this.config.windowMs;
    const weightedCount = Math.floor(entry.count * overlap) + 1;

    if (weightedCount > this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.windowStart + this.config.windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.windowStart + this.config.windowMs),
        retryAfter,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - weightedCount,
      resetAt: new Date(entry.windowStart + this.config.windowMs),
    };
  }

  /**
   * Fixed window rate limiting
   * Simple and efficient
   */
  private checkFixedWindow(key: string, now: number): RateLimitResult {
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const entry = this.entries.get(key);

    if (!entry || entry.windowStart !== windowStart) {
      // New window
      this.entries.set(key, { count: 1, windowStart });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(windowStart + this.config.windowMs),
      };
    }

    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((windowStart + this.config.windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(windowStart + this.config.windowMs),
        retryAfter,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetAt: new Date(windowStart + this.config.windowMs),
    };
  }

  /**
   * Token bucket rate limiting
   * Allows bursting while maintaining average rate
   */
  private checkTokenBucket(key: string, now: number): RateLimitResult {
    const entry = this.entries.get(key);
    const bucketSize = this.config.burstLimit || this.config.maxRequests;
    const refillRate = this.config.maxRequests / (this.config.windowMs / 1000); // tokens per second

    if (!entry) {
      // New bucket with full tokens
      this.entries.set(key, {
        count: 0,
        windowStart: now,
        tokens: bucketSize - 1,
        lastRefill: now,
      });
      return {
        allowed: true,
        remaining: bucketSize - 1,
        resetAt: new Date(now + 1000 / refillRate),
      };
    }

    // Refill tokens based on time passed
    const timePassed = (now - (entry.lastRefill || now)) / 1000;
    const tokensToAdd = Math.floor(timePassed * refillRate);
    entry.tokens = Math.min(bucketSize, (entry.tokens || 0) + tokensToAdd);
    entry.lastRefill = now;

    if ((entry.tokens || 0) < 1) {
      const timeToNextToken = (1 - (entry.tokens || 0)) / refillRate;
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + timeToNextToken * 1000),
        retryAfter: Math.ceil(timeToNextToken),
      };
    }

    entry.tokens = (entry.tokens || 0) - 1;
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens || 0),
      resetAt: new Date(now + 1000 / refillRate),
    };
  }

  /**
   * Reset limit for a specific key
   */
  reset(key: string): void {
    this.entries.delete(key);
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): { used: number; remaining: number; resetAt: Date } | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    const now = Date.now();
    return {
      used: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetAt: new Date(entry.windowStart + this.config.windowMs),
    };
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowMs * 2;

    for (const [key, entry] of this.entries) {
      if (entry.windowStart < cutoff) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Get current stats
   */
  getStats(): {
    activeKeys: number;
    totalEntries: number;
    config: RateLimiterConfig;
  } {
    return {
      activeKeys: this.entries.size,
      totalEntries: this.entries.size,
      config: this.config,
    };
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // API rate limiter (per API key)
  api: new RateLimiter({
    strategy: "sliding_window",
    maxRequests: 100,
    windowMs: 60000,
  }),

  // Authentication rate limiter (per IP)
  auth: new RateLimiter({
    strategy: "fixed_window",
    maxRequests: 5,
    windowMs: 300000, // 5 minutes
  }),

  // General endpoint rate limiter (per IP)
  general: new RateLimiter({
    strategy: "token_bucket",
    maxRequests: 60,
    windowMs: 60000,
    burstLimit: 10,
  }),

  // Webhook rate limiter (per organization)
  webhook: new RateLimiter({
    strategy: "sliding_window",
    maxRequests: 1000,
    windowMs: 3600000, // 1 hour
  }),
};

// Default singleton
export const rateLimiter = rateLimiters.api;

/**
 * Rate limit middleware for Next.js API routes
 */
export function rateLimitMiddleware(
  limiter: RateLimiter,
  keyExtractor: (request: NextRequest) => string = (req) =>
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
) {
  return async function middleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyExtractor(request);
    const result = limiter.check(key);

    // Add rate limit headers
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limiter.getStats().config.maxRequests),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": result.resetAt.toISOString(),
    };

    if (!result.allowed) {
      headers["Retry-After"] = String(result.retryAfter || 60);

      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          "Too many requests. Please try again later.",
          {
            retryAfter: result.retryAfter,
            resetAt: result.resetAt.toISOString(),
          }
        ),
        { status: 429, headers }
      );
    }

    // Call the actual handler
    const response = await handler();

    // Add rate limit headers to successful response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Create a tier-based rate limiter
 */
export function createTierRateLimiter(
  tierLimits: Record<string, { maxRequests: number; windowMs: number; burstLimit?: number }>
): {
  check: (key: string, tier: string) => RateLimitResult;
  reset: (key: string, tier: string) => void;
} {
  const limiters = new Map<string, RateLimiter>();

  for (const [tier, config] of Object.entries(tierLimits)) {
    limiters.set(
      tier,
      new RateLimiter({
        strategy: "sliding_window",
        ...config,
      })
    );
  }

  return {
    check: (key: string, tier: string) => {
      const limiter = limiters.get(tier) || limiters.get("free")!;
      return limiter.check(key);
    },
    reset: (key: string, tier: string) => {
      const limiter = limiters.get(tier);
      if (limiter) limiter.reset(key);
    },
  };
}

// Pre-configured tier-based API rate limiter
export const tierRateLimiter = createTierRateLimiter({
  free: { maxRequests: 10, windowMs: 60000 },
  starter: { maxRequests: 60, windowMs: 60000 },
  professional: { maxRequests: 300, windowMs: 60000 },
  enterprise: { maxRequests: 1000, windowMs: 60000 },
});

/**
 * Rate limit configuration helper
 */
export function createRateLimitConfig(options: {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}): {
  minute: RateLimiterConfig;
  hour: RateLimiterConfig;
  day: RateLimiterConfig;
} {
  return {
    minute: {
      strategy: "sliding_window",
      maxRequests: options.requestsPerMinute || 60,
      windowMs: 60000,
      burstLimit: options.burstLimit,
    },
    hour: {
      strategy: "fixed_window",
      maxRequests: options.requestsPerHour || 1000,
      windowMs: 3600000,
    },
    day: {
      strategy: "fixed_window",
      maxRequests: options.requestsPerDay || 10000,
      windowMs: 86400000,
    },
  };
}
