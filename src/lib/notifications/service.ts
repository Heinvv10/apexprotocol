/**
 * Notification Service
 * Phase 2.1: Create, publish, and manage notifications
 *
 * This service handles:
 * - Creating notifications in the database
 * - Publishing notifications to Redis for real-time delivery via SSE
 * - Deduplication to prevent notification spam
 * - Retrieving notification history and managing read status
 */

import { db } from "@/lib/db";
import {
  notifications,
  notificationPreferences,
  notificationReads,
  type Notification,
  type NewNotification,
  type NotificationMetadata,
} from "@/lib/db/schema/notifications";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getRedisClient, publish } from "@/lib/redis";

// Types
export interface CreateNotificationInput {
  userId: string;
  organizationId: string;
  type: "mention" | "score_change" | "recommendation" | "important";
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}

export interface NotificationResult {
  id: string;
  notification: Notification;
  published: boolean;
  deduplicated: boolean;
}

export interface UnreadCountResult {
  count: number;
  byType: Record<string, number>;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

// Constants
const DEDUPLICATION_TTL = 300; // 5 minutes in seconds
const DEFAULT_PAGE_SIZE = 20;

/**
 * Generate a deduplication key for a notification
 * This key is used in Redis to prevent duplicate notifications
 */
function generateDeduplicationKey(
  userId: string,
  type: string,
  metadata?: NotificationMetadata
): string {
  // Build a unique key based on notification type and metadata
  const parts = [`notification:dedup:${userId}:${type}`];

  // Add type-specific identifiers for deduplication
  if (type === "mention" && metadata?.mentionId) {
    parts.push(metadata.mentionId);
  } else if (type === "score_change" && metadata?.brandId && metadata?.metric) {
    parts.push(`${metadata.brandId}:${metadata.metric}`);
  } else if (type === "recommendation" && metadata?.recommendationId) {
    parts.push(metadata.recommendationId);
  } else if (metadata?.brandId) {
    // Fallback to brandId if available
    parts.push(metadata.brandId);
  }

  return parts.join(":");
}

/**
 * Check if a notification should be deduplicated
 * Returns true if a similar notification was recently sent
 */
async function shouldDeduplicate(
  userId: string,
  type: string,
  metadata?: NotificationMetadata
): Promise<boolean> {
  const redis = getRedisClient();
  const dedupKey = generateDeduplicationKey(userId, type, metadata);

  try {
    const exists = await redis.exists(dedupKey);
    return exists === 1;
  } catch (error) {
    console.error("[NotificationService] Deduplication check failed:", error);
    // On error, allow the notification through (fail open)
    return false;
  }
}

/**
 * Mark a notification as sent in the deduplication cache
 */
async function markAsSent(
  userId: string,
  type: string,
  metadata?: NotificationMetadata
): Promise<void> {
  const redis = getRedisClient();
  const dedupKey = generateDeduplicationKey(userId, type, metadata);

  try {
    await redis.setex(dedupKey, DEDUPLICATION_TTL, "1");
  } catch (error) {
    console.error("[NotificationService] Failed to mark as sent:", error);
    // Non-critical error, continue
  }
}

/**
 * Check if user has notification preferences that allow this notification
 */
async function shouldSendNotification(
  userId: string,
  type: string
): Promise<boolean> {
  try {
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // If no preferences found, default to allowing all notifications
    if (!prefs) {
      return true;
    }

    // Check if in-app notifications are enabled
    if (!prefs.inAppEnabled) {
      return false;
    }

    // Check type-specific preferences
    switch (type) {
      case "mention":
        return prefs.mentionNotifications;
      case "score_change":
        return prefs.scoreChangeNotifications;
      case "recommendation":
        return prefs.recommendationNotifications;
      case "important":
        return prefs.importantNotifications;
      default:
        return true;
    }
  } catch (error) {
    console.error("[NotificationService] Failed to check preferences:", error);
    // On error, allow the notification (fail open)
    return true;
  }
}

/**
 * Create a notification in the database
 */
async function createNotificationRecord(
  input: CreateNotificationInput
): Promise<Notification> {
  const notificationId = createId();

  const [notification] = await db
    .insert(notifications)
    .values({
      id: notificationId,
      userId: input.userId,
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata || {},
      isRead: false,
      isArchived: false,
    })
    .returning();

  return notification;
}

/**
 * Publish notification to Redis for real-time delivery via SSE
 */
async function publishNotificationToRedis(
  notification: Notification
): Promise<boolean> {
  try {
    const channel = `notifications:${notification.userId}`;
    await publish(channel, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
    });
    return true;
  } catch (error) {
    console.error("[NotificationService] Failed to publish to Redis:", error);
    return false;
  }
}

