/**
 * Competitor Auto-Discovery Service
 * Phase 9.1: Automatically discover competitors via multiple signals
 *
 * Discovery Methods:
 * - Keyword overlap analysis
 * - AI mention co-occurrence
 * - Industry + geography matching
 * - Search result overlap
 *
 * Confidence scoring: 0-1 scale based on signal strength
 */

import { db } from "@/lib/db";
import {
  brands,
  brandMentions,
  discoveredCompetitors,
  type Brand,
  type BrandCompetitor,
  type NewDiscoveredCompetitor,
  type DiscoveryMetadata,
} from "@/lib/db/schema";
import { eq, and, gte, ne, desc, sql, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Types
export interface DiscoverySignals {
  keywordOverlap: number; // 0-1 percentage
  aiCoOccurrence: number; // 0-1 percentage
  industryMatch: boolean;
  sharedKeywords: string[];
  coOccurrenceQueries: string[];
}

export interface DiscoveredCompetitorResult {
  competitorName: string;
  competitorDomain?: string;
  discoveryMethod: "keyword_overlap" | "ai_co_occurrence" | "industry_match" | "search_overlap" | "manual";
  confidenceScore: number;
  signals: DiscoverySignals;
  metadata: DiscoveryMetadata;
}

export interface DiscoveryOptions {
  minConfidenceScore?: number;
  maxResults?: number;
  lookbackDays?: number;
  includeRejected?: boolean;
}

// Weights for confidence calculation
const SIGNAL_WEIGHTS = {
  keywordOverlap: 0.35,
  aiCoOccurrence: 0.35,
  industryMatch: 0.20,
  searchOverlap: 0.10,
};

// Thresholds
const MIN_KEYWORD_OVERLAP = 0.15; // 15% minimum keyword overlap
const MIN_COOCCURRENCE = 0.10; // 10% minimum co-occurrence rate
const MIN_CONFIDENCE_DEFAULT = 0.40; // 40% minimum confidence for discovery

/**
 * Main discovery function - discovers competitors for a brand
 */
export async function discoverCompetitors(
  brandId: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveredCompetitorResult[]> {
  const {
    minConfidenceScore = MIN_CONFIDENCE_DEFAULT,
    maxResults = 20,
    lookbackDays = 90,
    includeRejected = false,
  } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  // Get brand info
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Get existing competitors (to exclude from discovery)
  const existingCompetitors = (brand.competitors || []) as Array<{
    name: string;
    url: string;
  }>;
  const existingNames = new Set(
    existingCompetitors.map((c) => c.name.toLowerCase())
  );

  // Get already discovered competitors (to avoid duplicates)
  const existingDiscovered = await db.query.discoveredCompetitors.findMany({
    where: includeRejected
      ? eq(discoveredCompetitors.brandId, brandId)
      : and(
          eq(discoveredCompetitors.brandId, brandId),
          ne(discoveredCompetitors.status, "rejected")
        ),
  });
  const discoveredNames = new Set(
    existingDiscovered.map((d) => d.competitorName.toLowerCase())
  );

  // Run discovery methods in parallel
  const [keywordCandidates, coOccurrenceCandidates] = await Promise.all([
    discoverByKeywordOverlap(brand, startDate, existingNames, discoveredNames),
    discoverByAICoOccurrence(brand, startDate, existingNames, discoveredNames),
  ]);

  // Merge and deduplicate candidates
  const candidateMap = new Map<string, DiscoveredCompetitorResult>();

  // Process keyword overlap candidates
  for (const candidate of keywordCandidates) {
    const key = candidate.competitorName.toLowerCase();
    const existing = candidateMap.get(key);

    if (existing) {
      // Merge signals
      existing.signals.keywordOverlap = Math.max(
        existing.signals.keywordOverlap,
        candidate.signals.keywordOverlap
      );
      existing.signals.sharedKeywords = [
        ...new Set([
          ...existing.signals.sharedKeywords,
          ...candidate.signals.sharedKeywords,
        ]),
      ];
      // Recalculate confidence
      existing.confidenceScore = calculateConfidence(existing.signals);
    } else {
      candidateMap.set(key, candidate);
    }
  }

  // Process co-occurrence candidates
  for (const candidate of coOccurrenceCandidates) {
    const key = candidate.competitorName.toLowerCase();
    const existing = candidateMap.get(key);

    if (existing) {
      // Merge signals
      existing.signals.aiCoOccurrence = Math.max(
        existing.signals.aiCoOccurrence,
        candidate.signals.aiCoOccurrence
      );
      existing.signals.coOccurrenceQueries = [
        ...new Set([
          ...existing.signals.coOccurrenceQueries,
          ...candidate.signals.coOccurrenceQueries,
        ]),
      ];
      // Recalculate confidence
      existing.confidenceScore = calculateConfidence(existing.signals);
      // Update discovery method if co-occurrence is stronger
      if (
        existing.signals.aiCoOccurrence > existing.signals.keywordOverlap &&
        existing.discoveryMethod === "keyword_overlap"
      ) {
        existing.discoveryMethod = "ai_co_occurrence";
      }
    } else {
      candidateMap.set(key, candidate);
    }
  }

  // Filter by minimum confidence and sort by score
  const results = [...candidateMap.values()]
    .filter((c) => c.confidenceScore >= minConfidenceScore)
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, maxResults);

  return results;
}

/**
 * Discover competitors by analyzing keyword overlap
 * Brands that rank for similar keywords are likely competitors
 */
async function discoverByKeywordOverlap(
  brand: Brand,
  startDate: Date,
  existingNames: Set<string>,
  discoveredNames: Set<string>
): Promise<DiscoveredCompetitorResult[]> {
  // Get brand's mentions and extract keywords/queries
  const brandMentionsList = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brand.id),
      gte(brandMentions.timestamp, startDate)
    ),
    limit: 500,
  });

  if (brandMentionsList.length === 0) {
    return [];
  }

  // Extract brand's keywords (queries + topics)
  const brandKeywords = new Set<string>();
  for (const mention of brandMentionsList) {
    brandKeywords.add(mention.query.toLowerCase().trim());
    const topics = mention.topics || [];
    for (const topic of topics) {
      brandKeywords.add(topic.toLowerCase().trim());
    }
  }

  // Extract competitor mentions from brand's AI mentions
  const competitorKeywordMap = new Map<
    string,
    {
      name: string;
      domain?: string;
      keywords: Set<string>;
      queries: string[];
    }
  >();

  for (const mention of brandMentionsList) {
    const competitors = mention.competitors || [];
    for (const comp of competitors) {
      const key = comp.name.toLowerCase();

      // Skip existing or already discovered
      if (existingNames.has(key) || discoveredNames.has(key)) {
        continue;
      }

      const existing = competitorKeywordMap.get(key) || {
        name: comp.name,
        domain: "", // CompetitorMention doesn't include domain
        keywords: new Set<string>(),
        queries: [] as string[],
      };

      // Add keywords from this mention
      existing.keywords.add(mention.query.toLowerCase().trim());
      const topics = mention.topics || [];
      for (const topic of topics) {
        existing.keywords.add(topic.toLowerCase().trim());
      }
      existing.queries.push(mention.query);

      competitorKeywordMap.set(key, existing);
    }
  }

  // Calculate keyword overlap for each competitor
  const results: DiscoveredCompetitorResult[] = [];

  for (const [, competitor] of competitorKeywordMap) {
    // Calculate overlap percentage
    const sharedKeywords = [...competitor.keywords].filter((k) =>
      brandKeywords.has(k)
    );
    const overlapPercentage =
      brandKeywords.size > 0 ? sharedKeywords.length / brandKeywords.size : 0;

    // Skip if below threshold
    if (overlapPercentage < MIN_KEYWORD_OVERLAP) {
      continue;
    }

    const signals: DiscoverySignals = {
      keywordOverlap: overlapPercentage,
      aiCoOccurrence: 0,
      industryMatch: false,
      sharedKeywords: sharedKeywords.slice(0, 20),
      coOccurrenceQueries: [],
    };

    results.push({
      competitorName: competitor.name,
      competitorDomain: competitor.domain,
      discoveryMethod: "keyword_overlap",
      confidenceScore: calculateConfidence(signals),
      signals,
      metadata: {
        keywordCount: sharedKeywords.length,
        firstSeenAt: new Date().toISOString(),
      },
    });
  }

  return results;
}

