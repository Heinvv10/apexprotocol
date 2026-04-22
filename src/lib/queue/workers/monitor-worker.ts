/**
 * Monitor Background Job Worker (F101)
 * Processes monitoring jobs to scan AI platforms for brand mentions
 */

import { monitorQueue, type Job } from "../index";
import { createScraperManager } from "../../scraping";
import { db } from "../../db";
import { brandMentions, monitoringJobs, brands } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { onMentionCreated } from "../../notifications/triggers";
import { getOrganizationMembers } from "../../auth";
import { getRedisClient } from "../../redis";
import { logger } from "../../logger";

// Worker configuration
const WORKER_CONFIG = {
  pollInterval: 5000, // 5 seconds
  maxJobsPerRun: 10,
  platforms: ["chatgpt", "claude", "perplexity", "gemini", "grok", "deepseek"] as const,
};

// Job result type
interface MonitorJobResult {
  success: boolean;
  mentionsFound: number;
  platformsScanned: string[];
  errors: string[];
  duration: number;
}

/**
 * Process a single monitoring job
 */
export async function processMonitorJob(job: Job): Promise<MonitorJobResult> {
  const startTime = Date.now();
  const result: MonitorJobResult = {
    success: false,
    mentionsFound: 0,
    platformsScanned: [],
    errors: [],
    duration: 0,
  };

  try {
    const { brandId, platforms, queries } = job.payload as {
      brandId: string;
      platforms?: string[];
      queries?: string[];
    };

    // Get brand data
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    // Update monitoring job status
    await db
      .update(monitoringJobs)
      .set({ status: "processing", startedAt: new Date() })
      .where(eq(monitoringJobs.brandId, brandId));

    // Determine which platforms to scan
    const targetPlatforms = platforms?.length
      ? platforms.filter((p) =>
          WORKER_CONFIG.platforms.includes(p as (typeof WORKER_CONFIG.platforms)[number])
        )
      : [...WORKER_CONFIG.platforms];

    // Get or generate queries
    const searchQueries = queries?.length
      ? queries
      : generateQueries(brand.name, brand.industry ?? undefined);

    // Create scraper manager
    const scraperManager = createScraperManager();

    // Scan each platform
    for (const platform of targetPlatforms) {
      try {
        result.platformsScanned.push(platform);

        const scrapeResult = await scraperManager.scrapePlatform(
          platform,
          brand.name,
          searchQueries
        );

        if (scrapeResult.success && scrapeResult.mentions.length > 0) {
          // Get organization ID from job payload
          const orgId = (job.payload as { orgId?: string }).orgId;

          // Fetch organization members for notification distribution
          let orgMembers: Array<{ id?: string; authUserId?: string | null; clerkUserId?: string | null }> = [];
          if (orgId) {
            try {
              orgMembers = await getOrganizationMembers(orgId);
            } catch (error) {
              console.error(
                "[MonitorWorker] Failed to fetch organization members:",
                error
              );
            }
          }

          // Store mentions in database
          for (const mention of scrapeResult.mentions) {
            // Map sentiment - convert "mixed" to "neutral" as DB only supports positive/neutral/negative
            const dbSentiment = mention.sentiment === "mixed"
              ? "neutral"
              : (mention.sentiment ?? "neutral") as "positive" | "neutral" | "negative" | "unrecognized";

            const [newMention] = await db.insert(brandMentions).values({
              id: createId(),
              brandId,
              platform: mention.platform as "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "copilot",
              query: mention.query,
              response: mention.response,
              sentiment: dbSentiment,
              position: null,
              citationUrl: mention.citationUrl ?? null,
              metadata: mention.metadata as Record<string, unknown>,
            }).returning();
            result.mentionsFound++;

            // Publish to Redis stream for real-time updates
            if (orgId) {
              try {
                const redis = getRedisClient();
                const streamKey = `mention_stream:${orgId}`;
                const streamMention = {
                  id: newMention.id,
                  brandId: newMention.brandId,
                  platform: newMention.platform,
                  query: newMention.query,
                  response: newMention.response,
                  sentiment: newMention.sentiment,
                  position: newMention.position,
                  citationUrl: newMention.citationUrl,
                  createdAt: newMention.createdAt.toISOString(),
                };
                // Push to Redis list for SSE consumers
                await redis.rpush(streamKey, JSON.stringify(streamMention));
                // Set TTL of 1 hour on the stream key to auto-cleanup old messages
                await redis.expire(streamKey, 3600);
                logger.debug("[MonitorWorker] Published mention to stream", {
                  mentionId: newMention.id,
                  orgId,
                  platform
                });
              } catch (streamError) {
                // Log but don't fail the job if streaming fails
                logger.error("[MonitorWorker] Failed to publish to stream", {
                  error: streamError,
                  mentionId: newMention.id,
                  orgId
                });
              }
            }

            // Trigger notifications for all organization members
            if (orgId && orgMembers.length > 0) {
              for (const member of orgMembers) {
                if (member.authUserId || member.id) {
                  try {
                    await onMentionCreated({
                      mention: newMention,
                      userId: (member.authUserId || member.id) as string,
                      organizationId: orgId,
                    });
                  } catch (notificationError) {
                    // Log error but don't fail the job
                    console.error(
                      "[MonitorWorker] Failed to create notification for user:",
                      (member.authUserId || member.id),
                      notificationError
                    );
                  }
                }
              }
            }
          }
        }

        if (scrapeResult.error) {
          result.errors.push(`${platform}: ${scrapeResult.error}`);
        }
      } catch (platformError) {
        result.errors.push(
          `${platform}: ${platformError instanceof Error ? platformError.message : String(platformError)}`
        );
      }
    }

    // Update monitoring job status
    await db
      .update(monitoringJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        mentionsFound: result.mentionsFound,
        error: result.errors.length > 0 ? result.errors.join("; ") : null,
      })
      .where(eq(monitoringJobs.brandId, brandId));

    result.success = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Generate search queries for a brand
 */
function generateQueries(brandName: string, industry?: string): string[] {
  const baseQueries = [
    `What is ${brandName}?`,
    `Tell me about ${brandName}`,
    `${brandName} review`,
    `Is ${brandName} good?`,
    `${brandName} alternatives`,
    `Best ${brandName} features`,
    `${brandName} pricing`,
  ];

  if (industry) {
    baseQueries.push(
      `Best ${industry} companies`,
      `Top ${industry} solutions`,
      `${industry} recommendations`,
      `Compare ${industry} providers`
    );
  }

  return baseQueries;
}

/**
 * Run the monitor worker (processes pending jobs)
 * This is called by cron endpoint
 */
export async function runMonitorWorker(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ jobId: string; result: MonitorJobResult }>;
}> {
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    results: [] as Array<{ jobId: string; result: MonitorJobResult }>,
  };

  // Clean stale jobs first
  await monitorQueue.cleanStaleJobs();

  // Process up to maxJobsPerRun jobs
  for (let i = 0; i < WORKER_CONFIG.maxJobsPerRun; i++) {
    const job = await monitorQueue.getNextJob();

    if (!job) {
      break; // No more jobs
    }

    stats.processed++;

    try {
      const result = await processMonitorJob(job);
      stats.results.push({ jobId: job.id, result });

      if (result.success) {
        await monitorQueue.completeJob(job.id, result);
        stats.succeeded++;

        // After a monitor job ingests new mentions, the brand's content +
        // authority + ai-readiness components all move. Recompute and
        // persist history so notifications fire in real time. The job
        // payload carries brandId — pull it safely in case of shape drift.
        const brandId = (job.payload as { brandId?: string })?.brandId;
        if (brandId) {
          try {
            const { computeGeoScore } = await import(
              "@/lib/analytics/geo-score-compute"
            );
            await computeGeoScore(brandId, { forceHistory: true });
          } catch (err) {
            logger.error("[monitor-worker] GEO score recompute failed", {
              error: err instanceof Error ? err.message : String(err),
              brandId,
            });
            const Sentry = await import("@sentry/nextjs").catch(() => null);
            Sentry?.captureException(err, {
              tags: { worker: "monitor", phase: "geo-score-recompute" },
            });
          }
        }
      } else {
        await monitorQueue.failJob(job.id, result.errors.join("; "));
        stats.failed++;
      }
    } catch (error) {
      await monitorQueue.failJob(
        job.id,
        error instanceof Error ? error.message : String(error)
      );
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Get worker status
 */
export async function getMonitorWorkerStatus(): Promise<{
  queueStats: Awaited<ReturnType<typeof monitorQueue.getStats>>;
  recentJobs: Job[];
  config: typeof WORKER_CONFIG;
}> {
  const [queueStats, recentJobs] = await Promise.all([
    monitorQueue.getStats(),
    monitorQueue.getJobs("completed", 5),
  ]);

  return {
    queueStats,
    recentJobs,
    config: WORKER_CONFIG,
  };
}
