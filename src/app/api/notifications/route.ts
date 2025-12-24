import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId, getUserId } from "@/lib/auth/clerk";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Query parameters schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  type: z.enum(["mention", "score_change", "recommendation", "important"]).optional(),
  isRead: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional().default(false),
});

/**
 * GET /api/notifications
 * Returns all notifications for the current user
 */
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

    // Database is required
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      isRead: searchParams.get("isRead") ?? undefined,
      isArchived: searchParams.get("isArchived") ?? undefined,
    });

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { notifications } = await import("@/lib/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    // Build where clause
    const whereConditions = [
      eq(notifications.userId, userId),
      eq(notifications.organizationId, orgId),
      eq(notifications.isArchived, params.isArchived),
    ];

    if (params.type) {
      whereConditions.push(eq(notifications.type, params.type));
    }

    if (params.isRead !== undefined) {
      whereConditions.push(eq(notifications.isRead, params.isRead));
    }

    // Get notifications
    const notificationList = await db
      .select()
      .from(notifications)
      .where(and(...whereConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const { count } = await import("drizzle-orm");
    const totalCount = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(...whereConditions));

    return NextResponse.json({
      success: true,
      data: {
        notifications: notificationList,
        meta: {
          total: totalCount[0]?.count || 0,
          limit: params.limit,
          offset: params.offset,
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
