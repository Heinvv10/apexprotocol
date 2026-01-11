import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Job Queue Service
 *
 * Provides job queue management with priorities, retries,
 * delayed execution, and progress tracking for content generation tasks.
 */

// Job Status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Job Priority
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

// Priority weights for ordering
const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1
};

// Zod Schemas
export const JobConfigSchema = z.object({
  maxConcurrent: z.number().min(1).default(5),
  defaultRetries: z.number().min(0).default(3),
  retryDelay: z.number().min(0).default(1000),
  processingTimeout: z.number().min(0).default(300000) // 5 minutes
});

export type JobConfig = z.infer<typeof JobConfigSchema>;

// Job Input
export interface JobInput {
  type: string;
  data: Record<string, unknown>;
  priority?: JobPriority;
  retries?: number;
  delay?: number;
}

// Job Interface
export interface Job {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: JobStatus;
  priority: JobPriority;
  retries: number;
  retriesRemaining: number;
  delay?: number;
  scheduledFor?: Date;
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Job Context (passed to handler)
export interface JobContext {
  jobId: string;
  updateProgress: (progress: number) => void;
}

// Job Handler
export type JobHandler = (
  data: Record<string, unknown>,
  context: JobContext
) => Promise<unknown>;

// Job Filter
export interface JobFilter {
  status?: JobStatus;
  type?: string;
}

// Queue Statistics
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
}

// Cleanup Options
export interface CleanupOptions {
  maxAge: number; // milliseconds
}

/**
 * Job Queue Service
 */
export class JobQueueService extends EventEmitter {
  private config: JobConfig;
  private jobs: Map<string, Job>;
  private handlers: Map<string, JobHandler>;
  private processing: Set<string>;
  private paused: boolean = false;
  private shuttingDown: boolean = false;
  private processingTimes: number[] = [];
  private idCounter: number = 0;

  constructor(config: Partial<JobConfig> = {}) {
    super();
    this.config = JobConfigSchema.parse(config);
    this.jobs = new Map();
    this.handlers = new Map();
    this.processing = new Set();
  }

  /**
   * Add a job to the queue
   */
  async add(input: JobInput): Promise<Job> {
    const id = this.generateId();
    const now = new Date();

    const job: Job = {
      id,
      type: input.type,
      data: input.data,
      status: 'pending',
      priority: input.priority || 'normal',
      retries: input.retries ?? this.config.defaultRetries,
      retriesRemaining: input.retries ?? this.config.defaultRetries,
      delay: input.delay,
      scheduledFor: input.delay ? new Date(now.getTime() + input.delay) : undefined,
      progress: 0,
      createdAt: now
    };

    this.jobs.set(id, job);
    this.emit('job:added', job);

    return job;
  }

  /**
   * Register a handler for a job type
   */
  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Check if a handler exists for a type
   */
  hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }

  /**
   * Process the next job in the queue
   */
  async processNext(): Promise<void> {
    if (this.paused || this.shuttingDown) return;
    if (this.processing.size >= this.config.maxConcurrent) return;

    const job = this.getNextJob();
    if (!job) return;

    await this.processJob(job);
  }

  /**
   * Process all pending jobs
   */
  async processAll(): Promise<void> {
    const maxIterations = 100; // Prevent infinite loops
    let iterations = 0;

    const processLoop = async () => {
      while (!this.paused && !this.shuttingDown && iterations < maxIterations) {
        iterations++;

        // Check for any jobs that can be processed (pending and not delayed)
        const pendingJobs = this.getPendingJobs();
        const allJobs = Array.from(this.jobs.values());
        const hasScheduledJobs = allJobs.some(
          j => j.status === 'pending' && j.scheduledFor && j.scheduledFor.getTime() > Date.now()
        );

        if (pendingJobs.length === 0 && this.processing.size === 0 && !hasScheduledJobs) {
          this.emit('queue:empty', {});
          break;
        }

        // Start as many jobs as we can
        while (this.processing.size < this.config.maxConcurrent) {
          const job = this.getNextJob();
          if (!job) break;
          this.processJob(job);
        }

        // Wait a bit before checking again
        // If we have scheduled jobs, wait for them
        if (pendingJobs.length === 0 && hasScheduledJobs) {
          await new Promise(r => setTimeout(r, Math.min(this.config.retryDelay, 100)));
        } else {
          await new Promise(r => setTimeout(r, 10));
        }
      }
    };

    await processLoop();

    // Wait for all processing jobs to complete
    while (this.processing.size > 0) {
      await new Promise(r => setTimeout(r, 10));
    }
  }

  /**
   * Get a job by ID
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * List all jobs, optionally filtered
   */
  listJobs(filter?: JobFilter): Job[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter(j => j.status === filter.status);
    }

    if (filter?.type) {
      jobs = jobs.filter(j => j.type === filter.type);
    }

    return jobs;
  }

  /**
   * Cancel a job
   */
  async cancel(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status !== 'pending') {
      return false;
    }

    job.status = 'cancelled';
    return true;
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    this.paused = true;
    this.emit('queue:paused', {});
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    this.paused = false;
    this.emit('queue:resumed', {});
  }

  /**
   * Check if the queue is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      pending,
      processing,
      completed,
      failed,
      avgProcessingTime
    };
  }

  /**
   * Clean up old jobs
   */
  async cleanup(options: CleanupOptions): Promise<number> {
    const cutoff = Date.now() - options.maxAge;
    let cleaned = 0;

    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' || job.status === 'failed') {
        const completedTime = job.completedAt?.getTime() || job.createdAt.getTime();
        if (completedTime < cutoff) {
          this.jobs.delete(id);
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.shuttingDown = true;

    // Wait for currently processing jobs to complete
    while (this.processing.size > 0) {
      await new Promise(r => setTimeout(r, 50));
    }

    this.removeAllListeners();
  }

  // Private methods

  private generateId(): string {
    this.idCounter++;
    return `job_${Date.now()}_${this.idCounter}`;
  }

  private getNextJob(): Job | undefined {
    const pendingJobs = this.getPendingJobs();
    if (pendingJobs.length === 0) return undefined;

    // Sort by priority (highest first), then by creation time
    pendingJobs.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return pendingJobs[0];
  }

  private getPendingJobs(): Job[] {
    const now = Date.now();
    return Array.from(this.jobs.values()).filter(job => {
      if (job.status !== 'pending') return false;

      // Check if delayed job is ready
      if (job.scheduledFor && job.scheduledFor.getTime() > now) {
        return false;
      }

      return true;
    });
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      this.emit('job:failed', job);
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    this.processing.add(job.id);
    this.emit('job:started', job);

    const context: JobContext = {
      jobId: job.id,
      updateProgress: (progress: number) => {
        job.progress = progress;
      }
    };

    try {
      const result = await handler(job.data, context);
      job.result = result;
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

      // Track processing time
      const processingTime = job.completedAt.getTime() - job.startedAt.getTime();
      this.processingTimes.push(processingTime);
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.emit('job:completed', job);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.error = errorMessage;

      if (job.retriesRemaining > 0) {
        job.retriesRemaining--;
        job.status = 'pending';
        this.emit('job:retry', job);

        // Schedule retry after delay
        if (this.config.retryDelay > 0) {
          job.scheduledFor = new Date(Date.now() + this.config.retryDelay);
        }
      } else {
        job.status = 'failed';
        job.completedAt = new Date();
        this.emit('job:failed', job);
      }
    } finally {
      this.processing.delete(job.id);
    }
  }
}

/**
 * Factory function
 */
export function createJobQueueService(
  config: Partial<JobConfig> = {}
): JobQueueService {
  return new JobQueueService(config);
}
