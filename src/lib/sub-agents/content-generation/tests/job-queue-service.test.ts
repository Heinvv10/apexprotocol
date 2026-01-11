import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  JobQueueService,
  createJobQueueService,
  JobConfig,
  Job,
  JobStatus,
  JobPriority
} from '../src/services/job-queue-service';

describe('JobQueueService', () => {
  let service: JobQueueService;
  let eventHandlers: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    eventHandlers = {};
    service = createJobQueueService({
      maxConcurrent: 2,
      defaultRetries: 3,
      retryDelay: 100,
      processingTimeout: 5000
    });

    // Capture events
    ['job:added', 'job:started', 'job:completed', 'job:failed', 'job:retry', 'queue:empty', 'queue:paused', 'queue:resumed'].forEach(event => {
      service.on(event, (...args) => {
        eventHandlers[event]?.(...args);
      });
    });
  });

  afterEach(async () => {
    await service.shutdown();
  });

  describe('Initialization', () => {
    it('should create service with default config', () => {
      const defaultService = createJobQueueService();
      expect(defaultService).toBeDefined();
      defaultService.shutdown();
    });

    it('should create service with custom config', () => {
      const customService = createJobQueueService({
        maxConcurrent: 5,
        defaultRetries: 5
      });
      expect(customService).toBeDefined();
      customService.shutdown();
    });

    it('should initialize with empty queue', () => {
      const stats = service.getStats();
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Job Addition', () => {
    it('should add a job to the queue', async () => {
      const job = await service.add({
        type: 'content-generation',
        data: { topic: 'AI trends' }
      });

      expect(job.id).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.type).toBe('content-generation');
    });

    it('should generate unique job IDs', async () => {
      const job1 = await service.add({ type: 'test', data: {} });
      const job2 = await service.add({ type: 'test', data: {} });

      expect(job1.id).not.toBe(job2.id);
    });

    it('should support job priority', async () => {
      const lowPriority = await service.add({
        type: 'test',
        data: {},
        priority: 'low'
      });

      const highPriority = await service.add({
        type: 'test',
        data: {},
        priority: 'high'
      });

      expect(lowPriority.priority).toBe('low');
      expect(highPriority.priority).toBe('high');
    });

    it('should use default priority when not specified', async () => {
      const job = await service.add({ type: 'test', data: {} });
      expect(job.priority).toBe('normal');
    });

    it('should emit job:added event', async () => {
      const handler = vi.fn();
      eventHandlers['job:added'] = handler;

      await service.add({ type: 'test', data: {} });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'test'
      }));
    });
  });

  describe('Job Processing', () => {
    it('should process jobs with registered handler', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });

      service.registerHandler('test-type', handler);

      const job = await service.add({
        type: 'test-type',
        data: { key: 'value' }
      });

      await service.processNext();
      await vi.waitFor(() => expect(handler).toHaveBeenCalled());

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'value' }),
        expect.any(Object)
      );
    });

    it('should process high priority jobs first', async () => {
      const processOrder: string[] = [];
      const handler = vi.fn().mockImplementation(async (data) => {
        processOrder.push(data.name);
        return { success: true };
      });

      service.registerHandler('priority-test', handler);

      await service.add({ type: 'priority-test', data: { name: 'low' }, priority: 'low' });
      await service.add({ type: 'priority-test', data: { name: 'high' }, priority: 'high' });
      await service.add({ type: 'priority-test', data: { name: 'normal' }, priority: 'normal' });

      await service.processAll();

      expect(processOrder[0]).toBe('high');
    });

    it('should limit concurrent processing', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const handler = vi.fn().mockImplementation(async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise(r => setTimeout(r, 50));
        concurrentCount--;
        return { success: true };
      });

      service.registerHandler('concurrent-test', handler);

      // Add more jobs than max concurrent
      for (let i = 0; i < 5; i++) {
        await service.add({ type: 'concurrent-test', data: { i } });
      }

      await service.processAll();

      expect(maxConcurrent).toBeLessThanOrEqual(2); // maxConcurrent from config
    });

    it('should emit job:started event', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      const startedHandler = vi.fn();
      eventHandlers['job:started'] = startedHandler;

      service.registerHandler('start-test', handler);
      await service.add({ type: 'start-test', data: {} });
      await service.processNext();

      await vi.waitFor(() => expect(startedHandler).toHaveBeenCalled());
    });

    it('should emit job:completed event on success', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'done' });
      const completedHandler = vi.fn();
      eventHandlers['job:completed'] = completedHandler;

      service.registerHandler('complete-test', handler);
      await service.add({ type: 'complete-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => expect(completedHandler).toHaveBeenCalled());
      expect(completedHandler).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed'
      }));
    });
  });

  describe('Job Failure and Retry', () => {
    it('should retry failed jobs', async () => {
      let attempts = 0;
      const handler = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      });

      service.registerHandler('retry-test', handler);
      await service.add({ type: 'retry-test', data: {}, retries: 3 });
      await service.processAll();

      await vi.waitFor(() => expect(attempts).toBe(3));
    });

    it('should emit job:retry event', async () => {
      let attempts = 0;
      const handler = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Retry me');
        }
        return { success: true };
      });

      const retryHandler = vi.fn();
      eventHandlers['job:retry'] = retryHandler;

      service.registerHandler('retry-event-test', handler);
      await service.add({ type: 'retry-event-test', data: {}, retries: 3 });
      await service.processAll();

      await vi.waitFor(() => expect(retryHandler).toHaveBeenCalled());
    });

    it('should emit job:failed event after all retries exhausted', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Always fails'));
      const failedHandler = vi.fn();
      eventHandlers['job:failed'] = failedHandler;

      service.registerHandler('fail-test', handler);
      await service.add({ type: 'fail-test', data: {}, retries: 2 });
      await service.processAll();

      await vi.waitFor(() => expect(failedHandler).toHaveBeenCalled());
      expect(failedHandler).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed'
      }));
    });

    it('should store error message on failure', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Specific error'));

      service.registerHandler('error-msg-test', handler);
      const job = await service.add({ type: 'error-msg-test', data: {}, retries: 0 });
      await service.processAll();

      await vi.waitFor(() => {
        const updatedJob = service.getJob(job.id);
        expect(updatedJob?.error).toBe('Specific error');
      });
    });
  });

  describe('Queue Control', () => {
    it('should pause the queue', async () => {
      await service.pause();
      expect(service.isPaused()).toBe(true);
    });

    it('should resume the queue', async () => {
      await service.pause();
      await service.resume();
      expect(service.isPaused()).toBe(false);
    });

    it('should not process jobs while paused', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('pause-test', handler);

      await service.pause();
      await service.add({ type: 'pause-test', data: {} });

      // Try to process
      await service.processNext();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit queue:paused event', async () => {
      const pausedHandler = vi.fn();
      eventHandlers['queue:paused'] = pausedHandler;

      await service.pause();

      expect(pausedHandler).toHaveBeenCalled();
    });

    it('should emit queue:resumed event', async () => {
      const resumedHandler = vi.fn();
      eventHandlers['queue:resumed'] = resumedHandler;

      await service.pause();
      await service.resume();

      expect(resumedHandler).toHaveBeenCalled();
    });

    it('should emit queue:empty event when all jobs processed', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      const emptyHandler = vi.fn();
      eventHandlers['queue:empty'] = emptyHandler;

      service.registerHandler('empty-test', handler);
      await service.add({ type: 'empty-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => expect(emptyHandler).toHaveBeenCalled());
    });
  });

  describe('Job Management', () => {
    it('should get job by ID', async () => {
      const job = await service.add({ type: 'get-test', data: { key: 'value' } });
      const retrieved = service.getJob(job.id);

      expect(retrieved).toEqual(job);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = service.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should cancel a pending job', async () => {
      const job = await service.add({ type: 'cancel-test', data: {} });
      const cancelled = await service.cancel(job.id);

      expect(cancelled).toBe(true);
      expect(service.getJob(job.id)?.status).toBe('cancelled');
    });

    it('should not cancel a completed job', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('cancel-complete-test', handler);

      const job = await service.add({ type: 'cancel-complete-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        const updatedJob = service.getJob(job.id);
        expect(updatedJob?.status).toBe('completed');
      });

      const cancelled = await service.cancel(job.id);
      expect(cancelled).toBe(false);
    });

    it('should list all jobs', async () => {
      await service.add({ type: 'list-test', data: { n: 1 } });
      await service.add({ type: 'list-test', data: { n: 2 } });

      const jobs = service.listJobs();
      expect(jobs.length).toBe(2);
    });

    it('should filter jobs by status', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('filter-test', handler);

      await service.add({ type: 'filter-test', data: { n: 1 } });
      await service.add({ type: 'filter-test', data: { n: 2 } });
      await service.processNext();

      await vi.waitFor(() => {
        const pending = service.listJobs({ status: 'pending' });
        expect(pending.length).toBe(1);
      });
    });

    it('should filter jobs by type', async () => {
      await service.add({ type: 'type-a', data: {} });
      await service.add({ type: 'type-b', data: {} });

      const typeAJobs = service.listJobs({ type: 'type-a' });
      expect(typeAJobs.length).toBe(1);
    });
  });

  describe('Queue Statistics', () => {
    it('should track pending jobs count', async () => {
      await service.add({ type: 'stats-test', data: {} });
      await service.add({ type: 'stats-test', data: {} });

      const stats = service.getStats();
      expect(stats.pending).toBe(2);
    });

    it('should track completed jobs count', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('complete-stats', handler);

      await service.add({ type: 'complete-stats', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        const stats = service.getStats();
        expect(stats.completed).toBe(1);
      });
    });

    it('should track failed jobs count', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Fail'));
      service.registerHandler('fail-stats', handler);

      await service.add({ type: 'fail-stats', data: {}, retries: 0 });
      await service.processAll();

      await vi.waitFor(() => {
        const stats = service.getStats();
        expect(stats.failed).toBe(1);
      });
    });

    it('should calculate average processing time', async () => {
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise(r => setTimeout(r, 20));
        return { success: true };
      });

      service.registerHandler('time-stats', handler);

      await service.add({ type: 'time-stats', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        const stats = service.getStats();
        expect(stats.avgProcessingTime).toBeGreaterThan(0);
      });
    });
  });

  describe('Delayed Jobs', () => {
    it('should support delayed job execution', async () => {
      vi.useFakeTimers();

      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('delayed-test', handler);

      await service.add({
        type: 'delayed-test',
        data: {},
        delay: 1000
      });

      // Job should not be processed immediately
      await service.processNext();
      expect(handler).not.toHaveBeenCalled();

      // Advance time past delay
      vi.advanceTimersByTime(1100);
      await service.processNext();

      vi.useRealTimers();
    });

    it('should include scheduled time for delayed jobs', async () => {
      const job = await service.add({
        type: 'scheduled-test',
        data: {},
        delay: 5000
      });

      expect(job.scheduledFor).toBeDefined();
      expect(job.scheduledFor!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Job Progress', () => {
    it('should update job progress', async () => {
      const handler = vi.fn().mockImplementation(async (data, context) => {
        context.updateProgress(50);
        await new Promise(r => setTimeout(r, 10));
        context.updateProgress(100);
        return { success: true };
      });

      service.registerHandler('progress-test', handler);
      const job = await service.add({ type: 'progress-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        const updatedJob = service.getJob(job.id);
        expect(updatedJob?.progress).toBe(100);
      });
    });
  });

  describe('Job Results', () => {
    it('should store job result on completion', async () => {
      const handler = vi.fn().mockResolvedValue({
        generated: 'content',
        wordCount: 500
      });

      service.registerHandler('result-test', handler);
      const job = await service.add({ type: 'result-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        const updatedJob = service.getJob(job.id);
        expect(updatedJob?.result).toEqual({
          generated: 'content',
          wordCount: 500
        });
      });
    });
  });

  describe('Cleanup', () => {
    it('should clean up old completed jobs', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('cleanup-test', handler);

      await service.add({ type: 'cleanup-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        expect(service.getStats().completed).toBe(1);
      });

      // Clean up with very short maxAge (0ms means any completed job is old)
      await service.cleanup({ maxAge: 0 });

      const jobs = service.listJobs();
      expect(jobs.filter(j => j.status === 'completed').length).toBe(0);
    });

    it('should not clean up recent jobs', async () => {
      const handler = vi.fn().mockResolvedValue({ success: true });
      service.registerHandler('recent-test', handler);

      await service.add({ type: 'recent-test', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        expect(service.getStats().completed).toBe(1);
      });

      await service.cleanup({ maxAge: 86400000 }); // 24 hours

      // Job should still exist (completed within last 24 hours)
      expect(service.listJobs().length).toBe(1);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should complete processing jobs on shutdown', async () => {
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise(r => setTimeout(r, 50));
        return { success: true };
      });

      service.registerHandler('shutdown-test', handler);
      await service.add({ type: 'shutdown-test', data: {} });

      // Start processing
      service.processNext();

      // Shutdown should wait for completion
      await service.shutdown();

      expect(service.getStats().completed).toBe(1);
    });
  });

  describe('Handler Registration', () => {
    it('should register multiple handlers', () => {
      service.registerHandler('type-a', vi.fn());
      service.registerHandler('type-b', vi.fn());

      expect(service.hasHandler('type-a')).toBe(true);
      expect(service.hasHandler('type-b')).toBe(true);
    });

    it('should fail for jobs without handler', async () => {
      await service.add({ type: 'no-handler', data: {} });
      await service.processAll();

      await vi.waitFor(() => {
        const stats = service.getStats();
        expect(stats.failed).toBe(1);
      });
    });
  });
});
