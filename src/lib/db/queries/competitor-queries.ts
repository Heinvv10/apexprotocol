/**
 * Drizzle query functions for competitor tracking operations
 * Follows patterns from src/lib/db/schema/competitive.ts and src/lib/db/queries/recommendations.ts
 */

import { db } from "@/lib/db";
import {
  competitorSnapshots,
  shareOfVoice,
  competitorMentions,
  serpFeatures,
  competitiveGaps,
  competitiveAlerts,
  discoveredCompetitors,
  type CompetitorSnapshot,
  type NewCompetitorSnapshot,
  type ShareOfVoiceRecord,
  type NewShareOfVoiceRecord,
  type CompetitorMentionRecord,
  type NewCompetitorMentionRecord,
  type SerpFeature,
  type NewSerpFeature,
  type CompetitiveGap,
  type NewCompetitiveGap,
  type CompetitiveAlert,
  type NewCompetitiveAlert,
  type DiscoveredCompetitor,
  type NewDiscoveredCompetitor,
} from "@/lib/db/schema";
import { eq, and, desc, asc, inArray, gte, lte, sql, or, between } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type DiscoveryMethod = "keyword_overlap" | "ai_co_occurrence" | "industry_match" | "search_overlap" | "manual";
export type DiscoveryStatus = "pending" | "confirmed" | "rejected";
export type SerpFeatureType = "featured_snippet" | "people_also_ask" | "ai_overview" | "knowledge_panel" | "local_pack" | "image_pack" | "video_carousel" | "top_stories";
export type FeatureOwner = "self" | "competitor" | "other";

