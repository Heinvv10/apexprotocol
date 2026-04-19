/**
 * Extract a structured BrandVoiceDescriptor from a raw writing sample.
 *
 * FR-CRE-002 v0.5. Single-shot Claude call, JSON-enforced via prompt.
 * No embeddings. No evaluation loop. The generator consumes the descriptor
 * verbatim when producing drafts.
 *
 * Contract:
 *   extractVoiceDescriptor({ text, tenantId, brandId })
 *     → BrandVoiceDescriptor  (on success)
 *     → throws ExtractionError (on malformed LLM output or API failure)
 */

import { chat } from "@/lib/llm/client";
import type { BrandVoiceDescriptor } from "@/lib/db/schema";

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly phase:
      | "llm_call"
      | "json_parse"
      | "schema_validation",
    public readonly raw?: string,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

const EXTRACTOR_MODEL = "claude-sonnet-4-6";
const EXTRACTOR_VERSION = "voice-extractor-v0.5";

const SYSTEM_PROMPT = `You are a brand-voice analyst. Given a writing sample,
extract a structured descriptor that captures how the brand writes — not what
it says. You MUST return valid JSON matching the exact schema below. Do not
include commentary, code fences, or any text outside the JSON object.

Schema:
{
  "tone": string,                                    // 1-2 sentence natural-language description
  "readingLevel": number,                            // Flesch-Kincaid grade level, approximate
  "formality": number,                               // 0 (casual) to 10 (academic)
  "avgSentenceLength": number,                       // words per sentence across the sample
  "sentenceLengthStdev": number,                     // std-dev of sentence length (higher = more burstiness)
  "vocabulary": string[],                            // 3-6 descriptors, e.g. "prefers active voice", "uses first-person plural"
  "signaturePhrases": string[],                      // 0-5 recurring phrases or callbacks
  "avoid": string[],                                 // 0-5 words/phrases the brand avoids
  "perspective": "first_person_singular" | "first_person_plural" | "second_person" | "third_person" | "mixed"
}

Be precise. Count sentences. Compute the average honestly. If the sample is
too short to support a confident number, return null for the numeric fields
you can't justify (they'll be treated as unknown downstream). Never guess.`;

function buildUserPrompt(text: string): string {
  return `Writing sample (analyse this — do not imitate, do not rewrite):

<sample>
${text.slice(0, 40_000)}
</sample>

Return the descriptor JSON now.`;
}

function validateDescriptor(raw: unknown): BrandVoiceDescriptor {
  if (!raw || typeof raw !== "object") {
    throw new ExtractionError("descriptor is not an object", "schema_validation");
  }
  const r = raw as Record<string, unknown>;
  const requiredStringKeys = ["tone", "perspective"] as const;
  for (const k of requiredStringKeys) {
    if (typeof r[k] !== "string") {
      throw new ExtractionError(`missing/invalid string field: ${k}`, "schema_validation");
    }
  }
  const validPerspective = new Set([
    "first_person_singular",
    "first_person_plural",
    "second_person",
    "third_person",
    "mixed",
  ]);
  if (!validPerspective.has(r.perspective as string)) {
    throw new ExtractionError(
      `invalid perspective value: ${String(r.perspective)}`,
      "schema_validation",
    );
  }
  const arrayKeys = ["vocabulary", "signaturePhrases", "avoid"] as const;
  for (const k of arrayKeys) {
    if (!Array.isArray(r[k])) {
      throw new ExtractionError(
        `missing/invalid array field: ${k}`,
        "schema_validation",
      );
    }
  }
  const numberKeys = [
    "readingLevel",
    "formality",
    "avgSentenceLength",
    "sentenceLengthStdev",
  ] as const;
  const numbers: Record<string, number> = {};
  for (const k of numberKeys) {
    const v = r[k];
    // Allow nulls — LLM is instructed to return null when unconfident
    if (v === null) {
      numbers[k] = 0;
      continue;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new ExtractionError(
        `missing/invalid number field: ${k}`,
        "schema_validation",
      );
    }
    numbers[k] = v;
  }

  return {
    tone: r.tone as string,
    readingLevel: numbers.readingLevel,
    formality: numbers.formality,
    avgSentenceLength: numbers.avgSentenceLength,
    sentenceLengthStdev: numbers.sentenceLengthStdev,
    vocabulary: (r.vocabulary as unknown[]).map(String),
    signaturePhrases: (r.signaturePhrases as unknown[]).map(String),
    avoid: (r.avoid as unknown[]).map(String),
    perspective: r.perspective as BrandVoiceDescriptor["perspective"],
    extractedWith: {
      model: EXTRACTOR_MODEL,
      version: EXTRACTOR_VERSION,
      extractedAt: new Date().toISOString(),
    },
  };
}

interface ExtractArgs {
  text: string;
  tenantId?: string | null;
  brandId?: string | null;
  signal?: AbortSignal;
}

export async function extractVoiceDescriptor(
  args: ExtractArgs,
): Promise<BrandVoiceDescriptor> {
  if (!args.text || args.text.trim().length < 200) {
    throw new ExtractionError(
      "sample too short — need at least 200 chars for reliable extraction",
      "schema_validation",
    );
  }

  let response;
  try {
    response = await chat({
      model: EXTRACTOR_MODEL,
      tenantId: args.tenantId,
      brandId: args.brandId,
      operation: "brand-voice.extract",
      temperature: 0.2,
      maxTokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(args.text) },
      ],
      signal: args.signal,
    });
  } catch (err) {
    throw new ExtractionError(
      `LLM call failed: ${(err as Error).message}`,
      "llm_call",
    );
  }

  const content = response.content.trim();
  // Strip ```json fences if the model ignored instructions
  const unfenced = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced);
  } catch (err) {
    throw new ExtractionError(
      `LLM returned invalid JSON: ${(err as Error).message}`,
      "json_parse",
      unfenced,
    );
  }

  return validateDescriptor(parsed);
}

/**
 * Build the "inject into generation prompt" block from a descriptor.
 * Kept as a plain string so it slots directly into any system prompt.
 */
export function renderVoiceBlock(descriptor: BrandVoiceDescriptor): string {
  return [
    "Brand voice guidance (match this style):",
    `- Tone: ${descriptor.tone}`,
    `- Perspective: ${descriptor.perspective.replace(/_/g, " ")}`,
    `- Formality: ${descriptor.formality}/10`,
    `- Target reading level: grade ${descriptor.readingLevel}`,
    `- Average sentence length: ~${Math.round(descriptor.avgSentenceLength)} words (vary naturally; target std-dev ~${Math.round(descriptor.sentenceLengthStdev)})`,
    descriptor.vocabulary.length > 0
      ? `- Vocabulary: ${descriptor.vocabulary.join("; ")}`
      : null,
    descriptor.signaturePhrases.length > 0
      ? `- Use these signature phrases when natural: ${descriptor.signaturePhrases.map((p) => `"${p}"`).join(", ")}`
      : null,
    descriptor.avoid.length > 0
      ? `- AVOID these: ${descriptor.avoid.map((p) => `"${p}"`).join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
