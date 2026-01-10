/**
 * QStash Scheduling Client
 * Wrapper for Upstash QStash to handle scheduled content publishing
 */

import { Client } from "@upstash/qstash";

// Initialize QStash client from environment variables
const qstashToken = process.env.QSTASH_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Create client only if token is available (prevents build errors)
export const qstash = qstashToken
  ? new Client({ token: qstashToken })
  : null;

// Helper to get QStash instance (throws if not configured)
function requireQStash(): Client {
  if (!qstash) {
    throw new Error(
      "QStash is not configured. Set QSTASH_TOKEN environment variable."
    );
  }
  if (!appUrl) {
    throw new Error(
      "App URL is not configured. Set NEXT_PUBLIC_APP_URL environment variable."
    );
  }
  return qstash;
}

// Types for QStash operations
export interface SchedulePublishPayload {
  contentId: string;
  platform: "wordpress" | "medium";
  scheduledAt?: string; // ISO timestamp for logging
}

export interface CreateScheduleOptions {
  contentId: string;
  platforms: ("wordpress" | "medium")[];
  scheduledAt: Date;
  cron?: string; // Optional cron expression for recurring schedules
}

export interface ScheduleResult {
  scheduleId?: string; // For recurring schedules
  messageId?: string; // For one-time delayed publishes
  scheduledAt: Date;
  platforms: string[];
}

export interface CancelScheduleOptions {
  scheduleId?: string; // For recurring schedules
  messageId?: string; // For one-time delayed publishes
}

/**
 * Calculate delay in seconds from now to scheduled time
 */
export function calculateDelay(scheduledAt: Date): number {
  const now = new Date();
  const delayMs = scheduledAt.getTime() - now.getTime();
  const delaySeconds = Math.max(0, Math.floor(delayMs / 1000));
  return delaySeconds;
}

/**
 * Validate that scheduled time is in the future
 */
export function validateScheduledTime(scheduledAt: Date): void {
  const now = new Date();
  if (scheduledAt <= now) {
    throw new Error("Scheduled time must be in the future");
  }
}

/**
 * Create a one-time delayed publish schedule
 * Uses QStash publishJSON for delayed execution
 */
export async function createDelayedPublish(
  options: CreateScheduleOptions
): Promise<ScheduleResult> {
  const client = requireQStash();
  validateScheduledTime(options.scheduledAt);

  const delay = calculateDelay(options.scheduledAt);
  const webhookUrl = `${appUrl}/api/webhooks/publish`;

  try {
    // Create separate delayed publishes for each platform
    const messageIds: string[] = [];

    for (const platform of options.platforms) {
      const payload: SchedulePublishPayload = {
        contentId: options.contentId,
        platform,
        scheduledAt: options.scheduledAt.toISOString(),
      };

      const response = await client.publishJSON({
        url: webhookUrl,
        body: payload,
        delay,
      });

      // QStash returns a messageId for delayed publishes
      if (response.messageId) {
        messageIds.push(response.messageId);
      }
    }

    return {
      messageId: messageIds.join(","), // Store all message IDs
      scheduledAt: options.scheduledAt,
      platforms: options.platforms,
    };
  } catch (error) {
    throw new Error(
      `Failed to create delayed publish: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a recurring publish schedule using cron
 * Uses QStash schedules.create for recurring execution
 */
export async function createRecurringSchedule(
  options: CreateScheduleOptions & { cron: string }
): Promise<ScheduleResult> {
  const client = requireQStash();

  if (!options.cron) {
    throw new Error("Cron expression is required for recurring schedules");
  }

  const webhookUrl = `${appUrl}/api/webhooks/publish`;

  try {
    // Create separate recurring schedules for each platform
    const scheduleIds: string[] = [];

    for (const platform of options.platforms) {
      const payload: SchedulePublishPayload = {
        contentId: options.contentId,
        platform,
        scheduledAt: options.scheduledAt.toISOString(),
      };

      const schedule = await client.schedules.create({
        destination: webhookUrl,
        cron: options.cron,
        body: JSON.stringify(payload),
      });

      scheduleIds.push(schedule.scheduleId);
    }

    return {
      scheduleId: scheduleIds.join(","), // Store all schedule IDs
      scheduledAt: options.scheduledAt,
      platforms: options.platforms,
    };
  } catch (error) {
    throw new Error(
      `Failed to create recurring schedule: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Cancel a scheduled publish
 * Handles both one-time delayed publishes and recurring schedules
 */
export async function cancelSchedule(
  options: CancelScheduleOptions
): Promise<boolean> {
  const client = requireQStash();

  try {
    // Cancel recurring schedule
    if (options.scheduleId) {
      const scheduleIds = options.scheduleId.split(",");

      for (const scheduleId of scheduleIds) {
        await client.schedules.delete(scheduleId.trim());
      }

      return true;
    }

    // Cancel one-time delayed publish
    if (options.messageId) {
      const messageIds = options.messageId.split(",");

      for (const messageId of messageIds) {
        await client.messages.delete(messageId.trim());
      }

      return true;
    }

    throw new Error("Either scheduleId or messageId must be provided");
  } catch (error) {
    throw new Error(
      `Failed to cancel schedule: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get schedule information
 * Useful for checking if a schedule still exists
 */
export async function getSchedule(scheduleId: string): Promise<unknown> {
  const client = requireQStash();

  try {
    const schedule = await client.schedules.get(scheduleId);
    return schedule;
  } catch (error) {
    throw new Error(
      `Failed to get schedule: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * List all schedules
 * Useful for debugging and monitoring
 */
export async function listSchedules(): Promise<unknown[]> {
  const client = requireQStash();

  try {
    const schedules = await client.schedules.list();
    return schedules;
  } catch (error) {
    throw new Error(
      `Failed to list schedules: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate cron expression for common scheduling patterns
 */
export const cronExpressions = {
  // Daily at specific hour (24-hour format)
  daily: (hour: number) => `0 ${hour} * * *`,

  // Weekly on specific day and hour (0 = Sunday, 6 = Saturday)
  weekly: (dayOfWeek: number, hour: number) => `0 ${hour} * * ${dayOfWeek}`,

  // Monthly on specific day and hour
  monthly: (dayOfMonth: number, hour: number) => `0 ${hour} ${dayOfMonth} * *`,

  // Every N hours
  everyNHours: (hours: number) => `0 */${hours} * * *`,

  // Every N minutes
  everyNMinutes: (minutes: number) => `*/${minutes} * * * *`,
} as const;
