/**
 * Explainable score decomposition — "show the math".
 *
 * Requirement: FR-INT-001 (🏆 category-leading).
 *
 * Every aggregate score in Apex has a breakdown: per-factor weight,
 * per-factor score, evidence citations pointing back to the underlying
 * signals. Competitors surface an opaque number; we expose the formula
 * so users can understand AND influence it.
 *
 * This module defines the canonical weights used across the product. The
 * same formula drives:
 *   - Audit overall score (audit/index.ts computeOverallScore)
 *   - AI readiness score (queue/workers/audit-postprocess)
 *   - Dashboard "why did my score change?" drill-down UI
 *
 * Changing weights here changes them everywhere. That is intentional.
 */

export type FactorKey =
  | "schema"
  | "structure"
  | "clarity"
  | "metadata"
  | "accessibility";

export interface FactorDefinition {
  key: FactorKey;
  label: string;
  description: string;
  /** 0..1 — contribution to the overall score */
  weight: number;
  /** What counts as "full credit" for this factor */
  maxRawScore: number;
}

/**
 * Canonical factor weights. Must sum to 1.0 across all factors.
 * Values mirror the AUDIT pillar spec (§4 of gap analysis): schema 25,
 * structure 25, clarity 20, metadata 15, accessibility 15.
 */
export const AUDIT_FACTORS: Readonly<Record<FactorKey, FactorDefinition>> = {
  schema: {
    key: "schema",
    label: "Schema markup",
    description:
      "Structured data (JSON-LD, microdata, llms.txt) that lets LLMs parse your content.",
    weight: 0.25,
    maxRawScore: 100,
  },
  structure: {
    key: "structure",
    label: "Content structure",
    description:
      "Heading hierarchy, FAQ blocks, Q&A formatting — patterns LLMs prefer to cite.",
    weight: 0.25,
    maxRawScore: 100,
  },
  clarity: {
    key: "clarity",
    label: "Clarity & readability",
    description:
      "Sentence length, paragraph structure, passive voice — readability for LLM extraction.",
    weight: 0.2,
    maxRawScore: 100,
  },
  metadata: {
    key: "metadata",
    label: "Metadata & discoverability",
    description:
      "Title tags, meta descriptions, Open Graph, canonical URLs.",
    weight: 0.15,
    maxRawScore: 100,
  },
  accessibility: {
    key: "accessibility",
    label: "Accessibility",
    description:
      "WCAG-level signals that also help automated extraction — alt text, ARIA, semantic HTML.",
    weight: 0.15,
    maxRawScore: 100,
  },
};

/** Sanity — enforce weights sum to 1.0 at module load */
{
  const sum = Object.values(AUDIT_FACTORS).reduce(
    (acc, f) => acc + f.weight,
    0,
  );
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(
      `AUDIT_FACTORS weights must sum to 1.0; got ${sum.toFixed(4)}. ` +
        "Update weights before shipping a new factor.",
    );
  }
}

export interface EvidenceItem {
  /** A human-readable signal quote */
  summary: string;
  /** "positive" raises the factor's score, "negative" lowers it */
  polarity: "positive" | "negative" | "neutral";
  /** 0..1 — how strongly this evidence drove the factor score */
  weight: number;
  /** Link back to the source (URL, page id, issue id) */
  ref?: { kind: "page" | "issue" | "crawler" | "external"; id: string };
}

export interface FactorBreakdown {
  key: FactorKey;
  label: string;
  rawScore: number;
  maxRawScore: number;
  weight: number;
  /** Contribution to the overall — (rawScore / maxRawScore) * weight * 100 */
  weightedContribution: number;
  evidence: EvidenceItem[];
}

export interface ScoreDecomposition {
  overall: number;
  factors: FactorBreakdown[];
  /**
   * Single-sentence natural-language explanation. Derived from the top
   * positive + top negative factor so the user sees "what's helping, what's
   * hurting" without having to read the full table.
   */
  narrative: string;
  generatedAt: string;
}

export interface FactorInput {
  key: FactorKey;
  rawScore: number;
  evidence?: EvidenceItem[];
}

/**
 * Compose a decomposition from per-factor raw scores + optional evidence.
 * Pure function — no DB, no LLM. Runs wherever you have the underlying
 * signals (audit worker, recommendation engine, API endpoint).
 */
export function composeDecomposition(
  inputs: FactorInput[],
): ScoreDecomposition {
  const byKey = new Map(inputs.map((i) => [i.key, i]));

  const breakdowns: FactorBreakdown[] = (
    Object.keys(AUDIT_FACTORS) as FactorKey[]
  ).map((key) => {
    const def = AUDIT_FACTORS[key];
    const input = byKey.get(key);
    const raw = Math.min(
      Math.max(input?.rawScore ?? 0, 0),
      def.maxRawScore,
    );
    const weightedContribution = (raw / def.maxRawScore) * def.weight * 100;
    return {
      key,
      label: def.label,
      rawScore: Math.round(raw),
      maxRawScore: def.maxRawScore,
      weight: def.weight,
      weightedContribution: Math.round(weightedContribution * 10) / 10,
      evidence: input?.evidence ?? [],
    };
  });

  const overall = Math.round(
    breakdowns.reduce((acc, b) => acc + b.weightedContribution, 0),
  );

  // Narrative picks the single highest+lowest contributor for a 1-sentence
  // summary. User can drill into the full breakdown for the rest.
  const sorted = [...breakdowns].sort(
    (a, b) => b.weightedContribution - a.weightedContribution,
  );
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const narrative =
    sorted.length > 0
      ? `${top.label} leads at ${top.rawScore}/100 (${formatPct(top.weight)} weight); ${bottom.label} lags at ${bottom.rawScore}/100 — focus work there for biggest delta.`
      : "No factors scored yet.";

  return {
    overall,
    factors: breakdowns,
    narrative,
    generatedAt: new Date().toISOString(),
  };
}

function formatPct(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}
