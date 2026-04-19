/**
 * Brand mention extraction + competitor detection + sentiment analysis.
 *
 * Requirements: FR-MON-021 (NER), FR-MON-022 (fuzzy resolution),
 * FR-MON-023 (competitor extraction), FR-MON-025 (sentiment).
 *
 * Design:
 *   Single Claude call does NER + fuzzy aliases + sentiment + competitor
 *   extraction in one pass. Cheaper than separate Presidio + embeddings
 *   pipelines and tighter semantically — the LLM understands "MSFT = Microsoft"
 *   and "the Redmond giant = Microsoft" in the same step.
 *
 *   For false-positive rate <5% on ambiguous brand names, we feed the brand's
 *   known aliases + known competitors into the extraction prompt as context.
 *   The LLM resolves ambiguity against that dictionary before emitting matches.
 *
 *   Embedding-based fuzzy match (Qdrant) is reserved for post-hoc dedup of
 *   mention records across platforms, not inline extraction.
 */

import { chat } from "@/lib/llm/client";
import { logger } from "@/lib/logger";

export class MentionExtractionError extends Error {
  constructor(
    message: string,
    public readonly phase: "llm_call" | "json_parse" | "schema_validation",
    public readonly raw?: string,
  ) {
    super(message);
    this.name = "MentionExtractionError";
  }
}

export interface BrandContext {
  name: string;
  aliases?: string[];
  knownCompetitors?: Array<{ name: string; aliases?: string[] }>;
}

export interface ExtractedBrandMention {
  /** Exact surface form found in the response text */
  surface: string;
  /** Character offsets of the mention */
  span: { start: number; end: number };
  /** Resolved canonical brand — matches the input brand.name */
  canonical: string;
  /** Was this a direct name match or fuzzy alias? */
  matchType: "exact" | "alias" | "descriptor";
  /** 0..1, extractor's confidence in this being the target brand */
  confidence: number;
}

export interface ExtractedCompetitor {
  surface: string;
  /** Resolved competitor name if matched against known list, else raw surface */
  canonical: string;
  knownCompetitor: boolean;
  span?: { start: number; end: number };
}

export interface ExtractedSentiment {
  label: "positive" | "neutral" | "negative" | "unrecognized";
  /** 0..1 confidence */
  confidence: number;
  /** Short evidence span from the response that grounds the label */
  evidence: string | null;
  /** 1-2 sentence reasoning */
  reasoning: string;
}

export interface ExtractionResult {
  brandMentioned: boolean;
  brandMentions: ExtractedBrandMention[];
  /** Position of first brand mention (1-indexed) in a ranked list, null if none */
  position: number | null;
  sentiment: ExtractedSentiment;
  competitors: ExtractedCompetitor[];
  /** URLs cited in the response — filtered to brand or competitor domains */
  citations: Array<{ url: string; attributed: "brand" | "competitor" | "other" }>;
}

const EXTRACTOR_MODEL = "claude-sonnet-4-6";
const EXTRACTOR_VERSION = "mention-extractor-v1";

function buildSystemPrompt(brand: BrandContext): string {
  const competitorList =
    (brand.knownCompetitors ?? []).length > 0
      ? brand
          .knownCompetitors!.map(
            (c) =>
              `  - ${c.name}${c.aliases && c.aliases.length ? ` (aliases: ${c.aliases.join(", ")})` : ""}`,
          )
          .join("\n")
      : "  (none provided — extract any named competitor organizations)";

  const aliasList =
    brand.aliases && brand.aliases.length
      ? brand.aliases.join(", ")
      : "(none provided)";

  return `You are a precise brand-analytics extractor. Given an AI-generated
response to a user query, extract structured signal about whether a target
brand was mentioned, how it was characterized, and which competitors appeared.

Target brand: "${brand.name}"
Known aliases: ${aliasList}
Known competitors:
${competitorList}

Rules:
1. Only count a "brand mention" when the text refers to THIS specific company.
   Ambiguous cases (e.g. "apex" as a common noun, not the company) must be
   rejected. Err toward false-negative over false-positive.
2. Match types:
   - "exact"      — the surface form matches the brand name or a listed alias
   - "alias"      — a ticker, nickname, or widely-known shorthand
   - "descriptor" — an unambiguous paraphrase ("the Redmond software giant" = Microsoft)
3. Position is 1 if the brand is the FIRST named company in a ranked/listed
   response, 2 if second, etc. Null if the response has no rank structure OR
   if the brand isn't present.
4. Sentiment must be grounded in a short evidence quote from the response.
   Use "unrecognized" only when the brand wasn't mentioned at all.
5. Competitors: extract ANY named company/product other than the target brand,
   even if they're not in the known list. Set knownCompetitor=true iff they
   match the list.
6. Citations: include every URL that appears in the response text. Attribute
   to "brand" if URL domain matches the brand's domain, "competitor" if it
   matches a competitor, else "other".

Return ONE JSON object, nothing else. No code fences. No prose. Schema:

{
  "brandMentioned": boolean,
  "brandMentions": [
    {
      "surface": string,
      "span": { "start": number, "end": number },
      "canonical": string,
      "matchType": "exact" | "alias" | "descriptor",
      "confidence": number
    }
  ],
  "position": number | null,
  "sentiment": {
    "label": "positive" | "neutral" | "negative" | "unrecognized",
    "confidence": number,
    "evidence": string | null,
    "reasoning": string
  },
  "competitors": [
    {
      "surface": string,
      "canonical": string,
      "knownCompetitor": boolean,
      "span": { "start": number, "end": number }
    }
  ],
  "citations": [
    { "url": string, "attributed": "brand" | "competitor" | "other" }
  ]
}`;
}

