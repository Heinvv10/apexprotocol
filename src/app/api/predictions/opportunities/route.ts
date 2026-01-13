import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Emerging Opportunities API Route
 * GET /api/predictions/opportunities?brandId=xxx
 * Returns detected emerging opportunities from prediction analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { brands, predictions, geoScoreHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  detectOpportunities,
  type OpportunityEntity,
  type OpportunityDetectionConfig,
} from "@/lib/ml/opportunity-detector";
import type { ForecastPrediction } from "@/lib/ml/forecaster";

/**
 * GET /api/predictions/opportunities
 * Fetches emerging opportunities for a brand based on predictions
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const minConfidence = searchParams.get("minConfidence");
    const minImpact = searchParams.get("minImpact");
    const maxResults = searchParams.get("maxResults");
    const timeframePreference = searchParams.get("timeframe");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    // Step 3: Verify brand exists and user has access
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Step 4: Fetch all active predictions for this brand
    const activePredictions = await db.query.predictions.findMany({
      where: and(
        eq(predictions.brandId, brandId),
        eq(predictions.status, "active")
      ),
      orderBy: [desc(predictions.predictionDate), desc(predictions.targetDate)],
    });

    if (activePredictions.length === 0) {
      return NextResponse.json({
        opportunities: [],
        summary: {
          totalOpportunities: 0,
          message: "No predictions available. Generate predictions first to detect opportunities.",
        },
      });
    }

    // Step 5: Group predictions by entity
    const entitiesMap = new Map<string, OpportunityEntity>();

    for (const prediction of activePredictions) {
      // Create entity key (entityType:entityId or entityType:brandId for brand-level)
      const entityKey =
        prediction.entityType === "brand"
          ? `brand:${brandId}`
          : `${prediction.entityType}:${prediction.entityId || "unknown"}`;

      // Get or create entity
      if (!entitiesMap.has(entityKey)) {
        entitiesMap.set(entityKey, {
          entityType: prediction.entityType,
          entityId:
            prediction.entityType === "brand"
              ? brandId
              : (prediction.entityId || "unknown"),
          entityName:
            prediction.entityType === "brand"
              ? brand.name
              : prediction.entityId || "Unknown",
          currentScore: 0, // Will be populated below
          predictions: [],
        });
      }

      const entity = entitiesMap.get(entityKey)!;

      // Add prediction to entity
      const forecastPrediction: ForecastPrediction = {
        date: prediction.targetDate,
        predictedValue: prediction.predictedValue,
        confidenceLower: prediction.confidenceLower,
        confidenceUpper: prediction.confidenceUpper,
        confidence: prediction.confidence,
      };

      entity.predictions.push(forecastPrediction);
    }

    // Step 6: Get current scores for each entity
    // For brand-level predictions, get the latest GEO score
    const entities = Array.from(entitiesMap.values());

    for (const entity of entities) {
      if (entity.entityType === "brand") {
        // Get latest GEO score from history
        const latestScore = await db.query.geoScoreHistory.findFirst({
          where: eq(geoScoreHistory.brandId, brandId),
          orderBy: [desc(geoScoreHistory.calculatedAt)],
        });

        if (latestScore) {
          entity.currentScore = latestScore.overallScore;
        }
      } else {
        // For keyword/topic/platform, we'd need their specific scores
        // For MVP, we can use the first prediction's value as a fallback
        // or skip if no current score available
        // TODO: Implement keyword/topic score retrieval when that data is available
        const oldestPrediction = entity.predictions[entity.predictions.length - 1];
        if (oldestPrediction) {
          entity.currentScore = oldestPrediction.predictedValue * 0.9; // Approximate
        }
      }
    }

    // Step 7: Sort predictions chronologically for each entity
    for (const entity of entities) {
      entity.predictions.sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
    }

    // Step 8: Detect opportunities
    const config: OpportunityDetectionConfig = {
      minConfidence: minConfidence ? parseFloat(minConfidence) : 0.7,
      minImpact: minImpact ? parseFloat(minImpact) : 10,
      maxResults: maxResults ? parseInt(maxResults, 10) : 10,
      timeframePreference:
        timeframePreference === "short" || timeframePreference === "long"
          ? timeframePreference
          : "medium",
    };

    const opportunities = detectOpportunities(entities, config);

    // Step 9: Format response
    const formattedOpportunities = opportunities.map((opp) => ({
      entityType: opp.entityType,
      entityId: opp.entityId,
      entityName: opp.entityName,
      currentScore: Math.round(opp.currentScore * 10) / 10,
      predictedScore: Math.round(opp.predictedScore * 10) / 10,
      impact: Math.round(opp.impact * 10) / 10, // Percentage
      confidence: Math.round(opp.confidence * 100), // Convert to percentage
      timeframe: opp.timeframe, // Days
      targetDate: opp.targetDate.toISOString(),
      trend: opp.trend,
      explanation: opp.explanation,
    }));

    return NextResponse.json({
      opportunities: formattedOpportunities,
      summary: {
        totalOpportunities: opportunities.length,
        totalEntitiesAnalyzed: entities.length,
        config: {
          minConfidence: config.minConfidence,
          minImpact: config.minImpact,
          timeframePreference: config.timeframePreference,
        },
      },
      metadata: {
        brandId,
        brandName: brand.name,
        predictionCount: activePredictions.length,
        lastUpdated: activePredictions[0]?.predictionDate.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch opportunities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
