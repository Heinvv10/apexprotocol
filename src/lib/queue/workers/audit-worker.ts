/**
 * Audit Background Job Worker
 * Processes audit jobs to crawl and analyze sites
 */

import { auditQueue, type Job } from "../index";
import { db } from "../../db";
import { audits } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createCrawler, analyzeAuditResults } from "../../audit";

// Worker configuration
const WORKER_CONFIG = {
  maxJobsPerRun: 5,
  defaultTimeout: 300000, // 5 minutes
  defaultMaxPages: 50,
};

// Job result type
interface AuditJobResult {
  success: boolean;
  pagesAnalyzed: number;
  issuesFound: number;
  overallScore: number;
  errors: string[];
  duration: number;
}

/**
 * Process a single audit job
 */
export async function processAuditJob(job: Job): Promise<AuditJobResult> {
  const startTime = Date.now();
  const result: AuditJobResult = {
    success: false,
    pagesAnalyzed: 0,
    issuesFound: 0,
    overallScore: 0,
    errors: [],
    duration: 0,
  };

  try {
    const { brandId, url, depth, maxPages } = job.payload as {
      brandId: string;
      url: string;
      depth?: number;
      maxPages?: number;
    };

    // Update audit status
    const existingAudit = await db.query.audits.findFirst({
      where: eq(audits.brandId, brandId),
      orderBy: (audits, { desc }) => [desc(audits.createdAt)],
    });

    if (existingAudit) {
      await db
        .update(audits)
        .set({
          status: "in_progress",
          startedAt: new Date(),
        })
        .where(eq(audits.id, existingAudit.id));
    }

    // Create crawler
    const depthSetting =
      depth === 3 ? "full" : depth === 2 ? "section" : "single";
    const crawler = createCrawler(url, {
      depth: depthSetting,
      maxPages: maxPages ?? WORKER_CONFIG.defaultMaxPages,
      timeout: WORKER_CONFIG.defaultTimeout,
    });

    // Run crawl
    const crawlResult = await crawler.crawl();
    result.pagesAnalyzed = crawlResult.pages.length;

    if (!crawlResult.success) {
      result.errors.push(
        ...crawlResult.errors.map((e) => `${e.url}: ${e.error}`)
      );
    }

    // Analyze results
    const analysis = analyzeAuditResults(crawlResult);
    result.overallScore = analysis.readability.overall;
    result.issuesFound = analysis.issues.length;

    // Update audit in database
    if (existingAudit) {
      await db
        .update(audits)
        .set({
          status: crawlResult.success ? "completed" : "failed",
          completedAt: new Date(),
          overallScore: analysis.readability.overall,
          categoryScores: [
            {
              category: "structure",
              score: analysis.readability.breakdown.structure.score,
              maxScore: analysis.readability.breakdown.structure.maxScore,
              issues: analysis.issues.filter((i) => i.category === "structure")
                .length,
            },
            {
              category: "schema",
              score: analysis.readability.breakdown.schema.score,
              maxScore: analysis.readability.breakdown.schema.maxScore,
              issues: analysis.issues.filter((i) => i.category === "schema")
                .length,
            },
            {
              category: "clarity",
              score: analysis.readability.breakdown.clarity.score,
              maxScore: analysis.readability.breakdown.clarity.maxScore,
              issues: analysis.issues.filter((i) => i.category === "content")
                .length,
            },
            {
              category: "metadata",
              score: analysis.readability.breakdown.metadata.score,
              maxScore: analysis.readability.breakdown.metadata.maxScore,
              issues: analysis.issues.filter((i) => i.category === "meta")
                .length,
            },
            {
              category: "accessibility",
              score: analysis.readability.breakdown.accessibility.score,
              maxScore: analysis.readability.breakdown.accessibility.maxScore,
              issues: analysis.issues.filter(
                (i) => i.category === "images" || i.category === "links"
              ).length,
            },
          ],
          issues: analysis.issues.map((issue) => ({
            id: issue.id,
            category: issue.category,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            element: issue.element,
            recommendation: issue.recommendation,
            impact: issue.impact.description,
          })),
          issueCount: analysis.issues.length,
          criticalCount: analysis.summary.criticalCount,
          highCount: analysis.summary.highCount,
          mediumCount: analysis.summary.mediumCount,
          lowCount: analysis.summary.lowCount,
          recommendations: analysis.recommendations,
          metadata: {
            timing: {
              totalDuration: Date.now() - startTime,
              fetchTime: crawlResult.duration,
              analysisTime: Date.now() - startTime - crawlResult.duration,
            },
            pagesAnalyzed: crawlResult.pages.length,
            grade: analysis.readability.grade,
          },
          errorMessage:
            result.errors.length > 0 ? result.errors.join("; ") : null,
        })
        .where(eq(audits.id, existingAudit.id));
    }

    result.success = crawlResult.success;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : String(error)
    );
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run the audit worker (processes pending jobs)
 * This is called by cron endpoint
 */
export async function runAuditWorker(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ jobId: string; result: AuditJobResult }>;
}> {
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    results: [] as Array<{ jobId: string; result: AuditJobResult }>,
  };

  // Clean stale jobs first
  await auditQueue.cleanStaleJobs();

  // Process up to maxJobsPerRun jobs
  for (let i = 0; i < WORKER_CONFIG.maxJobsPerRun; i++) {
    const job = await auditQueue.getNextJob();

    if (!job) {
      break; // No more jobs
    }

    stats.processed++;

    try {
      const result = await processAuditJob(job);
      stats.results.push({ jobId: job.id, result });

      if (result.success) {
        await auditQueue.completeJob(job.id, result);
        stats.succeeded++;
      } else {
        await auditQueue.failJob(job.id, result.errors.join("; "));
        stats.failed++;
      }
    } catch (error) {
      await auditQueue.failJob(
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
export async function getAuditWorkerStatus(): Promise<{
  queueStats: Awaited<ReturnType<typeof auditQueue.getStats>>;
  recentJobs: Job[];
  config: typeof WORKER_CONFIG;
}> {
  const [queueStats, recentJobs] = await Promise.all([
    auditQueue.getStats(),
    auditQueue.getJobs("completed", 5),
  ]);

  return {
    queueStats,
    recentJobs,
    config: WORKER_CONFIG,
  };
}
