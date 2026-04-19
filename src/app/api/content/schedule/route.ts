import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Validation schema for creating a schedule
const createScheduleSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  scheduledAt: z.string().datetime("Invalid datetime format"),
  platforms: z
    .array(z.enum(["wordpress", "medium"]))
    .min(1, "At least one platform is required"),
  qstashScheduleId: z.string().optional(),
  qstashMessageId: z.string().optional(),
});

// Validation schema for updating a schedule
const updateScheduleSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  scheduledAt: z.string().datetime().optional(),
  platforms: z.array(z.enum(["wordpress", "medium"])).optional(),
  status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
});

/**
 * GET /api/content/schedule
 * Returns all schedules for the current organization (optionally filtered by contentId)
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
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

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { contentSchedules, contentItems } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get contentId from query params if provided
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    let scheduleList;

    if (contentId) {
      // Verify content belongs to organization
      const content = await db
        .select()
        .from(contentItems)
        .where(
          and(
            eq(contentItems.id, contentId),
            eq(contentItems.organizationId, orgId)
          )
        )
        .limit(1);

      if (content.length === 0) {
        return NextResponse.json(
          { success: false, error: "Content not found" },
          { status: 404 }
        );
      }

      // Get schedules for specific content
      scheduleList = await db
        .select()
        .from(contentSchedules)
        .where(eq(contentSchedules.contentId, contentId))
        .orderBy(contentSchedules.scheduledAt);
    } else {
      // Get all schedules for organization's content
      scheduleList = await db
        .select({
          id: contentSchedules.id,
          contentId: contentSchedules.contentId,
          scheduledAt: contentSchedules.scheduledAt,
          qstashScheduleId: contentSchedules.qstashScheduleId,
          qstashMessageId: contentSchedules.qstashMessageId,
          platforms: contentSchedules.platforms,
          status: contentSchedules.status,
          createdAt: contentSchedules.createdAt,
          updatedAt: contentSchedules.updatedAt,
        })
        .from(contentSchedules)
        .innerJoin(contentItems, eq(contentSchedules.contentId, contentItems.id))
        .where(eq(contentItems.organizationId, orgId))
        .orderBy(contentSchedules.scheduledAt);
    }

    return NextResponse.json({
      success: true,
      data: {
        schedules: scheduleList,
        meta: {
          total: scheduleList.length,
          contentId: contentId || null,
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

/**
 * POST /api/content/schedule
 * Creates a new schedule for content
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    const userId = await getUserId();

    if (!orgId || !userId) {
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

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { contentSchedules, contentItems } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Verify content exists and belongs to organization
    const existingContent = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, validatedData.contentId),
          eq(contentItems.organizationId, orgId)
        )
      )
      .limit(1);

    if (existingContent.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    const currentContent = existingContent[0];

    // Verify content is in a schedulable status
    if (currentContent.status !== "scheduled" && currentContent.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: `Content must be in 'draft' or 'scheduled' status to create a schedule. Current status: '${currentContent.status}'`,
        },
        { status: 400 }
      );
    }

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(validatedData.scheduledAt);
    const now = new Date();

    if (scheduledDate <= now) {
      return NextResponse.json(
        {
          success: false,
          error: "scheduledAt must be in the future",
        },
        { status: 400 }
      );
    }

    // Create the schedule
    const newSchedule = await db
      .insert(contentSchedules)
      .values({
        contentId: validatedData.contentId,
        scheduledAt: scheduledDate,
        platforms: validatedData.platforms,
        qstashScheduleId: validatedData.qstashScheduleId,
        qstashMessageId: validatedData.qstashMessageId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update content status to scheduled if it's not already
    if (currentContent.status !== "scheduled") {
      await db
        .update(contentItems)
        .set({
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contentItems.id, validatedData.contentId),
            eq(contentItems.organizationId, orgId)
          )
        );
    }

    return NextResponse.json({
      success: true,
      data: newSchedule[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/content/schedule
 * Updates an existing schedule
 */
export async function PATCH(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    const userId = await getUserId();

    if (!orgId || !userId) {
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

    const body = await request.json();
    const validatedData = updateScheduleSchema.parse(body);

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { contentSchedules, contentItems } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Verify schedule exists and belongs to organization's content
    const existingSchedule = await db
      .select({
        schedule: contentSchedules,
        content: contentItems,
      })
      .from(contentSchedules)
      .innerJoin(contentItems, eq(contentSchedules.contentId, contentItems.id))
      .where(
        and(
          eq(contentSchedules.id, validatedData.scheduleId),
          eq(contentItems.organizationId, orgId)
        )
      )
      .limit(1);

    if (existingSchedule.length === 0) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    const currentSchedule = existingSchedule[0].schedule;

    // Cannot update completed or failed schedules
    if (currentSchedule.status === "completed" || currentSchedule.status === "failed") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot update schedule with status '${currentSchedule.status}'`,
        },
        { status: 400 }
      );
    }

    // Validate scheduledAt is in the future if being updated
    if (validatedData.scheduledAt) {
      const scheduledDate = new Date(validatedData.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        return NextResponse.json(
          {
            success: false,
            error: "scheduledAt must be in the future",
          },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: {
      scheduledAt?: Date;
      platforms?: string[];
      status?: "pending" | "completed" | "failed" | "cancelled";
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (validatedData.scheduledAt) {
      updateData.scheduledAt = new Date(validatedData.scheduledAt);
    }

    if (validatedData.platforms) {
      updateData.platforms = validatedData.platforms;
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    // Update the schedule
    const updatedSchedule = await db
      .update(contentSchedules)
      .set(updateData)
      .where(eq(contentSchedules.id, validatedData.scheduleId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSchedule[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
