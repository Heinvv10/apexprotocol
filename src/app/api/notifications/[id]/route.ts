import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notifications/[id]
 * Returns a single notification by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const notification = await db
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

    if (notification.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification[0],
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
 * DELETE /api/notifications/[id]
 * Deletes a notification by ID
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

    // Delete the notification
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
