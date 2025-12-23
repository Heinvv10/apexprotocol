/**
 * Drizzle query functions for recommendation CRUD operations
 * Follows patterns from src/lib/db/schema/recommendations.ts and existing API routes
 */

import { db } from "@/lib/db";
import {
  recommendations,
  type Recommendation,
  type NewRecommendation,
} from "@/lib/db/schema";
import { eq, and, desc, asc, inArray, gte, lte, sql, or, ilike } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type RecommendationStatus = "pending" | "in_progress" | "completed" | "dismissed";
export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type RecommendationCategory =
  | "technical_seo"
  | "content_optimization"
  | "schema_markup"
  | "citation_building"
  | "brand_consistency"
  | "competitor_analysis"
  | "content_freshness"
  | "authority_building";
export type RecommendationEffort = "quick_win" | "moderate" | "major";
export type RecommendationImpact = "high" | "medium" | "low";
export type RecommendationSource = "audit" | "monitoring" | "content" | "manual";

export interface RecommendationFilters {
  brandId?: string;
  brandIds?: string[];
  category?: RecommendationCategory;
  status?: RecommendationStatus;
  priority?: RecommendationPriority;
  effort?: RecommendationEffort;
  impact?: RecommendationImpact;
  source?: RecommendationSource;
  auditId?: string;
  assignedToId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  searchQuery?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field?: "createdAt" | "updatedAt" | "dueDate" | "priority";
  direction?: "asc" | "desc";
}

export interface UpdateRecommendationData {
  title?: string;
  description?: string;
  category?: RecommendationCategory;
  priority?: RecommendationPriority;
  status?: RecommendationStatus;
  effort?: RecommendationEffort;
  impact?: RecommendationImpact;
  estimatedTime?: string | null;
  assignedToId?: string | null;
  steps?: string[];
  notes?: string | null;
  dueDate?: Date | null;
}

export type DuplicateHandling = "skip" | "error" | "allow";

export interface CreateRecommendationOptions {
  /**
   * How to handle duplicate recommendations (same brandId, title, category)
   * - "skip": Skip insertion silently and return null
   * - "error": Throw an error if duplicate exists
   * - "allow": Insert regardless of duplicates (default behavior)
   */
  duplicateHandling?: DuplicateHandling;
}

export interface CreateRecommendationsResult {
  /** Successfully created recommendations */
  created: Recommendation[];
  /** Recommendations that were skipped due to duplicates */
  skipped: NewRecommendation[];
  /** Total count of created recommendations */
  createdCount: number;
  /** Total count of skipped recommendations */
  skippedCount: number;
}

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create a single recommendation with optional duplicate detection
 * @param data - The recommendation data to insert
 * @param options - Options for handling duplicates
 * @returns The created recommendation, or null if skipped due to duplicate
 * @throws Error if duplicateHandling is "error" and duplicate exists
 */
export async function createRecommendation(
  data: NewRecommendation,
  options: CreateRecommendationOptions = {}
): Promise<Recommendation | null> {
  const { duplicateHandling = "allow" } = options;

  // Check for duplicates if not allowing them
  if (duplicateHandling !== "allow") {
    const existing = await findSimilarRecommendation(
      data.brandId,
      data.title,
      data.category
    );

    if (existing) {
      if (duplicateHandling === "error") {
        throw new Error(
          `Duplicate recommendation exists: "${data.title}" for brand ${data.brandId} in category ${data.category}`
        );
      }
      // duplicateHandling === "skip"
      return null;
    }
  }

  const [recommendation] = await db
    .insert(recommendations)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return recommendation;
}

/**
 * Create multiple recommendations in a batch (no duplicate detection)
 * Use createRecommendationsWithDuplicateDetection for duplicate handling
 */
export async function createRecommendations(
  data: NewRecommendation[]
): Promise<Recommendation[]> {
  if (data.length === 0) {
    return [];
  }

  const now = new Date();
  const valuesWithTimestamps = data.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }));

  const createdRecommendations = await db
    .insert(recommendations)
    .values(valuesWithTimestamps)
    .returning();

  return createdRecommendations;
}

/**
 * Create multiple recommendations with duplicate detection
 * Efficiently checks for existing duplicates and skips them
 * @param data - Array of recommendations to create
 * @returns Result object with created recommendations and skipped duplicates
 */
