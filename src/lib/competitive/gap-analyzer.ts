/**
 * Competitive Gap Analyzer
 * Phase 5: Identify opportunities where competitors rank but brand doesn't
 *
 * Analyzes keyword gaps, content gaps, schema gaps, and topic gaps.
 */

import { db } from "@/lib/db";
import {
  brandMentions,
  brands,
  competitiveGaps,
  type NewCompetitiveGap,
} from "@/lib/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";

// Types
export interface GapType {
  type: "keyword" | "topic" | "schema" | "content";
  label: string;
  description: string;
}

export const GAP_TYPES: GapType[] = [
  {
    type: "keyword",
    label: "Keyword Gaps",
    description: "Keywords where competitors appear in AI responses but you don't",
  },
  {
    type: "topic",
    label: "Topic Gaps",
    description: "Topics/categories where competitors have visibility",
  },
  {
    type: "schema",
    label: "Schema Gaps",
    description: "Schema markup types competitors have but you're missing",
  },
  {
    type: "content",
    label: "Content Gaps",
    description: "Content types competitors are cited for",
  },
];

export interface GapOpportunity {
  id?: string;
  type: "keyword" | "topic" | "schema" | "content";
  keyword?: string;
  topic?: string;
  description: string;
  competitor: string;
  competitorPosition?: number;
  competitorUrl?: string;
  searchVolume?: number;
  difficulty?: number;
  opportunity: number; // 1-100 priority score
  isResolved: boolean;
  discoveredAt: Date;
}

export interface GapAnalysisReport {
  brandId: string;
  analyzedAt: Date;
  summary: {
    totalGaps: number;
    newGaps: number;
    resolvedGaps: number;
    highPriorityCount: number;
    byType: Record<string, number>;
  };
  gaps: GapOpportunity[];
  recommendations: string[];
}

export interface CompetitorCoverage {
  competitor: string;
  uniqueKeywords: string[];
  uniqueTopics: string[];
  overlapKeywords: string[];
  coverageScore: number; // How much they cover that you don't
}

/**
 * Analyze competitive gaps for a brand
 */
export async function analyzeGaps(brandId: string): Promise<GapAnalysisReport> {
  // Get brand info with competitors
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const competitors = (brand.competitors || []) as Array<{
    name: string;
    url: string;
  }>;

  // Get all brand mentions
  const mentions = await db.query.brandMentions.findMany({
    where: eq(brandMentions.brandId, brandId),
    orderBy: desc(brandMentions.timestamp),
    limit: 1000,
  });

  // Extract brand's keyword coverage
  const brandKeywords = new Set<string>();
  const brandTopics = new Set<string>();

  for (const mention of mentions) {
    // Add query as keyword
    brandKeywords.add(normalizeKeyword(mention.query));

    // Add topics
    const topics = mention.topics || [];
    for (const topic of topics) {
      brandTopics.add(topic.toLowerCase());
    }
  }

  // Analyze competitor coverage from mentions
  const competitorKeywords = new Map<string, Set<string>>();
  const competitorTopics = new Map<string, Set<string>>();

  for (const mention of mentions) {
    const compMentions = mention.competitors || [];
    for (const comp of compMentions) {
      const compName = comp.name.toLowerCase();

      if (!competitorKeywords.has(compName)) {
        competitorKeywords.set(compName, new Set());
        competitorTopics.set(compName, new Set());
      }

      competitorKeywords.get(compName)!.add(normalizeKeyword(mention.query));

      const topics = mention.topics || [];
      for (const topic of topics) {
        competitorTopics.get(compName)!.add(topic.toLowerCase());
      }
    }
  }

  // Find gaps
  const gaps: GapOpportunity[] = [];

  // Keyword gaps: keywords competitors rank for that brand doesn't
  for (const [compName, keywords] of competitorKeywords) {
    for (const keyword of keywords) {
      if (!brandKeywords.has(keyword)) {
        const opportunity = calculateOpportunity(keyword, compName, mentions);
        gaps.push({
          type: "keyword",
          keyword,
          description: `"${compName}" appears for "${keyword}" queries, but your brand doesn't`,
          competitor: compName,
          opportunity,
          isResolved: false,
          discoveredAt: new Date(),
        });
      }
    }
  }

  // Topic gaps: topics competitors are associated with
  for (const [compName, topics] of competitorTopics) {
    for (const topic of topics) {
      if (!brandTopics.has(topic)) {
        gaps.push({
          type: "topic",
          topic,
          description: `"${compName}" is associated with "${topic}" topic, but your brand isn't`,
          competitor: compName,
          opportunity: 60, // Default topic opportunity
          isResolved: false,
          discoveredAt: new Date(),
        });
      }
    }
  }

  // Deduplicate gaps by keyword/topic
  const uniqueGaps = deduplicateGaps(gaps);

  // Sort by opportunity score
  uniqueGaps.sort((a, b) => b.opportunity - a.opportunity);

  // Limit to top gaps
  const topGaps = uniqueGaps.slice(0, 50);

  // Calculate summary
  const summary = {
    totalGaps: topGaps.length,
    newGaps: topGaps.length, // All are new in this analysis
    resolvedGaps: 0,
    highPriorityCount: topGaps.filter((g) => g.opportunity >= 70).length,
    byType: {
      keyword: topGaps.filter((g) => g.type === "keyword").length,
      topic: topGaps.filter((g) => g.type === "topic").length,
      schema: topGaps.filter((g) => g.type === "schema").length,
      content: topGaps.filter((g) => g.type === "content").length,
    },
  };

  // Generate recommendations
  const recommendations = generateGapRecommendations(topGaps, brand.name);

  return {
    brandId,
    analyzedAt: new Date(),
    summary,
    gaps: topGaps,
    recommendations,
  };
}

