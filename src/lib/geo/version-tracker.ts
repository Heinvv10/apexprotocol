/**
 * Version Tracker for GEO Deliverables
 *
 * PRD: PRD-001 - User Deliverables & Dynamic Adaptability System
 *
 * Tracks versioned snapshots of action plans and other deliverables.
 * Enables "what changed" comparisons between versions.
 */

import { db } from "@/lib/db";
import {
  actionPlanVersions,
  type ActionSnapshot,
  type VersionChanges,
  type ImplementationStep,
  type PlatformRelevance,
} from "@/lib/db/schema/geo-knowledge-base";
import { eq, desc, and } from "drizzle-orm";
import type { EnrichedRecommendation } from "@/lib/ai/step-generator";

// ============================================================================
// Types
// ============================================================================

export interface ActionPlanVersion {
  id: string;
  brandId: string;
  versionNumber: number;
  knowledgeBaseVersion: string;
  generatedAt: Date;
  actionsSnapshot: ActionSnapshot[];
  changesFromPrevious?: VersionChanges | null;
  downloadedAt?: Date | null;
  downloadedBy?: string | null;
}

export interface VersionDiff {
  currentVersion: number;
  previousVersion: number;
  changes: VersionChanges;
  summary: string;
}

export interface CreateVersionInput {
  brandId: string;
  actions: EnrichedRecommendation[];
  knowledgeBaseVersion?: string;
}

// ============================================================================
// Knowledge Base Version Generator
// ============================================================================

/**
 * Generate a knowledge base version string based on current date
 * Format: YYYY.MM.n where n is incremented based on updates that month
 */
export function generateKnowledgeBaseVersion(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  // For now, use day as the revision number within the month
  const revision = now.getDate();
  return `${year}.${month}.${revision}`;
}

// ============================================================================
// Version Creation
// ============================================================================

/**
 * Create a new version of the action plan for a brand
 */
export async function createActionPlanVersion(
  input: CreateVersionInput
): Promise<ActionPlanVersion> {
  const { brandId, actions, knowledgeBaseVersion } = input;

  // Get the latest version number for this brand
  const latestVersion = await getLatestVersion(brandId);
  const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  // Convert enriched recommendations to action snapshots
  const actionsSnapshot: ActionSnapshot[] = actions.map((action) =>
    enrichedToSnapshot(action)
  );

  // Calculate changes from previous version
  let changesFromPrevious: VersionChanges | undefined;
  if (latestVersion) {
    changesFromPrevious = calculateChanges(
      latestVersion.actionsSnapshot,
      actionsSnapshot
    );
  }

  // Insert new version
  const [newVersion] = await db
    .insert(actionPlanVersions)
    .values({
      brandId,
      versionNumber: newVersionNumber,
      knowledgeBaseVersion: knowledgeBaseVersion || generateKnowledgeBaseVersion(),
      actionsSnapshot,
      changesFromPrevious,
    })
    .returning();

  return {
    ...newVersion,
    actionsSnapshot: newVersion.actionsSnapshot as ActionSnapshot[],
    changesFromPrevious: newVersion.changesFromPrevious as VersionChanges | null,
  };
}

/**
 * Convert EnrichedRecommendation to ActionSnapshot for storage
 */
function enrichedToSnapshot(action: EnrichedRecommendation): ActionSnapshot {
  // Convert platformRelevance to proper type
  const platformRelevance: PlatformRelevance = action.platformRelevance || {};

  return {
    id: action.templateId,
    title: action.title,
    description: action.description,
    category: Object.keys(platformRelevance).join(",") || "general",
    priority: getPriorityLabel(action.priority, action.impact),
    impact: action.impact,
    effort: action.difficulty,
    steps: action.steps || [],
    schemaCode: action.schemaCode,
    platformRelevance,
    expectedScoreImpact: action.expectedScoreImpact || 0,
  };
}

/**
 * Get priority label from numeric priority and impact
 */
function getPriorityLabel(priority: number, impact: string): string {
  if (priority === 1 && impact === "high") return "critical";
  if (priority === 1 || (priority === 2 && impact === "high")) return "high";
  if (priority === 2) return "medium";
  return "low";
}

// ============================================================================
// Version Retrieval
// ============================================================================

/**
 * Get the latest action plan version for a brand
 */