/**
 * Discover competitors by AI co-occurrence
 * Brands mentioned together in AI responses are likely competitors
 */
async function discoverByAICoOccurrence(
  brand: Brand,
  startDate: Date,
  existingNames: Set<string>,
  discoveredNames: Set<string>
): Promise<DiscoveredCompetitorResult[]> {
  // Get brand's mentions
  const brandMentionsList = await db.query.brandMentions.findMany({
    where: and(
      eq(brandMentions.brandId, brand.id),
      gte(brandMentions.timestamp, startDate)
    ),
    limit: 500,
  });

  if (brandMentionsList.length === 0) {
    return [];
  }

  const totalMentions = brandMentionsList.length;

  // Count how often each competitor appears together with the brand
  const coOccurrenceMap = new Map<
    string,
    {
      name: string;
      domain?: string;
      count: number;
      queries: string[];
    }
  >();

  for (const mention of brandMentionsList) {
    const competitors = mention.competitors || [];
    for (const comp of competitors) {
      const key = comp.name.toLowerCase();

      // Skip existing or already discovered
      if (existingNames.has(key) || discoveredNames.has(key)) {
        continue;
      }

      const existing = coOccurrenceMap.get(key) || {
        name: comp.name,
        domain: "", // CompetitorMention doesn't include domain
        count: 0,
        queries: [] as string[],
      };

      existing.count++;
      if (existing.queries.length < 10) {
        existing.queries.push(mention.query);
      }

      coOccurrenceMap.set(key, existing);
    }
  }

  // Calculate co-occurrence rate for each competitor
  const results: DiscoveredCompetitorResult[] = [];

  for (const [, competitor] of coOccurrenceMap) {
    const coOccurrenceRate = competitor.count / totalMentions;

    // Skip if below threshold
    if (coOccurrenceRate < MIN_COOCCURRENCE) {
      continue;
    }

    const signals: DiscoverySignals = {
      keywordOverlap: 0,
      aiCoOccurrence: coOccurrenceRate,
      industryMatch: false,
      sharedKeywords: [],
      coOccurrenceQueries: competitor.queries,
    };

    results.push({
      competitorName: competitor.name,
      competitorDomain: competitor.domain,
      discoveryMethod: "ai_co_occurrence",
      confidenceScore: calculateConfidence(signals),
      signals,
      metadata: {
        mentionCount: competitor.count,
        firstSeenAt: new Date().toISOString(),
      },
    });
  }

  return results;
}

