/**
 * ML Priority Adjustment API (F114)
 * POST /api/recommendations/ml - Train model or adjust priorities
 * GET /api/recommendations/ml - Get model info and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { mlPriorityEngine } from "@/lib/recommendations";

// Request schemas
const adjustPrioritySchema = z.object({
  originalScore: z.number().min(0).max(100),
  category: z.string().optional(),
  source: z.string().optional(),
  complexity: z.number().min(0).max(1).optional(),
  historicalSuccessRate: z.number().min(0).max(1).optional(),
});

const batchAdjustSchema = z.object({
  recommendations: z.array(
    z.object({
      id: z.string(),
      originalScore: z.number().min(0).max(100),
      category: z.string().optional(),
      source: z.string().optional(),
      complexity: z.number().min(0).max(1).optional(),
    })
  ),
});

const trainSchema = z.object({
  epochs: z.number().min(1).max(1000).default(100),
  learningRate: z.number().min(0.001).max(0.1).default(0.01),
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
    const action = searchParams.get("action") || "info";

    switch (action) {
      case "info":
        return handleGetModelInfo();

      case "metrics":
        return handleGetMetrics();

      case "needsRetraining":
        return handleCheckRetraining(searchParams);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: info, metrics, or needsRetraining" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get ML info",
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
    const action = body.action || "adjust";

    switch (action) {
      case "adjust":
        return handleAdjustPriority(body);

      case "batchAdjust":
        return handleBatchAdjust(body);

      case "train":
        return handleTrain(body);

      case "export":
        return handleExportModel();

      case "import":
        return handleImportModel(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: adjust, batchAdjust, train, export, or import" },
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
        error: "ML operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function handleGetModelInfo() {
  const model = mlPriorityEngine.getModelInfo();

  return NextResponse.json({
    success: true,
    model: {
      version: model.version,
      trainedAt: model.trainedAt.toISOString(),
      sampleCount: model.sampleCount,
      weights: model.weights,
      categoryAdjustments: model.categoryAdjustments,
      sourceAdjustments: model.sourceAdjustments,
    },
    status: model.sampleCount > 0 ? "trained" : "untrained",
  });
}

function handleGetMetrics() {
  const metrics = mlPriorityEngine.getMetrics();

  return NextResponse.json({
    success: true,
    metrics: {
      accuracy: Math.round(metrics.accuracy * 100) / 100,
      precision: Math.round(metrics.precision * 100) / 100,
      recall: Math.round(metrics.recall * 100) / 100,
      f1Score: Math.round(metrics.f1Score * 100) / 100,
      mse: Math.round(metrics.mse * 10000) / 10000,
      trainingLoss: Math.round(metrics.trainingLoss * 10000) / 10000,
      validationLoss: Math.round(metrics.validationLoss * 10000) / 10000,
    },
    interpretation: {
      accuracyGrade: getGrade(metrics.accuracy),
      modelHealth: getModelHealth(metrics),
    },
  });
}

function handleCheckRetraining(searchParams: URLSearchParams) {
  const maxAge = searchParams.get("maxAge")
    ? parseInt(searchParams.get("maxAge")!)
    : undefined;
  const minAccuracy = searchParams.get("minAccuracy")
    ? parseFloat(searchParams.get("minAccuracy")!)
    : undefined;

  const needsRetraining = mlPriorityEngine.needsRetraining({
    maxAge,
    minAccuracy,
  });

  return NextResponse.json({
    success: true,
    needsRetraining,
    currentModel: {
      version: mlPriorityEngine.getModelInfo().version,
      trainedAt: mlPriorityEngine.getModelInfo().trainedAt.toISOString(),
      accuracy: mlPriorityEngine.getMetrics().accuracy,
    },
    recommendation: needsRetraining
      ? "Model should be retrained for optimal performance"
      : "Model is up to date",
  });
}

async function handleAdjustPriority(body: unknown) {
  const params = adjustPrioritySchema.parse(body);

  const result = mlPriorityEngine.adjustPriority(params);

  return NextResponse.json({
    success: true,
    result: {
      originalScore: Math.round(result.originalScore * 100) / 100,
      adjustedScore: Math.round(result.adjustedScore * 100) / 100,
      adjustment: Math.round(result.adjustment * 100) / 100,
      confidence: Math.round(result.confidence * 100) / 100,
      factors: {
        category: Math.round(result.factors.categoryFactor * 100) / 100,
        source: Math.round(result.factors.sourceFactor * 100) / 100,
        historical: Math.round(result.factors.historicalFactor * 100) / 100,
        complexity: Math.round(result.factors.complexityFactor * 100) / 100,
      },
    },
    interpretation: {
      changeDirection: result.adjustment > 0 ? "increased" : result.adjustment < 0 ? "decreased" : "unchanged",
      changeMagnitude: Math.abs(result.adjustment) > 5 ? "significant" : "minor",
    },
  });
}

async function handleBatchAdjust(body: unknown) {
  const { recommendations } = batchAdjustSchema.parse(body);

  const results = mlPriorityEngine.batchAdjustPriorities(recommendations);

  const adjustments = Array.from(results.entries()).map(([id, result]) => ({
    id,
    originalScore: Math.round(result.originalScore * 100) / 100,
    adjustedScore: Math.round(result.adjustedScore * 100) / 100,
    adjustment: Math.round(result.adjustment * 100) / 100,
    confidence: Math.round(result.confidence * 100) / 100,
  }));

  // Sort by adjusted score
  adjustments.sort((a, b) => b.adjustedScore - a.adjustedScore);

  return NextResponse.json({
    success: true,
    count: adjustments.length,
    adjustments,
    summary: {
      averageAdjustment:
        adjustments.reduce((sum, a) => sum + Math.abs(a.adjustment), 0) / adjustments.length,
      increased: adjustments.filter((a) => a.adjustment > 0).length,
      decreased: adjustments.filter((a) => a.adjustment < 0).length,
      unchanged: adjustments.filter((a) => a.adjustment === 0).length,
    },
  });
}

async function handleTrain(body: unknown) {
  const { epochs, learningRate } = trainSchema.parse(body);

  const beforeMetrics = mlPriorityEngine.getMetrics();

  const metrics = await mlPriorityEngine.train({ epochs, learningRate });

  return NextResponse.json({
    success: true,
    message: "Model training completed",
    training: {
      epochs,
      learningRate,
    },
    model: {
      version: mlPriorityEngine.getModelInfo().version,
      sampleCount: mlPriorityEngine.getModelInfo().sampleCount,
    },
    metrics: {
      accuracy: Math.round(metrics.accuracy * 100) / 100,
      precision: Math.round(metrics.precision * 100) / 100,
      recall: Math.round(metrics.recall * 100) / 100,
      f1Score: Math.round(metrics.f1Score * 100) / 100,
      mse: Math.round(metrics.mse * 10000) / 10000,
    },
    improvement: {
      accuracy: Math.round((metrics.accuracy - beforeMetrics.accuracy) * 100) / 100,
      mse: Math.round((beforeMetrics.mse - metrics.mse) * 10000) / 10000,
    },
  });
}

function handleExportModel() {
  const modelJson = mlPriorityEngine.exportModel();

  return NextResponse.json({
    success: true,
    model: JSON.parse(modelJson),
    exportedAt: new Date().toISOString(),
  });
}

async function handleImportModel(body: unknown) {
  const schema = z.object({
    model: z.record(z.string(), z.unknown()),
  });

  const { model } = schema.parse(body);

  mlPriorityEngine.importModel(JSON.stringify(model));

  return NextResponse.json({
    success: true,
    message: "Model imported successfully",
    model: {
      version: mlPriorityEngine.getModelInfo().version,
      sampleCount: mlPriorityEngine.getModelInfo().sampleCount,
    },
  });
}

// Helper functions
function getGrade(accuracy: number): string {
  if (accuracy >= 0.9) return "Excellent";
  if (accuracy >= 0.8) return "Good";
  if (accuracy >= 0.7) return "Fair";
  if (accuracy >= 0.6) return "Needs Improvement";
  return "Poor";
}

function getModelHealth(metrics: { accuracy: number; mse: number; f1Score: number }): string {
  const score = metrics.accuracy * 0.4 + (1 - metrics.mse) * 0.3 + metrics.f1Score * 0.3;
  if (score >= 0.8) return "Healthy";
  if (score >= 0.6) return "Adequate";
  if (score >= 0.4) return "Degraded";
  return "Needs Training";
}
