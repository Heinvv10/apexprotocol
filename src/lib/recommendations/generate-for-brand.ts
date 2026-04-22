/**
 * Shared entrypoint: generate + persist AI recommendations for a brand.
 *
 * Pulls the latest completed audit, the last 100 AI-platform mentions, and
 * the brand's metadata, then asks Claude to synthesise a prioritised
 * recommendation list (with concrete `steps`). Writes through
 * createRecommendationsWithDuplicateDetection() so it is safe to call
 * repeatedly — the (brandId, title, category) dedup key prevents
 * overlapping rows with the simpler audit-rule recommendations already
 * persisted by persistRecommendationsFromIssues().
 *
 * Two callers:
 *   - audit-worker.ts (auto, gated by APEX_AUTO_AI_RECS)
 *   - POST /api/recommendations/generate (user-triggered)
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  audits,
  brandMentions,
  brands,
  type NewRecommendation,
} from "@/lib/db/schema";
import {
  generateAIRecommendations,
  type CompetitorMetrics,
  type ContentGap,
  type GeneratedRecommendation,
  type PlatformVisibility,
  type VisibilityData,
} from "@/lib/ai/recommendations";
import { createRecommendationsWithDuplicateDetection } from "@/lib/db/queries/recommendations";
import { logger } from "@/lib/logger";

const LOG_PREFIX = "[recommendations/generate-for-brand]";

export interface GenerateForBrandOptions {
  maxRecommendations?: number;
  minConfidence?: number;
  includeMonitor?: boolean;
  includeAudit?: boolean;
}

export interface GenerateForBrandResult {
  success: boolean;
  brandId: string;
  persisted: number;
  duplicatesSkipped: number;
  recommendations: GeneratedRecommendation[];
  tokenUsage?: { input: number; output: number };
  warning?: string;
  error?: string;
  sources: {
    monitorPlatforms: number;
    auditIncluded: boolean;
  };
}

export async function generateAndPersistRecommendationsForBrand(
  brandId: string,
  options: GenerateForBrandOptions = {},
): Promise<GenerateForBrandResult> {
  const {
    maxRecommendations = 50,
    minConfidence = 30,
    includeMonitor = true,
    includeAudit = true,
  } = options;

  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),
  });

  if (!brand) {
    return {
      success: false,
      brandId,
      persisted: 0,
      duplicatesSkipped: 0,
      recommendations: [],
      error: "Brand not found",
      sources: { monitorPlatforms: 0, auditIncluded: false },
    };
  }

  const platforms = includeMonitor
    ? await buildPlatformVisibility(brandId)
    : [];

  const latestAudit = includeAudit
    ? await db.query.audits.findFirst({
        where: and(eq(audits.brandId, brandId), eq(audits.status, "completed")),
        orderBy: [desc(audits.completedAt)],
      })
    : null;

  const contentGaps: ContentGap[] = latestAudit
    ? buildContentGaps(latestAudit, platforms)
    : [];

  const competitorData: CompetitorMetrics[] = [];

  const visibilityData: VisibilityData = {
    brandId,
    brandName: brand.name,
    platforms,
    contentGaps,
    competitorData,
  };

  const aiResult = await generateAIRecommendations(visibilityData, {
    maxRecommendations,
    minImpactThreshold: minConfidence,
  });

  if (!aiResult.success) {
    const insufficient = aiResult.error?.includes("Insufficient");
    return {
      success: insufficient ?? false,
      brandId,
      persisted: 0,
      duplicatesSkipped: 0,
      recommendations: [],
      warning: insufficient ? aiResult.error : undefined,
      error: insufficient ? undefined : aiResult.error,
      sources: {
        monitorPlatforms: platforms.length,
        auditIncluded: latestAudit !== null,
      },
    };
  }

  const rows: NewRecommendation[] = aiResult.recommendations.map((rec) => ({
    brandId,
    auditId: latestAudit?.id ?? null,
    title: rec.title,
    description: rec.description,
    category: rec.category,
    priority: rec.priority,
    impact: rec.impact,
    effort: rec.effort,
    status: "pending" as const,
    source: latestAudit ? ("audit" as const) : ("monitoring" as const),
    steps: (rec.steps || []).map((step, idx) => ({
      stepNumber: idx + 1,
      instruction:
        typeof step === "string"
          ? step
          : String((step as { instruction?: string })?.instruction ?? step),
    })),
    estimatedTime: rec.estimatedTimeframe,
    notes: `AI-generated. Expected outcome: ${rec.expectedOutcome}. Impact score: ${rec.impactScore}`,
  }));

  const persistResult = await createRecommendationsWithDuplicateDetection(rows);

  logger.info(`${LOG_PREFIX} completed`, {
    brandId,
    generated: aiResult.recommendations.length,
    persisted: persistResult.createdCount,
    duplicatesSkipped: persistResult.skippedCount,
    auditIncluded: latestAudit !== null,
    platforms: platforms.length,
  });

  return {
    success: true,
    brandId,
    persisted: persistResult.createdCount,
    duplicatesSkipped: persistResult.skippedCount,
    recommendations: aiResult.recommendations,
    tokenUsage: aiResult.tokenUsage,
    sources: {
      monitorPlatforms: platforms.length,
      auditIncluded: latestAudit !== null,
    },
  };
}

async function buildPlatformVisibility(
  brandId: string,
): Promise<PlatformVisibility[]> {
  const recentMentions = await db.query.brandMentions.findMany({
    where: eq(brandMentions.brandId, brandId),
    orderBy: [desc(brandMentions.timestamp)],
    limit: 100,
  });

  const groups = new Map<string, typeof recentMentions>();
  for (const m of recentMentions) {
    const list = groups.get(m.platform) ?? [];
    list.push(m);
    groups.set(m.platform, list);
  }

  const platforms: PlatformVisibility[] = [];
  for (const [platform, mentions] of groups) {
    const total = mentions.length || 1;
    const positions = mentions
      .map((m) => m.position)
      .filter((p): p is number => p !== null);
    const avgPosition =
      positions.length > 0
        ? Math.round(
            (positions.reduce((s, p) => s + p, 0) / positions.length) * 10,
          ) / 10
        : null;

    const positive = mentions.filter((m) => m.sentiment === "positive").length;
    const negative = mentions.filter((m) => m.sentiment === "negative").length;
    const sentimentScore = (positive - negative) / total;

    platforms.push({
      name: normalizePlatformName(platform),
      mentionRate: Math.round(
        (mentions.filter((m) => m.position !== null).length / total) * 100,
      ),
      averagePosition: avgPosition,
      sentiment:
        sentimentScore > 0.2
          ? "positive"
          : sentimentScore < -0.2
            ? "negative"
            : "neutral",
      citationFrequency: mentions.filter((m) => m.position !== null).length,
    });
  }

  return platforms;
}

function buildContentGaps(
  audit: { issues: unknown; categoryScores: unknown },
  platforms: PlatformVisibility[],
): ContentGap[] {
  const gaps: ContentGap[] = [];
  const issues =
    (audit.issues as Array<{
      category: string;
      severity: string;
      title: string;
      description: string;
    }>) ?? [];

  for (const issue of issues) {
    gaps.push({
      type: issue.category,
      description: `${issue.title}: ${issue.description}`,
      severity: mapIssueSeverity(issue.severity),
      affectedPlatforms: platformsAffectedByCategory(issue.category, platforms),
    });
  }

  const categoryScores =
    (audit.categoryScores as Array<{
      category: string;
      score: number;
      maxScore: number;
    }>) ?? [];

  for (const cs of categoryScores) {
    const pct = (cs.score / cs.maxScore) * 100;
    if (pct < 60) {
      gaps.push({
        type: `low_${cs.category}_score`,
        description: `${cs.category} score is ${Math.round(pct)}% (${cs.score}/${cs.maxScore})`,
        severity: pct < 30 ? "critical" : pct < 50 ? "high" : "medium",
        affectedPlatforms: platforms.map((p) => p.name),
      });
    }
  }

  return gaps;
}

function normalizePlatformName(platform: string): string {
  const n = platform.toLowerCase();
  if (n.includes("chatgpt") || n.includes("openai")) return "ChatGPT";
  if (n.includes("claude") || n.includes("anthropic")) return "Claude";
  if (n.includes("perplexity")) return "Perplexity";
  if (n.includes("gemini") || n.includes("google")) return "Gemini";
  return platform;
}

function mapIssueSeverity(
  severity: string,
): "critical" | "high" | "medium" | "low" {
  const s = severity.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high" || s === "error") return "high";
  if (s === "medium" || s === "warning") return "medium";
  return "low";
}

function platformsAffectedByCategory(
  category: string,
  platforms: PlatformVisibility[],
): string[] {
  const c = category.toLowerCase();
  if (c.includes("schema")) return platforms.map((p) => p.name);
  if (c.includes("seo") || c.includes("technical")) {
    return platforms.filter((p) => p.mentionRate < 50).map((p) => p.name);
  }
  return platforms.map((p) => p.name);
}
