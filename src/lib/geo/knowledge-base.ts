/**
 * GEO Knowledge Base Service
 *
 * Living knowledge base for GEO best practices, schema templates,
 * and platform behavior tracking. Auto-updates based on detected changes.
 */

import { db } from "@/lib/db";
import {
  geoBestPractices,
  schemaTemplates,
  platformChanges,
  updateLog,
  type GeoBestPractice,
  type NewGeoBestPractice,
  type SchemaTemplate,
  type NewSchemaTemplate,
  type PlatformChange,
  type NewPlatformChange,
} from "@/lib/db/schema/geo-knowledge-base";
import { eq, and, desc, isNull, gte, sql } from "drizzle-orm";

// ============================================================================
// BEST PRACTICES CRUD
// ============================================================================

/**
 * Get all active best practices (not deprecated)
 */
export async function getActiveBestPractices(
  platform?: string,
  category?: string
): Promise<GeoBestPractice[]> {
  const conditions = [isNull(geoBestPractices.deprecatedAt)];

  if (platform) {
    conditions.push(eq(geoBestPractices.platform, platform));
  }
  if (category) {
    conditions.push(eq(geoBestPractices.category, category));
  }

  return db
    .select()
    .from(geoBestPractices)
    .where(and(...conditions))
    .orderBy(desc(geoBestPractices.impactScore));
}

/**
 * Get best practice by ID
 */
export async function getBestPracticeById(
  id: string
): Promise<GeoBestPractice | null> {
  const results = await db
    .select()
    .from(geoBestPractices)
    .where(eq(geoBestPractices.id, id))
    .limit(1);
  return results[0] || null;
}

/**
 * Create a new best practice
 */
export async function createBestPractice(
  practice: NewGeoBestPractice
): Promise<GeoBestPractice> {
  const results = await db
    .insert(geoBestPractices)
    .values(practice)
    .returning();
  return results[0];
}

/**
 * Update a best practice (creates new version)
 */
