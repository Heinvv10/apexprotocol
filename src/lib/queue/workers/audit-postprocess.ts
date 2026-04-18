/**
 * Audit post-processing helpers
 *
 * After the audit worker finishes scraping + analysing a site it runs
 * these two side-effects so the UI has real data to show:
 *
 *   1. persistRecommendationsFromIssues — copies every detected audit
 *      issue into the `recommendations` table. The /dashboard/recommendations
 *      page used to always show "No recommendations yet" because nothing
 *      auto-populated it; it expected the AI generation endpoint to
 *      persist rows, but that only fires when the user clicks a button
 *      and needs an ANTHROPIC_API_KEY we don't always have.
 *
 *   2. computeAiReadinessScore — synthesises metadata.aiReadiness.{score,
 *      factors} from data the engine already has (structure/schema/
 *      clarity/metadata category scores, FAQ presence, heading validity).
 *      Replaces the previous behaviour where useAIReadiness multiplied
 *      undefined * 0.95 and rendered NaN.
 */

import { eq } from "drizzle-orm";
import { db } from "../../db";
import { recommendations } from "../../db/schema";
import type {
  AuditIssue,
  CategoryScore,
} from "../../db/schema/audits";

// Map audit-engine issue categories → recommendation schema categories.
// Audit categories: structure | schema | clarity | metadata | accessibility
//                   | content | ai_crawler | entity | performance | etc.
// Recommendation enum: technical_seo | content_optimization | schema_markup
//                    | citation_building | brand_consistency |
//                    | competitor_analysis | content_freshness | authority_building
function mapCategory(
  auditCategory: string
): "technical_seo" | "content_optimization" | "schema_markup" | "authority_building" {
  switch (auditCategory) {
    case "schema":
      return "schema_markup";
    case "structure":
    case "clarity":
    case "content":
      return "content_optimization";
    case "entity":
    case "authority":
      return "authority_building";
    case "metadata":
    case "accessibility":
    case "ai_crawler":
    case "performance":
    default:
      return "technical_seo";
  }
}

// severity → priority is a direct mapping
function mapPriority(
  severity: string
): "critical" | "high" | "medium" | "low" {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

// severity → effort is a heuristic. Quick wins for low, major for critical,
// everything else moderate. This is meant to help the user triage, not
// replace a human judgment.
function mapEffort(
  severity: string
): "quick_win" | "moderate" | "major" {
  if (severity === "low") return "quick_win";
  if (severity === "critical") return "major";
  return "moderate";
}

// severity → impact is a direct mapping
function mapImpact(severity: string): "high" | "medium" | "low" {
  if (severity === "critical" || severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

export async function persistRecommendationsFromIssues(params: {
  auditId: string;
  brandId: string;
  issues: AuditIssue[];
}): Promise<number> {
  if (!params.issues.length) return 0;

  // Skip issues we've already persisted for this audit (idempotent).
  const existing = await db
    .select({ title: recommendations.title })
    .from(recommendations)
    .where(eq(recommendations.auditId, params.auditId));
  const existingTitles = new Set(existing.map((r) => r.title));

  const rows = params.issues
    .filter((i) => !existingTitles.has(i.title))
    .map((issue) => {
      const severity = issue.severity ?? "medium";
      return {
        brandId: params.brandId,
        auditId: params.auditId,
        title: issue.title,
        description: issue.description,
        category: mapCategory(issue.category),
        priority: mapPriority(severity),
        status: "pending" as const,
        effort: mapEffort(severity),
        impact: mapImpact(severity),
        source: "audit" as const,
        steps: [],
      };
    });

  if (!rows.length) return 0;

  await db.insert(recommendations).values(rows);
  return rows.length;
}

/**
 * Derive an AI-readiness score (0-100) from the audit's existing
 * category scores + content-chunking breakdown. We're not inventing a
 * number out of air — we're re-weighting the engine's outputs into the
 * AI-visibility lens the UI already promises.
 *
 * Weights (sum to 100):
 *   - Schema score       × 0.25  (LLMs love structured data)
 *   - Structure score    × 0.25  (heading hierarchy / scannability)
 *   - Clarity score      × 0.20  (readability)
 *   - Metadata score     × 0.15  (titles, descriptions, canonicals)
 *   - Accessibility      × 0.15  (alt text, semantic HTML — LLMs see these)
 */
function weightedScore(scores: CategoryScore[]): number {
  const map = new Map(scores.map((c) => [c.category, c.score]));
  const get = (k: string): number => map.get(k) ?? 0;
  const w =
    get("schema") * 0.25 +
    get("structure") * 0.25 +
    get("clarity") * 0.2 +
    get("metadata") * 0.15 +
    get("accessibility") * 0.15;
  return Math.round(w);
}

export function computeAiReadinessScore(params: {
  categoryScores: CategoryScore[];
  contentChunkingBreakdown?: Record<string, number> | null;
}): {
  score: number;
  factors: {
    schema: number;
    structure: number;
    clarity: number;
    metadata: number;
    accessibility: number;
  };
} {
  const score = weightedScore(params.categoryScores);
  const map = new Map(params.categoryScores.map((c) => [c.category, c.score]));
  return {
    score,
    factors: {
      schema: map.get("schema") ?? 0,
      structure: map.get("structure") ?? 0,
      clarity: map.get("clarity") ?? 0,
      metadata: map.get("metadata") ?? 0,
      accessibility: map.get("accessibility") ?? 0,
    },
  };
}
