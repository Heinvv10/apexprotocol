/**
 * What-if score simulator (🏆 FR-INT-002).
 *
 * Takes a current audit score decomposition + a proposed change
 * (add FAQ, add schema, improve readability) and returns the predicted
 * new decomposition without actually running a full audit.
 *
 * Two prediction paths:
 *   1. Heuristic — each change type has a typical factor-score delta based
 *      on our historical audit data. Fast, deterministic, no LLM cost.
 *   2. LLM-grounded — for changes we can't pattern-match, ask Claude to
 *      estimate the delta given the change description + current evidence.
 *
 * We default to heuristic and fall back to LLM only when the change type
 * is unknown. The UI shows which path produced the prediction so users
 * can calibrate trust.
 */

import {
  composeDecomposition,
  AUDIT_FACTORS,
  type FactorKey,
  type FactorInput,
  type ScoreDecomposition,
} from "./score-decomposition";
import { chat } from "@/lib/llm/client";
import { logger } from "@/lib/logger";

export type ChangeType =
  | "add_faq_schema"
  | "add_article_schema"
  | "add_organization_schema"
  | "add_breadcrumb_schema"
  | "add_llms_txt"
  | "improve_headings"
  | "add_q_and_a_blocks"
  | "reduce_sentence_length"
  | "reduce_passive_voice"
  | "add_meta_description"
  | "add_open_graph"
  | "fix_canonical"
  | "add_alt_text"
  | "improve_keyboard_nav"
  | "custom";

export interface ProposedChange {
  type: ChangeType;
  /** Free-form description — used for LLM path when type is "custom" or to
   *  modulate the heuristic delta for partial changes. */
  description?: string;
  /** Where in the site the change applies — the UI surfaces this to avoid
   *  users confusing "add FAQ to /pricing" vs. "add FAQ site-wide". */
  scope?: "page" | "section" | "site";
}

export interface WhatIfPrediction {
  /** The current decomposition we simulated against */
  before: ScoreDecomposition;
  /** Predicted decomposition after the change lands */
  after: ScoreDecomposition;
  /** Predicted delta on overall */
  overallDelta: number;
  /** Per-factor deltas in raw-score points */
  factorDeltas: Record<FactorKey, number>;
  /** How confident we are — 0..1 */
  confidence: number;
  /** Which path produced this prediction */
  method: "heuristic" | "llm" | "hybrid";
  /** Human-readable explanation */
  rationale: string;
}

/**
 * Heuristic deltas per change type. Numbers reflect the typical boost we've
 * observed when the matching factor was previously underscored — capped by
 * current raw so predictions stop climbing once you've maxed a factor.
 *
 * These are a starting pattern library, not the final word. As we accumulate
 * before/after telemetry from real implementations (via FR-REC-007 lift
 * measurement), we should replace these numbers with empirical averages.
 */
const HEURISTIC_DELTAS: Record<
  Exclude<ChangeType, "custom">,
  { factor: FactorKey; delta: number; confidence: number; note: string }
> = {
  add_faq_schema: {
    factor: "schema",
    delta: 15,
    confidence: 0.85,
    note: "FAQPage schema is one of the highest-leverage AI-extraction signals.",
  },
  add_article_schema: {
    factor: "schema",
    delta: 8,
    confidence: 0.8,
    note: "Article schema clarifies content type for LLM crawlers.",
  },
  add_organization_schema: {
    factor: "schema",
    delta: 5,
    confidence: 0.75,
    note: "Organization schema anchors brand entity resolution.",
  },
  add_breadcrumb_schema: {
    factor: "schema",
    delta: 4,
    confidence: 0.7,
    note: "BreadcrumbList helps LLMs understand site hierarchy.",
  },
  add_llms_txt: {
    factor: "schema",
    delta: 6,
    confidence: 0.6,
    note: "llms.txt adoption is still early — real lift depends on crawler support.",
  },
  improve_headings: {
    factor: "structure",
    delta: 10,
    confidence: 0.8,
    note: "Clear H1→H2→H3 hierarchy drives citation extraction.",
  },
  add_q_and_a_blocks: {
    factor: "structure",
    delta: 12,
    confidence: 0.85,
    note: "Q→A blocks match how answer engines format responses.",
  },
  reduce_sentence_length: {
    factor: "clarity",
    delta: 8,
    confidence: 0.75,
    note: "Shorter sentences improve Flesch-Kincaid and LLM comprehension.",
  },
  reduce_passive_voice: {
    factor: "clarity",
    delta: 6,
    confidence: 0.7,
    note: "Active voice is easier for LLMs to attribute to the subject.",
  },
  add_meta_description: {
    factor: "metadata",
    delta: 7,
    confidence: 0.8,
    note: "Meta descriptions still matter for some AI crawlers' first-pass ranking.",
  },
  add_open_graph: {
    factor: "metadata",
    delta: 5,
    confidence: 0.7,
    note: "Open Graph improves citation-preview quality.",
  },
  fix_canonical: {
    factor: "metadata",
    delta: 4,
    confidence: 0.75,
    note: "Canonical dedup prevents duplicate-citation noise.",
  },
  add_alt_text: {
    factor: "accessibility",
    delta: 6,
    confidence: 0.75,
    note: "Alt text is pure accessibility signal — strong for A11y score.",
  },
  improve_keyboard_nav: {
    factor: "accessibility",
    delta: 5,
    confidence: 0.7,
    note: "Keyboard-accessible navigation signals thoughtful a11y.",
  },
};

