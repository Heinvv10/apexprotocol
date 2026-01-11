import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Caching Service
 *
 * Provides in-memory caching with TTL, eviction policies,
 * namespacing, and statistics tracking for the content generation sub-agent.
 */

// Eviction Policies
export type EvictionPolicy = 'lru' | 'fifo' | 'lfu';

// Zod Schemas
export const CacheConfigSchema = z.object({
  maxSize: z.number().min(1).default(1000),
  defaultTTL: z.number().min(0).default(3600000), // 1 hour default
  cleanupInterval: z.number().min(0).default(60000), // 1 minute
  evictionPolicy: z.enum(['lru', 'fifo', 'lfu']).default('lru')
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

// Cache Entry Interface
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  size: number;
}

// Cache Statistics
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  estimatedMemoryBytes: number;
}

// Set Options
export interface SetOptions {
  ttl?: number;
}

/**
 * Caching Service
 */
export class CachingService extends EventEmitter {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry>;
  private hits: number = 0;
  private misses: number = 0;
  private cleanupTimer?: NodeJS.Timeout;
  private destroyed: boolean = false;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = CacheConfigSchema.parse(config);
    this.cache = new Map();

    // Start cleanup interval if configured
    if (this.config.cleanupInterval > 0) {
      this.startCleanupInterval();
    }
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, options: SetOptions = {}): Promise<void> {
    if (this.destroyed) return;

    const ttl = options.ttl ?? this.config.defaultTTL;
    const now = new Date();

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      size: this.estimateSize(value)
    };

    this.cache.set(key, entry as CacheEntry);

    this.emit('cache:set', { key, ttl });
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    if (this.destroyed) return undefined;

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.misses++;
      this.emit('cache:miss', { key });
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      this.emit('cache:expired', { key });
      this.emit('cache:miss', { key });
      return undefined;
    }

    // Update access info
    entry.lastAccessedAt = new Date();
    entry.accessCount++;

    this.hits++;
    this.emit('cache:hit', { key });

    return entry.value;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    if (this.destroyed) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  async delete(key: string): Promise<boolean> {
    if (this.destroyed) return false;

    const existed = this.cache.has(key);
    if (existed) {
      this.cache.delete(key);
      this.emit('cache:delete', { key });
    }
    return existed;
  }

  /**
   * Clear all entries from the cache
   */
  async clear(): Promise<void> {
    if (this.destroyed) return;

    this.cache.clear();
    this.emit('cache:clear', {});
  }

  /**
   * Get a cache entry with metadata
   */
  getEntry<T>(key: string): CacheEntry<T> | undefined {
    if (this.destroyed) return undefined;
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    if (this.destroyed) {
      return {
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        estimatedMemoryBytes: 0
      };
    }

    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      estimatedMemoryBytes: this.calculateTotalMemory()
    };
  }

  /**
   * Reset statistics (keeps cached data)
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate a cache key from an object
   */
  generateKey(obj: Record<string, unknown>): string {
    return this.hashObject(obj);
  }

  /**
   * Clear entries by pattern (e.g., "prefix:*")
   */
  async clearByPattern(pattern: string): Promise<number> {
    if (this.destroyed) return 0;

    const regex = this.patternToRegex(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Get keys matching a pattern
   */
  getKeysByPattern(pattern: string): string[] {
    if (this.destroyed) return [];

    const regex = this.patternToRegex(pattern);
    const matchingKeys: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    return matchingKeys;
  }

  /**
   * Get or set - returns cached value or calls factory and caches result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: SetOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.destroyed = true;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.removeAllListeners();
  }

  // Private methods

  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl === 0) return false; // 0 means infinite TTL

    const age = Date.now() - entry.createdAt.getTime();
    return age > entry.ttl;
  }

  private evict(): void {
    switch (this.config.evictionPolicy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
      case 'lfu':
        this.evictLFU();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt.getTime() < oldestTime) {
        oldestTime = entry.lastAccessedAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictFIFO(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.createdAt.getTime() < oldestTime) {
        oldestTime = entry.createdAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictLFU(): void {
    let leastUsedKey: string | undefined;
    let leastCount = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);

    // Don't let the timer prevent process exit
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  private cleanupExpired(): void {
    if (this.destroyed) return;

    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.emit('cache:expired', { key });
    }
  }

  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 8;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'number') return 8;
    if (typeof value === 'string') return value.length * 2;
    if (value instanceof Date) return 8;
    if (Array.isArray(value)) {
      return value.reduce((sum: number, item) => sum + this.estimateSize(item), 0);
    }
    if (typeof value === 'object') {
      return Object.entries(value).reduce((sum, [key, val]) => {
        return sum + key.length * 2 + this.estimateSize(val);
      }, 0);
    }
    return 8;
  }

  private calculateTotalMemory(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private hashObject(obj: Record<string, unknown>): string {
    const str = JSON.stringify(this.sortObject(obj));
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `cache_${Math.abs(hash).toString(36)}`;
  }

  private sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }

    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = this.sortObject(obj[key] as Record<string, unknown>);
    }

    return sorted;
  }

  private patternToRegex(pattern: string): RegExp {
    // Escape special regex characters except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Convert * to .*
    const regexPattern = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`);
  }
}

/**
 * Factory function
 */
export function createCachingService(
  config: Partial<CacheConfig> = {}
): CachingService {
  return new CachingService(config);
}
