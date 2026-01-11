import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Cache Queue Service
 *
 * Provides integrated caching and job queue functionality including:
 * - In-memory LRU caching with TTL
 * - Priority-based job queue
 * - Job retry with backoff
 * - Cache invalidation patterns
 * - Cache-queue integration
 */

// Configuration Schema
export const CacheQueueConfigSchema = z.object({
  cacheTTL: z.number().min(0).default(60000), // Default 1 minute
  maxCacheSize: z.number().min(1).default(1000),
  maxConcurrentJobs: z.number().min(1).default(5),
  jobRetryDelay: z.number().min(0).default(1000),
  enableCacheStats: z.boolean().default(true)
});

export type CacheQueueConfig = z.infer<typeof CacheQueueConfigSchema>;

// Cache Entry
export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

// Cache Options
export interface CacheOptions {
  ttl?: number;
}

// Cache Stats
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

// Job Priority
export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

// Job Status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Job Definition
export interface JobDefinition {
  id: string;
  type: string;
  data: Record<string, unknown>;
  priority: JobPriority;
  maxRetries?: number;
  cacheResult?: boolean;
  cacheKey?: string;
  skipIfCached?: boolean;
  invalidatePatterns?: string[];
}

// Job Result
export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// Job State
export interface JobState {
  job: JobDefinition;
  status: JobStatus;
  attempts: number;
  result?: JobResult;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// Add Job Result
export interface AddJobResult {
  success: boolean;
  jobId: string;
  error?: string;
}

// Queue Stats
export interface QueueStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
}

// Job Processor
export type JobProcessor = (job: JobDefinition) => Promise<JobResult>;

// Priority weights for sorting
const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3
};

/**
 * Cache Queue Service
 */
