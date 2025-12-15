/**
 * Job Scheduler - Cron Jobs (F102)
 * Manages scheduled/recurring jobs for monitoring and reporting
 */

import { getRedisClient } from "../redis";
import {
  addMonitorJob,
  addReportJob,
  monitorQueue,
  reportQueue,
  type JobPriority,
} from "./index";
import { db } from "../db";
import { brands, organizations, scheduledJobs } from "../db/schema";
import { eq, and, lte, isNull, or } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Schedule types
export type ScheduleType =
  | "once"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly";

// Schedule configuration
export interface ScheduleConfig {
  id?: string;
  name: string;
  type: ScheduleType;
  jobType: "monitor:scan" | "report:weekly" | "report:monthly";
  brandId: string;
  orgId: string;
  enabled: boolean;
  priority?: JobPriority;
  config?: Record<string, unknown>;
  lastRun?: Date;
  nextRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Redis keys
const KEYS = {
  schedules: "scheduler:schedules",
  schedule: (id: string) => `scheduler:schedule:${id}`,
  lock: (id: string) => `scheduler:lock:${id}`,
};

/**
 * Calculate next run time based on schedule type
 */
function calculateNextRun(type: ScheduleType, from: Date = new Date()): Date {
  const next = new Date(from);

  switch (type) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
      next.setSeconds(0);
      break;

    case "daily":
      next.setDate(next.getDate() + 1);
      next.setHours(6, 0, 0, 0); // 6 AM
      break;

    case "weekly":
      // Next Monday at 6 AM
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
      next.setHours(6, 0, 0, 0);
      break;

    case "monthly":
      // First day of next month at 6 AM
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(6, 0, 0, 0);
      break;

    case "once":
    default:
      // No next run for one-time jobs
      return next;
  }

  return next;
}

/**
 * Create a new schedule
 */
export async function createSchedule(
  config: Omit<ScheduleConfig, "id" | "createdAt" | "updatedAt">
): Promise<ScheduleConfig> {
  const redis = getRedisClient();
  const id = createId();
  const now = new Date();

  const schedule: ScheduleConfig = {
    ...config,
    id,
    nextRun: config.nextRun ?? calculateNextRun(config.type),
    createdAt: now,
    updatedAt: now,
  };

  // Store in Redis
  await redis.hset(KEYS.schedules, { [id]: JSON.stringify(schedule) });

  // Also store in database for persistence
  await db.insert(scheduledJobs).values({
    id,
    name: schedule.name,
    scheduleType: schedule.type,
    jobType: schedule.jobType,
    brandId: schedule.brandId,
    orgId: schedule.orgId,
    enabled: schedule.enabled,
    config: schedule.config ?? {},
    nextRunAt: schedule.nextRun,
    createdAt: now,
    updatedAt: now,
  });

  return schedule;
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  id: string,
  updates: Partial<ScheduleConfig>
): Promise<ScheduleConfig | null> {
  const redis = getRedisClient();
  const existing = await getSchedule(id);

  if (!existing) {
    return null;
  }

  const updated: ScheduleConfig = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  // Recalculate next run if type changed
  if (updates.type && updates.type !== existing.type) {
    updated.nextRun = calculateNextRun(updates.type);
  }

  await redis.hset(KEYS.schedules, { [id]: JSON.stringify(updated) });

  // Update database
  await db
    .update(scheduledJobs)
    .set({
      name: updated.name,
      scheduleType: updated.type,
      enabled: updated.enabled,
      config: updated.config ?? {},
      nextRunAt: updated.nextRun,
      updatedAt: updated.updatedAt,
    })
    .where(eq(scheduledJobs.id, id));

  return updated;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  const redis = getRedisClient();
  await redis.hdel(KEYS.schedules, id);
  await db.delete(scheduledJobs).where(eq(scheduledJobs.id, id));
  return true;
}

/**
 * Get a schedule by ID
 */
export async function getSchedule(id: string): Promise<ScheduleConfig | null> {
  const redis = getRedisClient();
  const data = await redis.hget(KEYS.schedules, id);

  if (!data) {
    // Try database fallback
    const dbSchedule = await db.query.scheduledJobs.findFirst({
      where: eq(scheduledJobs.id, id),
    });

    if (dbSchedule) {
      const schedule: ScheduleConfig = {
        id: dbSchedule.id,
        name: dbSchedule.name,
        type: dbSchedule.scheduleType as ScheduleType,
        jobType: dbSchedule.jobType as ScheduleConfig["jobType"],
        brandId: dbSchedule.brandId,
        orgId: dbSchedule.orgId,
        enabled: dbSchedule.enabled,
        config: dbSchedule.config as Record<string, unknown>,
        lastRun: dbSchedule.lastRunAt ?? undefined,
        nextRun: dbSchedule.nextRunAt ?? undefined,
        createdAt: dbSchedule.createdAt,
        updatedAt: dbSchedule.updatedAt,
      };

      // Cache in Redis
      await redis.hset(KEYS.schedules, { [id]: JSON.stringify(schedule) });
      return schedule;
    }

    return null;
  }

  return typeof data === "string" ? JSON.parse(data) : data as ScheduleConfig;
}

/**
 * Get all schedules (optionally filtered)
 */
