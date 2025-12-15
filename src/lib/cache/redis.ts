import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Initialize Redis client from environment variables
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different use cases
export const rateLimits = {
  // API rate limit: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:api",
  }),

  // AI rate limit: 50 requests per hour
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 h"),
    analytics: true,
    prefix: "ratelimit:ai",
  }),

  // Auth rate limit: 10 attempts per 15 minutes
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
    prefix: "ratelimit:auth",
  }),

  // Webhook rate limit: 1000 requests per minute
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, "1 m"),
    analytics: true,
    prefix: "ratelimit:webhook",
  }),
};

// Cache key prefixes
export const CacheKeys = {
  // User data
  user: (userId: string) => `user:${userId}`,
  userSession: (userId: string) => `session:${userId}`,

  // Organization data
  org: (orgId: string) => `org:${orgId}`,
  orgMembers: (orgId: string) => `org:${orgId}:members`,
  orgBrands: (orgId: string) => `org:${orgId}:brands`,

  // Brand data
  brand: (brandId: string) => `brand:${brandId}`,
  brandMentions: (brandId: string) => `brand:${brandId}:mentions`,
  brandScore: (brandId: string) => `brand:${brandId}:score`,

  // Audit data
  audit: (auditId: string) => `audit:${auditId}`,
  auditProgress: (auditId: string) => `audit:${auditId}:progress`,

  // Content data
  content: (contentId: string) => `content:${contentId}`,
  contentList: (brandId: string) => `content:list:${brandId}`,

  // Recommendations
  recommendations: (brandId: string) => `recommendations:${brandId}`,

  // Analytics
  analytics: (brandId: string, period: string) => `analytics:${brandId}:${period}`,

  // Monitoring
  monitoringJob: (jobId: string) => `monitoring:job:${jobId}`,
  monitoringStatus: (brandId: string) => `monitoring:status:${brandId}`,
} as const;

// Default TTL values (in seconds)
export const CacheTTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  day: 86400, // 24 hours
  week: 604800, // 7 days
} as const;

// Helper functions for common cache operations
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

export async function setInCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = CacheTTL.medium
): Promise<boolean> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

export async function deleteFromCache(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    return 0;
  }
}

// Cache-aside pattern helper
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CacheTTL.medium
): Promise<T> {
  // Try to get from cache first
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache (fire and forget)
  setInCache(key, data, ttlSeconds);

  return data;
}

// Increment counter (useful for analytics)
export async function incrementCounter(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    if (ttlSeconds) {
      pipeline.expire(key, ttlSeconds);
    }
    const results = await pipeline.exec();
    return (results[0] as number) || 0;
  } catch (error) {
    console.error(`Counter increment error for key ${key}:`, error);
    return 0;
  }
}

// Check rate limit
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}