interface SimulateArgs {
  before: ScoreDecomposition;
  changes: ProposedChange[];
  /** Only call the LLM path for custom changes — default true */
  allowLLM?: boolean;
  tenantId?: string | null;
  brandId?: string | null;
}

export async function simulate(args: SimulateArgs): Promise<WhatIfPrediction> {
  const factorDeltas: Record<FactorKey, number> = {
    schema: 0,
    structure: 0,
    clarity: 0,
    metadata: 0,
    accessibility: 0,
  };
  const notes: string[] = [];
  const confidences: number[] = [];
  let usedLLM = false;
  let usedHeuristic = false;

  for (const change of args.changes) {
    if (change.type === "custom") {
      if (args.allowLLM !== false) {
        const est = await estimateViaLLM(change, args.before, {
          tenantId: args.tenantId,
          brandId: args.brandId,
        });
        factorDeltas[est.factor] += est.delta;
        confidences.push(est.confidence);
        notes.push(est.note);
        usedLLM = true;
      } else {
        notes.push(
          `Skipped "${change.description ?? "custom change"}" — LLM path disabled.`,
        );
        confidences.push(0.1);
      }
      continue;
    }

    const heuristic = HEURISTIC_DELTAS[change.type];
    if (!heuristic) continue;
    factorDeltas[heuristic.factor] += heuristic.delta;
    confidences.push(heuristic.confidence);
    notes.push(heuristic.note);
    usedHeuristic = true;
  }

  // Apply deltas, capped at factor maxRawScore
  const beforeByKey = new Map(args.before.factors.map((f) => [f.key, f]));
  const afterInputs: FactorInput[] = (Object.keys(AUDIT_FACTORS) as FactorKey[]).map(
    (key) => {
      const before = beforeByKey.get(key);
      const raw = before?.rawScore ?? 0;
      const capped = Math.min(
        raw + factorDeltas[key],
        AUDIT_FACTORS[key].maxRawScore,
      );
      return {
        key,
        rawScore: capped,
        evidence: before?.evidence ?? [],
      };
    },
  );

  const after = composeDecomposition(afterInputs);
  const overallDelta = after.overall - args.before.overall;

  // Overall confidence: geometric mean of per-change confidences, damped
  // by the number of changes (uncertainty compounds).
  const meanConf =
    confidences.length === 0
      ? 0
      : confidences.reduce((acc, c) => acc * c, 1) ** (1 / confidences.length);
  const changesPenalty =
    args.changes.length <= 1 ? 1 : 1 / Math.sqrt(args.changes.length);
  const confidence = Math.max(0, Math.min(1, meanConf * changesPenalty));

  const method: WhatIfPrediction["method"] =
    usedLLM && usedHeuristic ? "hybrid" : usedLLM ? "llm" : "heuristic";

  return {
    before: args.before,
    after,
    overallDelta,
    factorDeltas,
    confidence: Number(confidence.toFixed(2)),
    method,
    rationale: notes.join(" "),
  };
}

async function estimateViaLLM(
  change: ProposedChange,
  before: ScoreDecomposition,
  ctx: { tenantId?: string | null; brandId?: string | null },
): Promise<{ factor: FactorKey; delta: number; confidence: number; note: string }> {
  const factorLabels = before.factors
    .map((f) => `${f.key}: ${f.rawScore}/100`)
    .join(", ");

  try {
    const response = await chat({
      model: "claude-haiku-4-5",
      tenantId: ctx.tenantId,
      brandId: ctx.brandId,
      operation: "audit.what_if.llm_estimate",
      temperature: 0.2,
      maxTokens: 400,
      messages: [
        {
          role: "system",
          content: `You estimate the effect of a proposed content/schema change on an AI-readiness audit score. Return a single JSON object with: factor (one of: schema, structure, clarity, metadata, accessibility), delta (integer 0-20, signed; positive = score increase), confidence (0..1), note (one short sentence). Be conservative.`,
        },
        {
          role: "user",
          content: `Current factor scores: ${factorLabels}.\n\nProposed change: "${change.description ?? change.type}" (scope: ${change.scope ?? "page"}).\n\nReturn the JSON estimate now.`,
        },
      ],
    });

    const cleaned = response.content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as {
      factor: string;
      delta: number;
      confidence: number;
      note: string;
    };
    const validFactors = new Set<FactorKey>([
      "schema",
      "structure",
      "clarity",
      "metadata",
      "accessibility",
    ]);
    if (!validFactors.has(parsed.factor as FactorKey)) {
      throw new Error(`bad factor: ${parsed.factor}`);
    }
    return {
      factor: parsed.factor as FactorKey,
      delta: Math.max(-20, Math.min(20, Math.round(parsed.delta))),
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      note: parsed.note,
    };
  } catch (err) {
    logger.warn("what_if.llm_estimate_failed", {
      change: change.type,
      err: (err as Error).message,
    });
    // Honest-empty fallback: no delta, low confidence.
    return {
      factor: "schema",
      delta: 0,
      confidence: 0.1,
      note: `Could not estimate impact of "${change.description ?? change.type}"; assumed neutral.`,
    };
  }
}