export async function getSchedules(filters?: {
  brandId?: string;
  orgId?: string;
  enabled?: boolean;
}): Promise<ScheduleConfig[]> {
  const redis = getRedisClient();
  const allData = await redis.hgetall(KEYS.schedules);

  if (!allData) {
    return [];
  }

  let schedules: ScheduleConfig[] = Object.values(allData).map((data) =>
    typeof data === "string" ? JSON.parse(data) : data as ScheduleConfig
  );

  // Apply filters
  if (filters?.brandId) {
    schedules = schedules.filter((s) => s.brandId === filters.brandId);
  }
  if (filters?.orgId) {
    schedules = schedules.filter((s) => s.orgId === filters.orgId);
  }
  if (filters?.enabled !== undefined) {
    schedules = schedules.filter((s) => s.enabled === filters.enabled);
  }

  return schedules;
}

/**
 * Process due schedules (called by cron)
 */
export async function processDueSchedules(): Promise<{
  processed: number;
  jobsCreated: number;
  errors: string[];
}> {
  const redis = getRedisClient();
  const now = new Date();

  const result = {
    processed: 0,
    jobsCreated: 0,
    errors: [] as string[],
  };

  // Get all enabled schedules
  const schedules = await getSchedules({ enabled: true });

  for (const schedule of schedules) {
    // Check if due
    if (!schedule.nextRun || new Date(schedule.nextRun) > now) {
      continue;
    }

    // Try to acquire lock (prevent duplicate processing)
    const lockKey = KEYS.lock(schedule.id!);
    const lockAcquired = await redis.setnx(lockKey, Date.now().toString());

    if (!lockAcquired) {
      continue; // Already being processed
    }

    // Set lock expiration
    await redis.expire(lockKey, 300); // 5 minutes

    try {
      result.processed++;

      // Create the appropriate job
      switch (schedule.jobType) {
        case "monitor:scan":
          await addMonitorJob(schedule.brandId, schedule.orgId, {
            platforms: schedule.config?.platforms as string[] | undefined,
            queries: schedule.config?.queries as string[] | undefined,
            priority: schedule.priority,
          });
          result.jobsCreated++;
          break;

        case "report:weekly":
          await addReportJob(schedule.brandId, schedule.orgId, "weekly");
          result.jobsCreated++;
          break;

        case "report:monthly":
          await addReportJob(schedule.brandId, schedule.orgId, "monthly");
          result.jobsCreated++;
          break;
      }

      // Update schedule with new next run time
      const nextRun =
        schedule.type === "once" ? undefined : calculateNextRun(schedule.type);

      await updateSchedule(schedule.id!, {
        lastRun: now,
        nextRun,
        enabled: schedule.type !== "once", // Disable one-time schedules
      });
    } catch (error) {
      result.errors.push(
        `Schedule ${schedule.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Release lock
      await redis.del(lockKey);
    }
  }

  return result;
}

/**
 * Create default schedules for a brand
 */
export async function createDefaultSchedules(
  brandId: string,
  orgId: string
): Promise<ScheduleConfig[]> {
  const schedules: ScheduleConfig[] = [];

  // Daily monitoring scan
  schedules.push(
    await createSchedule({
      name: "Daily Brand Monitoring",
      type: "daily",
      jobType: "monitor:scan",
      brandId,
      orgId,
      enabled: true,
      priority: 2,
    })
  );

  // Weekly report
  schedules.push(
    await createSchedule({
      name: "Weekly Performance Report",
      type: "weekly",
      jobType: "report:weekly",
      brandId,
      orgId,
      enabled: true,
      priority: 4,
    })
  );

  // Monthly report
  schedules.push(
    await createSchedule({
      name: "Monthly Analytics Report",
      type: "monthly",
      jobType: "report:monthly",
      brandId,
      orgId,
      enabled: true,
      priority: 4,
    })
  );

  return schedules;
}

/**
 * Get scheduler status
 */
export async function getSchedulerStatus(): Promise<{
  totalSchedules: number;
  enabledSchedules: number;
  dueSchedules: number;
  queueStats: {
    monitor: Awaited<ReturnType<typeof monitorQueue.getStats>>;
    report: Awaited<ReturnType<typeof reportQueue.getStats>>;
  };
}> {
  const now = new Date();
  const schedules = await getSchedules();

  const enabledSchedules = schedules.filter((s) => s.enabled);
  const dueSchedules = enabledSchedules.filter(
    (s) => s.nextRun && new Date(s.nextRun) <= now
  );

  const [monitorStats, reportStats] = await Promise.all([
    monitorQueue.getStats(),
    reportQueue.getStats(),
  ]);

  return {
    totalSchedules: schedules.length,
    enabledSchedules: enabledSchedules.length,
    dueSchedules: dueSchedules.length,
    queueStats: {
      monitor: monitorStats,
      report: reportStats,
    },
  };
}

/**
 * Sync schedules from database to Redis (startup)
 */
export async function syncSchedulesFromDatabase(): Promise<number> {
  const redis = getRedisClient();

  // Get all schedules from database
  const dbSchedules = await db.query.scheduledJobs.findMany();

  let synced = 0;
  for (const dbSchedule of dbSchedules) {
    const schedule: ScheduleConfig = {
      id: dbSchedule.id,
      name: dbSchedule.name,
      type: dbSchedule.scheduleType as ScheduleType,
      jobType: dbSchedule.jobType as ScheduleConfig["jobType"],
      brandId: dbSchedule.brandId,
      orgId: dbSchedule.orgId,
      enabled: dbSchedule.enabled,
      config: dbSchedule.config as Record<string, unknown>,
      lastRun: dbSchedule.lastRunAt ?? undefined,
      nextRun: dbSchedule.nextRunAt ?? undefined,
      createdAt: dbSchedule.createdAt,
      updatedAt: dbSchedule.updatedAt,
    };

    await redis.hset(KEYS.schedules, {
      [dbSchedule.id]: JSON.stringify(schedule),
    });
    synced++;
  }

  return synced;
}
