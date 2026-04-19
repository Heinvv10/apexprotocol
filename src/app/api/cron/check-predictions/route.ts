/**
 * Cron API - Check Predictions and Trigger Alerts
 * Periodically checks active predictions and triggers alerts for predicted drops
 * Called by Vercel Cron or external scheduler (recommended: daily)
 *
 * Phase 6.3: Scheduled job for predictive alert system
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { predictions } from "@/lib/db/schema/predictions";
import { geoScoreHistory } from "@/lib/db/schema/feedback";
import { brands } from "@/lib/db/schema/brands";
import { users } from "@/lib/db/schema/users";
import { eq, desc, and, gte } from "drizzle-orm";
import { onPredictedScoreDrop } from "@/lib/notifications/triggers";
import { logger } from "@/lib/logger";

// Verify cron secret for security
async function verifyCronSecret(): Promise<boolean> {
  const headersList = await headers();
  const cronSecret = headersList.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  // Allow in development without secret
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return cronSecret === expectedSecret;
}

/**
 * Get latest GEO score for a brand
 */
async function getLatestGeoScore(brandId: string): Promise<number | null> {
  const latestScore = await db.query.geoScoreHistory.findFirst({
    where: eq(geoScoreHistory.brandId, brandId),
    orderBy: [desc(geoScoreHistory.calculatedAt)],
  });

  return latestScore?.overallScore ?? null;
}

/**
 * Get users for a brand (via organization)
 */
async function getBrandUsers(brandId: string): Promise<Array<{ userId: string; organizationId: string }>> {
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    return [];
  }

  // Get users in the brand's organization
  const orgUsers = await db.query.users.findMany({
    where: eq(users.organizationId, brand.organizationId),
  });

  return orgUsers.map(user => ({
    userId: user.id,
    organizationId: brand.organizationId,
  }));
}

/**
 * Process predictions for a single brand
 */
async function processBrandPredictions(brandId: string): Promise<{
  brandId: string;
  checked: number;
  triggered: number;
  skipped: number;
  errors: number;
}> {
  const results = {
    brandId,
    checked: 0,
    triggered: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get latest GEO score
    const currentScore = await getLatestGeoScore(brandId);

    if (currentScore === null) {
      logger.info(`[CheckPredictions] No GEO score found for brand ${brandId}`);
      return results;
    }

    // Get active predictions for this brand
    // Look at predictions for the next 30 days (alerts should have lead time)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const brandPredictions = await db.query.predictions.findMany({
      where: and(
        eq(predictions.brandId, brandId),
        eq(predictions.status, "active"),
        gte(predictions.targetDate, new Date()) // Future predictions only
      ),
    });

    results.checked = brandPredictions.length;

    if (brandPredictions.length === 0) {
      logger.info(`[CheckPredictions] No active predictions for brand ${brandId}`);
      return results;
    }

    // Get users to notify
    const brandUsers = await getBrandUsers(brandId);

    if (brandUsers.length === 0) {
      logger.info(`[CheckPredictions] No users found for brand ${brandId}`);
      return results;
    }

    // Check each prediction and trigger alerts if needed
    for (const prediction of brandPredictions) {
      try {
        // Trigger alert for each user in the organization
        for (const { userId, organizationId } of brandUsers) {
          const result = await onPredictedScoreDrop({
            prediction,
            currentScore,
            userId,
            organizationId,
          });

          if (result.success && !result.skipped) {
            results.triggered++;
          } else if (result.skipped) {
            results.skipped++;
          }
        }
      } catch (error) {
        console.error(`[CheckPredictions] Error processing prediction ${prediction.id}:`, error);
        results.errors++;
      }
    }

    return results;
  } catch (error) {
    console.error(`[CheckPredictions] Error processing brand ${brandId}:`, error);
    results.errors++;
    return results;
  }
}

/**
 * GET - Check predictions and trigger alerts
 */
export async function GET() {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();

    // Get all brands with active predictions
    const activePredictions = await db.query.predictions.findMany({
      where: and(
        eq(predictions.status, "active"),
        gte(predictions.targetDate, new Date()) // Future predictions only
      ),
    });

    // Get unique brand IDs
    const brandIds = Array.from(new Set(activePredictions.map(p => p.brandId)));

    logger.info(`[CheckPredictions] Processing ${brandIds.length} brands with ${activePredictions.length} active predictions`);

    // Process each brand
    const results = await Promise.all(
      brandIds.map(brandId => processBrandPredictions(brandId))
    );

    // Aggregate results
    const summary = {
      brandsProcessed: results.length,
      totalPredictionsChecked: results.reduce((sum, r) => sum + r.checked, 0),
      alertsTriggered: results.reduce((sum, r) => sum + r.triggered, 0),
      alertsSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      errors: results.reduce((sum, r) => sum + r.errors, 0),
      durationMs: Date.now() - startTime,
    };

    logger.info(`[CheckPredictions] Completed:`, summary);

    return NextResponse.json({
      success: true,
      message: "Prediction check completed",
      summary,
      brandResults: results,
    });
  } catch (error) {
    console.error("[CheckPredictions] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
