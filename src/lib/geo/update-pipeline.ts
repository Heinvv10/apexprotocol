/**
 * GEO Auto-Update Pipeline
 *
 * Weekly automated pipeline that:
 * 1. Collects citation patterns from all Apex users
 * 2. Analyzes platform behavior changes
 * 3. Updates best practices and schema templates
 * 4. Generates alerts for affected users
 * 5. Logs all updates for audit trail
 */

import { db } from "@/lib/db";
import {
  geoBestPractices,
  schemaTemplates,
  platformChanges,
  updateLog,
} from "@/lib/db/schema/geo-knowledge-base";
import { eq, desc, sql, gte } from "drizzle-orm";
import {
  runFullPlatformAnalysis,
  processAndRecordSignals,
  MONITORED_PLATFORMS,
  type PlatformBehaviorSignal,
} from "./platform-monitor";
import {
  getActiveBestPractices,
  deprecateBestPractice,
  updateBestPractice,
  logKnowledgeBaseUpdate,
} from "./knowledge-base";
import { generateAlertsFromSignals } from "./alert-generator";

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineResult {
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  phases: {
    collection: PhaseResult;
    analysis: PhaseResult;
    update: PhaseResult;
    alerting: PhaseResult;
  };
  summary: {
    platformsAnalyzed: number;
    signalsDetected: number;
    changesRecorded: number;
    practicesUpdated: number;
    practicesDeprecated: number;
    alertsSent: number;
    errors: string[];
  };
}

export interface PhaseResult {
  success: boolean;
  duration: number; // milliseconds
  details: Record<string, unknown>;
  errors: string[];
}

export interface UpdateConfig {
  dryRun?: boolean; // If true, don't actually make changes
  platforms?: string[]; // Specific platforms to analyze
  skipAlerts?: boolean; // Skip alert generation
  deprecationThreshold?: number; // Impact score below which to deprecate
}

// ============================================================================
// PIPELINE PHASES
// ============================================================================

/**
 * Phase 1: Collect data from all sources
 */
async function runCollectionPhase(): Promise<PhaseResult> {
  const start = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    // Get current best practices count
    const practices = await getActiveBestPractices();
    details.currentPractices = practices.length;

    // Get recent platform changes count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentChanges = await db
      .select({ count: sql<number>`count(*)` })
      .from(platformChanges)
      .where(gte(platformChanges.changeDetected, thirtyDaysAgo));
    details.recentChanges = Number(recentChanges[0]?.count || 0);

    // Get schema templates count
    const templates = await db
      .select({ count: sql<number>`count(*)` })
      .from(schemaTemplates)
      .where(eq(schemaTemplates.isCurrent, true));
    details.activeTemplates = Number(templates[0]?.count || 0);

    return {
      success: true,
      duration: Date.now() - start,
      details,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Collection phase failed");
    return {
      success: false,
      duration: Date.now() - start,
      details,
      errors,
    };
  }
}

/**
 * Phase 2: Analyze platform behavior
 */
async function runAnalysisPhase(): Promise<PhaseResult & { signals: PlatformBehaviorSignal[] }> {
  const start = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};
  let signals: PlatformBehaviorSignal[] = [];

  try {
    const analysis = await runFullPlatformAnalysis();
    signals = analysis.signals;
    details.platformMetrics = analysis.platformMetrics;
    details.signalsDetected = analysis.summary.totalSignals;
    details.criticalSignals = analysis.summary.criticalSignals;
    details.platformsAnalyzed = analysis.summary.platformsAnalyzed;

    return {
      success: true,
      duration: Date.now() - start,
      details,
      errors,
      signals,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Analysis phase failed");
    return {
      success: false,
      duration: Date.now() - start,
      details,
      errors,
      signals,
    };
  }
}

/**
 * Phase 3: Update knowledge base
 */
