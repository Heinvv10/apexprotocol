/**
 * API Rate Limiter for Public API (Edge-compatible)
 *
 * Lightweight rate limiter for API key authenticated requests.
 * Uses Upstash Redis for distributed rate limiting.
 * Falls back to allowing requests when Redis is unavailable.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Rate limits per tier (requests per minute).
// Tiers now represent route classes, not subscription plans. Dashboard fan-out
// means a single page can trigger 10+ reads; expensive routes (AI, scraping)
// need their own tight bucket so one user can't blow through spend.
const RATE_LIMITS = {
  // Expensive: AI inference, scraping, report generation. One user doing these
  // in a hot loop is how cost incidents happen.
  expensive: { perMinute: 10, perHour: 100, perDay: 500 },
  // Default: standard writes, auth-gated mutations.
  starter: { perMinute: 60, perHour: 1000, perDay: 10000 },
  // Read-heavy: dashboard/analytics/list endpoints hit on every page load.
  read: { perMinute: 300, perHour: 5000, perDay: 50000 },
  // Legacy aliases kept so existing callers still compile.
  free: { perMinute: 10, perHour: 100, perDay: 500 },
  professional: { perMinute: 300, perHour: 5000, perDay: 50000 },
  enterprise: { perMinute: 1000, perHour: 20000, perDay: 200000 },
} as const;

export type ApiTier = keyof typeof RATE_LIMITS;

/**
 * Classify a request path into a rate-limit bucket. Keep this fast — it runs
 * in middleware on every request.
 */
export function classifyRoute(pathname: string): ApiTier {
  // Expensive first — match by substring so nested routes count too.
  if (
    pathname.includes("/monitor/run") ||
    pathname.includes("/monitor/scrape") ||
    pathname.includes("/audit/analyze") ||
    pathname.includes("/brands/scrape") ||
    pathname.includes("/brands/enrich") ||
    pathname.includes("/brands/test-multipage") ||
    pathname.includes("/ai-insights/analyze") ||
    pathname.includes("/recommendations/generate") ||
    pathname.includes("/create/content") ||
    pathname.includes("/create/brief") ||
    pathname.includes("/predictions/train") ||
    pathname.includes("/competitive/discover") ||
    pathname.includes("/people/discover") ||
    pathname.includes("/people/") && pathname.includes("/enrich") ||
    pathname.includes("/reports/generate") ||
    pathname.includes("/reports/") && pathname.includes("/pdf") ||
    pathname.includes("/export") ||
    pathname.includes("/simulations") ||
    pathname.includes("/optimize") ||
    pathname.includes("/publishing/") ||
    pathname.includes("/social/publish")
  ) {
    return "expensive";
  }
  // Read-heavy dashboard/analytics paths — fan out on page load.
  if (
    pathname.includes("/analytics/") ||
    pathname.includes("/monitor/mentions") ||
    pathname.includes("/monitor/citations") ||
    pathname.includes("/monitor/stream") ||
    pathname.includes("/monitor/platforms") ||
    pathname.includes("/monitor/brands") ||
    pathname.includes("/monitor/sentiment") ||
    pathname.includes("/admin/dashboard") ||
    pathname.includes("/usage/") ||
    pathname.includes("/notifications") ||
    pathname.includes("/insights") ||
    pathname.includes("/engine-room") ||
    pathname.includes("/gamification") ||
    pathname.includes("/ai-insights/history") ||
    pathname.includes("/platform-monitoring") ||
    pathname.includes("/competitive/comparison") ||
    pathname.includes("/competitive/scores") ||
    pathname.includes("/competitive/snapshots") ||
    pathname.includes("/content/inventory") ||
    pathname.includes("/content/metrics") ||
    pathname.includes("/realtime")
  ) {
    return "read";
  }
  return "starter";
}

// One Upstash limiter per tier (passing {rate} to limit() silently ignores it;
// sliding-window limit is set at construction — separate instances per bucket).
const upstashLimiters = new Map<ApiTier, Ratelimit>();
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch {
    return null;
  }
}

function getTierUpstashLimiter(tier: ApiTier): Ratelimit | null {
  const existing = upstashLimiters.get(tier);
  if (existing) return existing;
  const redis = getRedis();
  if (!redis) return null;
  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS[tier].perMinute, "1 m"),
      prefix: `apex:api:rl:${tier}`,
    });
    upstashLimiters.set(tier, limiter);
    return limiter;
  } catch {
    return null;
  }
}

// In-memory sliding-window fallback for single-instance deployments (no Upstash).
// Tracks request timestamps per key, purges anything older than the window.
// Fine for one Node process; NOT safe across replicas — configure Upstash for that.
const memBuckets = new Map<string, number[]>();

function checkMemoryLimit(key: string, perMinute: number): RateLimitCheckResult {
  const now = Date.now();
  const windowStart = now - 60_000;
  const existing = memBuckets.get(key) ?? [];
  const recent = existing.filter((ts) => ts > windowStart);

  if (recent.length >= perMinute) {
    memBuckets.set(key, recent);
    return {
      allowed: false,
      limit: perMinute,
      remaining: 0,
      resetMs: (recent[0] ?? now) + 60_000,
    };
  }

  recent.push(now);
  memBuckets.set(key, recent);
  return {
    allowed: true,
    limit: perMinute,
    remaining: perMinute - recent.length,
    resetMs: now + 60_000,
  };
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
  // Dev-only escape hatch for the Playwright e2e suite. Parallel specs
  // burst through the 60/min Starter budget and poison the suite with
  // 429s that aren't representative of real-user behaviour. Never set
  // E2E_DISABLE_RATE_LIMIT=true in any production environment.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.E2E_DISABLE_RATE_LIMIT === "true"
  ) {
    return {
      allowed: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      resetMs: Date.now() + 60_000,
    };
  }

  const limits = RATE_LIMITS[tier] || RATE_LIMITS.starter;
  const key = `${tier}:${orgId}`;

  const limiter = getTierUpstashLimiter(tier);
  if (limiter) {
    try {
      const result = await limiter.limit(orgId);
      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetMs: result.reset,
      };
    } catch {
      // Upstash unavailable — fall through to in-memory
    }
  }

  // Fallback: in-memory sliding window. Works for single-instance deployments.
  return checkMemoryLimit(key, limits.perMinute);
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
