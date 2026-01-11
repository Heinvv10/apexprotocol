import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  CacheQueueService,
  createCacheQueueService,
  type CacheQueueConfig,
  type CacheEntry,
  type JobDefinition,
  type JobStatus,
  type JobResult,
  type CacheStats
} from '../src/services/cache-queue-service';

describe('CacheQueueService', () => {
  let service: CacheQueueService;

  beforeEach(() => {
    service = createCacheQueueService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      expect(service).toBeInstanceOf(CacheQueueService);
      const config = service.getConfig();
      expect(config.cacheTTL).toBeDefined();
      expect(config.maxCacheSize).toBeDefined();
      expect(config.maxConcurrentJobs).toBeDefined();
    });

    it('should create service with custom config', () => {
      const customService = createCacheQueueService({
        cacheTTL: 300000,
        maxCacheSize: 500,
        maxConcurrentJobs: 10
      });
      const config = customService.getConfig();
      expect(config.cacheTTL).toBe(300000);
      expect(config.maxCacheSize).toBe(500);
      expect(config.maxConcurrentJobs).toBe(10);
      customService.shutdown();
    });

    it('should validate config with Zod schema', () => {
      expect(() => createCacheQueueService({
        cacheTTL: -1
      })).toThrow();
    });
  });

  describe('Caching', () => {
    it('should store and retrieve cached data', async () => {
      const key = 'test-key';
      const data = { value: 'test-data', timestamp: Date.now() };

      await service.set(key, data);
      const retrieved = await service.get<typeof data>(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', async () => {
      const result = await service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should respect TTL expiration', async () => {
      const shortTTLService = createCacheQueueService({
        cacheTTL: 100 // 100ms TTL
      });

      await shortTTLService.set('expiring-key', 'value');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await shortTTLService.get('expiring-key');
      expect(result).toBeNull();

      shortTTLService.shutdown();
    });

    it('should allow custom TTL per entry', async () => {
      await service.set('short-ttl', 'value', { ttl: 100 });
      await service.set('long-ttl', 'value', { ttl: 10000 });

      await new Promise(resolve => setTimeout(resolve, 150));

      const shortResult = await service.get('short-ttl');
      const longResult = await service.get('long-ttl');

      expect(shortResult).toBeNull();
      expect(longResult).toBe('value');
    });

    it('should delete cached entries', async () => {
      await service.set('delete-test', 'value');
      expect(await service.get('delete-test')).toBe('value');

      await service.delete('delete-test');
      expect(await service.get('delete-test')).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.set('key3', 'value3');

      await service.clearCache();

      expect(await service.get('key1')).toBeNull();
      expect(await service.get('key2')).toBeNull();
      expect(await service.get('key3')).toBeNull();
    });

    it('should enforce max cache size with LRU eviction', async () => {
      const smallCacheService = createCacheQueueService({
        maxCacheSize: 3
      });

      await smallCacheService.set('key1', 'value1');
      await smallCacheService.set('key2', 'value2');
      await smallCacheService.set('key3', 'value3');

      // Add new entry, should evict oldest (key1)
      await smallCacheService.set('key4', 'value4');

      // One of the original keys should be evicted
      const stats = await smallCacheService.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.evictions).toBeGreaterThanOrEqual(1);

      smallCacheService.shutdown();
    });

    it('should provide cache statistics', async () => {
      await service.set('stat-key1', 'value1');
      await service.set('stat-key2', 'value2');
      await service.get('stat-key1');
      await service.get('stat-key1');
      await service.get('non-existent');

      const stats = await service.getCacheStats();

      expect(stats.size).toBeGreaterThanOrEqual(2);
      expect(stats.hits).toBeGreaterThanOrEqual(2);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeDefined();
    });

    it('should support cache namespaces', async () => {
      await service.set('brand:123:insights', { data: 'insights' });
      await service.set('brand:123:recommendations', { data: 'recommendations' });
      await service.set('brand:456:insights', { data: 'other-insights' });

      const keys = await service.getKeysByPattern('brand:123:*');

      expect(keys.length).toBe(2);
      expect(keys).toContain('brand:123:insights');
      expect(keys).toContain('brand:123:recommendations');
    });
  });

  describe('Job Queue', () => {
    it('should add jobs to the queue', async () => {
      const job: JobDefinition = {
        id: 'job-1',
        type: 'generate_insights',
        data: { brandId: 'brand-123' },
        priority: 'normal'
      };

      const result = await service.addJob(job);

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job-1');
    });

    it('should process jobs in order', async () => {
      const processedOrder: string[] = [];

      service.registerProcessor('test_job', async (job) => {
        processedOrder.push(job.id);
        return { success: true };
      });

      await service.addJob({ id: 'job-1', type: 'test_job', data: {}, priority: 'normal' });
      await service.addJob({ id: 'job-2', type: 'test_job', data: {}, priority: 'normal' });
      await service.addJob({ id: 'job-3', type: 'test_job', data: {}, priority: 'normal' });

      // Wait for all jobs to complete - use event-based waiting
      await new Promise<void>(resolve => {
        let completed = 0;
        service.on('job:completed', () => {
          completed++;
          if (completed === 3) resolve();
        });
        // Fallback timeout in case events don't fire
        setTimeout(() => resolve(), 500);
      });

      expect(processedOrder).toEqual(['job-1', 'job-2', 'job-3']);
    });

    it('should prioritize high priority jobs', async () => {
      const processedOrder: string[] = [];

      service.registerProcessor('priority_job', async (job) => {
        processedOrder.push(job.id);
        return { success: true };
      });

      // Pause processing temporarily
      service.pauseProcessing();

      await service.addJob({ id: 'normal-1', type: 'priority_job', data: {}, priority: 'normal' });
      await service.addJob({ id: 'high-1', type: 'priority_job', data: {}, priority: 'high' });
      await service.addJob({ id: 'low-1', type: 'priority_job', data: {}, priority: 'low' });
      await service.addJob({ id: 'critical-1', type: 'priority_job', data: {}, priority: 'critical' });

      // Resume processing
      service.resumeProcessing();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 150));

      // Critical and high should be processed first
      expect(processedOrder.indexOf('critical-1')).toBeLessThan(processedOrder.indexOf('normal-1'));
      expect(processedOrder.indexOf('high-1')).toBeLessThan(processedOrder.indexOf('low-1'));
    });

    it('should track job status', async () => {
      service.registerProcessor('status_job', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true };
      });

      await service.addJob({ id: 'status-test', type: 'status_job', data: {}, priority: 'normal' });

      const initialStatus = await service.getJobStatus('status-test');
      expect(['pending', 'processing']).toContain(initialStatus?.status);

      // Wait for completion using event
      await new Promise<void>(resolve => {
        service.on('job:completed', (data) => {
          if (data.jobId === 'status-test') resolve();
        });
        setTimeout(() => resolve(), 500);
      });

      const finalStatus = await service.getJobStatus('status-test');
      expect(finalStatus?.status).toBe('completed');
    });

    it('should handle job failures', async () => {
      service.registerProcessor('failing_job', async () => {
        throw new Error('Job failed intentionally');
      });

      await service.addJob({ id: 'failing-test', type: 'failing_job', data: {}, priority: 'normal', maxRetries: 0 });

      // Wait for failure using event
      await new Promise<void>(resolve => {
        service.on('job:failed', (data) => {
          if (data.jobId === 'failing-test') resolve();
        });
        setTimeout(() => resolve(), 500);
      });

      const status = await service.getJobStatus('failing-test');
      expect(status?.status).toBe('failed');
      expect(status?.error).toBeDefined();
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;

      service.registerProcessor('retry_job', async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Not ready yet');
        }
        return { success: true };
      });

      await service.addJob({
        id: 'retry-test',
        type: 'retry_job',
        data: {},
        priority: 'normal',
        maxRetries: 3
      });

      // Wait for completion using event
      await new Promise<void>(resolve => {
        service.on('job:completed', (data) => {
          if (data.jobId === 'retry-test') resolve();
        });
        setTimeout(() => resolve(), 2000); // Allow time for retries with backoff
      });

      const status = await service.getJobStatus('retry-test');
      expect(status?.status).toBe('completed');
      expect(attempts).toBe(3);
    });

    it('should respect max concurrent jobs', async () => {
      const concurrentService = createCacheQueueService({
        maxConcurrentJobs: 2
      });

      let concurrentCount = 0;
      let maxConcurrent = 0;

      concurrentService.registerProcessor('concurrent_job', async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise(resolve => setTimeout(resolve, 50));
        concurrentCount--;
        return { success: true };
      });

      // Add 5 jobs
      for (let i = 0; i < 5; i++) {
        await concurrentService.addJob({
          id: `concurrent-${i}`,
          type: 'concurrent_job',
          data: {},
          priority: 'normal'
        });
      }

      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(maxConcurrent).toBeLessThanOrEqual(2);

      concurrentService.shutdown();
    });

    it('should cancel pending jobs', async () => {
      service.pauseProcessing();

      await service.addJob({ id: 'cancel-test', type: 'some_job', data: {}, priority: 'normal' });

      const cancelled = await service.cancelJob('cancel-test');
      expect(cancelled).toBe(true);

      const status = await service.getJobStatus('cancel-test');
      expect(status?.status).toBe('cancelled');

      service.resumeProcessing();
    });

    it('should provide queue statistics', async () => {
      service.registerProcessor('stats_job', async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return { success: true };
      });

      await service.addJob({ id: 'stats-1', type: 'stats_job', data: {}, priority: 'normal' });
      await service.addJob({ id: 'stats-2', type: 'stats_job', data: {}, priority: 'high' });

      const stats = await service.getQueueStats();

      expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
      expect(stats.pendingJobs).toBeDefined();
      expect(stats.processingJobs).toBeDefined();
      expect(stats.completedJobs).toBeDefined();
    });
  });

  describe('Cache-Queue Integration', () => {
    it('should cache job results', async () => {
      service.registerProcessor('cacheable_job', async (job) => {
        return { success: true, data: { result: `processed-${job.data.input}` } };
      });

      await service.addJob({
        id: 'cache-result-test',
        type: 'cacheable_job',
        data: { input: 'test-input' },
        priority: 'normal',
        cacheResult: true,
        cacheKey: 'job-result:test'
      });

      // Wait for completion using event
      await new Promise<void>(resolve => {
        service.on('job:completed', (data) => {
          if (data.jobId === 'cache-result-test') resolve();
        });
        setTimeout(() => resolve(), 500);
      });

      const cachedResult = await service.get<JobResult>('job-result:test');
      expect(cachedResult).toBeDefined();
      expect(cachedResult?.data?.result).toBe('processed-test-input');
    });

    it('should skip processing if result is cached', async () => {
      let processorCalls = 0;

      service.registerProcessor('skip_if_cached', async () => {
        processorCalls++;
        return { success: true, data: { value: 'fresh' } };
      });

      // Pre-cache a result
      await service.set('cached-job:key', { success: true, data: { value: 'cached' } });

      await service.addJob({
        id: 'skip-test',
        type: 'skip_if_cached',
        data: {},
        priority: 'normal',
        cacheResult: true,
        cacheKey: 'cached-job:key',
        skipIfCached: true
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(processorCalls).toBe(0); // Should not have called processor
    });

    it('should invalidate related cache entries on job completion', async () => {
      await service.set('brand:123:insights', { stale: true });
      await service.set('brand:123:recommendations', { stale: true });

      service.registerProcessor('invalidate_job', async () => {
        return { success: true };
      });

      await service.addJob({
        id: 'invalidate-test',
        type: 'invalidate_job',
        data: {},
        priority: 'normal',
        invalidatePatterns: ['brand:123:*']
      });

      // Wait for completion using event
      await new Promise<void>(resolve => {
        service.on('job:completed', (data) => {
          if (data.jobId === 'invalidate-test') resolve();
        });
        setTimeout(() => resolve(), 500);
      });

      const insights = await service.get('brand:123:insights');
      const recommendations = await service.get('brand:123:recommendations');

      expect(insights).toBeNull();
      expect(recommendations).toBeNull();
    });
  });

  describe('Events', () => {
    it('should emit cache:hit event', async () => {
      const hitSpy = vi.fn();
      service.on('cache:hit', hitSpy);

      await service.set('event-key', 'value');
      await service.get('event-key');

      expect(hitSpy).toHaveBeenCalledWith({ key: 'event-key' });
    });

    it('should emit cache:miss event', async () => {
      const missSpy = vi.fn();
      service.on('cache:miss', missSpy);

      await service.get('non-existent-key');

      expect(missSpy).toHaveBeenCalledWith({ key: 'non-existent-key' });
    });

    it('should emit job:completed event', async () => {
      const completedSpy = vi.fn();
      service.on('job:completed', completedSpy);

      service.registerProcessor('event_job', async () => ({ success: true }));

      await service.addJob({ id: 'event-test', type: 'event_job', data: {}, priority: 'normal' });

      // Wait for completion using event
      await new Promise<void>(resolve => {
        service.on('job:completed', () => resolve());
        setTimeout(() => resolve(), 500);
      });

      expect(completedSpy).toHaveBeenCalled();
    });

    it('should emit job:failed event', async () => {
      const failedSpy = vi.fn();
      service.on('job:failed', failedSpy);

      service.registerProcessor('failing_event_job', async () => {
        throw new Error('Intentional failure');
      });

      await service.addJob({
        id: 'fail-event-test',
        type: 'failing_event_job',
        data: {},
        priority: 'normal',
        maxRetries: 0
      });

      // Wait for failure using event
      await new Promise<void>(resolve => {
        service.on('job:failed', () => resolve());
        setTimeout(() => resolve(), 500);
      });

      expect(failedSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle processor errors gracefully', async () => {
      service.registerProcessor('error_job', async () => {
        throw new Error('Processor error');
      });

      const result = await service.addJob({
        id: 'error-test',
        type: 'error_job',
        data: {},
        priority: 'normal',
        maxRetries: 0
      });

      expect(result.success).toBe(true); // Job was added successfully

      // Wait for failure using event
      await new Promise<void>(resolve => {
        service.on('job:failed', (data) => {
          if (data.jobId === 'error-test') resolve();
        });
        setTimeout(() => resolve(), 500);
      });

      const status = await service.getJobStatus('error-test');
      expect(status?.status).toBe('failed');
    });

    it('should handle invalid job types', async () => {
      const result = await service.addJob({
        id: 'invalid-type',
        type: 'non_existent_processor',
        data: {},
        priority: 'normal'
      });

      // Wait for failure using event
      await new Promise<void>(resolve => {
        service.on('job:failed', (data) => {
          if (data.jobId === 'invalid-type') resolve();
        });
        setTimeout(() => resolve(), 500);
      });

      const status = await service.getJobStatus('invalid-type');
      expect(status?.status).toBe('failed');
      expect(status?.error).toContain('processor');
    });

    it('should handle duplicate job IDs', async () => {
      await service.addJob({ id: 'dup-test', type: 'some_job', data: {}, priority: 'normal' });

      const result = await service.addJob({
        id: 'dup-test',
        type: 'some_job',
        data: {},
        priority: 'normal'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exists');
    });
  });

  describe('Performance', () => {
    it('should handle high cache throughput', async () => {
      const startTime = Date.now();

      // Write 1000 entries
      for (let i = 0; i < 1000; i++) {
        await service.set(`perf-key-${i}`, { value: i });
      }

      // Read them back
      for (let i = 0; i < 1000; i++) {
        await service.get(`perf-key-${i}`);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle queue burst', async () => {
      service.registerProcessor('burst_job', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { success: true };
      });

      const startTime = Date.now();

      // Add 100 jobs rapidly
      for (let i = 0; i < 100; i++) {
        await service.addJob({
          id: `burst-${i}`,
          type: 'burst_job',
          data: {},
          priority: 'normal'
        });
      }

      const addDuration = Date.now() - startTime;

      // Adding jobs should be fast
      expect(addDuration).toBeLessThan(1000);
    });
  });
});