export async function createRecommendationsWithDuplicateDetection(
  data: NewRecommendation[]
): Promise<CreateRecommendationsResult> {
  if (data.length === 0) {
    return {
      created: [],
      skipped: [],
      createdCount: 0,
      skippedCount: 0,
    };
  }

  // Find existing duplicates efficiently
  const existingDuplicates = await findExistingDuplicates(data);

  // Create a set of duplicate keys for fast lookup
  const duplicateKeys = new Set(
    existingDuplicates.map((rec) =>
      buildDuplicateKey(rec.brandId, rec.title, rec.category)
    )
  );

  // Separate new recommendations from duplicates
  const toCreate: NewRecommendation[] = [];
  const skipped: NewRecommendation[] = [];

  for (const rec of data) {
    const key = buildDuplicateKey(rec.brandId, rec.title, rec.category);
    if (duplicateKeys.has(key)) {
      skipped.push(rec);
    } else {
      toCreate.push(rec);
      // Also add to duplicateKeys to handle duplicates within the input array
      duplicateKeys.add(key);
    }
  }

  // Create non-duplicate recommendations
  const created = toCreate.length > 0
    ? await createRecommendations(toCreate)
    : [];

  return {
    created,
    skipped,
    createdCount: created.length,
    skippedCount: skipped.length,
  };
}

/**
 * Build a normalized key for duplicate detection
 * Uses brandId + normalized title (lowercase) + category
 */
function buildDuplicateKey(
  brandId: string,
  title: string,
  category: string
): string {
  return `${brandId}::${title.toLowerCase().trim()}::${category}`;
}

/**
 * Find existing recommendations that match any of the input recommendations
 * Used for efficient batch duplicate detection
 */
async function findExistingDuplicates(
  data: NewRecommendation[]
): Promise<Pick<Recommendation, "brandId" | "title" | "category">[]> {
  if (data.length === 0) {
    return [];
  }

  // Get unique brand IDs
  const brandIds = [...new Set(data.map((r) => r.brandId))];

  // Get unique categories
  const categories = [...new Set(data.map((r) => r.category))];

  // Get all potential matches (brand + category combinations)
  // Then filter in memory for title matches
  const potentialMatches = await db
    .select({
      brandId: recommendations.brandId,
      title: recommendations.title,
      category: recommendations.category,
    })
    .from(recommendations)
    .where(
      and(
        inArray(recommendations.brandId, brandIds),
        inArray(recommendations.category, categories)
      )
    );

  // Filter to only exact title matches (case-insensitive)
  const inputTitlesLower = new Set(
    data.map((r) => r.title.toLowerCase().trim())
  );

  return potentialMatches.filter((match) =>
    inputTitlesLower.has(match.title.toLowerCase().trim())
  );
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get a single recommendation by ID
 */
export async function getRecommendationById(
  id: string
): Promise<Recommendation | null> {
  const [recommendation] = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.id, id))
    .limit(1);

  return recommendation ?? null;
}

/**
 * Get recommendations with optional filters, pagination, and sorting
 */
export async function getRecommendations(
  filters: RecommendationFilters = {},
  pagination: PaginationOptions = {},
  sort: SortOptions = {}
): Promise<{ data: Recommendation[]; total: number }> {
  const { limit = 50, offset = 0 } = pagination;
  const { field = "createdAt", direction = "desc" } = sort;

  // Build conditions array
  const conditions = buildFilterConditions(filters);

  // Build order by clause
  const orderByClause = buildOrderByClause(field, direction);

  // Execute query
  const data = await db
    .select()
    .from(recommendations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recommendations)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data,
    total: countResult?.count ?? 0,
  };
}

/**
 * Get recommendations for a specific brand
 */
export async function getRecommendationsByBrandId(
  brandId: string,
  options: {
    status?: RecommendationStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Recommendation[]> {
  const { status, limit = 50, offset = 0 } = options;

  const conditions = [eq(recommendations.brandId, brandId)];
  if (status) {
    conditions.push(eq(recommendations.status, status));
  }

  const data = await db
    .select()
    .from(recommendations)
    .where(and(...conditions))
    .orderBy(desc(recommendations.createdAt))
    .limit(limit)
    .offset(offset);

  return data;
}

/**
 * Get recommendations for multiple brand IDs
 */
export async function getRecommendationsByBrandIds(
  brandIds: string[],
  filters: Omit<RecommendationFilters, "brandId" | "brandIds"> = {},
  pagination: PaginationOptions = {}
): Promise<{ data: Recommendation[]; total: number }> {
  if (brandIds.length === 0) {
    return { data: [], total: 0 };
  }

  return getRecommendations(
    { ...filters, brandIds },
    pagination
  );
}

/**
 * Get recommendations by audit ID
 */
export async function getRecommendationsByAuditId(
  auditId: string
): Promise<Recommendation[]> {
  const data = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.auditId, auditId))
    .orderBy(desc(recommendations.createdAt));

  return data;
}

