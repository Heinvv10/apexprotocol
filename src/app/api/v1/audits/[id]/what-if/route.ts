/**
 * POST /api/v1/audits/:id/what-if
 *
 * Predicts score delta for a list of proposed changes (FR-INT-002, 🏆).
 *
 * Body:
 *   { "changes": [
 *       { "type": "add_faq_schema", "scope": "page" },
 *       { "type": "custom", "description": "Rewrite intro with concrete examples" }
 *     ],
 *     "allow_llm": true }
 *
 * Returns before/after decomposition + overall delta + per-factor deltas +
 * confidence + method (heuristic/llm/hybrid).
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { audits, brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import {
  composeDecomposition,
  type FactorInput,
  type FactorKey,
} from "@/lib/audit/score-decomposition";
import { simulate } from "@/lib/audit/what-if-simulator";

const ChangeSchema = z.object({
  type: z.enum([
    "add_faq_schema",
    "add_article_schema",
    "add_organization_schema",
    "add_breadcrumb_schema",
    "add_llms_txt",
    "improve_headings",
    "add_q_and_a_blocks",
    "reduce_sentence_length",
    "reduce_passive_voice",
    "add_meta_description",
    "add_open_graph",
    "fix_canonical",
    "add_alt_text",
    "improve_keyboard_nav",
    "custom",
  ]),
  description: z.string().max(1000).optional(),
  scope: z.enum(["page", "section", "site"]).optional(),
});

const BodySchema = z.object({
  changes: z.array(ChangeSchema).min(1).max(20),
  allow_llm: z.boolean().optional(),
});

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

export const POST = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "invalid_request",
        "Validation failed.",
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join("; ") : String(v),
          ]),
        ),
      );
    }

    const rows = await db
      .select({ audit: audits })
      .from(audits)
      .innerJoin(brands, eq(brands.id, audits.brandId))
      .where(
        and(eq(audits.id, id), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (rows.length === 0) {
      throw new ApiError("not_found", "Audit not found.");
    }

    const a = rows[0].audit;
    const categoryScores = (a.categoryScores ?? []) as Array<{
      category: string;
      score: number;
    }>;

    // Rebuild the current decomposition (same mapping rules as
    // GET /audits/:id/decomposition)
    const inputs: FactorInput[] = [];
    const seen = new Set<FactorKey>();
    for (const cs of categoryScores) {
      const key = FACTOR_MAP[cs.category];
      if (!key || seen.has(key)) continue;
      seen.add(key);
      inputs.push({ key, rawScore: cs.score, evidence: [] });
    }
    // Backfill missing factors
    for (const key of ["schema", "structure", "clarity", "metadata", "accessibility"] as FactorKey[]) {
      if (!seen.has(key)) {
        inputs.push({ key, rawScore: 0, evidence: [] });
      }
    }
    const before = composeDecomposition(inputs);

    const prediction = await simulate({
      before,
      changes: parsed.data.changes,
      allowLLM: parsed.data.allow_llm,
      tenantId: auth.tenantId,
      brandId: a.brandId,
    });

    return NextResponse.json({
      data: {
        audit_id: a.id,
        brand_id: a.brandId,
        before: {
          overall: prediction.before.overall,
          factors: prediction.before.factors.map((f) => ({
            key: f.key,
            label: f.label,
            raw_score: f.rawScore,
            weighted_contribution: f.weightedContribution,
          })),
        },
        after: {
          overall: prediction.after.overall,
          factors: prediction.after.factors.map((f) => ({
            key: f.key,
            label: f.label,
            raw_score: f.rawScore,
            weighted_contribution: f.weightedContribution,
          })),
          narrative: prediction.after.narrative,
        },
        overall_delta: prediction.overallDelta,
        factor_deltas: prediction.factorDeltas,
        confidence: prediction.confidence,
        method: prediction.method,
        rationale: prediction.rationale,
      },
    });
  },
);
