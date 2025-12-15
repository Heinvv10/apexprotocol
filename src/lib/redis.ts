/**
 * Redis Client - Upstash Redis for caching and rate limiting
 */

import { Redis } from "@upstash/redis";

// Singleton Redis client
let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
      );
    }

    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

/**
 * Cache helpers
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  return value as T | null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const redis = getRedisClient();
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } else {
    await redis.set(key, JSON.stringify(value));
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

export async function cacheExists(key: string): Promise<boolean> {
  const redis = getRedisClient();
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Cache with automatic JSON parsing
 */
export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T | null;
}

/**
 * Cache multiple keys at once
 */
export async function cacheGetMany<T>(
  keys: string[]
): Promise<Map<string, T | null>> {
  const redis = getRedisClient();
  const values = await redis.mget<(T | null)[]>(...keys);
  const result = new Map<string, T | null>();
  keys.forEach((key, index) => {
    result.set(key, values[index]);
  });
  return result;
}

/**
 * Cache with fetch - get from cache or fetch and cache
 */
export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await cacheGetJSON<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetchFn();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

/**
 * Pub/Sub helpers for real-time updates
 */
export async function publish(channel: string, message: unknown): Promise<void> {
  const redis = getRedisClient();
  await redis.publish(channel, JSON.stringify(message));
}

/**
 * Increment a counter
 */
export async function increment(key: string, by: number = 1): Promise<number> {
  const redis = getRedisClient();
  if (by === 1) {
    return redis.incr(key);
  }
  return redis.incrby(key, by);
}

/**
 * Decrement a counter
 */
export async function decrement(key: string, by: number = 1): Promise<number> {
  const redis = getRedisClient();
  if (by === 1) {
    return redis.decr(key);
  }
  return redis.decrby(key, by);
}

/**
 * Set expiration on a key
 */
export async function expire(key: string, seconds: number): Promise<void> {
  const redis = getRedisClient();
  await redis.expire(key, seconds);
}

/**
 * Get TTL of a key
 */
export async function getTTL(key: string): Promise<number> {
  const redis = getRedisClient();
  return redis.ttl(key);
}

/**
 * List operations
 */
export async function listPush(
  key: string,
  ...values: unknown[]
): Promise<number> {
  const redis = getRedisClient();
  return redis.rpush(key, ...values.map((v) => JSON.stringify(v)));
}

export async function listPop<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.lpop(key);
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value as T | null;
}

export async function listRange<T>(
  key: string,
  start: number = 0,
  stop: number = -1
): Promise<T[]> {
  const redis = getRedisClient();
  const values = await redis.lrange(key, start, stop);
  return values.map((v) => {
    if (typeof v === "string") {
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as unknown as T;
      }
    }
    return v as T;
  });
}

/**
 * Hash operations
 */
export async function hashSet(
  key: string,
  field: string,
  value: unknown
): Promise<void> {
  const redis = getRedisClient();
  await redis.hset(key, { [field]: JSON.stringify(value) });
}

export async function hashGet<T>(
  key: string,
  field: string
): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.hget(key, field);
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value as T | null;
}

export async function hashGetAll<T>(key: string): Promise<Record<string, T>> {
  const redis = getRedisClient();
  const hash = await redis.hgetall(key);
  const result: Record<string, T> = {};
  if (hash) {
    for (const [field, value] of Object.entries(hash)) {
      if (typeof value === "string") {
        try {
          result[field] = JSON.parse(value) as T;
        } catch {
          result[field] = value as unknown as T;
        }
      } else {
        result[field] = value as T;
      }
    }
  }
  return result;
}

/**
 * Set operations
 */
export async function setAdd(key: string, ...members: string[]): Promise<number> {
  const redis = getRedisClient();
  return redis.sadd(key, members);
}

export async function setMembers(key: string): Promise<string[]> {
  const redis = getRedisClient();
  return redis.smembers(key);
}

export async function setIsMember(
  key: string,
  member: string
): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.sismember(key, member);
  return result === 1;
}

/**
 * Sorted set operations (for leaderboards, scoring)
 */
export async function zAdd(
  key: string,
  score: number,
  member: string
): Promise<number> {
  const redis = getRedisClient();
  const result = await redis.zadd(key, { score, member });
  return result ?? 0;
}

export async function zRange(
  key: string,
  start: number,
  stop: number,
  withScores: boolean = false
): Promise<string[] | Array<{ member: string; score: number }>> {
  const redis = getRedisClient();
  if (withScores) {
    return redis.zrange(key, start, stop, { withScores: true });
  }
  return redis.zrange(key, start, stop);
}

export async function zRank(key: string, member: string): Promise<number | null> {
  const redis = getRedisClient();
  return redis.zrank(key, member);
}
