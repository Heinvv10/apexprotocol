import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendations, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth";

// Validation schema for status update
const updateStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "dismissed"]),
  notes: z.string().optional().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/recommendations/[id]/status
 * Updates the status of a recommendation
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Get existing recommendation
    const existingRec = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, id))
      .limit(1);

    if (existingRec.length === 0) {
      return NextResponse.json(
        { success: false, error: "Recommendation not found" },
        { status: 404 }
      );
    }

    // Verify brand belongs to organization
    const brand = await db
      .select()
      .from(brands)
      .where(
        and(
          eq(brands.id, existingRec[0].brandId),
          eq(brands.organizationId, orgId),
          eq(brands.isActive, true)
        )
      )
      .limit(1);

    if (brand.length === 0) {
      return NextResponse.json(
        { success: false, error: "Recommendation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: validatedData.status,
      updatedAt: new Date(),
    };

    // Set timestamps based on status change
    if (validatedData.status === "completed" && existingRec[0].status !== "completed") {
      updateData.completedAt = new Date();
    }

    if (validatedData.status === "dismissed" && existingRec[0].status !== "dismissed") {
      updateData.dismissedAt = new Date();
    }

    // Clear completion/dismissal timestamps if status is being reverted
    if (
      validatedData.status !== "completed" &&
      validatedData.status !== "dismissed"
    ) {
      if (existingRec[0].status === "completed") {
        updateData.completedAt = null;
      }
      if (existingRec[0].status === "dismissed") {
        updateData.dismissedAt = null;
      }
    }

    // Add notes if provided
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    const updatedRec = await db
      .update(recommendations)
      .set(updateData)
      .where(eq(recommendations.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedRec[0],
      meta: {
        previousStatus: existingRec[0].status,
        newStatus: validatedData.status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
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
