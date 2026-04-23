/**
 * Job Queue System (F100)
 * Serverless-compatible job queue using Upstash Redis
 * Provides BullMQ-like interface for background job processing
 */

import { getRedisClient } from "../redis";

// Job types
export type JobType =
  | "monitor:scan"
  | "monitor:platform"
  | "audit:crawl"
  | "audit:analyze"
  | "content:generate"
  | "recommendations:generate"
  | "report:weekly"
  | "report:monthly";

// Job status
export type JobStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "delayed";

// Job priority (lower = higher priority)
export type JobPriority = 1 | 2 | 3 | 4 | 5;

// Job data interface
export interface JobData {
  type: JobType;
  payload: Record<string, unknown>;
  priority?: JobPriority;
  delay?: number; // milliseconds
  attempts?: number;
  maxAttempts?: number;
  timeout?: number; // milliseconds
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  result?: unknown;
  metadata?: {
    brandId?: string;
    orgId?: string;
    userId?: string;
    platform?: string;
  };
}

// Job with ID
export interface Job extends JobData {
  id: string;
  status: JobStatus;
}

// Queue configuration
export interface QueueConfig {
  name: string;
  maxConcurrency?: number;
  defaultPriority?: JobPriority;
  defaultTimeout?: number;
  defaultMaxAttempts?: number;
}

// Redis key prefixes
const KEYS = {
  pending: (queue: string) => `queue:${queue}:pending`,
  active: (queue: string) => `queue:${queue}:active`,
  completed: (queue: string) => `queue:${queue}:completed`,
  failed: (queue: string) => `queue:${queue}:failed`,
  delayed: (queue: string) => `queue:${queue}:delayed`,
  job: (queue: string, jobId: string) => `queue:${queue}:job:${jobId}`,
  stats: (queue: string) => `queue:${queue}:stats`,
};

/**
 * Job Queue class
 */
export class JobQueue {
  private config: Required<QueueConfig>;

  constructor(config: QueueConfig) {
    this.config = {
      maxConcurrency: 5,
      defaultPriority: 3,
      defaultTimeout: 30000, // 30 seconds
      defaultMaxAttempts: 3,
      ...config,
    };
  }