/**
 * Get pending recommendations for a brand, sorted by priority
 */
export async function getPendingRecommendations(
  brandId: string,
  limit: number = 10
): Promise<Recommendation[]> {
  // Custom priority ordering: critical > high > medium > low
  const data = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.brandId, brandId),
        eq(recommendations.status, "pending")
      )
    )
    .orderBy(
      sql`CASE
        WHEN ${recommendations.priority} = 'critical' THEN 1
        WHEN ${recommendations.priority} = 'high' THEN 2
        WHEN ${recommendations.priority} = 'medium' THEN 3
        WHEN ${recommendations.priority} = 'low' THEN 4
        ELSE 5
      END`,
      desc(recommendations.createdAt)
    )
    .limit(limit);

  return data;
}

/**
 * Count recommendations by status for a brand
 */
export async function countRecommendationsByStatus(
  brandId: string
): Promise<Record<RecommendationStatus, number>> {
  const results = await db
    .select({
      status: recommendations.status,
      count: sql<number>`count(*)::int`,
    })
    .from(recommendations)
    .where(eq(recommendations.brandId, brandId))
    .groupBy(recommendations.status);

  const counts: Record<RecommendationStatus, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    dismissed: 0,
  };

  for (const row of results) {
    counts[row.status] = row.count;
  }

  return counts;
}

/**
 * Count recommendations by priority for a brand
 */
export async function countRecommendationsByPriority(
  brandId: string
): Promise<Record<RecommendationPriority, number>> {
  const results = await db
    .select({
      priority: recommendations.priority,
      count: sql<number>`count(*)::int`,
    })
    .from(recommendations)
    .where(eq(recommendations.brandId, brandId))
    .groupBy(recommendations.priority);

  const counts: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const row of results) {
    counts[row.priority] = row.count;
  }

  return counts;
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a recommendation by ID
 */
