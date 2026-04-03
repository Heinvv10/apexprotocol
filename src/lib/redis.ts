/**
 * Redis Client - Upstash Redis for caching and rate limiting
 * Falls back to in-memory storage for development when Redis is not configured
 */

import { Redis } from "@upstash/redis";

// Singleton Redis client
let redisClient: Redis | null = null;

// In-memory fallback storage for development
const inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();

/**
 * In-memory Redis-like client for development
 */
class InMemoryRedis {
  async get(key: string): Promise<string | null> {
    const item = inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<"OK"> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    inMemoryStore.set(key, { value, expiresAt });
    return "OK";
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    return this.set(key, value, { ex: seconds });
  }

  async del(key: string): Promise<number> {
    return inMemoryStore.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = inMemoryStore.get(key);
    if (!item) return 0;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      inMemoryStore.delete(key);
      return 0;
    }
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = inMemoryStore.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = inMemoryStore.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const ttl = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return ttl > 0 ? ttl : -2;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || "0", 10);
    const newVal = current + 1;
    await this.set(key, String(newVal));
    return newVal;
  }

  async incrby(key: string, increment: number): Promise<number> {
    const current = parseInt((await this.get(key)) || "0", 10);
    const newVal = current + increment;
    await this.set(key, String(newVal));
    return newVal;
  }

  async decr(key: string): Promise<number> {
    return this.incrby(key, -1);
  }

  async decrby(key: string, decrement: number): Promise<number> {
    return this.incrby(key, -decrement);
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(async (k) => {
      const v = await this.get(k);
      return v ? (JSON.parse(v) as T) : null;
    }));
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const existing = await this.get(key);
    const arr: string[] = existing ? JSON.parse(existing) : [];
    arr.push(...values);
    await this.set(key, JSON.stringify(arr));
    return arr.length;
  }

  async lpop(key: string): Promise<string | null> {
    const existing = await this.get(key);
    if (!existing) return null;
    const arr: string[] = JSON.parse(existing);
    const item = arr.shift();
    await this.set(key, JSON.stringify(arr));
    return item || null;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const existing = await this.get(key);
    if (!existing) return [];
    const arr: string[] = JSON.parse(existing);
    const end = stop === -1 ? arr.length : stop + 1;
    return arr.slice(start, end);
  }

  async hset(key: string, fieldValues: Record<string, string>): Promise<number> {
    const existing = await this.get(key);
    const hash: Record<string, string> = existing ? JSON.parse(existing) : {};
    Object.assign(hash, fieldValues);
    await this.set(key, JSON.stringify(hash));
    return Object.keys(fieldValues).length;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const existing = await this.get(key);
    if (!existing) return null;
    const hash: Record<string, string> = JSON.parse(existing);
    return hash[field] || null;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const existing = await this.get(key);
    if (!existing) return null;
    return JSON.parse(existing);
  }

  async sadd(key: string, members: string[]): Promise<number> {
    const existing = await this.get(key);
    const set = new Set<string>(existing ? JSON.parse(existing) : []);
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    await this.set(key, JSON.stringify([...set]));
    return added;
  }

  async smembers(key: string): Promise<string[]> {
    const existing = await this.get(key);
    return existing ? JSON.parse(existing) : [];
  }

  async sismember(key: string, member: string): Promise<number> {
    const members = await this.smembers(key);
    return members.includes(member) ? 1 : 0;
  }

  async zadd(key: string, { score, member }: { score: number; member: string }): Promise<number> {
    const existing = await this.get(key);
    const zset: Array<{ score: number; member: string }> = existing ? JSON.parse(existing) : [];
    const idx = zset.findIndex((z) => z.member === member);
    if (idx >= 0) {
      zset[idx].score = score;
      await this.set(key, JSON.stringify(zset));
      return 0;
    }
    zset.push({ score, member });
    zset.sort((a, b) => a.score - b.score);
    await this.set(key, JSON.stringify(zset));
    return 1;
  }

  async zrange(key: string, start: number, stop: number, options?: { withScores?: boolean; byScore?: boolean }): Promise<string[] | Array<{ member: string; score: number }>> {
    const existing = await this.get(key);
    if (!existing) return [];
    const zset: Array<{ score: number; member: string }> = JSON.parse(existing);

    // If byScore, treat start/stop as score values instead of indices
    if (options?.byScore) {
      const filtered = zset.filter((z) => z.score >= start && z.score <= stop);
      if (options?.withScores) return filtered;
      return filtered.map((z) => z.member);
    }

    const end = stop === -1 ? zset.length : stop + 1;
    const slice = zset.slice(start, end);
    if (options?.withScores) return slice;
    return slice.map((z) => z.member);
  }

  async zrank(key: string, member: string): Promise<number | null> {
    const existing = await this.get(key);
    if (!existing) return null;
    const zset: Array<{ score: number; member: string }> = JSON.parse(existing);
    const idx = zset.findIndex((z) => z.member === member);
    return idx >= 0 ? idx : null;
  }

  async zcard(key: string): Promise<number> {
    const existing = await this.get(key);
    if (!existing) return 0;
    const zset: Array<{ score: number; member: string }> = JSON.parse(existing);
    return zset.length;
  }

  async zrem(key: string, member: string): Promise<number> {
    const existing = await this.get(key);
    if (!existing) return 0;
    const zset: Array<{ score: number; member: string }> = JSON.parse(existing);
    const idx = zset.findIndex((z) => z.member === member);
    if (idx < 0) return 0;
    zset.splice(idx, 1);
    await this.set(key, JSON.stringify(zset));
    return 1;
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    const existing = await this.get(key);
    if (!existing) return 0;
    const zset: Array<{ score: number; member: string }> = JSON.parse(existing);
    const originalLength = zset.length;
    const end = stop === -1 ? zset.length : stop + 1;
    if (start < 0 && stop === -1) {
      // For "remove everything except last N", start is negative
      const itemsToKeep = Math.abs(start) - 1;
      const newZset = zset.slice(zset.length - itemsToKeep);
      await this.set(key, JSON.stringify(newZset));
      return originalLength - newZset.length;
    }
    zset.splice(start, end - start);
    await this.set(key, JSON.stringify(zset));
    return originalLength - zset.length;
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const existing = await this.get(key);
    const hash: Record<string, number> = existing ? JSON.parse(existing) : {};
    const current = hash[field] || 0;
    const newVal = current + increment;
    hash[field] = newVal;
    await this.set(key, JSON.stringify(hash));
    return newVal;
  }

  async publish(_channel: string, _message: string): Promise<number> {
    // No-op for in-memory - pub/sub not supported
    return 0;
  }
}

// Flag to track if using in-memory fallback
let usingInMemory = false;

/**
 * Get Redis client instance (singleton)
 * Falls back to in-memory storage when Redis is not configured
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      if (!usingInMemory) {
        console.warn(
          "[Redis] Using in-memory fallback. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production."
        );
        usingInMemory = true;
      }
      // Return in-memory client cast as Redis (cached as singleton)
      redisClient = new InMemoryRedis() as unknown as Redis;
    } else {
      redisClient = new Redis({
        url,
        token,
      });
    }
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