/**
 * Calculate confidence score from discovery signals
 */
function calculateConfidence(signals: DiscoverySignals): number {
  let score = 0;

  // Keyword overlap contribution (0-35%)
  score += Math.min(signals.keywordOverlap, 1) * SIGNAL_WEIGHTS.keywordOverlap;

  // AI co-occurrence contribution (0-35%)
  score += Math.min(signals.aiCoOccurrence, 1) * SIGNAL_WEIGHTS.aiCoOccurrence;

  // Industry match bonus (20%)
  if (signals.industryMatch) {
    score += SIGNAL_WEIGHTS.industryMatch;
  }

  // Boost for having multiple signals
  const signalCount = [
    signals.keywordOverlap > 0,
    signals.aiCoOccurrence > 0,
    signals.industryMatch,
  ].filter(Boolean).length;

  if (signalCount >= 2) {
    score *= 1.2; // 20% boost for multiple signals
  }

  return Math.min(Math.round(score * 100) / 100, 1);
}

/**
 * Store discovered competitors in the database
 */
export async function storeDiscoveredCompetitors(
  brandId: string,
  discoveries: DiscoveredCompetitorResult[]
): Promise<string[]> {
  if (discoveries.length === 0) {
    return [];
  }

  const values: NewDiscoveredCompetitor[] = discoveries.map((d) => ({
    id: createId(),
    brandId,
    competitorName: d.competitorName,
    competitorDomain: d.competitorDomain,
    discoveryMethod: d.discoveryMethod,
    confidenceScore: d.confidenceScore,
    keywordOverlap: d.signals.keywordOverlap,
    aiCoOccurrence: d.signals.aiCoOccurrence,
    industryMatch: d.signals.industryMatch,
    sharedKeywords: d.signals.sharedKeywords,
    coOccurrenceQueries: d.signals.coOccurrenceQueries,
    metadata: d.metadata,
    status: "pending",
  }));

  const inserted = await db
    .insert(discoveredCompetitors)
    .values(values)
    .returning({ id: discoveredCompetitors.id });

  return inserted.map((r) => r.id);
}

