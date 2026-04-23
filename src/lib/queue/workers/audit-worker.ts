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
import type { AuditIssue, AuditMetadata, AuditStage } from "../../db/schema/audits";
import {
  persistRecommendationsFromIssues,
  computeAiReadinessScore,
} from "./audit-postprocess";
import { computeGeoScore } from "@/lib/analytics/geo-score-compute";
import { generateAndPersistRecommendationsForBrand } from "@/lib/recommendations/generate-for-brand";
import { buildActionPlan } from "@/lib/recommendations/action-plan";
import { projectExpectedImpact } from "@/lib/audit/expected-impact";
import { brandMentions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Worker configuration
const WORKER_CONFIG = {
  maxJobsPerRun: 5,
  defaultTimeout: 300000, // 5 minutes
  defaultMaxPages: 50,
};

// Stage → target % mapping. Lets the UI render a determinate bar even
// though each stage internally is black-box work. Numbers are calibrated
// against the average wall-clock time each phase takes on a 50-page
// crawl; they're guidance, not a guarantee.
const STAGE_PERCENT: Record<AuditStage, number> = {
  queued: 5,
  crawling: 25,
  analyzing: 50,
  checks: 65,
  scoring: 80,
  persisting: 90,
  finalizing: 95,
  completed: 100,
  failed: 100,
  cancelled: 100,
};

/**
 * Patch the audit's metadata.progress in place. Merges with existing
 * metadata so we don't clobber `depth`, `options`, `priority` set at
 * creation time. Errors are swallowed — progress telemetry must never
 * take down the audit.
 */
async function updateAuditProgress(
  auditId: string,
  stage: AuditStage,
  message?: string,
  extra?: { pagesCrawled?: number; totalPages?: number; currentUrl?: string },
): Promise<void> {
  try {
    const row = await db.query.audits.findFirst({
      where: eq(audits.id, auditId),
      columns: { metadata: true },
    });
    const existing = (row?.metadata ?? {}) as AuditMetadata;
    const next: AuditMetadata = {
      ...existing,
      progress: {
        stage,
        percent: STAGE_PERCENT[stage],
        message,
        pagesCrawled: extra?.pagesCrawled,
        totalPages: extra?.totalPages,
        currentUrl: extra?.currentUrl,
        updatedAt: new Date().toISOString(),
      },
    };
    await db
      .update(audits)
      .set({ metadata: next })
      .where(eq(audits.id, auditId));
  } catch (err) {
    logger.warn("[audit-worker] progress update failed", {
      error: err instanceof Error ? err.message : String(err),
      auditId,
      stage,
    });
  }
}

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
    const { brandId, url, depth, maxPages, auditId } = job.payload as {
      brandId: string;
      url: string;
      depth?: number;
      maxPages?: number;
      auditId?: string;
    };

    // Prefer the exact auditId from the job payload; fall back to
    // "most recent audit for this brand" for older queued jobs that
    // predate the auditId plumbing (pre-2026-04-23).
    const existingAudit = auditId
      ? await db.query.audits.findFirst({ where: eq(audits.id, auditId) })
      : await db.query.audits.findFirst({
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

      await updateAuditProgress(
        existingAudit.id,
        "crawling",
        depth === 3
          ? `Crawling up to ${maxPages ?? WORKER_CONFIG.defaultMaxPages} pages…`
          : depth === 2
            ? "Crawling site section…"
            : "Fetching page…",
        { totalPages: maxPages ?? WORKER_CONFIG.defaultMaxPages, currentUrl: url },
      );
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

    if (existingAudit) {
      await updateAuditProgress(
        existingAudit.id,
        "analyzing",
        `Analyzing ${crawlResult.pages.length} page${crawlResult.pages.length === 1 ? "" : "s"}…`,
        { pagesCrawled: crawlResult.pages.length, totalPages: crawlResult.pages.length },
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

    if (existingAudit) {
      await updateAuditProgress(
        existingAudit.id,
        "checks",
        "Running AI readiness checks…",
        { pagesCrawled: crawlResult.pages.length },
      );
    }

    // Wrap external checks in safe fallbacks to prevent crashes on timeout/network errors.
    // Failures are surfaced to Sentry + the structured logger with the check label so
    // operators can see when an audit silently skipped a signal (previously these were
    // only console.error'd, easy to miss in prod).
    const Sentry = await import("@sentry/nextjs").catch(() => null);
    const safeCheck = async <T>(
      label: string,
      fn: () => Promise<T>,
      fallback: T,
    ): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        logger.error(`[audit-worker] ${label} failed`, {
          error: err instanceof Error ? err.message : String(err),
          brandId,
          url,
        });
        Sentry?.captureException(err, { tags: { worker: "audit", check: label } });
        return fallback;
      }
    };
    const [aiCrawlerIssues, entityIssues, chunkingResult, pageSpeedResult] = await Promise.all([
      safeCheck("ai-crawlers", () => checkAiCrawlers(url), [] as unknown),
      brand
        ? safeCheck("entity-authority", () => checkEntityAuthority(brand.name, brand.domain || undefined), [] as unknown)
        : Promise.resolve([] as unknown),
      safeCheck("content-chunking", () => checkContentChunking(url), { issues: [], score: 0 } as unknown),
      safeCheck("page-speed", () => checkPageSpeed(url), null as unknown),
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

    if (existingAudit) {
      await updateAuditProgress(
        existingAudit.id,
        "scoring",
        "Computing GEO score…",
        { pagesCrawled: crawlResult.pages.length },
      );
    }

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

      // Synthesise a top-3 action plan. Cross-references the projected
      // score impact of each finding with platform-recognition signals
      // from the monitoring data so the UI can render "do these first"
      // bullets ordered by leverage rather than dropping the user into
      // a flat list.
      const impactMap = projectExpectedImpact({
        issues: allIssues,
        categoryScores: finalCategoryScores,
      });
      const recentMentions = await db
        .select({
          platform: brandMentions.platform,
          sentiment: brandMentions.sentiment,
          position: brandMentions.position,
        })
        .from(brandMentions)
        .where(eq(brandMentions.brandId, brandId))
        .orderBy(desc(brandMentions.timestamp))
        .limit(100);
      const platformGroups = new Map<
        string,
        { total: number; recognised: number; sentiments: string[] }
      >();
      for (const m of recentMentions) {
        const g = platformGroups.get(m.platform) ?? {
          total: 0,
          recognised: 0,
          sentiments: [],
        };
        g.total += 1;
        if (m.position !== null) g.recognised += 1;
        if (m.sentiment) g.sentiments.push(m.sentiment);
        platformGroups.set(m.platform, g);
      }
      const platformSignals = Array.from(platformGroups.entries()).map(
        ([platform, g]) => {
          const neg =
            g.sentiments.filter((s) => s === "negative").length;
          const pos =
            g.sentiments.filter((s) => s === "positive").length;
          const unrec = g.sentiments.filter(
            (s) => s === "unrecognized",
          ).length;
          const dominant: "positive" | "neutral" | "negative" | "unrecognized" =
            unrec > g.total / 3
              ? "unrecognized"
              : neg > pos
                ? "negative"
                : pos > neg
                  ? "positive"
                  : "neutral";
          return {
            platform,
            mentionRate: Math.round((g.recognised / Math.max(g.total, 1)) * 100),
            sentiment: dominant,
          };
        },
      );
      const actionPlan = buildActionPlan({
        issues: allIssues,
        expectedImpactById: impactMap,
        platformSignals,
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
        ...(actionPlan.length > 0
          ? {
              actionPlan: {
                generatedAt: new Date().toISOString(),
                items: actionPlan,
              },
            }
          : {}),
        ...(performance ? { performance } : {}),
        progress: {
          stage: (crawlResult.success ? "completed" : "failed") as AuditStage,
          percent: 100,
          message: crawlResult.success
            ? "Audit complete"
            : "Audit failed — see errors",
          pagesCrawled: crawlResult.pages.length,
          totalPages: crawlResult.pages.length,
          updatedAt: new Date().toISOString(),
        },
      } as AuditMetadata;

      await updateAuditProgress(
        existingAudit.id,
        "persisting",
        "Saving results…",
      );

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
            categoryScores: finalCategoryScores,
          });
        } catch (err) {
          // Don't fail the audit if recommendation persistence has a
          // hiccup (FK race, schema drift). Audit completes; the
          // recommendations backfill can be re-run separately.
          logger.error("[audit-worker] failed to persist recommendations", {
            error: err instanceof Error ? err.message : String(err),
            auditId: existingAudit.id,
            brandId: existingAudit.brandId,
          });
          Sentry?.captureException(err, {
            tags: { worker: "audit", phase: "persist-recommendations" },
          });
        }
      }

      if (crawlResult.success) {
        await updateAuditProgress(
          existingAudit.id,
          "finalizing",
          "Generating recommendations…",
          { pagesCrawled: crawlResult.pages.length },
        );
      }

      // Recompute + persist the brand's GEO score now that the audit's
      // overallScore has updated the technical component. `forceHistory`
      // ensures we always write a history row after an audit so the trend
      // chart reflects audit-driven movement even below the 5-pt change
      // threshold. Notifications still respect the threshold internally.
      if (crawlResult.success) {
        try {
          await computeGeoScore(existingAudit.brandId, { forceHistory: true });
        } catch (err) {
          logger.error("[audit-worker] GEO score recompute failed", {
            error: err instanceof Error ? err.message : String(err),
            brandId: existingAudit.brandId,
          });
          Sentry?.captureException(err, {
            tags: { worker: "audit", phase: "geo-score-recompute" },
          });
        }
      }

      // Auto-invoke the AI recommendation generator once the audit is in
      // the DB. The rule-based persistRecommendationsFromIssues() call
      // above already wrote flat issue→rec rows; this pass layers AI
      // recommendations that include `steps`, cross-reference
      // brand_mentions, and use Claude to synthesise actions beyond
      // per-finding boilerplate. Dedup by (brandId, title, category)
      // prevents collisions. Gated by APEX_AUTO_AI_RECS=false to opt
      // out (defaults on); also no-ops cleanly if ANTHROPIC_API_KEY is
      // missing because generateAIRecommendations returns a structured
      // error we log and move past.
      if (
        crawlResult.success &&
        process.env.APEX_AUTO_AI_RECS !== "false"
      ) {
        try {
          const aiResult = await generateAndPersistRecommendationsForBrand(
            existingAudit.brandId,
          );
          if (!aiResult.success && aiResult.error) {
            logger.warn("[audit-worker] AI rec generator returned error", {
              brandId: existingAudit.brandId,
              error: aiResult.error,
            });
          } else {
            logger.info("[audit-worker] AI recs persisted", {
              brandId: existingAudit.brandId,
              persisted: aiResult.persisted,
              duplicatesSkipped: aiResult.duplicatesSkipped,
            });
          }
        } catch (err) {
          logger.error("[audit-worker] AI rec generation failed", {
            error: err instanceof Error ? err.message : String(err),
            brandId: existingAudit.brandId,
          });
          Sentry?.captureException(err, {
            tags: { worker: "audit", phase: "ai-recommendations" },
          });
        }
      }

      await updateAuditProgress(
        existingAudit.id,
        crawlResult.success ? "completed" : "failed",
        crawlResult.success
          ? `Audit complete — ${allIssues.length} issue${allIssues.length === 1 ? "" : "s"} found`
          : result.errors[0] || "Audit failed",
        { pagesCrawled: crawlResult.pages.length, totalPages: crawlResult.pages.length },
      );
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
