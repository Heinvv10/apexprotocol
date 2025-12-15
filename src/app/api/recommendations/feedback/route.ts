/**
 * Recommendation Feedback API (F113)
 * POST /api/recommendations/feedback - Submit or update feedback
 * GET /api/recommendations/feedback - Get feedback statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  feedbackManager,
  formatFeedbackResponse,
  type FeedbackRating,
  type FeedbackTag,
} from "@/lib/recommendations";

// Request schemas
const submitFeedbackSchema = z.object({
  recommendationId: z.string().min(1),
  brandId: z.string().min(1),
  rating: z.number().min(1).max(5) as z.ZodType<FeedbackRating>,
  helpful: z.boolean(),
  comment: z.string().optional(),
  tags: z
    .array(
      z.enum([
        "too_complex",
        "not_relevant",
        "already_done",
        "not_actionable",
        "missing_context",
        "incorrect",
        "helpful",
        "accurate",
        "easy_to_implement",
        "high_impact",
      ])
    )
    .optional(),
});

const updateOutcomeSchema = z.object({
  feedbackId: z.string().min(1),
  outcome: z.object({
    implemented: z.boolean(),
    implementedAt: z.string().datetime().optional(),
    success: z.boolean(),
    impactMeasured: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }),
});

const updateMetricsSchema = z.object({
  feedbackId: z.string().min(1),
  metrics: z.object({
    beforeScore: z.number().optional(),
    afterScore: z.number().optional(),
    timeToImplement: z.number().optional(),
    effortRating: z.number().min(1).max(5).optional(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const recommendationId = searchParams.get("recommendationId");
    const statsOnly = searchParams.get("statsOnly") === "true";

    // Get statistics
    if (statsOnly) {
      let stats;
      if (recommendationId) {
        stats = feedbackManager.getRecommendationStats(recommendationId);
      } else if (brandId) {
        stats = feedbackManager.getBrandStats(brandId);
      } else {
        stats = feedbackManager.getGlobalStats();
      }

      return NextResponse.json({
        success: true,
        scope: recommendationId
          ? "recommendation"
          : brandId
            ? "brand"
            : "global",
        stats: {
          totalFeedback: stats.totalFeedback,
          averageRating: Math.round(stats.averageRating * 100) / 100,
          helpfulPercentage: Math.round(stats.helpfulPercentage),
          implementationRate: Math.round(stats.implementationRate),
          successRate: Math.round(stats.successRate),
          averageImpact: Math.round(stats.averageImpact),
          tagDistribution: stats.tagDistribution,
        },
      });
    }

    // Get feedback list
    let feedback;
    if (recommendationId) {
      feedback = feedbackManager.getRecommendationFeedback(recommendationId);
    } else if (brandId) {
      feedback = feedbackManager.getBrandFeedback(brandId);
    } else {
      return NextResponse.json(
        { error: "Provide brandId or recommendationId" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: feedback.length,
      feedback: feedback.map(formatFeedbackResponse),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action || "submit";

    switch (action) {
      case "submit":
        return handleSubmitFeedback(body, userId);

      case "updateOutcome":
        return handleUpdateOutcome(body);

      case "updateMetrics":
        return handleUpdateMetrics(body);

      case "export":
        return handleExportForTraining();

      case "needsReview":
        return handleGetNeedsReview(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: submit, updateOutcome, updateMetrics, export, or needsReview" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Feedback operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleSubmitFeedback(body: unknown, userId: string) {
  const { recommendationId, brandId, rating, helpful, comment, tags } =
    submitFeedbackSchema.parse(body);

  const feedback = feedbackManager.submitFeedback({
    recommendationId,
    brandId,
    userId,
    rating,
    helpful,
    comment,
    tags: tags as FeedbackTag[],
  });

  return NextResponse.json({
    success: true,
    message: "Feedback submitted successfully",
    feedback: formatFeedbackResponse(feedback),
  });
}

async function handleUpdateOutcome(body: unknown) {
  const { feedbackId, outcome } = updateOutcomeSchema.parse(body);

  const updated = feedbackManager.updateOutcome(feedbackId, {
    implemented: outcome.implemented,
    implementedAt: outcome.implementedAt ? new Date(outcome.implementedAt) : undefined,
    success: outcome.success,
    impactMeasured: outcome.impactMeasured,
    notes: outcome.notes,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Feedback not found", feedbackId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Outcome updated successfully",
    feedback: formatFeedbackResponse(updated),
  });
}

async function handleUpdateMetrics(body: unknown) {
  const { feedbackId, metrics } = updateMetricsSchema.parse(body);

  const updated = feedbackManager.updateMetrics(feedbackId, metrics);

  if (!updated) {
    return NextResponse.json(
      { error: "Feedback not found", feedbackId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Metrics updated successfully",
    feedback: formatFeedbackResponse(updated),
  });
}

async function handleExportForTraining() {
  const trainingData = feedbackManager.exportForTraining();

  return NextResponse.json({
    success: true,
    count: trainingData.length,
    data: trainingData,
    summary: {
      totalSamples: trainingData.length,
      implemented: trainingData.filter((d) => d.implemented).length,
      successful: trainingData.filter((d) => d.success).length,
      averageRating:
        trainingData.length > 0
          ? trainingData.reduce((sum, d) => sum + d.rating, 0) / trainingData.length
          : 0,
      avgImpact:
        trainingData.filter((d) => d.impact !== undefined).length > 0
          ? trainingData
              .filter((d) => d.impact !== undefined)
              .reduce((sum, d) => sum + d.impact!, 0) /
            trainingData.filter((d) => d.impact !== undefined).length
          : null,
    },
  });
}

async function handleGetNeedsReview(body: unknown) {
  const schema = z.object({
    threshold: z.number().min(1).max(5).default(3),
  });

  const { threshold } = schema.parse(body);

  const recommendations = feedbackManager.getRecommendationsNeedingReview(threshold);

  return NextResponse.json({
    success: true,
    threshold,
    count: recommendations.length,
    recommendations,
    message:
      recommendations.length > 0
        ? `Found ${recommendations.length} recommendations with average rating below ${threshold}`
        : "No recommendations need review",
  });
}
