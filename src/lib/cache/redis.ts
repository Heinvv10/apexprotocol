import IORedis from "ioredis";

// Check if Redis is configured
const isRedisConfigured = () => {
  const url = process.env.REDIS_URL;
  return !!url && url !== "undefined";
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
    // Capture the outer Redis instance via an arrow-function bound closure
    // on each command push — avoids `this` aliasing entirely.
    const incrCmd = (key: string) => this.incr(key);
    const expireCmd = (key: string, seconds: number) => this.expire(key, seconds);
    return {
      incr(key: string) {
        commands.push(() => incrCmd(key));
        return this;
      },
      expire(key: string, seconds: number) {
        commands.push(() => expireCmd(key, seconds));
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
let _redisInstance: IORedis | InMemoryRedis | null = null;
let _usingFallback = false;

function getRedis(): IORedis | InMemoryRedis {
  if (!_redisInstance) {
    if (isRedisConfigured()) {
      _redisInstance = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");
    } else {
      if (!_usingFallback) {
        console.warn("[Cache/Redis] Using in-memory fallback. Set REDIS_URL for production.");
        _usingFallback = true;
      }
      _redisInstance = new InMemoryRedis();
    }
  }
  return _redisInstance;
}

// Export redis getter (maintains API compatibility)
export const redis = new Proxy({} as IORedis, {
  get(_target, prop) {
    const instance = getRedis();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

// Mock rate limiter for in-process rate limiting
class MockRatelimit {
  async limit(_identifier: string) {
    return { success: true, remaining: 999, reset: Date.now() + 60000, limit: 1000 };
  }
}

// Rate limiters — always use in-process MockRatelimit (Upstash removed, ioredis-native ratelimit is future work)
export const rateLimits = {
  api: new MockRatelimit(),
  ai: new MockRatelimit(),
  auth: new MockRatelimit(),
  webhook: new MockRatelimit(),
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
    const instance = getRedis();
    const data = await instance.get(key);
    if (!data) return null;
    // ioredis returns string; InMemoryRedis returns original type
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }
    return data as T;
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
    const instance = getRedis();
    if (instance instanceof InMemoryRedis) {
      await instance.set(key, value, { ex: ttlSeconds });
    } else {
      // ioredis uses setex(key, seconds, value)
      await instance.setex(key, ttlSeconds, JSON.stringify(value));
    }
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
    const instance = getRedis();
    const count = await instance.incr(key);
    if (ttlSeconds) {
      await instance.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    console.error(`Counter increment error for key ${key}:`, error);
    return 0;
  }
}

// Check rate limit
export async function checkRateLimit(
  limiter: MockRatelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}