export interface CompetitorSnapshotFilters {
  brandId?: string;
  competitorName?: string;
  competitorDomain?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ShareOfVoiceFilters {
  brandId?: string;
  platform?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CompetitorMentionFilters {
  brandId?: string;
  competitorName?: string;
  platform?: string;
  sentiment?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SerpFeatureFilters {
  brandId?: string;
  keyword?: string;
  featureType?: SerpFeatureType;
  ownedBy?: FeatureOwner;
  competitorName?: string;
  searchEngine?: string;
}

export interface CompetitiveGapFilters {
  brandId?: string;
  gapType?: string;
  competitorName?: string;
  isResolved?: boolean;
}

export interface CompetitiveAlertFilters {
  brandId?: string;
  alertType?: string;
  severity?: string;
  isRead?: boolean;
  isDismissed?: boolean;
  competitorName?: string;
}

export interface DiscoveredCompetitorFilters {
  brandId?: string;
  status?: DiscoveryStatus;
  discoveryMethod?: DiscoveryMethod;
  minConfidenceScore?: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field?: string;
  direction?: "asc" | "desc";
}

export interface TrendDataPoint {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface CompetitorTrendData {
  competitorName: string;
  competitorDomain: string;
  trends: {
    geoScore: TrendDataPoint[];
    aiMentionCount: TrendDataPoint[];
    avgMentionPosition: TrendDataPoint[];
    sentimentScore: TrendDataPoint[];
  };
  latest: CompetitorSnapshot | null;
}

// ============================================================================
// Competitor Snapshots - Create Operations
// ============================================================================

/**
 * Create a single competitor snapshot
 */
export async function createCompetitorSnapshot(
  data: NewCompetitorSnapshot
): Promise<CompetitorSnapshot> {
  const [snapshot] = await db
    .insert(competitorSnapshots)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();

  return snapshot;
}

/**
 * Create multiple competitor snapshots in a batch
 */
export async function createCompetitorSnapshots(
  data: NewCompetitorSnapshot[]
): Promise<CompetitorSnapshot[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    createdAt: now,
  }));

  const snapshots = await db
    .insert(competitorSnapshots)
    .values(valuesWithTimestamps)
    .returning();

  return snapshots;
}

// ============================================================================
// Competitor Snapshots - Read Operations
// ============================================================================

/**
 * Get competitor snapshots with optional filters
 */
export async function getCompetitorSnapshots(
  filters: CompetitorSnapshotFilters = {},
  pagination: PaginationOptions = {},
  sort: SortOptions = {}
): Promise<{ data: CompetitorSnapshot[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;
  const { field = "snapshotDate", direction = "desc" } = sort;

  const conditions = buildCompetitorSnapshotFilterConditions(filters);

  const orderByClause = buildOrderByClause(
    competitorSnapshots,
    field,
    direction
  );

  const data = await db
    .select()
    .from(competitorSnapshots)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(competitorSnapshots)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get the latest snapshot for a specific competitor
 */
export async function getLatestCompetitorSnapshot(
  brandId: string,
  competitorDomain: string
): Promise<CompetitorSnapshot | null> {
  const [snapshot] = await db
    .select()
    .from(competitorSnapshots)
    .where(
      and(
        eq(competitorSnapshots.brandId, brandId),
        eq(competitorSnapshots.competitorDomain, competitorDomain)
      )
    )
    .orderBy(desc(competitorSnapshots.snapshotDate))
    .limit(1);

  return snapshot ?? null;
}

/**
 * Get competitor snapshots for trend analysis
 * Returns snapshots within a date range for a specific competitor
 */
export async function getCompetitorSnapshotsForTrends(
  brandId: string,
  competitorDomain: string,
  dateFrom: Date,
  dateTo: Date
): Promise<CompetitorSnapshot[]> {
  const snapshots = await db
    .select()
    .from(competitorSnapshots)
    .where(
      and(
        eq(competitorSnapshots.brandId, brandId),
        eq(competitorSnapshots.competitorDomain, competitorDomain),
        gte(competitorSnapshots.snapshotDate, dateFrom.toISOString().split('T')[0]),
        lte(competitorSnapshots.snapshotDate, dateTo.toISOString().split('T')[0])
      )
    )
    .orderBy(asc(competitorSnapshots.snapshotDate));

  return snapshots;
}

/**
 * Get trend data for a competitor with calculated changes
 */
export async function getCompetitorTrendData(
  brandId: string,
  competitorDomain: string,
  dateFrom: Date,
  dateTo: Date
): Promise<CompetitorTrendData | null> {
  const snapshots = await getCompetitorSnapshotsForTrends(
    brandId,
    competitorDomain,
    dateFrom,
    dateTo
  );

  if (snapshots.length === 0) {
    return null;
  }

  // Calculate trend data with changes
  const geoScoreTrend = calculateTrendDataPoints(
    snapshots,
    (s) => s.geoScore ?? 0,
    (s) => s.snapshotDate
  );

  const aiMentionCountTrend = calculateTrendDataPoints(
    snapshots,
    (s) => s.aiMentionCount ?? 0,
    (s) => s.snapshotDate
  );

  const avgMentionPositionTrend = calculateTrendDataPoints(
    snapshots,
    (s) => s.avgMentionPosition ?? 0,
    (s) => s.snapshotDate
  );

  const sentimentScoreTrend = calculateTrendDataPoints(
    snapshots,
    (s) => s.sentimentScore ?? 0,
    (s) => s.snapshotDate
  );

  return {
    competitorName: snapshots[0].competitorName,
    competitorDomain: snapshots[0].competitorDomain,
    trends: {
      geoScore: geoScoreTrend,
      aiMentionCount: aiMentionCountTrend,
      avgMentionPosition: avgMentionPositionTrend,
      sentimentScore: sentimentScoreTrend,
    },
    latest: snapshots[snapshots.length - 1],
  };
}

/**
 * Get all competitors being tracked for a brand
 */
export async function getTrackedCompetitors(
  brandId: string
): Promise<Array<{ competitorName: string; competitorDomain: string }>> {
  const results = await db
    .selectDistinct({
      competitorName: competitorSnapshots.competitorName,
      competitorDomain: competitorSnapshots.competitorDomain,
    })
    .from(competitorSnapshots)
    .where(eq(competitorSnapshots.brandId, brandId))
    .orderBy(asc(competitorSnapshots.competitorName));

  return results;
}

// ============================================================================
// Share of Voice - Create Operations
// ============================================================================

/**
 * Create a share of voice record
 */
export async function createShareOfVoice(
  data: NewShareOfVoiceRecord
): Promise<ShareOfVoiceRecord> {
  const [record] = await db
    .insert(shareOfVoice)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();

  return record;
}

/**
 * Create multiple share of voice records in a batch
 */
export async function createShareOfVoiceRecords(
  data: NewShareOfVoiceRecord[]
): Promise<ShareOfVoiceRecord[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    createdAt: now,
  }));