/**
 * Store gaps in the database
 */
export async function storeGaps(
  brandId: string,
  gaps: GapOpportunity[]
): Promise<void> {
  for (const gap of gaps) {
    const gapRecord: NewCompetitiveGap = {
      brandId,
      gapType: gap.type,
      keyword: gap.keyword,
      topic: gap.topic,
      description: gap.description,
      competitorName: gap.competitor,
      competitorPosition: gap.competitorPosition,
      competitorUrl: gap.competitorUrl,
      searchVolume: gap.searchVolume,
      difficulty: gap.difficulty,
      opportunity: gap.opportunity,
      isResolved: false,
    };

    await db.insert(competitiveGaps).values(gapRecord);
  }
}

/**
 * Get existing gaps for a brand
 */
export async function getExistingGaps(
  brandId: string,
  options?: {
    type?: string;
    resolved?: boolean;
    minOpportunity?: number;
    limit?: number;
  }
): Promise<GapOpportunity[]> {
  let query = db.query.competitiveGaps.findMany({
    where: and(
      eq(competitiveGaps.brandId, brandId),
      options?.type ? eq(competitiveGaps.gapType, options.type) : undefined,
      options?.resolved !== undefined
        ? eq(competitiveGaps.isResolved, options.resolved)
        : undefined
    ),
    orderBy: desc(competitiveGaps.opportunity),
    limit: options?.limit || 50,
  });

  const results = await query;

  return results.map((gap) => ({
    id: gap.id,
    type: gap.gapType as "keyword" | "topic" | "schema" | "content",
    keyword: gap.keyword || undefined,
    topic: gap.topic || undefined,
    description: gap.description,
    competitor: gap.competitorName,
    competitorPosition: gap.competitorPosition || undefined,
    competitorUrl: gap.competitorUrl || undefined,
    searchVolume: gap.searchVolume || undefined,
    difficulty: gap.difficulty || undefined,
    opportunity: gap.opportunity || 50,
    isResolved: gap.isResolved,
    discoveredAt: gap.discoveredAt,
  }));
}

/**
 * Mark a gap as resolved
 */
export async function resolveGap(gapId: string): Promise<void> {
  await db
    .update(competitiveGaps)
    .set({
      isResolved: true,
      resolvedAt: new Date(),
    })
    .where(eq(competitiveGaps.id, gapId));
}

/**
 * Get competitor coverage analysis
 */
export async function getCompetitorCoverage(
  brandId: string
): Promise<CompetitorCoverage[]> {
  // Get brand info
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const competitors = (brand.competitors || []) as Array<{
    name: string;
    url: string;
  }>;

  // Get mentions
  const mentions = await db.query.brandMentions.findMany({
    where: eq(brandMentions.brandId, brandId),
    limit: 500,
  });

  // Build brand's keyword set
  const brandKeywords = new Set<string>();
  for (const mention of mentions) {
    brandKeywords.add(normalizeKeyword(mention.query));
  }

  // Analyze each competitor
  const coverages: CompetitorCoverage[] = [];

  for (const competitor of competitors) {
    const compKeywords = new Set<string>();
    const overlapKeywords: string[] = [];
    const uniqueKeywords: string[] = [];

    for (const mention of mentions) {
      const compMentions = mention.competitors || [];
      const found = compMentions.find(
        (c) => c.name.toLowerCase() === competitor.name.toLowerCase()
      );

      if (found) {
        const keyword = normalizeKeyword(mention.query);
        compKeywords.add(keyword);

        if (brandKeywords.has(keyword)) {
          if (!overlapKeywords.includes(keyword)) {
            overlapKeywords.push(keyword);
          }
        } else {
          if (!uniqueKeywords.includes(keyword)) {
            uniqueKeywords.push(keyword);
          }
        }
      }
    }

    // Calculate coverage score (how much they have that we don't)
    const coverageScore =
      compKeywords.size > 0
        ? (uniqueKeywords.length / compKeywords.size) * 100
        : 0;

    coverages.push({
      competitor: competitor.name,
      uniqueKeywords,
      uniqueTopics: [], // Would need topic extraction
      overlapKeywords,
      coverageScore: Math.round(coverageScore * 100) / 100,
    });
  }

  // Sort by coverage score (highest gaps first)
  coverages.sort((a, b) => b.coverageScore - a.coverageScore);

  return coverages;
}