export class CacheQueueService extends EventEmitter {
  private config: CacheQueueConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheStats = { hits: 0, misses: 0, evictions: 0 };
  private jobs: Map<string, JobState> = new Map();
  private pendingQueue: string[] = [];
  private processors: Map<string, JobProcessor> = new Map();
  private processing = false;
  private paused = false;
  private activeJobs = 0;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CacheQueueConfig> = {}) {
    super();
    this.config = CacheQueueConfigSchema.parse(config);

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupExpiredEntries(), 10000);

    // Start processing
    this.startProcessing();
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheQueueConfig {
    return { ...this.config };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.paused = true;
    this.processing = false;
  }

  // ==================== Cache Methods ====================

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? this.config.cacheTTL;
    const now = Date.now();

    // Check if we need to evict
    if (this.cache.size >= this.config.maxCacheSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: ttl > 0 ? now + ttl : Infinity,
      lastAccessed: now
    });
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.cacheStats.misses++;
      this.emit('cache:miss', { key });
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.emit('cache:miss', { key });
      return null;
    }

    // Update last accessed
    entry.lastAccessed = Date.now();
    this.cacheStats.hits++;
    this.emit('cache:hit', { key });

    return entry.value as T;
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Get keys matching a pattern
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    const regex = this.patternToRegex(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  /**
   * Invalidate keys matching patterns
   */
  async invalidateByPatterns(patterns: string[]): Promise<number> {
    let invalidated = 0;

    for (const pattern of patterns) {
      const keys = await this.getKeysByPattern(pattern);
      for (const key of keys) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    return {
      size: this.cache.size,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: totalRequests > 0 ? this.cacheStats.hits / totalRequests : 0,
      evictions: this.cacheStats.evictions
    };
  }

  // ==================== Queue Methods ====================

  /**
   * Register a job processor
   */
  registerProcessor(type: string, processor: JobProcessor): void {
    this.processors.set(type, processor);
  }

  /**
   * Add a job to the queue
   */
  async addJob(job: JobDefinition): Promise<AddJobResult> {
    // Check for duplicate ID
    if (this.jobs.has(job.id)) {
      return {
        success: false,
        jobId: job.id,
        error: 'Job with this ID already exists'
      };
    }

    // Check for cached result if skipIfCached
    if (job.skipIfCached && job.cacheKey) {
      const cached = await this.get(job.cacheKey);
      if (cached) {
        // Create a completed job state with cached result
        this.jobs.set(job.id, {
          job,
          status: 'completed',
          attempts: 0,
          result: cached as JobResult,
          createdAt: Date.now(),
          completedAt: Date.now()
        });
        return { success: true, jobId: job.id };
      }
    }

    // Add to jobs map
    this.jobs.set(job.id, {
      job,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now()
    });

    // Add to pending queue
    this.pendingQueue.push(job.id);

    // Sort queue by priority
    this.sortQueue();

    this.emit('job:added', { jobId: job.id, type: job.type });

    // Trigger processing on next tick
    setImmediate(() => this.processNextJobs());

    return { success: true, jobId: job.id };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobState | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const jobState = this.jobs.get(jobId);

    if (!jobState || jobState.status !== 'pending') {
      return false;
    }

    jobState.status = 'cancelled';

    // Remove from pending queue
    const index = this.pendingQueue.indexOf(jobId);
    if (index > -1) {
      this.pendingQueue.splice(index, 1);
    }

    this.emit('job:cancelled', { jobId });

    return true;
  }

  /**
   * Pause job processing
   */
  pauseProcessing(): void {
    this.paused = true;
  }

  /**
   * Resume job processing
   */
  resumeProcessing(): void {
    this.paused = false;
    this.processNextJobs();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const state of this.jobs.values()) {
      switch (state.status) {
        case 'pending': pending++; break;
        case 'processing': processing++; break;
        case 'completed': completed++; break;
        case 'failed': failed++; break;
      }
    }

    return {
      totalJobs: this.jobs.size,
      pendingJobs: pending,
      processingJobs: processing,
      completedJobs: completed,
      failedJobs: failed
    };
  }

  // ==================== Private Methods ====================

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`);
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheStats.evictions++;
      this.emit('cache:eviction', { key: oldestKey });
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private sortQueue(): void {
    this.pendingQueue.sort((a, b) => {
      const jobA = this.jobs.get(a);
      const jobB = this.jobs.get(b);

      if (!jobA || !jobB) return 0;

      const priorityDiff = PRIORITY_WEIGHTS[jobA.job.priority] - PRIORITY_WEIGHTS[jobB.job.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Same priority, sort by creation time
      return jobA.createdAt - jobB.createdAt;
    });
  }

  private startProcessing(): void {
    this.processing = true;
    this.processNextJobs();
  }

  private processNextJobs(): void {
    if (this.paused || !this.processing) return;

    while (
      this.activeJobs < this.config.maxConcurrentJobs &&
      this.pendingQueue.length > 0
    ) {
      const jobId = this.pendingQueue.shift();
      if (jobId) {
        this.processJob(jobId);
      }
    }
  }

  private async processJob(jobId: string): Promise<void> {
    const jobState = this.jobs.get(jobId);
    if (!jobState || jobState.status !== 'pending') return;

    const processor = this.processors.get(jobState.job.type);

    if (!processor) {
      jobState.status = 'failed';
      jobState.error = `No processor registered for job type: ${jobState.job.type}`;
      this.emit('job:failed', { jobId, error: jobState.error });
      return;
    }

    this.activeJobs++;
    jobState.status = 'processing';
    jobState.startedAt = Date.now();
    jobState.attempts++;

    this.emit('job:started', { jobId, type: jobState.job.type });

    try {
      const result = await processor(jobState.job);

      jobState.status = 'completed';
      jobState.result = result;
      jobState.completedAt = Date.now();

      // Cache result if configured
      if (jobState.job.cacheResult && jobState.job.cacheKey) {
        await this.set(jobState.job.cacheKey, result);
      }

      // Invalidate patterns if configured
      if (jobState.job.invalidatePatterns) {
        await this.invalidateByPatterns(jobState.job.invalidatePatterns);
      }

      this.emit('job:completed', { jobId, result });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const maxRetries = jobState.job.maxRetries ?? 3;

      if (jobState.attempts < maxRetries) {
        // Retry with delay
        jobState.status = 'pending';
        this.pendingQueue.push(jobId);
        this.sortQueue();

        setTimeout(() => {
          this.processNextJobs();
        }, this.config.jobRetryDelay * jobState.attempts);

        this.emit('job:retry', { jobId, attempt: jobState.attempts, error: errorMessage });
      } else {
        jobState.status = 'failed';
        jobState.error = errorMessage;
        jobState.completedAt = Date.now();

        this.emit('job:failed', { jobId, error: errorMessage });
      }
    }

    this.activeJobs--;

    // Process next jobs
    if (!this.paused) {
      setImmediate(() => this.processNextJobs());
    }
  }
}

/**
 * Factory function
 */
export function createCacheQueueService(
  config: Partial<CacheQueueConfig> = {}
): CacheQueueService {
  return new CacheQueueService(config);
}