  const records = await db
    .insert(shareOfVoice)
    .values(valuesWithTimestamps)
    .returning();

  return records;
}

// ============================================================================
// Share of Voice - Read Operations
// ============================================================================

/**
 * Get share of voice records with optional filters
 */
export async function getShareOfVoice(
  filters: ShareOfVoiceFilters = {},
  pagination: PaginationOptions = {}
): Promise<{ data: ShareOfVoiceRecord[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = buildShareOfVoiceFilterConditions(filters);

  const data = await db
    .select()
    .from(shareOfVoice)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(shareOfVoice.date))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shareOfVoice)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get the latest share of voice for a brand and platform
 */
export async function getLatestShareOfVoice(
  brandId: string,
  platform: string = "all"
): Promise<ShareOfVoiceRecord | null> {
  const [record] = await db
    .select()
    .from(shareOfVoice)
    .where(
      and(
        eq(shareOfVoice.brandId, brandId),
        eq(shareOfVoice.platform, platform)
      )
    )
    .orderBy(desc(shareOfVoice.date))
    .limit(1);

  return record ?? null;
}

/**
 * Get share of voice trend data for a date range
 */
export async function getShareOfVoiceTrend(
  brandId: string,
  platform: string,
  dateFrom: Date,
  dateTo: Date
): Promise<ShareOfVoiceRecord[]> {
  const records = await db
    .select()
    .from(shareOfVoice)
    .where(
      and(
        eq(shareOfVoice.brandId, brandId),
        eq(shareOfVoice.platform, platform),
        gte(shareOfVoice.date, dateFrom.toISOString().split('T')[0]),
        lte(shareOfVoice.date, dateTo.toISOString().split('T')[0])
      )
    )
    .orderBy(asc(shareOfVoice.date));

  return records;
}

// ============================================================================
// Competitor Mentions - Create Operations
// ============================================================================

/**
 * Create a competitor mention record
 */
export async function createCompetitorMention(
  data: NewCompetitorMentionRecord
): Promise<CompetitorMentionRecord> {
  const [mention] = await db
    .insert(competitorMentions)
    .values({
      ...data,
      timestamp: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return mention;
}

/**
 * Create multiple competitor mention records in a batch
 */
export async function createCompetitorMentions(
  data: NewCompetitorMentionRecord[]
): Promise<CompetitorMentionRecord[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    timestamp: now,
    createdAt: now,
  }));

  const mentions = await db
    .insert(competitorMentions)
    .values(valuesWithTimestamps)
    .returning();

  return mentions;
}

// ============================================================================
// Competitor Mentions - Read Operations
// ============================================================================

/**
 * Get competitor mentions with optional filters
 */
