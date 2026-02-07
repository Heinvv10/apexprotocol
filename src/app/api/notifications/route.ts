/**
 * Notifications API
 * 
 * In-app notifications for the notification center
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET - List notifications
export async function GET(request: NextRequest) {
  try {
    const { orgId, userId } = await auth();
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    // Query notifications
    const result = await db.execute(sql`
      SELECT * FROM notifications
      WHERE organization_id = ${organizationId}
      ${unreadOnly ? sql`AND is_read = FALSE` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    // Get unread count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE organization_id = ${organizationId}
      AND is_read = FALSE
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      unreadCount: parseInt((countResult.rows[0] as any)?.count || "0"),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { orgId } = await auth();
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";
    const body = await request.json();
    const { ids, all } = body;

    if (all) {
      // Mark all as read
      await db.execute(sql`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE organization_id = ${organizationId}
        AND is_read = FALSE
      `);
    } else if (ids && Array.isArray(ids)) {
      // Mark specific notifications as read
      await db.execute(sql`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE organization_id = ${organizationId}
        AND id = ANY(${ids}::text[])
      `);
    } else {
      return NextResponse.json(
        { error: "Must provide 'ids' array or 'all: true'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// DELETE - Delete old notifications
export async function DELETE(request: NextRequest) {
  try {
    const { orgId } = await auth();
    const isDev = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!isDev && !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = orgId || "dev-org";
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThan") || "30");

    // Validate olderThanDays is a safe integer within bounds
    if (!Number.isInteger(olderThanDays) || olderThanDays < 1 || olderThanDays > 365) {
      return NextResponse.json(
        { error: "olderThan must be an integer between 1 and 365" },
        { status: 400 }
      );
    }

    // Delete old read notifications (parameterized to prevent SQL injection)
    const result = await db.execute(sql`
      DELETE FROM notifications
      WHERE organization_id = ${organizationId}
      AND is_read = TRUE
      AND created_at < NOW() - INTERVAL '1 day' * ${olderThanDays}
    `);

    return NextResponse.json({
      success: true,
      message: `Deleted old notifications`,
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
