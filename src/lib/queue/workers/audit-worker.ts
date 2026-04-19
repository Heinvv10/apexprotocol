/**
 * Audit Background Job Worker
 * Processes audit jobs to crawl and analyze sites
 */

import { auditQueue, type Job } from "../index";
import { db } from "../../db";
import { audits, brands } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createCrawler, analyzeAuditResults } from "../../audit";
import { scoreAudit } from "../../audit/scoring";
import {
  checkAiCrawlers,
  checkEntityAuthority,
  checkContentChunking,
  checkPageSpeed,
} from "../../audit/checks";
import type { AuditIssue, AuditMetadata } from "../../db/schema/audits";
import {
  persistRecommendationsFromIssues,
  computeAiReadinessScore,
} from "./audit-postprocess";

// Worker configuration
const WORKER_CONFIG = {
  maxJobsPerRun: 5,
  defaultTimeout: 300000, // 5 minutes
  defaultMaxPages: 50,
};

function gradeForScore(score: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

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

    // Analyze results — issue detection + category baselines (legacy path).
    const analysis = analyzeAuditResults(crawlResult);

    // Signal-grounded scoring — replaces the old `75 − issues × 10` style
    // formulas. Each category score derives from extracted page signals
    // (H1 count, schema types, title length, alt ratio, etc.) with an
    // evidence trail persisted alongside the score. See src/lib/audit/scoring.ts.
    const scored = scoreAudit(crawlResult.pages);

    // Run additional GEO/AEO checks in parallel
    // Get brand name for entity authority check
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    // Wrap external checks in safe fallbacks to prevent crashes on timeout/network errors
    const safeCheck = async (fn: () => Promise<unknown>, fallback: unknown): Promise<unknown> => {
      try { return await fn(); } catch (e) { console.error('[Audit] Check failed:', e instanceof Error ? e.message : String(e)); return fallback; }
    };
    const [aiCrawlerIssues, entityIssues, chunkingResult, pageSpeedResult] = await Promise.all([
      safeCheck(() => checkAiCrawlers(url), []),
      brand ? safeCheck(() => checkEntityAuthority(brand.name, brand.domain || undefined), []) : Promise.resolve([]),
      safeCheck(() => checkContentChunking(url), { issues: [], score: 0 }),
      safeCheck(() => checkPageSpeed(url), null),
    ]);

    // Merge all issues
    const allIssues: AuditIssue[] = [
      ...analysis.issues.map((issue) => ({
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        impact: issue.impact.description,
      })),
      ...(aiCrawlerIssues as AuditIssue[]),
      ...(entityIssues as AuditIssue[]),
      ...((chunkingResult as Record<string, unknown>).issues as AuditIssue[] ?? []),
    ];

    result.overallScore = scored.overall;
    result.issuesFound = allIssues.length;

    // Update audit in database
    if (existingAudit) {
      // Prefer signal-grounded scores. Keep the same shape the UI expects
      // (category/score/maxScore/issues) so /dashboard/audit/results renders
      // unchanged.
      const finalCategoryScores = (
        ["structure", "schema", "clarity", "metadata", "accessibility"] as const
      ).map((key) => ({
        category: key,
        score: scored.categoryScores[key],
        maxScore: 100,
        issues: analysis.issues.filter((i) => {
          if (key === "clarity") return i.category === "content";
          return i.category === key;
        }).length,
      }));

      // Compute AI-readiness score from the category scores the engine
      // just produced. This gives AIReadinessDeepDive real data instead
      // of the phantom metadata.aiReadiness.score that never existed.
      const aiReadiness = computeAiReadinessScore({
        categoryScores: finalCategoryScores,
      });

      // Performance metrics come from Google PageSpeed Insights when
      // the safeCheck above succeeded. When PSI is unreachable or rate-
      // limited, performance stays undefined and PerformanceDeepDive
      // renders an honest "not captured" empty state rather than the
      // fabricated defaults it used to fall back to.
      const performance = pageSpeedResult as
        | {
            firstContentfulPaint: number;
            largestContentfulPaint: number;
            totalBlockingTime: number;
            cumulativeLayoutShift: number;
            speedIndex: number;
            responseTime?: number;
          }
        | null;

      const finalMetadata = {
        timing: {
          totalDuration: Date.now() - startTime,
          fetchTime: crawlResult.duration,
          analysisTime: Date.now() - startTime - crawlResult.duration,
        },
        pagesAnalyzed: crawlResult.pages.length,
        grade: gradeForScore(scored.overall),
        contentChunkingScore: (chunkingResult as Record<string, unknown>).score,
        contentChunkingBreakdown: (chunkingResult as Record<string, unknown>).breakdown,
        contentAnalysis: analysis.contentAnalysis,
        aiReadiness,
        // Signal-grounded audit scoring: weighted decomposition + the raw
        // evidence trail per category. The /api/admin/audit-debug/[id]
        // route (Phase D) reads this to show "why this score?".
        scoring: {
          decomposition: scored.decomposition,
          evidence: scored.evidence,
        },
        ...(performance ? { performance } : {}),
      } as AuditMetadata;

      await db
        .update(audits)
        .set({
          status: crawlResult.success ? "completed" : "failed",
          completedAt: new Date(),
          overallScore: scored.overall,
          categoryScores: finalCategoryScores,
          issues: allIssues,
          issueCount: allIssues.length,
          criticalCount: allIssues.filter((i) => i.severity === "critical").length,
          highCount: allIssues.filter((i) => i.severity === "high").length,
          mediumCount: allIssues.filter((i) => i.severity === "medium").length,
          lowCount: allIssues.filter((i) => i.severity === "low").length,
          recommendations: analysis.recommendations,
          metadata: finalMetadata,
          errorMessage:
            result.errors.length > 0 ? result.errors.join("; ") : null,
        })
        .where(eq(audits.id, existingAudit.id));

      // Persist each detected issue as a tracked recommendation row so
      // /dashboard/recommendations stops showing "No recommendations yet"
      // for a brand that's actually had an audit run against it.
      if (crawlResult.success && allIssues.length > 0) {
        try {
          await persistRecommendationsFromIssues({
            auditId: existingAudit.id,
            brandId: existingAudit.brandId,
            issues: allIssues,
          });
        } catch (err) {
          // Don't fail the audit if recommendation persistence has a
          // hiccup (FK race, schema drift). Audit completes; the
          // recommendations backfill can be re-run separately.
          console.error(
            "[audit-worker] failed to persist recommendations:",
            err
          );
        }
      }
    }

    result.success = crawlResult.success;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? (error as Error).message : String(error)
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
        error instanceof Error ? (error as Error).message : String(error)
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