export async function getCompetitorMentions(
  filters: CompetitorMentionFilters = {},
  pagination: PaginationOptions = {}
): Promise<{ data: CompetitorMentionRecord[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = buildCompetitorMentionFilterConditions(filters);

  const data = await db
    .select()
    .from(competitorMentions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(competitorMentions.timestamp))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(competitorMentions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get competitor mention counts by competitor name
 */
export async function getCompetitorMentionCounts(
  brandId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<Array<{ competitorName: string; count: number }>> {
  const conditions = [eq(competitorMentions.brandId, brandId)];

  if (dateFrom) {
    conditions.push(gte(competitorMentions.timestamp, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(competitorMentions.timestamp, dateTo));
  }

  const results = await db
    .select({
      competitorName: competitorMentions.competitorName,
      count: sql<number>`count(*)::int`,
    })
    .from(competitorMentions)
    .where(and(...conditions))
    .groupBy(competitorMentions.competitorName)
    .orderBy(desc(sql`count(*)`));

  return results;
}

// ============================================================================
// SERP Features - Create Operations
// ============================================================================

/**
 * Create a SERP feature record
 */
export async function createSerpFeature(
  data: NewSerpFeature
): Promise<SerpFeature> {
  const [feature] = await db
    .insert(serpFeatures)
    .values({
      ...data,
      timestamp: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return feature;
}

/**
 * Create multiple SERP feature records in a batch
 */
export async function createSerpFeatures(
  data: NewSerpFeature[]
): Promise<SerpFeature[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    timestamp: now,
    createdAt: now,
  }));

  const features = await db
    .insert(serpFeatures)
    .values(valuesWithTimestamps)
    .returning();

  return features;
}

// ============================================================================
// SERP Features - Read Operations
// ============================================================================

/**
 * Get SERP features with optional filters
 */
export async function getSerpFeatures(
  filters: SerpFeatureFilters = {},
  pagination: PaginationOptions = {}
): Promise<{ data: SerpFeature[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = buildSerpFeatureFilterConditions(filters);

  const data = await db
    .select()
    .from(serpFeatures)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(serpFeatures.timestamp))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(serpFeatures)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get SERP features owned by brand
 */
export async function getOwnedSerpFeatures(
  brandId: string,
  limit: number = 50
): Promise<SerpFeature[]> {
  const features = await db
    .select()
    .from(serpFeatures)
    .where(
      and(
        eq(serpFeatures.brandId, brandId),
        eq(serpFeatures.ownedBy, "self")
      )
    )
    .orderBy(desc(serpFeatures.timestamp))
    .limit(limit);

  return features;
}

/**
 * Get SERP features owned by competitors
 */
export async function getCompetitorSerpFeatures(
  brandId: string,
  competitorName?: string,
  limit: number = 50
): Promise<SerpFeature[]> {
  const conditions = [
    eq(serpFeatures.brandId, brandId),
    eq(serpFeatures.ownedBy, "competitor"),
  ];

  if (competitorName) {
    conditions.push(eq(serpFeatures.competitorName, competitorName));
  }

  const features = await db
    .select()
    .from(serpFeatures)
    .where(and(...conditions))
    .orderBy(desc(serpFeatures.timestamp))
    .limit(limit);

  return features;
}

// ============================================================================
// Competitive Gaps - Create Operations
// ============================================================================

/**
 * Create a competitive gap record
 */
export async function createCompetitiveGap(
  data: NewCompetitiveGap
): Promise<CompetitiveGap> {
  const [gap] = await db
    .insert(competitiveGaps)
    .values({
      ...data,
      discoveredAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return gap;
}

/**
 * Create multiple competitive gap records in a batch
 */
export async function createCompetitiveGaps(
  data: NewCompetitiveGap[]
): Promise<CompetitiveGap[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    discoveredAt: now,
    createdAt: now,
  }));

  const gaps = await db
    .insert(competitiveGaps)
    .values(valuesWithTimestamps)
    .returning();

  return gaps;
}

// ============================================================================
// Competitive Gaps - Read Operations
// ============================================================================

/**
 * Get competitive gaps with optional filters
 */
export async function getCompetitiveGaps(
  filters: CompetitiveGapFilters = {},
  pagination: PaginationOptions = {}
): Promise<{ data: CompetitiveGap[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = buildCompetitiveGapFilterConditions(filters);

  const data = await db
    .select()
    .from(competitiveGaps)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(competitiveGaps.discoveredAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(competitiveGaps)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get unresolved competitive gaps for a brand
 */
export async function getUnresolvedCompetitiveGaps(
  brandId: string,
  limit: number = 50
): Promise<CompetitiveGap[]> {
  const gaps = await db
    .select()
    .from(competitiveGaps)
    .where(
      and(
        eq(competitiveGaps.brandId, brandId),
        eq(competitiveGaps.isResolved, false)
      )
    )
    .orderBy(desc(competitiveGaps.opportunity))
    .limit(limit);

  return gaps;
}

/**
 * Update competitive gap resolution status
 */
export async function resolveCompetitiveGap(
  id: string
): Promise<CompetitiveGap | null> {
  const [updated] = await db
    .update(competitiveGaps)
    .set({
      isResolved: true,
      resolvedAt: new Date(),
    })
    .where(eq(competitiveGaps.id, id))
    .returning();

  return updated ?? null;
}

// ============================================================================
// Competitive Alerts - Create Operations
// ============================================================================

/**
 * Create a competitive alert
 */
export async function createCompetitiveAlert(
  data: NewCompetitiveAlert
): Promise<CompetitiveAlert> {
  const [alert] = await db
    .insert(competitiveAlerts)
    .values({
      ...data,
      triggeredAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return alert;
}

/**
 * Create multiple competitive alerts in a batch
 */
export async function createCompetitiveAlerts(
  data: NewCompetitiveAlert[]
): Promise<CompetitiveAlert[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    triggeredAt: now,
    createdAt: now,
  }));

  const alerts = await db
    .insert(competitiveAlerts)
    .values(valuesWithTimestamps)
    .returning();

  return alerts;
}

// ============================================================================
// Competitive Alerts - Read Operations
// ============================================================================

/**
 * Get competitive alerts with optional filters
 */
export async function getCompetitiveAlerts(
  filters: CompetitiveAlertFilters = {},
  pagination: PaginationOptions = {}
): Promise<{ data: CompetitiveAlert[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = buildCompetitiveAlertFilterConditions(filters);

  const data = await db
    .select()
    .from(competitiveAlerts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(competitiveAlerts.triggeredAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(competitiveAlerts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get unread competitive alerts for a brand
 */
export async function getUnreadCompetitiveAlerts(
  brandId: string,
  limit: number = 50
): Promise<CompetitiveAlert[]> {
  const alerts = await db
    .select()
    .from(competitiveAlerts)
    .where(
      and(
        eq(competitiveAlerts.brandId, brandId),
        eq(competitiveAlerts.isRead, false),
        eq(competitiveAlerts.isDismissed, false)
      )
    )
    .orderBy(
      sql`CASE
        WHEN ${competitiveAlerts.severity} = 'critical' THEN 1
        WHEN ${competitiveAlerts.severity} = 'high' THEN 2
        WHEN ${competitiveAlerts.severity} = 'medium' THEN 3
        WHEN ${competitiveAlerts.severity} = 'low' THEN 4
        ELSE 5
      END`,
      desc(competitiveAlerts.triggeredAt)
    )
    .limit(limit);

  return alerts;
}

/**
 * Mark competitive alert as read
 */
export async function markAlertAsRead(
  id: string
): Promise<CompetitiveAlert | null> {
  const [updated] = await db
    .update(competitiveAlerts)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(competitiveAlerts.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Dismiss competitive alert
 */
export async function dismissAlert(
  id: string
): Promise<CompetitiveAlert | null> {
  const [updated] = await db
    .update(competitiveAlerts)
    .set({
      isDismissed: true,
    })
    .where(eq(competitiveAlerts.id, id))
    .returning();

  return updated ?? null;
}

// ============================================================================
// Discovered Competitors - Create Operations
// ============================================================================

/**
 * Create a discovered competitor record
 */
export async function createDiscoveredCompetitor(
  data: NewDiscoveredCompetitor
): Promise<DiscoveredCompetitor> {
  const [competitor] = await db
    .insert(discoveredCompetitors)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return competitor;
}

/**
 * Create multiple discovered competitor records in a batch
 */
export async function createDiscoveredCompetitors(
  data: NewDiscoveredCompetitor[]
): Promise<DiscoveredCompetitor[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }));

  const competitors = await db
    .insert(discoveredCompetitors)
    .values(valuesWithTimestamps)
    .returning();

  return competitors;
}

// ============================================================================
// Discovered Competitors - Read Operations
// ============================================================================

/**
 * Get discovered competitors with optional filters
 */
export async function getDiscoveredCompetitors(
  filters: DiscoveredCompetitorFilters = {},
  pagination: PaginationOptions = {}
): Promise<{ data: DiscoveredCompetitor[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;

  const conditions = buildDiscoveredCompetitorFilterConditions(filters);

  const data = await db
    .select()
    .from(discoveredCompetitors)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(discoveredCompetitors.confidenceScore))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(discoveredCompetitors)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get pending discovered competitors for a brand
 */
export async function getPendingDiscoveredCompetitors(
  brandId: string,
  limit: number = 50
): Promise<DiscoveredCompetitor[]> {
  const competitors = await db
    .select()
    .from(discoveredCompetitors)
    .where(
      and(
        eq(discoveredCompetitors.brandId, brandId),
        eq(discoveredCompetitors.status, "pending")
      )
    )
    .orderBy(desc(discoveredCompetitors.confidenceScore))
    .limit(limit);

  return competitors;
}

/**
 * Update discovered competitor status
 */
export async function updateDiscoveredCompetitorStatus(
  id: string,
  status: DiscoveryStatus,
  rejectionReason?: string | null
): Promise<DiscoveredCompetitor | null> {
  const now = new Date();
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (status === "confirmed") {
    updateData.confirmedAt = now;
  } else if (status === "rejected") {
    updateData.rejectedAt = now;
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
  }

  const [updated] = await db
    .update(discoveredCompetitors)
    .set(updateData)
    .where(eq(discoveredCompetitors.id, id))
    .returning();

  return updated ?? null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate trend data points with change values
 */
function calculateTrendDataPoints<T>(
  snapshots: T[],
  valueExtractor: (snapshot: T) => number,
  dateExtractor: (snapshot: T) => string
): TrendDataPoint[] {
  return snapshots.map((snapshot, index) => {
    const value = valueExtractor(snapshot);
    const date = dateExtractor(snapshot);

    let change: number | undefined;
    let changePercent: number | undefined;

    if (index > 0) {
      const previousValue = valueExtractor(snapshots[index - 1]);
      change = value - previousValue;
      changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
    }

    return {
      date,
      value,
      change,
      changePercent,
    };
  });
}

/**
 * Build filter conditions for competitor snapshots
 */
function buildCompetitorSnapshotFilterConditions(
  filters: CompetitorSnapshotFilters
) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(competitorSnapshots.brandId, filters.brandId));
  }

  if (filters.competitorName) {
    conditions.push(eq(competitorSnapshots.competitorName, filters.competitorName));
  }

  if (filters.competitorDomain) {
    conditions.push(eq(competitorSnapshots.competitorDomain, filters.competitorDomain));
  }

  if (filters.dateFrom) {
    conditions.push(gte(competitorSnapshots.snapshotDate, filters.dateFrom.toISOString().split('T')[0]));
  }

  if (filters.dateTo) {
    conditions.push(lte(competitorSnapshots.snapshotDate, filters.dateTo.toISOString().split('T')[0]));
  }

  return conditions;
}

/**
 * Build filter conditions for share of voice
 */
function buildShareOfVoiceFilterConditions(filters: ShareOfVoiceFilters) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(shareOfVoice.brandId, filters.brandId));
  }

  if (filters.platform) {
    conditions.push(eq(shareOfVoice.platform, filters.platform));
  }

  if (filters.dateFrom) {
    conditions.push(gte(shareOfVoice.date, filters.dateFrom.toISOString().split('T')[0]));
  }

  if (filters.dateTo) {
    conditions.push(lte(shareOfVoice.date, filters.dateTo.toISOString().split('T')[0]));
  }

  return conditions;
}

/**
 * Build filter conditions for competitor mentions
 */
function buildCompetitorMentionFilterConditions(
  filters: CompetitorMentionFilters
) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(competitorMentions.brandId, filters.brandId));
  }

  if (filters.competitorName) {
    conditions.push(eq(competitorMentions.competitorName, filters.competitorName));
  }

  if (filters.platform) {
    conditions.push(eq(competitorMentions.platform, filters.platform));
  }

  if (filters.sentiment) {
    conditions.push(eq(competitorMentions.sentiment, filters.sentiment));
  }

  if (filters.dateFrom) {
    conditions.push(gte(competitorMentions.timestamp, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(competitorMentions.timestamp, filters.dateTo));
  }

  return conditions;
}

/**
 * Build filter conditions for SERP features
 */
function buildSerpFeatureFilterConditions(filters: SerpFeatureFilters) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(serpFeatures.brandId, filters.brandId));
  }

  if (filters.keyword) {
    conditions.push(eq(serpFeatures.keyword, filters.keyword));
  }

  if (filters.featureType) {
    conditions.push(eq(serpFeatures.featureType, filters.featureType));
  }

  if (filters.ownedBy) {
    conditions.push(eq(serpFeatures.ownedBy, filters.ownedBy));
  }

  if (filters.competitorName) {
    conditions.push(eq(serpFeatures.competitorName, filters.competitorName));
  }

  if (filters.searchEngine) {
    conditions.push(eq(serpFeatures.searchEngine, filters.searchEngine));
  }

  return conditions;
}

/**
 * Build filter conditions for competitive gaps
 */
function buildCompetitiveGapFilterConditions(filters: CompetitiveGapFilters) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(competitiveGaps.brandId, filters.brandId));
  }

  if (filters.gapType) {
    conditions.push(eq(competitiveGaps.gapType, filters.gapType));
  }

  if (filters.competitorName) {
    conditions.push(eq(competitiveGaps.competitorName, filters.competitorName));
  }

  if (filters.isResolved !== undefined) {
    conditions.push(eq(competitiveGaps.isResolved, filters.isResolved));
  }

  return conditions;
}

