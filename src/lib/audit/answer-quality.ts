/**
 * Answer-quality score (FR-AUD-015).
 *
 * Scores how good a page is as a *citation candidate* for a specific
 * user query. Not a readability score — a "would an answer engine pick
 * this?" score.
 *
 * Single Claude call: feed the prompt + the page content, ask for a
 * structured rubric. Outputs 0-100 overall + per-dimension scores.
 */

import { chat } from "@/lib/llm/client";

export class AnswerQualityError extends Error {
  constructor(
    message: string,
    public readonly phase: "llm_call" | "parse",
  ) {
    super(message);
    this.name = "AnswerQualityError";
  }
}

export interface AnswerQualityScore {
  overall: number;
  dimensions: {
    directness: number;
    specificity: number;
    factualDensity: number;
    structuralClarity: number;
    authority: number;
    recency: number;
  };
  strengths: string[];
  weaknesses: string[];
  rewriteHints: string[];
}

const SYSTEM_PROMPT = `You are an answer-engine quality evaluator. Given a
user query and a candidate page, score how likely an answer engine (ChatGPT,
Perplexity, Claude, Google AI Overviews) would CITE this page when answering
that query.

Score on six 0-100 dimensions:
  - directness: how quickly does the page answer the specific query?
  - specificity: concrete numbers, dates, names, not generalities
  - factualDensity: claims that can be extracted and quoted
  - structuralClarity: headings, Q&A blocks, scannable sections
  - authority: author signals, first-hand experience, citations to sources
  - recency: does it acknowledge the current state, or is it stale?

Output ONE JSON object:
{
  "overall": 0-100,
  "dimensions": { directness, specificity, factualDensity, structuralClarity, authority, recency },
  "strengths": string[],
  "weaknesses": string[],
  "rewriteHints": string[]
}

Be conservative with "overall" — 80+ means "likely to be cited", 60-79 means
"competitive candidate", below 60 means "unlikely". Compute overall as a
weighted avg: directness 25%, structuralClarity 20%, specificity 20%,
factualDensity 15%, authority 15%, recency 5%.`;

export async function scoreAnswerQuality(args: {
  query: string;
  pageTitle?: string;
  pageContent: string;
  tenantId?: string | null;
  brandId?: string | null;
}): Promise<AnswerQualityScore> {
  if (!args.pageContent || args.pageContent.trim().length < 200) {
    throw new AnswerQualityError(
      "page content too short for scoring (need ≥200 chars)",
      "parse",
    );
  }

  let response;
  try {
    response = await chat({
      model: "claude-sonnet-4-6",
      tenantId: args.tenantId,
      brandId: args.brandId,
      operation: "audit.answer_quality",
      temperature: 0.2,
      maxTokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Query: "${args.query}"`,
            args.pageTitle ? `Page title: ${args.pageTitle}` : "",
            `Page content:`,
            "",
            args.pageContent.slice(0, 60_000),
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });
  } catch (err) {
    throw new AnswerQualityError(
      `LLM call failed: ${(err as Error).message}`,
      "llm_call",
    );
  }

  const raw = response.content.trim();
  const unfenced = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced);
  } catch (err) {
    throw new AnswerQualityError(
      `Invalid JSON: ${(err as Error).message}`,
      "parse",
    );
  }

  return normalise(parsed);
}

function normalise(raw: unknown): AnswerQualityScore {
  const r = raw as Record<string, unknown>;
  const d = (r.dimensions ?? {}) as Record<string, unknown>;
  const clampDim = (x: unknown): number => {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  };
  return {
    overall: clampDim(r.overall),
    dimensions: {
      directness: clampDim(d.directness),
      specificity: clampDim(d.specificity),
      factualDensity: clampDim(d.factualDensity),
      structuralClarity: clampDim(d.structuralClarity),
      authority: clampDim(d.authority),
      recency: clampDim(d.recency),
    },
    strengths: Array.isArray(r.strengths) ? (r.strengths as unknown[]).map(String) : [],
    weaknesses: Array.isArray(r.weaknesses) ? (r.weaknesses as unknown[]).map(String) : [],
    rewriteHints: Array.isArray(r.rewriteHints) ? (r.rewriteHints as unknown[]).map(String) : [],
  };
}
