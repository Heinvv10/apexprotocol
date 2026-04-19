/**
 * GET /api/v1/audits/:id/decomposition
 *
 * Explainable score decomposition for an audit — the "show the math"
 * endpoint (FR-INT-001, 🏆 category-leading).
 *
 * Derives factor scores from the audit's stored categoryScores + issues
 * and passes them through the canonical weights in score-decomposition.ts.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import {
  composeDecomposition,
  type FactorInput,
  type FactorKey,
  type EvidenceItem,
} from "@/lib/audit/score-decomposition";

const FACTOR_MAP: Record<string, FactorKey> = {
  schema: "schema",
  schema_markup: "schema",
  structure: "structure",
  content_structure: "structure",
  clarity: "clarity",
  readability: "clarity",
  metadata: "metadata",
  accessibility: "accessibility",
};

export const GET = withApiErrorHandling(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id } = await params;

    const rows = await db
      .select({ audit: audits })
      .from(audits)
      .innerJoin(brands, eq(brands.id, audits.brandId))
      .where(
        and(eq(audits.id, id), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new ApiError("not_found", `Audit "${id}" not found.`);
    }
    const a = rows[0].audit;

    // Map the audit's category_scores into our canonical factor inputs.
    const categoryScores = (a.categoryScores ?? []) as Array<{
      category: string;
      score: number;
      maxScore?: number;
      issues?: number;
    }>;

    const issues = (a.issues ?? []) as Array<{
      id?: string;
      severity?: "critical" | "high" | "medium" | "low";
      category?: string;
      title?: string;
    }>;

    const seen = new Set<FactorKey>();
    const inputs: FactorInput[] = [];

    for (const cs of categoryScores) {
      const key = FACTOR_MAP[cs.category];
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const factorIssues = issues.filter(
        (i) => i.category && FACTOR_MAP[i.category] === key,
      );

      const evidence: EvidenceItem[] = factorIssues.slice(0, 8).map((i) => ({
        summary: i.title ?? `${i.severity ?? "issue"} in ${key}`,
        polarity: "negative" as const,
        weight:
          i.severity === "critical"
            ? 1
            : i.severity === "high"
              ? 0.7
              : i.severity === "medium"
                ? 0.4
                : 0.2,
        ref: i.id ? { kind: "issue" as const, id: i.id } : undefined,
      }));

      inputs.push({
        key,
        rawScore: cs.score,
        evidence,
      });
    }

    // Backfill any missing factors with null rawScore so the breakdown
    // still enumerates every weight — honest empty rather than omission.
    for (const key of Object.keys(FACTOR_MAP) as string[]) {
      const mapped = FACTOR_MAP[key];
      if (!seen.has(mapped)) {
        seen.add(mapped);
        inputs.push({ key: mapped, rawScore: 0, evidence: [] });
      }
    }

    const decomposition = composeDecomposition(inputs);

    return NextResponse.json({
      data: {
        audit_id: a.id,
        brand_id: a.brandId,
        computed_overall: decomposition.overall,
        stored_overall: a.overallScore,
        factors: decomposition.factors.map((f) => ({
          key: f.key,
          label: f.label,
          raw_score: f.rawScore,
          max_raw_score: f.maxRawScore,
          weight: f.weight,
          weighted_contribution: f.weightedContribution,
          evidence: f.evidence,
        })),
        narrative: decomposition.narrative,
        generated_at: decomposition.generatedAt,
      },
    });
  },
);