/**
 * Confirm a discovered competitor (add to brand's competitor list)
 */
export async function confirmDiscoveredCompetitor(
  discoveryId: string,
  brandId: string
): Promise<void> {
  // Get the discovered competitor
  const discovery = await db.query.discoveredCompetitors.findFirst({
    where: and(
      eq(discoveredCompetitors.id, discoveryId),
      eq(discoveredCompetitors.brandId, brandId)
    ),
  });

  if (!discovery) {
    throw new Error("Discovered competitor not found");
  }

  // Get the brand
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Add to brand's competitors list
  const existingCompetitors = (brand.competitors || []) as BrandCompetitor[];

  const newCompetitor: BrandCompetitor = {
    name: discovery.competitorName,
    url: discovery.competitorDomain || "",
    reason: `Auto-discovered via ${discovery.discoveryMethod} (${Math.round(discovery.confidenceScore * 100)}% confidence)`,
  };
  existingCompetitors.push(newCompetitor);

  // Update brand and discovery record
  await Promise.all([
    db
      .update(brands)
      .set({ competitors: existingCompetitors as BrandCompetitor[] })
      .where(eq(brands.id, brandId)),
    db
      .update(discoveredCompetitors)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(discoveredCompetitors.id, discoveryId)),
  ]);
}

/**
 * Reject a discovered competitor
 */
export async function rejectDiscoveredCompetitor(
  discoveryId: string,
  brandId: string,
  reason?: string
): Promise<void> {
  await db
    .update(discoveredCompetitors)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(discoveredCompetitors.id, discoveryId),
        eq(discoveredCompetitors.brandId, brandId)
      )
    );
}

/**
 * Get discovered competitors for a brand
 */
export async function getDiscoveredCompetitors(
  brandId: string,
  status?: "pending" | "confirmed" | "rejected"
): Promise<typeof discoveredCompetitors.$inferSelect[]> {
  const conditions = [eq(discoveredCompetitors.brandId, brandId)];

  if (status) {
    conditions.push(eq(discoveredCompetitors.status, status));
  }

  return db.query.discoveredCompetitors.findMany({
    where: and(...conditions),
    orderBy: [
      desc(discoveredCompetitors.confidenceScore),
      desc(discoveredCompetitors.createdAt),
    ],
  });
}

/**
 * Run full discovery process for a brand
 * Discovers new competitors and stores them
 */
export async function runDiscoveryProcess(
  brandId: string,
  options: DiscoveryOptions = {}
): Promise<{
  discovered: number;
  stored: string[];
}> {
  // Discover competitors
  const discoveries = await discoverCompetitors(brandId, options);

  // Store in database
  const storedIds = await storeDiscoveredCompetitors(brandId, discoveries);

  return {
    discovered: discoveries.length,
    stored: storedIds,
  };
}
