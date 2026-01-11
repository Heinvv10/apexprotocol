import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CachingService,
  createCachingService,
  CacheConfig,
  CacheEntry,
  CacheStats
} from '../src/services/caching-service';

describe('CachingService', () => {
  let service: CachingService;
  let eventHandlers: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    eventHandlers = {};
    service = createCachingService({
      maxSize: 100,
      defaultTTL: 60000, // 1 minute
      cleanupInterval: 30000
    });

    // Capture events
    service.on('cache:hit', (...args) => {
      eventHandlers['cache:hit']?.(...args);
    });
    service.on('cache:miss', (...args) => {
      eventHandlers['cache:miss']?.(...args);
    });
    service.on('cache:set', (...args) => {
      eventHandlers['cache:set']?.(...args);
    });
    service.on('cache:delete', (...args) => {
      eventHandlers['cache:delete']?.(...args);
    });
    service.on('cache:clear', (...args) => {
      eventHandlers['cache:clear']?.(...args);
    });
    service.on('cache:expired', (...args) => {
      eventHandlers['cache:expired']?.(...args);
    });
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createCachingService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getStats().size).toBe(0);
      defaultService.destroy();
    });

    it('should create service with custom config', () => {
      const customService = createCachingService({
        maxSize: 50,
        defaultTTL: 30000
      });
      expect(customService).toBeDefined();
      customService.destroy();
    });

    it('should initialize with empty cache', () => {
      const stats = service.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      await service.set('key1', { data: 'value1' });
      const result = await service.get('key1');
      expect(result).toEqual({ data: 'value1' });
    });

    it('should return undefined for missing key', async () => {
      const result = await service.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', async () => {
      await service.set('exists', 'value');
      expect(service.has('exists')).toBe(true);
      expect(service.has('notexists')).toBe(false);
    });

    it('should delete a key', async () => {
      await service.set('toDelete', 'value');
      expect(service.has('toDelete')).toBe(true);

      const deleted = await service.delete('toDelete');
      expect(deleted).toBe(true);
      expect(service.has('toDelete')).toBe(false);
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await service.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.set('key3', 'value3');

      expect(service.getStats().size).toBe(3);

      await service.clear();
      expect(service.getStats().size).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should set value with custom TTL', async () => {
      await service.set('ttlKey', 'value', { ttl: 100 });
      const entry = service.getEntry('ttlKey');
      expect(entry?.ttl).toBe(100);
    });

    it('should expire value after TTL', async () => {
      vi.useFakeTimers();

      await service.set('expiring', 'value', { ttl: 100 });
      expect(await service.get('expiring')).toBe('value');

      // Advance time past TTL
      vi.advanceTimersByTime(150);

      expect(await service.get('expiring')).toBeUndefined();

      vi.useRealTimers();
    });

    it('should use default TTL when not specified', async () => {
      await service.set('defaultTTL', 'value');
      const entry = service.getEntry('defaultTTL');
      expect(entry?.ttl).toBe(60000); // Default from config
    });

    it('should not expire with TTL of 0 (infinite)', async () => {
      vi.useFakeTimers();

      await service.set('infinite', 'value', { ttl: 0 });

      // Advance time significantly
      vi.advanceTimersByTime(1000000);

      expect(await service.get('infinite')).toBe('value');

      vi.useRealTimers();
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', async () => {
      await service.set('trackHit', 'value');

      await service.get('trackHit');
      await service.get('trackHit');

      const stats = service.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', async () => {
      await service.get('miss1');
      await service.get('miss2');

      const stats = service.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate', async () => {
      await service.set('hit', 'value');

      await service.get('hit');  // hit
      await service.get('hit');  // hit
      await service.get('miss'); // miss

      const stats = service.getStats();
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });

    it('should track cache size', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');

      expect(service.getStats().size).toBe(2);

      await service.delete('key1');
      expect(service.getStats().size).toBe(1);
    });

    it('should reset statistics', async () => {
      await service.set('key', 'value');
      await service.get('key');
      await service.get('miss');

      service.resetStats();

      const stats = service.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(1); // Size should remain
    });
  });

  describe('Eviction Policies', () => {
    it('should evict oldest entries when max size reached (LRU)', async () => {
      const smallCache = createCachingService({
        maxSize: 3,
        evictionPolicy: 'lru'
      });

      await smallCache.set('key1', 'value1');
      await new Promise(r => setTimeout(r, 5)); // Small delay to ensure different timestamps
      await smallCache.set('key2', 'value2');
      await new Promise(r => setTimeout(r, 5));
      await smallCache.set('key3', 'value3');
      await new Promise(r => setTimeout(r, 5));

      // Access key1 to make it recently used
      await smallCache.get('key1');

      // Add another key, should evict key2 (least recently used after key1 was accessed)
      await smallCache.set('key4', 'value4');

      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);

      smallCache.destroy();
    });

    it('should evict based on FIFO policy', async () => {
      const fifoCache = createCachingService({
        maxSize: 3,
        evictionPolicy: 'fifo'
      });

      await fifoCache.set('key1', 'value1');
      await fifoCache.set('key2', 'value2');
      await fifoCache.set('key3', 'value3');

      // Add another key, should evict key1 (first in)
      await fifoCache.set('key4', 'value4');

      expect(fifoCache.has('key1')).toBe(false);
      expect(fifoCache.has('key2')).toBe(true);
      expect(fifoCache.has('key4')).toBe(true);

      fifoCache.destroy();
    });
  });

  describe('Events', () => {
    it('should emit cache:set event', async () => {
      const handler = vi.fn();
      eventHandlers['cache:set'] = handler;

      await service.set('eventKey', 'eventValue');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        key: 'eventKey'
      }));
    });

    it('should emit cache:hit event on successful get', async () => {
      const handler = vi.fn();
      eventHandlers['cache:hit'] = handler;

      await service.set('hitKey', 'value');
      await service.get('hitKey');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        key: 'hitKey'
      }));
    });

    it('should emit cache:miss event on failed get', async () => {
      const handler = vi.fn();
      eventHandlers['cache:miss'] = handler;

      await service.get('missKey');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        key: 'missKey'
      }));
    });

    it('should emit cache:delete event', async () => {
      const handler = vi.fn();
      eventHandlers['cache:delete'] = handler;

      await service.set('deleteKey', 'value');
      await service.delete('deleteKey');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        key: 'deleteKey'
      }));
    });

    it('should emit cache:clear event', async () => {
      const handler = vi.fn();
      eventHandlers['cache:clear'] = handler;

      await service.set('key1', 'value1');
      await service.clear();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Key Generation', () => {
    it('should generate cache key from object', () => {
      const key = service.generateKey({
        type: 'content',
        id: '123',
        platform: 'twitter'
      });

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should generate same key for same object', () => {
      const key1 = service.generateKey({ a: 1, b: 2 });
      const key2 = service.generateKey({ a: 1, b: 2 });

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different objects', () => {
      const key1 = service.generateKey({ a: 1 });
      const key2 = service.generateKey({ a: 2 });

      expect(key1).not.toBe(key2);
    });

    it('should handle nested objects', () => {
      const key = service.generateKey({
        outer: {
          inner: {
            value: 'test'
          }
        }
      });

      expect(key).toBeDefined();
    });
  });

  describe('Namespacing', () => {
    it('should support namespaced keys', async () => {
      await service.set('content:123', 'value1');
      await service.set('brand:456', 'value2');

      expect(await service.get('content:123')).toBe('value1');
      expect(await service.get('brand:456')).toBe('value2');
    });

    it('should clear by namespace pattern', async () => {
      await service.set('content:1', 'v1');
      await service.set('content:2', 'v2');
      await service.set('brand:1', 'v3');

      await service.clearByPattern('content:*');

      expect(service.has('content:1')).toBe(false);
      expect(service.has('content:2')).toBe(false);
      expect(service.has('brand:1')).toBe(true);
    });

    it('should get all keys by pattern', async () => {
      await service.set('prefix:a', 'v1');
      await service.set('prefix:b', 'v2');
      await service.set('other:c', 'v3');

      const keys = service.getKeysByPattern('prefix:*');

      expect(keys).toContain('prefix:a');
      expect(keys).toContain('prefix:b');
      expect(keys).not.toContain('other:c');
    });
  });

  describe('Serialization', () => {
    it('should handle complex objects', async () => {
      const complex = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { a: 1 },
        date: new Date('2025-01-01'),
        null: null
      };

      await service.set('complex', complex);
      const result = await service.get('complex');

      expect(result).toEqual(complex);
    });

    it('should handle arrays', async () => {
      const array = [1, 'two', { three: 3 }];

      await service.set('array', array);
      const result = await service.get('array');

      expect(result).toEqual(array);
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent sets', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.set(`concurrent:${i}`, `value${i}`)
      );

      await Promise.all(promises);

      expect(service.getStats().size).toBe(10);
    });

    it('should handle concurrent gets', async () => {
      await service.set('concurrentGet', 'value');

      const promises = Array.from({ length: 10 }, () =>
        service.get('concurrentGet')
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r === 'value')).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should estimate memory usage', async () => {
      await service.set('memKey', 'a'.repeat(1000));

      const stats = service.getStats();
      expect(stats.estimatedMemoryBytes).toBeGreaterThan(1000);
    });

    it('should cleanup on destroy', () => {
      const tempService = createCachingService();
      tempService.destroy();

      // Should not throw after destroy
      expect(tempService.getStats().size).toBe(0);
    });
  });

  describe('GetOrSet Pattern', () => {
    it('should return cached value if exists', async () => {
      await service.set('getOrSet', 'cached');

      const factory = vi.fn().mockResolvedValue('factory');
      const result = await service.getOrSet('getOrSet', factory);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache if missing', async () => {
      const factory = vi.fn().mockResolvedValue('factoryValue');

      const result = await service.getOrSet('newKey', factory);

      expect(result).toBe('factoryValue');
      expect(factory).toHaveBeenCalled();
      expect(await service.get('newKey')).toBe('factoryValue');
    });

    it('should pass TTL option to getOrSet', async () => {
      const factory = vi.fn().mockResolvedValue('value');

      await service.getOrSet('ttlKey', factory, { ttl: 5000 });

      const entry = service.getEntry('ttlKey');
      expect(entry?.ttl).toBe(5000);
    });
  });
});