export async function getLatestVersion(
  brandId: string
): Promise<ActionPlanVersion | null> {
  const [version] = await db
    .select()
    .from(actionPlanVersions)
    .where(eq(actionPlanVersions.brandId, brandId))
    .orderBy(desc(actionPlanVersions.versionNumber))
    .limit(1);

  if (!version) return null;

  return {
    ...version,
    actionsSnapshot: version.actionsSnapshot as ActionSnapshot[],
    changesFromPrevious: version.changesFromPrevious as VersionChanges | null,
  };
}

/**
 * Get a specific version by version number
 */
export async function getVersion(
  brandId: string,
  versionNumber: number
): Promise<ActionPlanVersion | null> {
  const [version] = await db
    .select()
    .from(actionPlanVersions)
    .where(
      and(
        eq(actionPlanVersions.brandId, brandId),
        eq(actionPlanVersions.versionNumber, versionNumber)
      )
    )
    .limit(1);

  if (!version) return null;

  return {
    ...version,
    actionsSnapshot: version.actionsSnapshot as ActionSnapshot[],
    changesFromPrevious: version.changesFromPrevious as VersionChanges | null,
  };
}

/**
 * Get version history for a brand (most recent first)
 */
export async function getVersionHistory(
  brandId: string,
  limit = 10
): Promise<ActionPlanVersion[]> {
  const versions = await db
    .select()
    .from(actionPlanVersions)
    .where(eq(actionPlanVersions.brandId, brandId))
    .orderBy(desc(actionPlanVersions.versionNumber))
    .limit(limit);

  return versions.map((version) => ({
    ...version,
    actionsSnapshot: version.actionsSnapshot as ActionSnapshot[],
    changesFromPrevious: version.changesFromPrevious as VersionChanges | null,
  }));
}

// ============================================================================
// Version Comparison
// ============================================================================

/**
 * Calculate changes between two snapshots
 */