/**
 * Create and publish a notification
 * This is the main entry point for creating notifications
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationResult> {
  // Check user preferences
  const shouldSend = await shouldSendNotification(input.userId, input.type);
  if (!shouldSend) {
    throw new Error("Notification blocked by user preferences");
  }

  // Check for deduplication
  const isDuplicate = await shouldDeduplicate(
    input.userId,
    input.type,
    input.metadata
  );

  if (isDuplicate) {
    // Return existing notification info without creating a new one
    return {
      id: "",
      notification: null as any,
      published: false,
      deduplicated: true,
    };
  }

  // Create notification in database
  const notification = await createNotificationRecord(input);

  // Publish to Redis for real-time delivery
  const published = await publishNotificationToRedis(notification);

  // Mark as sent in deduplication cache
  await markAsSent(input.userId, input.type, input.metadata);

  return {
    id: notification.id,
    notification,
    published,
    deduplicated: false,
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(
  userId: string
): Promise<UnreadCountResult> {
  try {
    // Get total unread count
    const [totalResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      );

    // Get count by type
    const byTypeResults = await db
      .select({
        type: notifications.type,
        count: count(),
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      )
      .groupBy(notifications.type);

    const byType: Record<string, number> = {};
    for (const result of byTypeResults) {
      byType[result.type] = result.count;
    }

    return {
      count: totalResult?.count || 0,
      byType,
    };
  } catch (error) {
    console.error("[NotificationService] Failed to get unread count:", error);
    throw error;
  }
}

/**
 * Get notification history for a user
 */
export async function getNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    includeRead?: boolean;
    includeArchived?: boolean;
    type?: string;
  } = {}
): Promise<NotificationListResult> {
  const {
    limit = DEFAULT_PAGE_SIZE,
    offset = 0,
    includeRead = true,
    includeArchived = false,
    type,
  } = options;

  try {
    // Build where conditions
    const conditions = [eq(notifications.userId, userId)];

    if (!includeRead) {
      conditions.push(eq(notifications.isRead, false));
    }

    if (!includeArchived) {
      conditions.push(eq(notifications.isArchived, false));
    }

    if (type) {
      conditions.push(eq(notifications.type, type as any));
    }

    // Get notifications
    const notificationsList = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(notifications.createdAt)],
      limit: limit + 1, // Fetch one extra to check if there are more
      offset,
    });

    // Check if there are more results
    const hasMore = notificationsList.length > limit;
    const results = hasMore ? notificationsList.slice(0, limit) : notificationsList;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(...conditions));

    return {
      notifications: results,
      total: totalResult?.count || 0,
      hasMore,
    };
  } catch (error) {
    console.error("[NotificationService] Failed to get notifications:", error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    // Update notification
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );

    // Create read tracking record
    await db.insert(notificationReads).values({
      id: createId(),
      notificationId,
      userId,
    });
  } catch (error) {
    console.error("[NotificationService] Failed to mark as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    // Get all unread notification IDs
    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        eq(notifications.isArchived, false)
      ),
      columns: {
        id: true,
      },
    });

    if (unreadNotifications.length === 0) {
      return 0;
    }

    const now = new Date();

    // Update all to read
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: now,
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      );

    // Create read tracking records
    const readRecords = unreadNotifications.map((n) => ({
      id: createId(),
      notificationId: n.id,
      userId,
      readAt: now,
    }));

    await db.insert(notificationReads).values(readRecords);

    return unreadNotifications.length;
  } catch (error) {
    console.error("[NotificationService] Failed to mark all as read:", error);
    throw error;
  }
}

/**
 * Archive a notification
 */
export async function archiveNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    await db
      .update(notifications)
      .set({
        isArchived: true,
        archivedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  } catch (error) {
    console.error("[NotificationService] Failed to archive notification:", error);
    throw error;
  }
}

/**
 * Delete a notification (soft delete via archive)
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  return archiveNotification(notificationId, userId);
}

/**
 * Get or create notification preferences for a user
 */
export async function getOrCreatePreferences(
  userId: string,
  organizationId: string
) {
  try {
    // Try to get existing preferences
    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // Create default preferences if none exist
    if (!prefs) {
      const [newPrefs] = await db
        .insert(notificationPreferences)
        .values({
          id: createId(),
          userId,
          organizationId,
          emailEnabled: true,
          emailDigestFrequency: "none",
          inAppEnabled: true,
          mentionNotifications: true,
          scoreChangeNotifications: true,
          recommendationNotifications: true,
          importantNotifications: true,
          timezone: "UTC",
          digestHour: 9,
        })
        .returning();

      prefs = newPrefs;
    }

    return prefs;
  } catch (error) {
    console.error("[NotificationService] Failed to get/create preferences:", error);
    throw error;
  }
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  userId: string,
  updates: Partial<{
    emailEnabled: boolean;
    emailDigestFrequency: "none" | "daily" | "weekly";
    inAppEnabled: boolean;
    mentionNotifications: boolean;
    scoreChangeNotifications: boolean;
    recommendationNotifications: boolean;
    importantNotifications: boolean;
    timezone: string;
    digestHour: number;
  }>
) {
  try {
    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    return updated;
  } catch (error) {
    console.error("[NotificationService] Failed to update preferences:", error);
    throw error;
  }
}

// Export singleton instance
export const NotificationService = {
  createNotification,
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getOrCreatePreferences,
  updatePreferences,
};