/**
 * Build filter conditions for competitive alerts
 */
function buildCompetitiveAlertFilterConditions(
  filters: CompetitiveAlertFilters
) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(competitiveAlerts.brandId, filters.brandId));
  }

  if (filters.alertType) {
    conditions.push(eq(competitiveAlerts.alertType, filters.alertType));
  }

  if (filters.severity) {
    conditions.push(eq(competitiveAlerts.severity, filters.severity));
  }

  if (filters.isRead !== undefined) {
    conditions.push(eq(competitiveAlerts.isRead, filters.isRead));
  }

  if (filters.isDismissed !== undefined) {
    conditions.push(eq(competitiveAlerts.isDismissed, filters.isDismissed));
  }

  if (filters.competitorName) {
    conditions.push(eq(competitiveAlerts.competitorName, filters.competitorName));
  }

  return conditions;
}

/**
 * Build filter conditions for discovered competitors
 */
function buildDiscoveredCompetitorFilterConditions(
  filters: DiscoveredCompetitorFilters
) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(discoveredCompetitors.brandId, filters.brandId));
  }

  if (filters.status) {
    conditions.push(eq(discoveredCompetitors.status, filters.status));
  }

  if (filters.discoveryMethod) {
    conditions.push(eq(discoveredCompetitors.discoveryMethod, filters.discoveryMethod));
  }

  if (filters.minConfidenceScore !== undefined) {
    conditions.push(gte(discoveredCompetitors.confidenceScore, filters.minConfidenceScore));
  }

  return conditions;
}

/**
 * Build order by clause from sort options
 */
function buildOrderByClause(
  table: typeof competitorSnapshots,
  field: string,
  direction: "asc" | "desc"
) {
  const column = (table as Record<string, unknown>)[field];
  if (!column) {
    return direction === "asc" ? asc(table.createdAt) : desc(table.createdAt);
  }
  return direction === "asc" ? asc(column) : desc(column);
}
