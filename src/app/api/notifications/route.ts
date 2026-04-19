/**
 * Notifications API
 *
 * In-app notifications for the notification center
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";

// GET - List notifications
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams =
      request.nextUrl?.searchParams ??
      new URL(request.url).searchParams;

    const rawLimit = parseInt(searchParams.get("limit") || "20");
    const rawOffset = parseInt(searchParams.get("offset") || "0");

    if (isNaN(rawLimit) || isNaN(rawOffset)) {
      throw new Error("Invalid pagination parameters");
    }

    const limit = Math.min(rawLimit, 100);
    const offset = rawOffset;
    const type = searchParams.get("type");
    const isReadParam = searchParams.get("isRead");
    const isArchivedParam = searchParams.get("isArchived");

    // Build where conditions
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.organizationId, orgId),
    ];

    if (type) {
      conditions.push(eq(notifications.type, type as "mention" | "score_change" | "recommendation" | "important"));
    }

    if (isReadParam !== null) {
      conditions.push(eq(notifications.isRead, isReadParam === "true"));
    }

    if (isArchivedParam !== null) {
      conditions.push(eq(notifications.isArchived, isArchivedParam === "true"));
    } else {
      // By default, don't show archived
      conditions.push(eq(notifications.isArchived, false));
    }

    const whereClause = and(...conditions);

    // Get notifications with pagination
    const rows = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        notifications: rows,
        meta: {
          limit,
          offset,
          total,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids, all } = body;

    if (all) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.organizationId, orgId),
            eq(notifications.isRead, false)
          )
        );
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        await db
          .update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, userId),
              eq(notifications.organizationId, orgId)
            )
          );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Must provide 'ids' array or 'all: true'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE - Delete old notifications
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams =
      request.nextUrl?.searchParams ??
      new URL(request.url).searchParams;
    const olderThanDays = parseInt(searchParams.get("olderThan") || "30");

    if (
      !Number.isInteger(olderThanDays) ||
      olderThanDays < 1 ||
      olderThanDays > 365
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "olderThan must be an integer between 1 and 365",
        },
        { status: 400 }
      );
    }

    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.organizationId, orgId),
          eq(notifications.isRead, true)
        )
      );

    return NextResponse.json({
      success: true,
      message: `Deleted old notifications`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
