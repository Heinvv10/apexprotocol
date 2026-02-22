/**
 * GEO Monitoring Cron Job
 *
 * Runs automatically via Vercel Cron to collect AI platform mentions
 * and calculate competitive intelligence metrics.
 *
 * Schedule: Every 6 hours (configured in vercel.json)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { monitoringJobs, brands, geoScoreHistory, brandMentions, audits } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { runGEOMonitoringForBrand } from "@/lib/services/geo-monitor";
import { calculateSOV, storeDailySOV } from "@/lib/competitive/share-of-voice";
import { generateCompetitiveAlerts } from "@/lib/competitive/alert-generator";
import { createId } from "@paralleldrive/cuid2";

/**
 * Calculate and record GEO score for a brand
 * This ensures we have daily historical data for predictions
 */
async function recordGeoScore(brandId: string): Promise<{ score: number; recorded: boolean }> {
  try {
    // Get mention stats
    const mentionsData = await db
      .select({
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN ${brandMentions.sentiment} = 'positive' THEN 1 END)`,
        withCitation: sql<number>`COUNT(CASE WHEN ${brandMentions.citationUrl} IS NOT NULL THEN 1 END)`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    const mentions = mentionsData[0] || { total: 0, positive: 0, withCitation: 0 };

    // Get platform coverage
    const platformCount = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${brandMentions.platform})`,
      })
      .from(brandMentions)
      .where(eq(brandMentions.brandId, brandId));

    const platforms = platformCount[0]?.count || 0;

    // Get last audit for technical score
    const lastAudit = await db.query.audits.findFirst({
      where: eq(audits.brandId, brandId),
      orderBy: [desc(audits.createdAt)],
    });

    // Calculate component scores
    const totalMentions = Number(mentions.total) || 0;
    const positiveMentions = Number(mentions.positive) || 0;
    const citedMentions = Number(mentions.withCitation) || 0;

    const technicalScore = lastAudit?.overallScore || 65;
    const contentScore = totalMentions > 0
      ? Math.min(Math.round((positiveMentions / totalMentions) * 100), 100)
      : 50;
    const authorityScore = totalMentions > 0
      ? Math.min(Math.round((citedMentions / totalMentions) * 100) + 20, 100)
      : 40;
    const aiReadinessScore = Math.min(Math.round((Number(platforms) / 7) * 100), 100);

    const overall = Math.round(
      technicalScore * 0.25 +
      contentScore * 0.25 +
      authorityScore * 0.25 +
      aiReadinessScore * 0.25
    );

    // Get previous score
    const lastScore = await db.query.geoScoreHistory.findFirst({
      where: eq(geoScoreHistory.brandId, brandId),
      orderBy: [desc(geoScoreHistory.calculatedAt)],
    });

    const previousScore = lastScore?.overallScore ?? overall;
    const scoreChange = overall - previousScore;
    const trend = scoreChange > 0 ? "up" : scoreChange < 0 ? "down" : "stable";

    // Always record daily score (not just on change)
    await db.insert(geoScoreHistory).values({
      brandId,
      overallScore: overall,
      visibilityScore: aiReadinessScore,
      sentimentScore: contentScore,
      recommendationScore: authorityScore,
      competitorGapScore: null,
      previousScore,
      scoreChange,
      trend,
      mentionCount: totalMentions,
      positiveMentions,
      negativeMentions: 0,
      neutralMentions: totalMentions - positiveMentions,
      recommendationCount: null,
      completedRecommendations: null,
      calculationNotes: `Daily cron collection - ${trend}`,
      dataQuality: totalMentions > 10 ? 90 : totalMentions > 5 ? 75 : 60,
    });

    return { score: overall, recorded: true };
  } catch (error) {
    console.error(`[GEO Cron] Failed to record score for brand ${brandId}:`, error);
    return { score: 0, recorded: false };
  }
}

// Verify cron secret to ensure request is from Vercel
async function verifyCronSecret(request: Request): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Vercel sends CRON_SECRET in Authorization header
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  if (!(await verifyCronSecret(request))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results = {
    success: true,
    brandsProcessed: 0,
    mentionsCollected: 0,
    scoresRecorded: 0,
    sovUpdated: 0,
    alertsGenerated: 0,
    errors: [] as string[],
    duration: 0,
  };

  try {
    console.log("[GEO Cron] Starting scheduled monitoring run");

    // Get all brands with monitoring enabled
    const activeBrands = await db.query.brands.findMany({
      where: eq(brands.monitoringEnabled, true),
    });

    console.log(`[GEO Cron] Found ${activeBrands.length} brands with monitoring enabled`);

    for (const brand of activeBrands) {
      try {
        // Create job record with required fields
        const jobId = createId();
        const [job] = await db.insert(monitoringJobs).values({
          id: jobId,
          brandId: brand.id,
          orgId: brand.organizationId,
          status: "processing",
          platforms: brand.monitoringPlatforms || [],
          queries: brand.geoKeywords || [],
          startedAt: new Date(),
        }).returning();

        // Run GEO monitoring for this brand
        const monitorResult = await runGEOMonitoringForBrand(brand.id);
        results.mentionsCollected += monitorResult.mentionsCollected;

        if (monitorResult.errors.length > 0) {
          results.errors.push(...monitorResult.errors.map(e => `${brand.name}: ${e}`));
        }

        // Record daily GEO score for predictions
        const scoreResult = await recordGeoScore(brand.id);
        if (scoreResult.recorded) {
          results.scoresRecorded++;
          console.log(`[GEO Cron] Recorded score ${scoreResult.score} for ${brand.name}`);
        }

        // Calculate and store Share of Voice
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sovSnapshot = await calculateSOV(brand.id, {
          start: thirtyDaysAgo,
          end: now,
        });

        await storeDailySOV(brand.id, sovSnapshot);
        results.sovUpdated++;

        // Generate competitive alerts
        try {
          const alerts = await generateCompetitiveAlerts(brand.id, sovSnapshot);
          results.alertsGenerated += alerts.length;
        } catch (alertError) {
          // Alert generation is optional, don't fail the whole job
          console.error(`[GEO Cron] Alert generation failed for ${brand.name}:`, alertError);
        }

        // Update job record
        await db.update(monitoringJobs)
          .set({
            status: "completed",
            mentionsFound: monitorResult.mentionsCollected,
            completedAt: new Date(),
          })
          .where(eq(monitoringJobs.id, job.id));

        results.brandsProcessed++;
        console.log(`[GEO Cron] Completed ${brand.name}: ${monitorResult.mentionsCollected} mentions`);

      } catch (brandError) {
        const errorMessage = brandError instanceof Error ? brandError.message : String(brandError);
        results.errors.push(`${brand.name}: ${errorMessage}`);
        console.error(`[GEO Cron] Error processing ${brand.name}:`, brandError);
      }
    }

    results.duration = Date.now() - startTime;

    console.log("[GEO Cron] Completed:", results);

    return NextResponse.json(results);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.success = false;
    results.errors.push(`Fatal error: ${errorMessage}`);
    results.duration = Date.now() - startTime;

    console.error("[GEO Cron] Fatal error:", error);

    return NextResponse.json(results, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