/**
 * Get gap trends over time
 */
export async function getGapTrends(
  brandId: string,
  days: number = 30
): Promise<{
  total: number[];
  byType: Record<string, number[]>;
  dates: string[];
}> {
  const dates: string[] = [];
  const total: number[] = [];
  const byType: Record<string, number[]> = {
    keyword: [],
    topic: [],
    schema: [],
    content: [],
  };

  // Generate date range
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dates.push(dateStr);

    // For now, return placeholder data
    // In production, this would query historical gap counts
    total.push(0);
    byType.keyword.push(0);
    byType.topic.push(0);
    byType.schema.push(0);
    byType.content.push(0);
  }

  // Get actual gap counts grouped by date
  const gaps = await db.query.competitiveGaps.findMany({
    where: eq(competitiveGaps.brandId, brandId),
  });

  // Populate data from actual gaps
  for (const gap of gaps) {
    const gapDate = gap.discoveredAt.toISOString().split("T")[0];
    const dateIndex = dates.indexOf(gapDate);

    if (dateIndex !== -1) {
      total[dateIndex]++;
      if (byType[gap.gapType]) {
        byType[gap.gapType][dateIndex]++;
      }
    }
  }

  return { total, byType, dates };
}

// Helper functions

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim().replace(/\s+/g, " ");
}

function calculateOpportunity(
  keyword: string,
  competitor: string,
  mentions: Array<{ query: string; competitors: Array<{ name: string; position: number }> | null }>
): number {
  // Base opportunity score
  let score = 50;

  // Count how often competitor appears for this keyword
  let appearanceCount = 0;
  let totalPositions = 0;

  for (const mention of mentions) {
    if (normalizeKeyword(mention.query) === keyword) {
      const compMentions = mention.competitors || [];
      const found = compMentions.find(
        (c) => c.name.toLowerCase() === competitor.toLowerCase()
      );
      if (found) {
        appearanceCount++;
        if (found.position) {
          totalPositions += found.position;
        }
      }
    }
  }

  // Higher appearance count = higher opportunity
  if (appearanceCount >= 5) {
    score += 30;
  } else if (appearanceCount >= 3) {
    score += 20;
  } else if (appearanceCount >= 1) {
    score += 10;
  }

  // Better competitor position = higher opportunity
  if (appearanceCount > 0) {
    const avgPosition = totalPositions / appearanceCount;
    if (avgPosition <= 2) {
      score += 20;
    } else if (avgPosition <= 5) {
      score += 10;
    }
  }

  return Math.min(100, Math.max(0, score));
}

function deduplicateGaps(gaps: GapOpportunity[]): GapOpportunity[] {
  const seen = new Map<string, GapOpportunity>();

  for (const gap of gaps) {
    const key =
      gap.type === "keyword"
        ? `keyword:${gap.keyword}`
        : gap.type === "topic"
        ? `topic:${gap.topic}`
        : `${gap.type}:${gap.description}`;

    const existing = seen.get(key);
    if (!existing || gap.opportunity > existing.opportunity) {
      seen.set(key, gap);
    }
  }

  return Array.from(seen.values());
}

function generateGapRecommendations(
  gaps: GapOpportunity[],
  brandName: string
): string[] {
  const recommendations: string[] = [];

  // Count gaps by type
  const keywordGaps = gaps.filter((g) => g.type === "keyword");
  const topicGaps = gaps.filter((g) => g.type === "topic");
  const highPriorityGaps = gaps.filter((g) => g.opportunity >= 70);

  if (highPriorityGaps.length > 0) {
    recommendations.push(
      `Found ${highPriorityGaps.length} high-priority gaps. Focus on these first to quickly improve visibility.`
    );
  }

  if (keywordGaps.length > 10) {
    const topKeywords = keywordGaps
      .slice(0, 3)
      .map((g) => g.keyword)
      .filter(Boolean);
    recommendations.push(
      `Create content targeting keywords: "${topKeywords.join('", "')}" where competitors currently rank.`
    );
  }

  if (topicGaps.length > 5) {
    const topTopics = topicGaps
      .slice(0, 3)
      .map((g) => g.topic)
      .filter(Boolean);
    recommendations.push(
      `Expand into topics: "${topTopics.join('", "')}" to match competitor coverage.`
    );
  }

  // Competitor-specific recommendations
  const competitorGapCount = new Map<string, number>();
  for (const gap of gaps) {
    const count = competitorGapCount.get(gap.competitor) || 0;
    competitorGapCount.set(gap.competitor, count + 1);
  }

  const topCompetitor = [...competitorGapCount.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topCompetitor && topCompetitor[1] > 5) {
    recommendations.push(
      `"${topCompetitor[0]}" has ${topCompetitor[1]} keywords/topics you're missing. Analyze their content strategy.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `Great coverage! Continue monitoring for new competitive opportunities.`
    );
  }

  return recommendations;
}
