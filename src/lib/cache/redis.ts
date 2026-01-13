import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Check if Redis is configured
const isRedisConfigured = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!url && !!token && url !== "undefined" && token !== "undefined";
};

// In-memory fallback for development
class InMemoryRedis {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<"OK"> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }

  async incr(key: string): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newVal = current + 1;
    await this.set(key, newVal);
    return newVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  pipeline() {
    const commands: Array<() => Promise<unknown>> = [];
    const self = this;
    return {
      incr(key: string) {
        commands.push(() => self.incr(key));
        return this;
      },
      expire(key: string, seconds: number) {
        commands.push(() => self.expire(key, seconds));
        return this;
      },
      async exec() {
        const results: unknown[] = [];
        for (const cmd of commands) {
          results.push(await cmd());
        }
        return results;
      },
    };
  }
}

// Initialize Redis client (with fallback)
let _redisInstance: Redis | InMemoryRedis | null = null;
let _usingFallback = false;

function getRedis(): Redis | InMemoryRedis {
  if (!_redisInstance) {
    if (isRedisConfigured()) {
      _redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    } else {
      if (!_usingFallback) {
        console.warn("[Cache/Redis] Using in-memory fallback. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.");
        _usingFallback = true;
      }
      _redisInstance = new InMemoryRedis();
    }
  }
  return _redisInstance;
}

// Export redis getter (maintains API compatibility)
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const instance = getRedis();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

// Mock rate limiter for in-memory fallback
class MockRatelimit {
  async limit(_identifier: string) {
    return { success: true, remaining: 999, reset: Date.now() + 60000, limit: 1000 };
  }
}

// Create rate limiter (real or mock based on Redis availability)
function createRatelimit(limiter: ReturnType<typeof Ratelimit.slidingWindow>, prefix: string): Ratelimit | MockRatelimit {
  if (isRedisConfigured()) {
    return new Ratelimit({
      redis: getRedis() as Redis,
      limiter,
      analytics: true,
      prefix,
    });
  }
  return new MockRatelimit();
}

// Lazy-initialized rate limiters
let _rateLimitsInstance: {
  api: Ratelimit | MockRatelimit;
  ai: Ratelimit | MockRatelimit;
  auth: Ratelimit | MockRatelimit;
  webhook: Ratelimit | MockRatelimit;
} | null = null;

// Rate limiters for different use cases (lazy initialized)
export const rateLimits = new Proxy({} as {
  api: Ratelimit | MockRatelimit;
  ai: Ratelimit | MockRatelimit;
  auth: Ratelimit | MockRatelimit;
  webhook: Ratelimit | MockRatelimit;
}, {
  get(_target, prop: string) {
    if (!_rateLimitsInstance) {
      _rateLimitsInstance = {
        api: createRatelimit(Ratelimit.slidingWindow(100, "1 m"), "ratelimit:api"),
        ai: createRatelimit(Ratelimit.slidingWindow(50, "1 h"), "ratelimit:ai"),
        auth: createRatelimit(Ratelimit.slidingWindow(10, "15 m"), "ratelimit:auth"),
        webhook: createRatelimit(Ratelimit.slidingWindow(1000, "1 m"), "ratelimit:webhook"),
      };
    }
    return _rateLimitsInstance[prop as keyof typeof _rateLimitsInstance];
  },
});

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