  /**
   * Add a job to the queue
   */
  async add(
    type: JobType,
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
      delay?: number;
      maxAttempts?: number;
      timeout?: number;
      metadata?: JobData["metadata"];
    }
  ): Promise<Job> {
    const redis = getRedisClient();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const now = new Date().toISOString();
    const scheduledAt = options?.delay
      ? new Date(Date.now() + options.delay).toISOString()
      : now;

    const job: Job = {
      id: jobId,
      type,
      payload,
      status: options?.delay ? "delayed" : "pending",
      priority: options?.priority ?? this.config.defaultPriority,
      delay: options?.delay,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? this.config.defaultMaxAttempts,
      timeout: options?.timeout ?? this.config.defaultTimeout,
      createdAt: now,
      scheduledAt,
      metadata: options?.metadata,
    };

    // Store job data
    await redis.setex(KEYS.job(this.config.name, jobId), 86400 * 7, JSON.stringify(job));

    // Add to appropriate queue based on delay
    if (options?.delay) {
      // Add to delayed queue with score = scheduledAt timestamp
      await redis.zadd(KEYS.delayed(this.config.name), Date.now() + options.delay, jobId,
      );
    } else {
      // Add to pending queue with priority as score
      await redis.zadd(KEYS.pending(this.config.name), job.priority ?? 3, jobId,
      );
    }

    // Update stats
    await this.incrementStat("added");

    return job;
  }

  /**
   * Get next job from pending queue
   */
  async getNextJob(): Promise<Job | null> {
    const redis = getRedisClient();

    // Check active job count
    const activeCount = await redis.zcard(KEYS.active(this.config.name));
    if ((activeCount ?? 0) >= this.config.maxConcurrency) {
      return null;
    }

    // Move delayed jobs to pending if ready
    await this.processDelayedJobs();

    // Get job with highest priority (lowest score)
    const jobIds = await redis.zrange(
      KEYS.pending(this.config.name),
      0,
      0
    );

    if (!jobIds || jobIds.length === 0) {
      return null;
    }

    const jobId = jobIds[0] as string;

    // Move from pending to active
    await redis.zrem(KEYS.pending(this.config.name), jobId);
    await redis.zadd(KEYS.active(this.config.name), Date.now(), jobId,
    );

    // Update job status
    const job = await this.getJob(jobId);
    if (job) {
      job.status = "active";
      job.startedAt = new Date().toISOString();
      job.attempts = (job.attempts ?? 0) + 1;
      await this.updateJob(job);
      await this.incrementStat("started");
    }

    return job;
  }

  /**
   * Complete a job
   */
  async completeJob(jobId: string, result?: unknown): Promise<void> {
    const redis = getRedisClient();

    // Remove from active
    await redis.zrem(KEYS.active(this.config.name), jobId);

    // Update job
    const job = await this.getJob(jobId);
    if (job) {
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      job.result = result;
      await this.updateJob(job);

      // Add to completed queue (limited history)
      await redis.zadd(KEYS.completed(this.config.name), Date.now(), jobId,
      );

      // Trim completed queue to last 1000
      await redis.zremrangebyrank(KEYS.completed(this.config.name), 0, -1001);
    }

    await this.incrementStat("completed");
  }

  /**
   * Fail a job
   */
  async failJob(jobId: string, error: string): Promise<void> {
    const redis = getRedisClient();
    const job = await this.getJob(jobId);

    if (!job) {
      return;
    }

    // Remove from active
    await redis.zrem(KEYS.active(this.config.name), jobId);

    // Check if we should retry
    const maxAttempts = job.maxAttempts ?? this.config.defaultMaxAttempts;
    const attempts = job.attempts ?? 0;

    if (attempts < maxAttempts) {
      // Retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempts), 60000);
      job.status = "delayed";
      job.error = error;
      job.scheduledAt = new Date(Date.now() + delay).toISOString();
      await this.updateJob(job);

      await redis.zadd(KEYS.delayed(this.config.name), Date.now() + delay, jobId,
      );

      await this.incrementStat("retried");
    } else {
      // Max attempts reached - mark as failed
      job.status = "failed";
      job.failedAt = new Date().toISOString();
      job.error = error;
      await this.updateJob(job);

      await redis.zadd(KEYS.failed(this.config.name), Date.now(), jobId,
      );

      // Trim failed queue to last 500
      await redis.zremrangebyrank(KEYS.failed(this.config.name), 0, -501);

      await this.incrementStat("failed");
    }
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    const redis = getRedisClient();
    const data = await redis.get(KEYS.job(this.config.name, jobId));
    if (!data) {
      return null;
    }
    return typeof data === "string" ? JSON.parse(data) : data as Job;
  }

  /**
   * Update a job
   */
  async updateJob(job: Job): Promise<void> {
    const redis = getRedisClient();
    await redis.setex(KEYS.job(this.config.name, job.id), 86400 * 7, JSON.stringify(job));
  }

  /**
   * Process delayed jobs that are ready
   */
  private async processDelayedJobs(): Promise<void> {
    const redis = getRedisClient();
    const now = Date.now();

    // Get delayed jobs that are ready
    const readyJobs = await redis.zrangebyscore(KEYS.delayed(this.config.name), 0, now);

    if (!readyJobs || readyJobs.length === 0) {
      return;
    }

    // Move each to pending queue
    for (const jobId of readyJobs) {
      const job = await this.getJob(jobId as string);
      if (job) {
        await redis.zrem(KEYS.delayed(this.config.name), jobId);
        await redis.zadd(KEYS.pending(this.config.name), job.priority ?? 3, jobId as string,
        );
        job.status = "pending";
        await this.updateJob(job);
      }
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    counters: Record<string, number>;
  }> {
    const redis = getRedisClient();

    const [pending, active, completed, failed, delayed, counters] =
      await Promise.all([
        redis.zcard(KEYS.pending(this.config.name)),
        redis.zcard(KEYS.active(this.config.name)),
        redis.zcard(KEYS.completed(this.config.name)),
        redis.zcard(KEYS.failed(this.config.name)),
        redis.zcard(KEYS.delayed(this.config.name)),
        redis.hgetall(KEYS.stats(this.config.name)),
      ]);

    return {
      pending: pending ?? 0,
      active: active ?? 0,
      completed: completed ?? 0,
      failed: failed ?? 0,
      delayed: delayed ?? 0,
      counters: (counters as unknown as Record<string, number>) ?? {},
    };
  }

  /**
   * Get jobs by status
   */
  async getJobs(
    status: JobStatus,
    limit: number = 10,
    offset: number = 0
  ): Promise<Job[]> {
    const redis = getRedisClient();
    const key = {
      pending: KEYS.pending(this.config.name),
      active: KEYS.active(this.config.name),
      completed: KEYS.completed(this.config.name),
      failed: KEYS.failed(this.config.name),
      delayed: KEYS.delayed(this.config.name),
    }[status];

    const jobIds = await redis.zrange(key, offset, offset + limit - 1);
    if (!jobIds || jobIds.length === 0) {
      return [];
    }

    const jobs: Job[] = [];
    for (const jobId of jobIds) {
      const job = await this.getJob(jobId as string);
      if (job) {
        jobs.push(job);
      }
    }

    return jobs;
  }

  /**
   * Increment a stat counter
   */
  private async incrementStat(stat: string): Promise<void> {
    const redis = getRedisClient();
    await redis.hincrby(KEYS.stats(this.config.name), stat, 1);
  }

  /**
   * Clean up stale jobs
   */
  async cleanStaleJobs(maxAge: number = 3600000): Promise<number> {
    const redis = getRedisClient();
    const cutoff = Date.now() - maxAge;

    // Get stale active jobs
    const staleJobs = await redis.zrangebyscore(KEYS.active(this.config.name), 0, cutoff);

    if (!staleJobs || staleJobs.length === 0) {
      return 0;
    }

    // Fail each stale job
    for (const jobId of staleJobs) {
      await this.failJob(jobId as string, "Job timed out (stale)");
    }

    return staleJobs.length;
  }
}