export async function updateRecommendation(
  id: string,
  data: UpdateRecommendationData
): Promise<Recommendation | null> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(recommendations)
    .set(updateData)
    .where(eq(recommendations.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Update recommendation status with timestamp tracking
 */
export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus,
  notes?: string | null
): Promise<Recommendation | null> {
  const now = new Date();
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  // Set completion/dismissal timestamps
  if (status === "completed") {
    updateData.completedAt = now;
  } else if (status === "dismissed") {
    updateData.dismissedAt = now;
  }

  // Clear timestamps if status is reverted
  if (status === "pending" || status === "in_progress") {
    updateData.completedAt = null;
    updateData.dismissedAt = null;
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const [updated] = await db
    .update(recommendations)
    .set(updateData)
    .where(eq(recommendations.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Assign a recommendation to a user
 */
export async function assignRecommendation(
  id: string,
  assignedToId: string | null
): Promise<Recommendation | null> {
  const [updated] = await db
    .update(recommendations)
    .set({
      assignedToId,
      updatedAt: new Date(),
    })
    .where(eq(recommendations.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Bulk update status for multiple recommendations
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: RecommendationStatus
): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (status === "completed") {
    updateData.completedAt = now;
  } else if (status === "dismissed") {
    updateData.dismissedAt = now;
  }

  const result = await db
    .update(recommendations)
    .set(updateData)
    .where(inArray(recommendations.id, ids));

  return result.rowCount ?? 0;
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete a recommendation by ID
 */
export async function deleteRecommendation(id: string): Promise<boolean> {
  const result = await db
    .delete(recommendations)
    .where(eq(recommendations.id, id));

  return (result.rowCount ?? 0) > 0;
}

/**
 * Delete multiple recommendations by IDs
 */
export async function deleteRecommendations(ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const result = await db
    .delete(recommendations)
    .where(inArray(recommendations.id, ids));

  return result.rowCount ?? 0;
}

/**
 * Delete all recommendations for a brand
 */
export async function deleteRecommendationsByBrandId(
  brandId: string
): Promise<number> {
  const result = await db
    .delete(recommendations)
    .where(eq(recommendations.brandId, brandId));

  return result.rowCount ?? 0;
}

/**
 * Delete dismissed recommendations older than a certain date
 */
export async function deleteDismissedRecommendations(
  olderThan: Date
): Promise<number> {
  const result = await db
    .delete(recommendations)
    .where(
      and(
        eq(recommendations.status, "dismissed"),
        lte(recommendations.dismissedAt, olderThan)
      )
    );

  return result.rowCount ?? 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build filter conditions from RecommendationFilters
 */
function buildFilterConditions(filters: RecommendationFilters) {
  const conditions = [];

  if (filters.brandId) {
    conditions.push(eq(recommendations.brandId, filters.brandId));
  }

  if (filters.brandIds && filters.brandIds.length > 0) {
    conditions.push(inArray(recommendations.brandId, filters.brandIds));
  }

  if (filters.category) {
    conditions.push(eq(recommendations.category, filters.category));
  }

  if (filters.status) {
    conditions.push(eq(recommendations.status, filters.status));
  }

  if (filters.priority) {
    conditions.push(eq(recommendations.priority, filters.priority));
  }

  if (filters.effort) {
    conditions.push(eq(recommendations.effort, filters.effort));
  }

  if (filters.impact) {
    conditions.push(eq(recommendations.impact, filters.impact));
  }

  if (filters.source) {
    conditions.push(eq(recommendations.source, filters.source));
  }

  if (filters.auditId) {
    conditions.push(eq(recommendations.auditId, filters.auditId));
  }

  if (filters.assignedToId) {
    conditions.push(eq(recommendations.assignedToId, filters.assignedToId));
  }

  if (filters.dueBefore) {
    conditions.push(lte(recommendations.dueDate, filters.dueBefore));
  }

  if (filters.dueAfter) {
    conditions.push(gte(recommendations.dueDate, filters.dueAfter));
  }

  if (filters.searchQuery) {
    conditions.push(
      or(
        ilike(recommendations.title, `%${filters.searchQuery}%`),
        ilike(recommendations.description, `%${filters.searchQuery}%`)
      )
    );
  }

  return conditions;
}

/**
 * Build order by clause from sort options
 */
function buildOrderByClause(
  field: "createdAt" | "updatedAt" | "dueDate" | "priority",
  direction: "asc" | "desc"
) {
  const column = {
    createdAt: recommendations.createdAt,
    updatedAt: recommendations.updatedAt,
    dueDate: recommendations.dueDate,
    priority: recommendations.priority,
  }[field];

  return direction === "asc" ? asc(column) : desc(column);
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Check if a similar recommendation exists (for duplicate detection)
 * A recommendation is considered a duplicate if it matches:
 * - Same brandId
 * - Same category
 * - Same title (case-insensitive match)
 *
 * @param brandId - The brand ID to check
 * @param title - The recommendation title to check (case-insensitive)
 * @param category - The recommendation category
 * @returns The existing recommendation if found, or null
 */
export async function findSimilarRecommendation(
  brandId: string,
  title: string,
  category: RecommendationCategory
): Promise<Recommendation | null> {
  const [existing] = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.brandId, brandId),
        eq(recommendations.category, category),
        ilike(recommendations.title, title)
      )
    )
    .limit(1);

  return existing ?? null;
}

/**
 * Check if a recommendation would be a duplicate
 * Convenience function that returns a boolean instead of the existing recommendation
 *
 * @param brandId - The brand ID to check
 * @param title - The recommendation title to check (case-insensitive)
 * @param category - The recommendation category
 * @returns true if a similar recommendation already exists
 */
export async function isDuplicateRecommendation(
  brandId: string,
  title: string,
  category: RecommendationCategory
): Promise<boolean> {
  const existing = await findSimilarRecommendation(brandId, title, category);
  return existing !== null;
}

/**
 * Check if a NewRecommendation would be a duplicate
 * Convenience overload that accepts a NewRecommendation object
 *
 * @param data - The recommendation data to check
 * @returns true if a similar recommendation already exists
 */
export async function checkRecommendationDuplicate(
  data: Pick<NewRecommendation, "brandId" | "title" | "category">
): Promise<{ isDuplicate: boolean; existing: Recommendation | null }> {
  const existing = await findSimilarRecommendation(
    data.brandId,
    data.title,
    data.category
  );
  return {
    isDuplicate: existing !== null,
    existing,
  };
}