function validateResult(raw: unknown): ExtractionResult {
  if (!raw || typeof raw !== "object") {
    throw new MentionExtractionError(
      "result is not an object",
      "schema_validation",
    );
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.brandMentioned !== "boolean") {
    throw new MentionExtractionError(
      "brandMentioned must be boolean",
      "schema_validation",
    );
  }
  if (!Array.isArray(r.brandMentions)) {
    throw new MentionExtractionError(
      "brandMentions must be array",
      "schema_validation",
    );
  }
  if (!r.sentiment || typeof r.sentiment !== "object") {
    throw new MentionExtractionError(
      "sentiment missing",
      "schema_validation",
    );
  }
  const s = r.sentiment as Record<string, unknown>;
  const validLabels = new Set([
    "positive",
    "neutral",
    "negative",
    "unrecognized",
  ]);
  if (typeof s.label !== "string" || !validLabels.has(s.label)) {
    throw new MentionExtractionError(
      `invalid sentiment.label: ${String(s.label)}`,
      "schema_validation",
    );
  }

  return {
    brandMentioned: r.brandMentioned,
    brandMentions: (r.brandMentions as unknown[]).map(
      (m) => m as ExtractedBrandMention,
    ),
    position:
      typeof r.position === "number"
        ? r.position
        : r.position === null
          ? null
          : null,
    sentiment: {
      label: s.label as ExtractedSentiment["label"],
      confidence: typeof s.confidence === "number" ? s.confidence : 0,
      evidence: typeof s.evidence === "string" ? s.evidence : null,
      reasoning:
        typeof s.reasoning === "string" ? s.reasoning : "",
    },
    competitors: Array.isArray(r.competitors)
      ? (r.competitors as unknown[]).map((c) => c as ExtractedCompetitor)
      : [],
    citations: Array.isArray(r.citations)
      ? (r.citations as unknown[]).map((c) => c as ExtractionResult["citations"][number])
      : [],
  };
}

interface ExtractArgs {
  brand: BrandContext;
  response: string;
  query?: string;
  tenantId?: string | null;
  brandId?: string | null;
  signal?: AbortSignal;
}

/**
 * Extract brand signal + sentiment + competitors from a single LLM response.
 * Used by monitoring workers after they receive a platform response.
 */
export async function extractMentionSignal(
  args: ExtractArgs,
): Promise<ExtractionResult> {
  if (!args.response || args.response.trim().length < 10) {
    // Empty / trivial response — return a neutral "not mentioned" result.
    return {
      brandMentioned: false,
      brandMentions: [],
      position: null,
      sentiment: {
        label: "unrecognized",
        confidence: 1,
        evidence: null,
        reasoning: "response was empty or near-empty",
      },
      competitors: [],
      citations: [],
    };
  }

  let response;
  try {
    response = await chat({
      model: EXTRACTOR_MODEL,
      tenantId: args.tenantId,
      brandId: args.brandId,
      operation: "mentions.extract",
      temperature: 0.1,
      maxTokens: 2048,
      messages: [
        { role: "system", content: buildSystemPrompt(args.brand) },
        {
          role: "user",
          content: `Original user query:\n${args.query ?? "(not provided)"}\n\nResponse to analyze:\n\n${args.response}`,
        },
      ],
      signal: args.signal,
    });
  } catch (err) {
    throw new MentionExtractionError(
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
    throw new MentionExtractionError(
      `Invalid JSON: ${(err as Error).message}`,
      "json_parse",
      unfenced.slice(0, 400),
    );
  }

  const result = validateResult(parsed);

  logger.info("mentions.extracted", {
    brand: args.brand.name,
    brandMentioned: result.brandMentioned,
    position: result.position,
    sentiment: result.sentiment.label,
    competitorCount: result.competitors.length,
    citationCount: result.citations.length,
    extractorVersion: EXTRACTOR_VERSION,
  });

  return result;
}
