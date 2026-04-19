/**
 * Redis Client - ioredis against local/managed Redis
 * Falls back to in-memory storage for development when Redis is not configured.
 *
 * Set REDIS_URL (e.g. redis://redis:6379 inside the apexgeo_network Docker
 * network, or redis://localhost:6379 when running outside Docker).
 *
 * The wrapper functions below normalize away ioredis-vs-Upstash differences
 * (set with EX, zadd ordering, mget result shape, etc.) so consumers only
 * see a stable cache API.
 */

import IORedis, { type Redis as IORedisClient } from "ioredis";

// Singleton Redis client. Type widened to allow InMemoryRedis substitution.
type RedisLike = IORedisClient | InMemoryRedis;
let redisClient: RedisLike | null = null;

// In-memory fallback storage for development
const inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();

/**
 * In-memory Redis-like client for development.
 * Implements just the methods used by the wrapper functions below.
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

  async set(key: string, value: string, ..._args: unknown[]): Promise<"OK"> {
    // Args may be ['EX', seconds] or ['PX', ms] etc. Only support EX.
    let expiresAt: number | undefined;
    if (_args.length >= 2 && _args[0] === "EX" && typeof _args[1] === "number") {
      expiresAt = Date.now() + _args[1] * 1000;
    }
    inMemoryStore.set(key, { value, expiresAt });
    return "OK";
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    inMemoryStore.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return "OK";
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

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map((k) => this.get(k)));
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

  // ioredis hset signature: hset(key, field, value) OR hset(key, { field: value })
  async hset(key: string, fieldOrObject: string | Record<string, string>, value?: string): Promise<number> {
    const existing = await this.get(key);
    const hash: Record<string, string> = existing ? JSON.parse(existing) : {};
    if (typeof fieldOrObject === "string") {
      hash[fieldOrObject] = value!;
      await this.set(key, JSON.stringify(hash));
      return 1;
    } else {
      Object.assign(hash, fieldOrObject);
      await this.set(key, JSON.stringify(hash));
      return Object.keys(fieldOrObject).length;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    const existing = await this.get(key);
    if (!existing) return null;
    const hash: Record<string, string> = JSON.parse(existing);
    return hash[field] || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const existing = await this.get(key);
    if (!existing) return {};
    return JSON.parse(existing);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
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

  // ioredis zadd signature: zadd(key, score, member, score2, member2, ...)
  async zadd(key: string, score: number, member: string): Promise<number> {
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

  async zrange(key: string, start: number, stop: number, ..._args: unknown[]): Promise<string[]> {
    const existing = await this.get(key);
    if (!existing) return [];
    const zset: Array<{ score: number; member: string }> = JSON.parse(existing);
    const withScores = _args.includes("WITHSCORES");
    const end = stop === -1 ? zset.length : stop + 1;
    const slice = zset.slice(start, end);
    if (withScores) {
      return slice.flatMap((z) => [z.member, String(z.score)]);
    }
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
    // No-op for in-memory — pub/sub not supported.
    return 0;
  }
}

let usingInMemory = false;

/**
 * Get Redis client (singleton). Falls back to in-memory when REDIS_URL
 * is not configured (test/dev environments).
 */
export function getRedisClient(): RedisLike {
  if (!redisClient) {
    const url = process.env.REDIS_URL;

    if (!url) {
      if (!usingInMemory) {
        console.warn(
          "[Redis] Using in-memory fallback. Set REDIS_URL=redis://redis:6379 for production."
        );
        usingInMemory = true;
      }
      redisClient = new InMemoryRedis();
    } else {
      redisClient = new IORedis(url, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: false,
      });
    }
  }

  return redisClient;
}

// === Cache helpers (stable API across upstash/ioredis swap) ===

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const redis = getRedisClient();
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
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

export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  return cacheGet<T>(key);
}

export async function cacheGetMany<T>(
  keys: string[]
): Promise<Map<string, T | null>> {
  const redis = getRedisClient();
  const values = await redis.mget(...keys);
  const result = new Map<string, T | null>();
  keys.forEach((key, index) => {
    const v = values[index];
    if (v === null || v === undefined) {
      result.set(key, null);
    } else {
      try {
        result.set(key, JSON.parse(v) as T);
      } catch {
        result.set(key, v as unknown as T);
      }
    }
  });
  return result;
}

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

export async function publish(channel: string, message: unknown): Promise<void> {
  const redis = getRedisClient();
  await redis.publish(channel, JSON.stringify(message));
}

export async function increment(key: string, by: number = 1): Promise<number> {
  const redis = getRedisClient();
  if (by === 1) return redis.incr(key);
  return redis.incrby(key, by);
}

export async function decrement(key: string, by: number = 1): Promise<number> {
  const redis = getRedisClient();
  if (by === 1) return redis.decr(key);
  return redis.decrby(key, by);
}

export async function expire(key: string, seconds: number): Promise<void> {
  const redis = getRedisClient();
  await redis.expire(key, seconds);
}

export async function getTTL(key: string): Promise<number> {
  const redis = getRedisClient();
  return redis.ttl(key);
}

// === List ops ===

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
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export async function listRange<T>(
  key: string,
  start: number = 0,
  stop: number = -1
): Promise<T[]> {
  const redis = getRedisClient();
  const values = await redis.lrange(key, start, stop);
  return values.map((v) => {
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as unknown as T;
    }
  });
}

// === Hash ops ===

export async function hashSet(
  key: string,
  field: string,
  value: unknown
): Promise<void> {
  const redis = getRedisClient();
  await redis.hset(key, field, JSON.stringify(value));
}

export async function hashGet<T>(
  key: string,
  field: string
): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.hget(key, field);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export async function hashGetAll<T>(key: string): Promise<Record<string, T>> {
  const redis = getRedisClient();
  const hash = await redis.hgetall(key);
  const result: Record<string, T> = {};
  for (const [field, value] of Object.entries(hash)) {
    try {
      result[field] = JSON.parse(value) as T;
    } catch {
      result[field] = value as unknown as T;
    }
  }
  return result;
}

// === Set ops ===

export async function setAdd(key: string, ...members: string[]): Promise<number> {
  const redis = getRedisClient();
  return redis.sadd(key, ...members);
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

// === Sorted set ops ===

export async function zAdd(
  key: string,
  score: number,
  member: string
): Promise<number> {
  const redis = getRedisClient();
  return redis.zadd(key, score, member);
}

export async function zRange(
  key: string,
  start: number,
  stop: number,
  withScores: boolean = false
): Promise<string[] | Array<{ member: string; score: number }>> {
  const redis = getRedisClient();
  if (withScores) {
    const flat = await redis.zrange(key, start, stop, "WITHSCORES");
    const result: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < flat.length; i += 2) {
      result.push({ member: flat[i], score: parseFloat(flat[i + 1]) });
    }
    return result;
  }
  return redis.zrange(key, start, stop);
}

export async function zRank(key: string, member: string): Promise<number | null> {
  const redis = getRedisClient();
  return redis.zrank(key, member);
}
