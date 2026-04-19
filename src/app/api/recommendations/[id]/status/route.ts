import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendations, brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";
import {
  calculateScoreImprovement,
  calculateEffectivenessScore,
  type RecommendationPriority,
} from "@/lib/analytics/effectiveness";

// Validation schema for status update with score capture
const updateStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "dismissed"]),
  notes: z.string().optional().nullable(),
  baselineScore: z.number().int().min(0).max(100).optional().nullable(),
  postImplementationScore: z.number().int().min(0).max(100).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Map priority enum values to effectiveness calculation priority type
 */
function mapPriorityToEffectiveness(
  priority: string
): RecommendationPriority {
  if (priority === "critical" || priority === "high") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

/**
 * Calculate implementation days between startedAt and completedAt
 */
function calculateImplementationDays(
  startedAt: Date | null,
  completedAt: Date
): number {
  if (!startedAt) return 1; // Default to 1 day if no start date

  const diffMs = completedAt.getTime() - startedAt.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays); // Minimum 1 day
}

/**
 * PATCH /api/recommendations/[id]/status
 * Updates the status of a recommendation with optional score capture
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

    const existing = existingRec[0];
    const isTransitioningToInProgress =
      validatedData.status === "in_progress" && existing.status !== "in_progress";
    const isTransitioningToCompleted =
      validatedData.status === "completed" && existing.status !== "completed";

    // Validate score requirements based on status transition
    if (isTransitioningToInProgress && validatedData.baselineScore == null) {
      return NextResponse.json(
        {
          success: false,
          error: "Baseline score is required when starting implementation",
          field: "baselineScore",
        },
        { status: 400 }
      );
    }

    if (isTransitioningToCompleted && validatedData.postImplementationScore == null) {
      // Check if we have a baseline score (either from request or existing)
      const baselineScore = validatedData.baselineScore ?? existing.baselineScore;
      if (baselineScore == null) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot complete recommendation without baseline score. Start implementation first.",
            field: "baselineScore",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Post-implementation score is required when completing a recommendation",
          field: "postImplementationScore",
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: validatedData.status,
      updatedAt: new Date(),
    };

    // Handle transition to in_progress - set startedAt and baselineScore
    if (isTransitioningToInProgress) {
      updateData.startedAt = new Date();
      updateData.baselineScore = validatedData.baselineScore;
    }

    // Handle transition to completed - set completedAt, post score, and calculate effectiveness
    if (isTransitioningToCompleted) {
      const completedAt = new Date();
      updateData.completedAt = completedAt;
      updateData.postImplementationScore = validatedData.postImplementationScore;

      // Determine baseline score (from request or existing record)
      const baselineScore = validatedData.baselineScore ?? existing.baselineScore;
      if (validatedData.baselineScore != null) {
        updateData.baselineScore = validatedData.baselineScore;
        // Also set startedAt if transitioning directly from pending to completed
        if (existing.status === "pending") {
          updateData.startedAt = completedAt;
        }
      }

      if (baselineScore != null && validatedData.postImplementationScore != null) {
        // Calculate score improvement
        const scoreImprovement = calculateScoreImprovement(
          validatedData.postImplementationScore,
          baselineScore
        );
        updateData.scoreImprovement = scoreImprovement;

        // Calculate effectiveness score
        const startedAt = existing.startedAt || completedAt;
        const implementationDays = calculateImplementationDays(startedAt, completedAt);
        const priority = mapPriorityToEffectiveness(existing.priority);

        const effectivenessScore = calculateEffectivenessScore(
          baselineScore,
          validatedData.postImplementationScore,
          implementationDays,
          priority
        );
        updateData.effectivenessScore = effectivenessScore;
      }
    }

    // Handle dismissed status
    if (validatedData.status === "dismissed" && existing.status !== "dismissed") {
      updateData.dismissedAt = new Date();
    }

    // Clear completion/dismissal timestamps if status is being reverted
    if (
      validatedData.status !== "completed" &&
      validatedData.status !== "dismissed"
    ) {
      if (existing.status === "completed") {
        updateData.completedAt = null;
        // Optionally clear scores when reverting from completed
        updateData.postImplementationScore = null;
        updateData.scoreImprovement = null;
        updateData.effectivenessScore = null;
      }
      if (existing.status === "dismissed") {
        updateData.dismissedAt = null;
      }
    }

    // Clear in_progress tracking if reverting to pending
    if (validatedData.status === "pending" && existing.status !== "pending") {
      updateData.startedAt = null;
      updateData.baselineScore = null;
    }

    // Add notes if provided
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Also allow updating baseline score without status change (for corrections)
    if (
      validatedData.baselineScore != null &&
      validatedData.status === existing.status &&
      validatedData.status === "in_progress"
    ) {
      updateData.baselineScore = validatedData.baselineScore;
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
        previousStatus: existing.status,
        newStatus: validatedData.status,
        timestamp: new Date().toISOString(),
        scoreTracking: {
          baselineScore: updatedRec[0].baselineScore,
          postImplementationScore: updatedRec[0].postImplementationScore,
          scoreImprovement: updatedRec[0].scoreImprovement,
          effectivenessScore: updatedRec[0].effectivenessScore,
        },
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
