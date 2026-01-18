import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId, getUserId } from "@/lib/auth/clerk";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Validation schema for status transition request
const statusTransitionSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  newStatus: z.enum(["draft", "review", "scheduled", "published"]),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * Validates if a status transition is allowed based on workflow rules
 */
function isValidTransition(currentStatus: string, newStatus: string): boolean {
  // Published is terminal - cannot move back
  if (currentStatus === "published") {
    return false;
  }

  // Draft can move to review or scheduled
  if (currentStatus === "draft") {
    return newStatus === "review" || newStatus === "scheduled";
  }

  // Review can move to draft (reject) or scheduled (approve)
  if (currentStatus === "review") {
    return newStatus === "draft" || newStatus === "scheduled";
  }

  // Scheduled can move to published (auto/manual) or back to draft (cancel)
  if (currentStatus === "scheduled") {
    return newStatus === "published" || newStatus === "draft";
  }

  return false;
}

/**
 * POST /api/content/status
 * Transitions content status with workflow validation
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
    const validatedData = statusTransitionSchema.parse(body);

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { contentItems } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Fetch current content to validate transition
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
    const currentStatus = currentContent.status;

    // Validate status transition
    if (!isValidTransition(currentStatus, validatedData.newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from '${currentStatus}' to '${validatedData.newStatus}'`,
        },
        { status: 400 }
      );
    }

    // If transitioning to scheduled, scheduledAt is required
    if (validatedData.newStatus === "scheduled" && !validatedData.scheduledAt) {
      return NextResponse.json(
        {
          success: false,
          error: "scheduledAt is required when transitioning to scheduled status",
        },
        { status: 400 }
      );
    }

    // Validate scheduledAt is in the future if provided
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

    // Update content status
    const updatedContent = await db
      .update(contentItems)
      .set({
        status: validatedData.newStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contentItems.id, validatedData.contentId),
          eq(contentItems.organizationId, orgId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedContent[0].id,
        previousStatus: currentStatus,
        newStatus: validatedData.newStatus,
        updatedAt: updatedContent[0].updatedAt,
      },
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