export function calculateChanges(
  previous: ActionSnapshot[],
  current: ActionSnapshot[]
): VersionChanges {
  const previousIds = new Set(previous.map((a) => a.id));
  const currentIds = new Set(current.map((a) => a.id));

  // Find added actions
  const addedActions = current
    .filter((a) => !previousIds.has(a.id))
    .map((a) => a.id);

  // Find removed actions
  const removedActions = previous
    .filter((a) => !currentIds.has(a.id))
    .map((a) => a.id);

  // Find modified actions
  const modifiedActions: VersionChanges["modifiedActions"] = [];

  for (const currentAction of current) {
    const prev = previous.find((p) => p.id === currentAction.id);
    if (!prev) continue;

    const changes: string[] = [];

    if (prev.title !== currentAction.title) {
      changes.push(`Title changed from "${prev.title}" to "${currentAction.title}"`);
    }
    if (prev.description !== currentAction.description) {
      changes.push("Description updated");
    }
    if (prev.priority !== currentAction.priority) {
      changes.push(`Priority changed from ${prev.priority} to ${currentAction.priority}`);
    }
    if (prev.impact !== currentAction.impact) {
      changes.push(`Impact changed from ${prev.impact} to ${currentAction.impact}`);
    }
    if (prev.effort !== currentAction.effort) {
      changes.push(`Effort changed from ${prev.effort} to ${currentAction.effort}`);
    }
    if ((prev.steps?.length || 0) !== (currentAction.steps?.length || 0)) {
      changes.push(`Steps updated (${prev.steps?.length || 0} → ${currentAction.steps?.length || 0})`);
    }
    if (!!prev.schemaCode !== !!currentAction.schemaCode) {
      changes.push(currentAction.schemaCode ? "Schema code added" : "Schema code removed");
    }

    if (changes.length > 0) {
      modifiedActions.push({
        actionId: currentAction.id,
        changes,
      });
    }
  }

  // Generate summary
  const summaryParts: string[] = [];
  if (addedActions.length > 0) {
    summaryParts.push(`${addedActions.length} new action(s)`);
  }
  if (removedActions.length > 0) {
    summaryParts.push(`${removedActions.length} removed`);
  }
  if (modifiedActions.length > 0) {
    summaryParts.push(`${modifiedActions.length} modified`);
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(", ") : "No changes";

  return {
    addedActions,
    removedActions,
    modifiedActions,
    summary,
  };
}

/**
 * Compare two versions and get a detailed diff
 */
export async function compareVersions(
  brandId: string,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiff | null> {
  const [from, to] = await Promise.all([
    getVersion(brandId, fromVersion),
    getVersion(brandId, toVersion),
  ]);

  if (!from || !to) return null;

  const changes = calculateChanges(from.actionsSnapshot, to.actionsSnapshot);

  return {
    currentVersion: toVersion,
    previousVersion: fromVersion,
    changes,
    summary: changes.summary,
  };
}

/**
 * Generate a human-readable summary of changes
 */
export function generateDiffSummary(changes: VersionChanges): string {
  return changes.summary;
}

// ============================================================================
// Download Tracking
// ============================================================================

/**
 * Mark a version as downloaded by a user
 */
export async function markVersionDownloaded(
  versionId: string,
  userId: string
): Promise<void> {
  await db
    .update(actionPlanVersions)
    .set({
      downloadedAt: new Date(),
      downloadedBy: userId,
    })
    .where(eq(actionPlanVersions.id, versionId));
}

/**
 * Check if there's a newer version since last download
 */
export async function hasNewerVersion(
  brandId: string
): Promise<{ hasNewer: boolean; latestVersion: number; lastDownloaded?: number }> {
  const versions = await db
    .select()
    .from(actionPlanVersions)
    .where(eq(actionPlanVersions.brandId, brandId))
    .orderBy(desc(actionPlanVersions.versionNumber))
    .limit(10);

  if (versions.length === 0) {
    return { hasNewer: false, latestVersion: 0 };
  }

  const latest = versions[0];
  const lastDownloaded = versions.find((v) => v.downloadedAt)?.versionNumber;

  return {
    hasNewer: lastDownloaded ? latest.versionNumber > lastDownloaded : false,
    latestVersion: latest.versionNumber,
    lastDownloaded,
  };
}

// ============================================================================
// Version Header Generation
// ============================================================================

/**
 * Generate version header for PDF/exports
 */
export function generateVersionHeader(
  version: ActionPlanVersion,
  brandName: string
): string {
  const lines = [
    "═══════════════════════════════════════════════════════════════════",
    `APEX GEO ACTION PLAN v${version.versionNumber}.0`,
    `Brand: ${brandName}`,
    `Generated: ${version.generatedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    `Knowledge Base Version: ${version.knowledgeBaseVersion}`,
  ];

  if (version.changesFromPrevious) {
    const changes = version.changesFromPrevious;
    const changesList: string[] = [];

    if (changes.addedActions.length > 0) {
      changesList.push(`• ${changes.addedActions.length} new action(s) added`);
    }
    if (changes.removedActions.length > 0) {
      changesList.push(`• ${changes.removedActions.length} action(s) removed`);
    }
    if (changes.modifiedActions.length > 0) {
      changesList.push(`• ${changes.modifiedActions.length} action(s) updated`);
    }

    if (changesList.length > 0) {
      lines.push("");
      lines.push(`⚠️ CHANGES SINCE v${version.versionNumber - 1}.0:`);
      lines.push(...changesList);
    }
  }

  lines.push("═══════════════════════════════════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Generate changelog for display
 */
export function generateChangelog(versions: ActionPlanVersion[]): string {
  if (versions.length === 0) return "No version history available.";

  const entries: string[] = [];

  for (const version of versions) {
    const date = version.generatedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    entries.push(`## Version ${version.versionNumber}.0 (${date})`);
    entries.push(`Knowledge Base: ${version.knowledgeBaseVersion}`);
    entries.push(`Actions: ${version.actionsSnapshot.length}`);

    if (version.changesFromPrevious) {
      const changes = version.changesFromPrevious;
      if (changes.addedActions.length > 0) {
        entries.push(`- Added: ${changes.addedActions.join(", ")}`);
      }
      if (changes.removedActions.length > 0) {
        entries.push(`- Removed: ${changes.removedActions.join(", ")}`);
      }
      if (changes.modifiedActions.length > 0) {
        entries.push(`- Modified: ${changes.modifiedActions.map((m) => m.actionId).join(", ")}`);
      }
    }

    entries.push("");
  }

  return entries.join("\n");
}