async function runUpdatePhase(
  signals: PlatformBehaviorSignal[],
  config: UpdateConfig
): Promise<PhaseResult> {
  const start = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {
    practicesUpdated: 0,
    practicesDeprecated: 0,
    changesRecorded: 0,
  };

  if (config.dryRun) {
    details.dryRun = true;
    return {
      success: true,
      duration: Date.now() - start,
      details,
      errors,
    };
  }

  try {
    // Record detected signals as platform changes
    const recordResult = await processAndRecordSignals(signals);
    details.changesRecorded = recordResult.recorded;

    // Check for practices that need deprecation (low impact after analysis)
    const deprecationThreshold = config.deprecationThreshold || 3;
    const practices = await getActiveBestPractices();

    let deprecatedCount = 0;
    for (const practice of practices) {
      // Check if any signal indicates this practice is no longer effective
      const relatedSignals = signals.filter(
        (s) =>
          s.platform === practice.platform &&
          s.changeType === "content_preference" &&
          s.metrics.percentChange < -30
      );

      if (relatedSignals.length > 0 && practice.impactScore <= deprecationThreshold) {
        await deprecateBestPractice(
          practice.id,
          `Platform behavior change detected: ${relatedSignals[0].details}`
        );
        deprecatedCount++;
      }
    }
    details.practicesDeprecated = deprecatedCount;

    // Update practices based on positive signals
    let updatedCount = 0;
    for (const signal of signals) {
      if (signal.metrics.percentChange > 20 && signal.confidence >= 75) {
        const affectedPractices = practices.filter(
          (p) => p.platform === signal.platform
        );
        for (const practice of affectedPractices) {
          // Increase impact score for practices on platforms showing growth
          const newImpactScore = Math.min(10, practice.impactScore + 1);
          if (newImpactScore !== practice.impactScore) {
            await updateBestPractice(practice.id, { impactScore: newImpactScore });
            updatedCount++;
          }
        }
      }
    }
    details.practicesUpdated = updatedCount;

    return {
      success: true,
      duration: Date.now() - start,
      details,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Update phase failed");
    return {
      success: false,
      duration: Date.now() - start,
      details,
      errors,
    };
  }
}

/**
 * Phase 4: Generate alerts
 */
async function runAlertingPhase(
  signals: PlatformBehaviorSignal[],
  config: UpdateConfig
): Promise<PhaseResult> {
  const start = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = { alertsSent: 0 };

  if (config.skipAlerts || config.dryRun) {
    details.skipped = true;
    return {
      success: true,
      duration: Date.now() - start,
      details,
      errors,
    };
  }

  try {
    const alertResult = await generateAlertsFromSignals(signals);
    details.alertsSent = alertResult.created;
    details.alertErrors = alertResult.errors;

    return {
      success: alertResult.errors === 0,
      duration: Date.now() - start,
      details,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Alerting phase failed");
    return {
      success: false,
      duration: Date.now() - start,
      details,
      errors,
    };
  }
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the full auto-update pipeline
 */
export async function runUpdatePipeline(
  config: UpdateConfig = {}
): Promise<PipelineResult> {
  const startedAt = new Date();
  const allErrors: string[] = [];

  // Phase 1: Collection
  const collectionResult = await runCollectionPhase();
  allErrors.push(...collectionResult.errors);

  // Phase 2: Analysis
  const analysisResult = await runAnalysisPhase();
  allErrors.push(...analysisResult.errors);

  // Phase 3: Update
  const updateResult = await runUpdatePhase(analysisResult.signals, config);
  allErrors.push(...updateResult.errors);

  // Phase 4: Alerting
  const alertingResult = await runAlertingPhase(analysisResult.signals, config);
  allErrors.push(...alertingResult.errors);

  const completedAt = new Date();

  // Log pipeline run
  await logKnowledgeBaseUpdate({
    updateType: "pipeline_run",
    description: `Auto-update pipeline completed. Analyzed ${analysisResult.details.platformsAnalyzed} platforms, detected ${analysisResult.details.signalsDetected} signals.`,
    itemsAdded: Number(updateResult.details.changesRecorded || 0),
    itemsUpdated: Number(updateResult.details.practicesUpdated || 0),
    itemsDeprecated: Number(updateResult.details.practicesDeprecated || 0),
    affectedPlatforms: MONITORED_PLATFORMS.slice(),
    dataSource: "auto_pipeline",
    success: allErrors.length === 0,
    errorMessage: allErrors.length > 0 ? allErrors.join("; ") : undefined,
  });

  return {
    success: allErrors.length === 0,
    startedAt,
    completedAt,
    phases: {
      collection: collectionResult,
      analysis: analysisResult,
      update: updateResult,
      alerting: alertingResult,
    },
    summary: {
      platformsAnalyzed: Number(analysisResult.details.platformsAnalyzed || 0),
      signalsDetected: Number(analysisResult.details.signalsDetected || 0),
      changesRecorded: Number(updateResult.details.changesRecorded || 0),
      practicesUpdated: Number(updateResult.details.practicesUpdated || 0),
      practicesDeprecated: Number(updateResult.details.practicesDeprecated || 0),
      alertsSent: Number(alertingResult.details.alertsSent || 0),
      errors: allErrors,
    },
  };
}

/**
 * Get pipeline run history
 */
export async function getPipelineHistory(limit: number = 10) {
  return db
    .select()
    .from(updateLog)
    .where(eq(updateLog.updateType, "pipeline_run"))
    .orderBy(desc(updateLog.createdAt))
    .limit(limit);
}

/**
 * Get last successful pipeline run
 */
export async function getLastSuccessfulRun() {
  const results = await db
    .select()
    .from(updateLog)
    .where(
      sql`${updateLog.updateType} = 'pipeline_run' AND ${updateLog.success} = true`
    )
    .orderBy(desc(updateLog.createdAt))
    .limit(1);
  return results[0] || null;
}
