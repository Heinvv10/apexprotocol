import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getOrganizationId, getUserId } from "@/lib/auth/clerk";

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get unread count
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId),
          eq(notifications.isRead, false),
          eq(notifications.isArchived, false)
        )
      );

    const unreadCount = result[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: { count: unreadCount },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
