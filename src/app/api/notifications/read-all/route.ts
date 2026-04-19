import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, notificationReads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications as read for the current user
 */
export async function PATCH(_request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Get all unread notifications for this user
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      );

    if (unreadNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unread notifications to mark as read",
        data: { count: 0 },
      });
    }

    // Update all unread notifications
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: now,
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      );

    // Create read audit records for all notifications
    const readRecords = unreadNotifications.map((notification) => ({
      notificationId: notification.id,
      userId,
      readAt: now,
    }));

    await db.insert(notificationReads).values(readRecords);

    return NextResponse.json({
      success: true,
      message: `Marked ${unreadNotifications.length} notifications as read`,
      data: { count: unreadNotifications.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
