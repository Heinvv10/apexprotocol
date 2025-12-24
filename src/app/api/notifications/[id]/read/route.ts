import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, notificationReads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganizationId, getUserId } from "@/lib/auth/clerk";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id]/read
 * Marks a notification as read
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check notification exists and belongs to this user
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId)
        )
      )
      .limit(1);

    if (existingNotification.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Skip if already read
    if (existingNotification[0].isRead) {
      return NextResponse.json({
        success: true,
        data: existingNotification[0],
        message: "Notification already marked as read",
      });
    }

    const now = new Date();

    // Update notification as read
    const updated = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: now,
      })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId)
        )
      )
      .returning();

    // Create read audit record
    await db.insert(notificationReads).values({
      notificationId: id,
      userId,
      readAt: now,
    });

    return NextResponse.json({
      success: true,
      data: updated[0],
      message: "Notification marked as read",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]/read
 * Marks a notification as unread
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check notification exists and belongs to this user
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId)
        )
      )
      .limit(1);

    if (existingNotification.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Update notification as unread
    const updated = await db
      .update(notifications)
      .set({
        isRead: false,
        readAt: null,
      })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: updated[0],
      message: "Notification marked as unread",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