// Pre-configured queues
export const monitorQueue = new JobQueue({
  name: "monitor",
  maxConcurrency: 3,
  defaultPriority: 2,
  defaultTimeout: 120000, // 2 minutes
  defaultMaxAttempts: 3,
});

export const auditQueue = new JobQueue({
  name: "audit",
  maxConcurrency: 2,
  defaultPriority: 3,
  defaultTimeout: 300000, // 5 minutes
  defaultMaxAttempts: 2,
});

export const contentQueue = new JobQueue({
  name: "content",
  maxConcurrency: 5,
  defaultPriority: 3,
  defaultTimeout: 60000, // 1 minute
  defaultMaxAttempts: 3,
});

export const reportQueue = new JobQueue({
  name: "report",
  maxConcurrency: 2,
  defaultPriority: 4,
  defaultTimeout: 180000, // 3 minutes
  defaultMaxAttempts: 2,
});

/**
 * Add a monitoring job
 */
export async function addMonitorJob(
  brandId: string,
  orgId: string,
  options?: {
    platforms?: string[];
    queries?: string[];
    priority?: JobPriority;
    delay?: number;
  }
): Promise<Job> {
  return monitorQueue.add(
    "monitor:scan",
    {
      brandId,
      platforms: options?.platforms,
      queries: options?.queries,
    },
    {
      priority: options?.priority,
      delay: options?.delay,
      metadata: { brandId, orgId },
    }
  );
}

/**
 * Add an audit job
 */
export async function addAuditJob(
  brandId: string,
  orgId: string,
  url: string,
  options?: {
    depth?: number;
    maxPages?: number;
    priority?: JobPriority;
    auditId?: string;
  }
): Promise<Job> {
  return auditQueue.add(
    "audit:crawl",
    {
      brandId,
      url,
      depth: options?.depth ?? 2,
      maxPages: options?.maxPages ?? 50,
      auditId: options?.auditId,
    },
    {
      priority: options?.priority,
      metadata: { brandId, orgId },
    }
  );
}

/**
 * Add a content generation job
 */
export async function addContentJob(
  brandId: string,
  orgId: string,
  contentType: string,
  topic: string,
  options?: {
    priority?: JobPriority;
    keywords?: string[];
  }
): Promise<Job> {
  return contentQueue.add(
    "content:generate",
    {
      brandId,
      contentType,
      topic,
      keywords: options?.keywords,
    },
    {
      priority: options?.priority,
      metadata: { brandId, orgId },
    }
  );
}

/**
 * Add a report generation job
 */
export async function addReportJob(
  brandId: string,
  orgId: string,
  reportType: "weekly" | "monthly",
  options?: {
    delay?: number;
  }
): Promise<Job> {
  const type = reportType === "weekly" ? "report:weekly" : "report:monthly";
  return reportQueue.add(
    type,
    { brandId },
    {
      delay: options?.delay,
      metadata: { brandId, orgId },
    }
  );
}
