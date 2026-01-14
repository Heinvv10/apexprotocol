/**
 * Sync Service
 * Manages background sync jobs for social media data synchronization
 */

import { db } from "@/lib/db";
import { socialSyncJobs, socialPlatformEnum } from "@/lib/db/schema";
import { eq, and, or, lte, isNull, desc, count, sql } from "drizzle-orm";

// Derive type from enum
export type SocialPlatform = (typeof socialPlatformEnum.enumValues)[number];

// ============================================================================
// Types
// ============================================================================

export type SyncJobType = "metrics" | "mentions" | "followers" | "posts" | "profile" | "full_sync";
export type SyncJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface SyncJob {
  id: string;
  brandId: string;
  socialAccountId: string | null;
  platform: SocialPlatform;
  jobType: SyncJobType;
  status: SyncJobStatus | null;
  startedAt: Date | null;
  completedAt: Date | null;
  recordsProcessed: number | null;
  recordsTotal: number | null;
  errorMessage: string | null;
  retryCount: number | null;
  maxRetries: number | null;
  nextRetryAt: Date | null;
  jobMetadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSyncJobParams {
  brandId: string;
  socialAccountId?: string;
  platform: SocialPlatform;
  jobType: SyncJobType;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface SyncJobProgress {
  recordsProcessed: number;
  recordsTotal?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 60000; // 1 minute base delay
const RETRY_DELAY_MULTIPLIER = 2; // Exponential backoff

// ============================================================================
// Job Creation
// ============================================================================

/**
 * Create a new sync job
 */
export async function createSyncJob(params: CreateSyncJobParams): Promise<SyncJob> {
  const {
    brandId,
    socialAccountId,
    platform,
    jobType,
    maxRetries = DEFAULT_MAX_RETRIES,
    metadata,
  } = params;

  // Check if there's already a pending/running job for this combination
  const existingJob = await db.query.socialSyncJobs.findFirst({
    where: and(
      eq(socialSyncJobs.brandId, brandId),
      eq(socialSyncJobs.platform, platform),
      eq(socialSyncJobs.jobType, jobType),
      or(
        eq(socialSyncJobs.status, "pending"),
        eq(socialSyncJobs.status, "running")
      )
    ),
  });

  if (existingJob) {
    // Return existing job instead of creating duplicate
    return existingJob as SyncJob;
  }

  const [job] = await db
    .insert(socialSyncJobs)
    .values({
      brandId,
      socialAccountId: socialAccountId || null,
      platform,
      jobType,
      status: "pending",
      maxRetries,
      jobMetadata: metadata || null,
    })
    .returning();

  return job as SyncJob;
}

/**
 * Create multiple sync jobs for a full sync operation
 */
export async function createFullSyncJobs(params: {
  brandId: string;
  socialAccountId: string;
  platform: SocialPlatform;
}): Promise<SyncJob[]> {
  const { brandId, socialAccountId, platform } = params;

  const jobTypes: SyncJobType[] = ["profile", "metrics", "mentions", "followers", "posts"];
  const jobs: SyncJob[] = [];

  for (const jobType of jobTypes) {
    const job = await createSyncJob({
      brandId,
      socialAccountId,
      platform,
      jobType,
    });
    jobs.push(job);
  }

  return jobs;
}

// ============================================================================
// Job Status Management
// ============================================================================

/**
 * Start a sync job (mark as running)
 */
export async function startSyncJob(jobId: string): Promise<SyncJob> {
  const [job] = await db
    .update(socialSyncJobs)
    .set({
      status: "running",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(socialSyncJobs.id, jobId))
    .returning();

  return job as SyncJob;
}

/**
 * Update job progress
 */
export async function updateSyncJobProgress(
  jobId: string,
  progress: SyncJobProgress
): Promise<SyncJob> {
  const updateData: Record<string, unknown> = {
    recordsProcessed: progress.recordsProcessed,
    updatedAt: new Date(),
  };

  if (progress.recordsTotal !== undefined) {
    updateData.recordsTotal = progress.recordsTotal;
  }

  if (progress.metadata) {
    // Merge with existing metadata
    const existing = await db.query.socialSyncJobs.findFirst({
      where: eq(socialSyncJobs.id, jobId),
    });

    updateData.jobMetadata = {
      ...(existing?.jobMetadata || {}),
      ...progress.metadata,
    };
  }

  const [job] = await db
    .update(socialSyncJobs)
    .set(updateData)
    .where(eq(socialSyncJobs.id, jobId))
    .returning();

  return job as SyncJob;
}

/**
 * Complete a sync job successfully
 */
export async function completeSyncJob(
  jobId: string,
  finalProgress?: SyncJobProgress
): Promise<SyncJob> {
  const updateData: Record<string, unknown> = {
    status: "completed" as const,
    completedAt: new Date(),
    updatedAt: new Date(),
    errorMessage: null,
  };

  if (finalProgress) {
    updateData.recordsProcessed = finalProgress.recordsProcessed;
    if (finalProgress.recordsTotal !== undefined) {
      updateData.recordsTotal = finalProgress.recordsTotal;
    }
    if (finalProgress.metadata) {
      const existing = await db.query.socialSyncJobs.findFirst({
        where: eq(socialSyncJobs.id, jobId),
      });
      updateData.jobMetadata = {
        ...(existing?.jobMetadata || {}),
        ...finalProgress.metadata,
      };
    }
  }

  const [job] = await db
    .update(socialSyncJobs)
    .set(updateData)
    .where(eq(socialSyncJobs.id, jobId))
    .returning();

  return job as SyncJob;
}

/**
 * Fail a sync job with an error
 */
export async function failSyncJob(
  jobId: string,
  errorMessage: string
): Promise<SyncJob> {
  // Get current job to check retry count
  const currentJob = await db.query.socialSyncJobs.findFirst({
    where: eq(socialSyncJobs.id, jobId),
  });

  if (!currentJob) {
    throw new Error(`Sync job not found: ${jobId}`);
  }

  const retryCount = (currentJob.retryCount || 0) + 1;
  const maxRetries = currentJob.maxRetries || DEFAULT_MAX_RETRIES;

  // Calculate next retry time with exponential backoff
  const retryDelayMs = RETRY_DELAY_BASE_MS * Math.pow(RETRY_DELAY_MULTIPLIER, retryCount - 1);
  const nextRetryAt = retryCount < maxRetries
    ? new Date(Date.now() + retryDelayMs)
    : null;

  const [job] = await db
    .update(socialSyncJobs)
    .set({
      status: retryCount >= maxRetries ? "failed" : "pending",
      errorMessage,
      retryCount,
      nextRetryAt,
      completedAt: retryCount >= maxRetries ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(socialSyncJobs.id, jobId))
    .returning();

  return job as SyncJob;
}

/**
 * Cancel a sync job
 */
export async function cancelSyncJob(jobId: string): Promise<SyncJob> {
  const [job] = await db
    .update(socialSyncJobs)
    .set({
      status: "cancelled",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(socialSyncJobs.id, jobId))
    .returning();

  return job as SyncJob;
}

// ============================================================================
// Job Queries
// ============================================================================

/**
 * Get a sync job by ID
 */
export async function getSyncJob(jobId: string): Promise<SyncJob | null> {
  const job = await db.query.socialSyncJobs.findFirst({
    where: eq(socialSyncJobs.id, jobId),
  });

  return job as SyncJob | null;
}

/**
 * Get pending jobs ready to run
 */
export async function getPendingJobs(limit: number = 10): Promise<SyncJob[]> {
  const now = new Date();

  const jobs = await db.query.socialSyncJobs.findMany({
    where: and(
      eq(socialSyncJobs.status, "pending"),
      or(
        isNull(socialSyncJobs.nextRetryAt),
        lte(socialSyncJobs.nextRetryAt, now)
      )
    ),
    orderBy: [desc(socialSyncJobs.createdAt)],
    limit,
  });

  return jobs as SyncJob[];
}

/**
 * Get running jobs (for monitoring)
 */
export async function getRunningJobs(): Promise<SyncJob[]> {
  const jobs = await db.query.socialSyncJobs.findMany({
    where: eq(socialSyncJobs.status, "running"),
    orderBy: [desc(socialSyncJobs.startedAt)],
  });

  return jobs as SyncJob[];
}

/**
 * Get jobs for a brand
 */
export async function getBrandSyncJobs(
  brandId: string,
  options?: {
    platform?: SocialPlatform;
    status?: SyncJobStatus;
    limit?: number;
  }
): Promise<SyncJob[]> {
  const conditions = [eq(socialSyncJobs.brandId, brandId)];

  if (options?.platform) {
    conditions.push(eq(socialSyncJobs.platform, options.platform));
  }

  if (options?.status) {
    conditions.push(eq(socialSyncJobs.status, options.status));
  }

  const jobs = await db.query.socialSyncJobs.findMany({
    where: and(...conditions),
    orderBy: [desc(socialSyncJobs.createdAt)],
    limit: options?.limit || 50,
  });

  return jobs as SyncJob[];
}

/**
 * Get recent job history for a brand/platform
 */
export async function getJobHistory(params: {
  brandId: string;
  platform?: SocialPlatform;
  jobType?: SyncJobType;
  limit?: number;
}): Promise<SyncJob[]> {
  const conditions = [eq(socialSyncJobs.brandId, params.brandId)];

  if (params.platform) {
    conditions.push(eq(socialSyncJobs.platform, params.platform));
  }

  if (params.jobType) {
    conditions.push(eq(socialSyncJobs.jobType, params.jobType));
  }

  const jobs = await db.query.socialSyncJobs.findMany({
    where: and(...conditions),
    orderBy: [desc(socialSyncJobs.createdAt)],
    limit: params.limit || 20,
  });

  return jobs as SyncJob[];
}

/**
 * Get last successful sync for a brand/platform/jobType
 */
export async function getLastSuccessfulSync(params: {
  brandId: string;
  platform: SocialPlatform;
  jobType: SyncJobType;
}): Promise<SyncJob | null> {
  const job = await db.query.socialSyncJobs.findFirst({
    where: and(
      eq(socialSyncJobs.brandId, params.brandId),
      eq(socialSyncJobs.platform, params.platform),
      eq(socialSyncJobs.jobType, params.jobType),
      eq(socialSyncJobs.status, "completed")
    ),
    orderBy: [desc(socialSyncJobs.completedAt)],
  });

  return job as SyncJob | null;
}

// ============================================================================
// Cleanup & Maintenance
// ============================================================================

/**
 * Mark stale running jobs as failed (jobs running for too long)
 */
export async function cleanupStaleJobs(maxRunningMinutes: number = 60): Promise<number> {
  const cutoffTime = new Date(Date.now() - maxRunningMinutes * 60 * 1000);

  // First count the stale jobs
  const staleJobsCount = await db
    .select({ count: count() })
    .from(socialSyncJobs)
    .where(
      and(
        eq(socialSyncJobs.status, "running"),
        lte(socialSyncJobs.startedAt, cutoffTime)
      )
    );

  const jobsToCleanup = staleJobsCount[0]?.count ?? 0;

  if (jobsToCleanup > 0) {
    await db
      .update(socialSyncJobs)
      .set({
        status: "failed",
        errorMessage: `Job timed out after ${maxRunningMinutes} minutes`,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(socialSyncJobs.status, "running"),
          lte(socialSyncJobs.startedAt, cutoffTime)
        )
      );
  }

  return jobsToCleanup;
}

/**
 * Delete old completed/failed jobs
 */
export async function deleteOldJobs(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  // First count the old jobs to delete
  const oldJobsCount = await db
    .select({ count: count() })
    .from(socialSyncJobs)
    .where(
      and(
        or(
          eq(socialSyncJobs.status, "completed"),
          eq(socialSyncJobs.status, "failed"),
          eq(socialSyncJobs.status, "cancelled")
        ),
        lte(socialSyncJobs.completedAt, cutoffDate)
      )
    );

  const jobsToDelete = oldJobsCount[0]?.count ?? 0;

  if (jobsToDelete > 0) {
    await db
      .delete(socialSyncJobs)
      .where(
        and(
          or(
            eq(socialSyncJobs.status, "completed"),
            eq(socialSyncJobs.status, "failed"),
            eq(socialSyncJobs.status, "cancelled")
          ),
          lte(socialSyncJobs.completedAt, cutoffDate)
        )
      );
  }

  return jobsToDelete;
}

// ============================================================================
// Job Statistics
// ============================================================================

/**
 * Get sync statistics for a brand
 */
export async function getSyncStats(brandId: string): Promise<{
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  lastSync: Date | null;
}> {
  const jobs = await db.query.socialSyncJobs.findMany({
    where: eq(socialSyncJobs.brandId, brandId),
  });

  const stats = {
    total: jobs.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    lastSync: null as Date | null,
  };

  for (const job of jobs) {
    switch (job.status) {
      case "pending":
        stats.pending++;
        break;
      case "running":
        stats.running++;
        break;
      case "completed":
        stats.completed++;
        if (job.completedAt && (!stats.lastSync || job.completedAt > stats.lastSync)) {
          stats.lastSync = job.completedAt;
        }
        break;
      case "failed":
        stats.failed++;
        break;
      case "cancelled":
        stats.cancelled++;
        break;
    }
  }

  return stats;
}

// ============================================================================
// Job Queue Processing Helper
// ============================================================================

/**
 * Process a job with automatic status management
 * This is a helper for implementing job processors
 */
export async function processJob<T>(
  jobId: string,
  processor: (job: SyncJob) => Promise<T>
): Promise<{ success: true; result: T } | { success: false; error: string }> {
  // Get and start the job
  const job = await getSyncJob(jobId);
  if (!job) {
    return { success: false, error: `Job not found: ${jobId}` };
  }

  if (job.status !== "pending") {
    return { success: false, error: `Job is not pending: ${job.status}` };
  }

  await startSyncJob(jobId);

  try {
    const result = await processor(job);
    await completeSyncJob(jobId);
    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await failSyncJob(jobId, errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Utility Exports
// ============================================================================

export const SyncService = {
  // Creation
  createSyncJob,
  createFullSyncJobs,

  // Status Management
  startSyncJob,
  updateSyncJobProgress,
  completeSyncJob,
  failSyncJob,
  cancelSyncJob,

  // Queries
  getSyncJob,
  getPendingJobs,
  getRunningJobs,
  getBrandSyncJobs,
  getJobHistory,
  getLastSuccessfulSync,

  // Maintenance
  cleanupStaleJobs,
  deleteOldJobs,

  // Statistics
  getSyncStats,

  // Processing
  processJob,
};

export default SyncService;