export async function updateBestPractice(
  id: string,
  updates: Partial<NewGeoBestPractice>
): Promise<GeoBestPractice> {
  const results = await db
    .update(geoBestPractices)
    .set({
      ...updates,
      version: sql`${geoBestPractices.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(geoBestPractices.id, id))
    .returning();
  return results[0];
}

/**
 * Deprecate a best practice
 */
export async function deprecateBestPractice(
  id: string,
  reason: string
): Promise<GeoBestPractice> {
  const results = await db
    .update(geoBestPractices)
    .set({
      deprecatedAt: new Date(),
      deprecationReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(geoBestPractices.id, id))
    .returning();
  return results[0];
}

/**
 * Get best practices by platform with impact ranking
 */
export async function getBestPracticesByPlatform(
  platform: string
): Promise<GeoBestPractice[]> {
  return db
    .select()
    .from(geoBestPractices)
    .where(
      and(
        eq(geoBestPractices.platform, platform),
        isNull(geoBestPractices.deprecatedAt)
      )
    )
    .orderBy(desc(geoBestPractices.impactScore));
}

/**
 * Get high-impact best practices (score >= 7)
 */
export async function getHighImpactPractices(): Promise<GeoBestPractice[]> {
  return db
    .select()
    .from(geoBestPractices)
    .where(
      and(
        gte(geoBestPractices.impactScore, 7),
        isNull(geoBestPractices.deprecatedAt)
      )
    )
    .orderBy(desc(geoBestPractices.impactScore));
}

// ============================================================================
// SCHEMA TEMPLATES CRUD
// ============================================================================

/**
 * Get all current schema templates
 */
export async function getCurrentSchemaTemplates(): Promise<SchemaTemplate[]> {
  return db
    .select()
    .from(schemaTemplates)
    .where(eq(schemaTemplates.isCurrent, true))
    .orderBy(schemaTemplates.schemaType);
}

/**
 * Get schema template by type
 */
export async function getSchemaTemplateByType(
  schemaType: string
): Promise<SchemaTemplate | null> {
  const results = await db
    .select()
    .from(schemaTemplates)
    .where(
      and(
        eq(schemaTemplates.schemaType, schemaType),
        eq(schemaTemplates.isCurrent, true)
      )
    )
    .limit(1);
  return results[0] || null;
}

/**
 * Create a new schema template
 */
export async function createSchemaTemplate(
  template: NewSchemaTemplate
): Promise<SchemaTemplate> {
  const results = await db
    .insert(schemaTemplates)
    .values(template)
    .returning();
  return results[0];
}

/**
 * Update schema template (creates new version, marks old as superseded)
 */
export async function updateSchemaTemplate(
  schemaType: string,
  newTemplate: Omit<NewSchemaTemplate, "schemaType" | "version" | "isCurrent">
): Promise<SchemaTemplate> {
  // Get current version
  const current = await getSchemaTemplateByType(schemaType);
  const newVersion = current ? current.version + 1 : 1;

  // Mark current as not current
  if (current) {
    await db
      .update(schemaTemplates)
      .set({ isCurrent: false })
      .where(eq(schemaTemplates.id, current.id));
  }

  // Create new version
  const results = await db
    .insert(schemaTemplates)
    .values({
      ...newTemplate,
      schemaType,
      version: newVersion,
      isCurrent: true,
      supersededById: current?.id,
    })
    .returning();

  return results[0];
}

/**
 * Get schema template version history
 */
export async function getSchemaTemplateHistory(
  schemaType: string
): Promise<SchemaTemplate[]> {
  return db
    .select()
    .from(schemaTemplates)
    .where(eq(schemaTemplates.schemaType, schemaType))
    .orderBy(desc(schemaTemplates.version));
}

// ============================================================================
// PLATFORM CHANGES CRUD
// ============================================================================

/**
 * Get recent platform changes
 */
export async function getRecentPlatformChanges(
  platform?: string,
  limit: number = 20
): Promise<PlatformChange[]> {
  const conditions = platform
    ? [eq(platformChanges.platform, platform)]
    : [];

  return db
    .select()
    .from(platformChanges)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(platformChanges.changeDetected))
    .limit(limit);
}

/**
 * Record a new platform change
 */
export async function recordPlatformChange(
  change: NewPlatformChange
): Promise<PlatformChange> {
  const results = await db
    .insert(platformChanges)
    .values(change)
    .returning();
  return results[0];
}

/**
 * Get platform changes by type
 */
export async function getPlatformChangesByType(
  changeType: string
): Promise<PlatformChange[]> {
  return db
    .select()
    .from(platformChanges)
    .where(eq(platformChanges.changeType, changeType))
    .orderBy(desc(platformChanges.changeDetected));
}

/**
 * Get high-confidence platform changes (>= 70% confidence)
 */
export async function getHighConfidenceChanges(): Promise<PlatformChange[]> {
  return db
    .select()
    .from(platformChanges)
    .where(gte(platformChanges.confidenceScore, 70))
    .orderBy(desc(platformChanges.changeDetected));
}

// ============================================================================
// UPDATE LOG CRUD
// ============================================================================

/**
 * Log a knowledge base update
 */
export async function logKnowledgeBaseUpdate(data: {
  updateType: string;
  description: string;
  itemsAdded?: number;
  itemsUpdated?: number;
  itemsDeprecated?: number;
  affectedPlatforms: string[];
  dataSource: string;
  success?: boolean;
  errorMessage?: string;
}) {
  const results = await db
    .insert(updateLog)
    .values({
      updateType: data.updateType,
      description: data.description,
      itemsAdded: data.itemsAdded ?? 0,
      itemsUpdated: data.itemsUpdated ?? 0,
      itemsDeprecated: data.itemsDeprecated ?? 0,
      affectedPlatforms: data.affectedPlatforms,
      dataSource: data.dataSource,
      success: data.success ?? true,
      errorMessage: data.errorMessage,
    })
    .returning();
  return results[0];
}

/**
 * Get recent update logs
 */
export async function getRecentUpdateLogs(limit: number = 20) {
  return db
    .select()
    .from(updateLog)
    .orderBy(desc(updateLog.createdAt))
    .limit(limit);
}

// ============================================================================
// AGGREGATED QUERIES
// ============================================================================

/**
 * Get knowledge base summary statistics
 */
export async function getKnowledgeBaseSummary(): Promise<{
  activePractices: number;
  deprecatedPractices: number;
  schemaTemplates: number;
  recentChanges: number;
  lastUpdated: Date | null;
  platformCoverage: Record<string, number>;
}> {
  // Count active practices
  const activePracticesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(geoBestPractices)
    .where(isNull(geoBestPractices.deprecatedAt));

  // Count deprecated practices
  const deprecatedPracticesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(geoBestPractices)
    .where(sql`${geoBestPractices.deprecatedAt} IS NOT NULL`);

  // Count schema templates
  const templatesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schemaTemplates)
    .where(eq(schemaTemplates.isCurrent, true));

  // Count recent changes (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentChangesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(platformChanges)
    .where(gte(platformChanges.changeDetected, thirtyDaysAgo));

  // Get last update
  const lastUpdateResult = await db
    .select({ createdAt: updateLog.createdAt })
    .from(updateLog)
    .orderBy(desc(updateLog.createdAt))
    .limit(1);

  // Get platform coverage
  const platformCoverageResult = await db
    .select({
      platform: geoBestPractices.platform,
      count: sql<number>`count(*)`,
    })
    .from(geoBestPractices)
    .where(isNull(geoBestPractices.deprecatedAt))
    .groupBy(geoBestPractices.platform);

  const platformCoverage: Record<string, number> = {};
  for (const row of platformCoverageResult) {
    platformCoverage[row.platform] = Number(row.count);
  }

  return {
    activePractices: Number(activePracticesResult[0]?.count || 0),
    deprecatedPractices: Number(deprecatedPracticesResult[0]?.count || 0),
    schemaTemplates: Number(templatesResult[0]?.count || 0),
    recentChanges: Number(recentChangesResult[0]?.count || 0),
    lastUpdated: lastUpdateResult[0]?.createdAt || null,
    platformCoverage,
  };
}

/**
 * Get recommendations affected by recent platform changes
 */
export async function getAffectedRecommendations(
  since: Date
): Promise<{ change: PlatformChange; affectedIds: string[] }[]> {
  const changes = await db
    .select()
    .from(platformChanges)
    .where(gte(platformChanges.changeDetected, since))
    .orderBy(desc(platformChanges.changeDetected));

  return changes.map((change) => ({
    change,
    affectedIds: change.affectedRecommendations || [],
  }));
}
