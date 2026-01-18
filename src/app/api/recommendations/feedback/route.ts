/**
 * Recommendation Feedback API (F113)
 * POST /api/recommendations/feedback - Submit or update feedback
 * GET /api/recommendations/feedback - Get feedback for recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendations, brands } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Validation schema for feedback submission
const submitFeedbackSchema = z.object({
  action: z.literal("submit").optional(),
  recommendationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

/**
 * GET /api/recommendations/feedback
 * Gets feedback for recommendations (by brandId or recommendationId)
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

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const recommendationId = searchParams.get("recommendationId");

    // Get feedback for a specific recommendation
    if (recommendationId) {
      const rec = await db
        .select({
          id: recommendations.id,
          title: recommendations.title,
          userRating: recommendations.userRating,
          userFeedback: recommendations.userFeedback,
          feedbackAt: recommendations.feedbackAt,
        })
        .from(recommendations)
        .innerJoin(brands, eq(recommendations.brandId, brands.id))
        .where(
          and(
            eq(recommendations.id, recommendationId),
            eq(brands.organizationId, orgId),
            eq(brands.isActive, true)
          )
        )
        .limit(1);

      if (rec.length === 0) {
        return NextResponse.json(
          { success: false, error: "Recommendation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        feedback: rec[0].userRating
          ? {
              recommendationId: rec[0].id,
              title: rec[0].title,
              rating: rec[0].userRating,
              feedback: rec[0].userFeedback,
              feedbackAt: rec[0].feedbackAt?.toISOString(),
            }
          : null,
      });
    }

    // Get all feedback for a brand
    if (brandId) {
      // Verify brand belongs to organization
      const brand = await db
        .select()
        .from(brands)
        .where(
          and(
            eq(brands.id, brandId),
            eq(brands.organizationId, orgId),
            eq(brands.isActive, true)
          )
        )
        .limit(1);

      if (brand.length === 0) {
        return NextResponse.json(
          { success: false, error: "Brand not found" },
          { status: 404 }
        );
      }

      const feedbackList = await db
        .select({
          id: recommendations.id,
          title: recommendations.title,
          userRating: recommendations.userRating,
          userFeedback: recommendations.userFeedback,
          feedbackAt: recommendations.feedbackAt,
        })
        .from(recommendations)
        .where(
          and(
            eq(recommendations.brandId, brandId),
            isNotNull(recommendations.userRating)
          )
        );

      return NextResponse.json({
        success: true,
        count: feedbackList.length,
        feedback: feedbackList.map((rec) => ({
          recommendationId: rec.id,
          title: rec.title,
          rating: rec.userRating,
          feedback: rec.userFeedback,
          feedbackAt: rec.feedbackAt?.toISOString(),
        })),
      });
    }

    return NextResponse.json(
      { success: false, error: "Provide brandId or recommendationId" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback", details: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations/feedback
 * Submits feedback for a recommendation
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = submitFeedbackSchema.parse(body);

    // Get existing recommendation
    const existingRec = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, validatedData.recommendationId))
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

    // Update recommendation with feedback
    const feedbackAt = new Date();
    const updatedRec = await db
      .update(recommendations)
      .set({
        userRating: validatedData.rating,
        userFeedback: validatedData.feedback || null,
        feedbackAt,
        updatedAt: feedbackAt,
      })
      .where(eq(recommendations.id, validatedData.recommendationId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        recommendationId: updatedRec[0].id,
        title: updatedRec[0].title,
        rating: updatedRec[0].userRating,
        feedback: updatedRec[0].userFeedback,
        feedbackAt: updatedRec[0].feedbackAt?.toISOString(),
      },
      meta: {
        timestamp: feedbackAt.toISOString(),
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
      { success: false, error: "Feedback operation failed", details: message },
      { status: 500 }
    );
  }
}
