/**
 * Editorial Polish — brand voice + cliché removal + burstiness + readability
 * + E-E-A-T signals check.
 *
 * Requirement: FR-CRE-011.
 *
 * This is NOT a detector-bypass tool. Framing and implementation are
 * explicitly editorial-quality. We DO NOT surface "GPTZero score" or
 * "undetectable" metrics. The gap analysis (§15.1) documents why: Google
 * doesn't penalise AI content; the real value here is giving drafts the
 * editorial polish that helps citation-generating LLMs want to quote them.
 *
 * Operates on already-generated drafts from content-generator.ts — either
 * called automatically as a post-pass, or exposed as a standalone "Polish
 * this" action in the content editor UI.
 */

import { chat } from "@/lib/llm/client";
import type { BrandVoiceDescriptor } from "@/lib/db/schema";
import { renderVoiceBlock } from "./brand-voice-extractor";

export class EditorialPolishError extends Error {
  constructor(
    message: string,
    public readonly phase: "llm_call" | "parse",
  ) {
    super(message);
    this.name = "EditorialPolishError";
  }
}

export interface EditorialAnalysis {
  /** Flesch-Kincaid grade level (approx) */
  readingLevel: number;
  /** Avg sentence length in words */
  avgSentenceLength: number;
  /** Std-dev of sentence length — burstiness */
  sentenceLengthStdev: number;
  /** Estimated passive-voice fraction 0..1 */
  passiveVoiceRatio: number;
  /** Lists of issues found, pre-polish */
  issues: {
    cliches: string[];
    weakVerbs: string[];
    hedging: string[];
    repetition: string[];
  };
  eeat: {
    hasFirstPersonExperience: boolean;
    hasAuthorSignals: boolean;
    hasSpecificExamples: boolean;
    hasExternalCitations: boolean;
  };
}

export interface PolishResult {
  /** The polished text — ready to paste */
  polished: string;
  /** Short changelog of what was adjusted */
  changelog: string[];
  /** Analysis of the ORIGINAL draft (for UI before/after) */
  before: EditorialAnalysis;
  /** Analysis of the polished version */
  after: EditorialAnalysis;
}

const SYSTEM_PROMPT = `You are a senior editor polishing an AI-generated
draft into its best editorial form. You must:

1. KEEP the intent, structure, and argument intact. This is polish, not rewrite.
2. Strip clichés and empty phrases: "in today's fast-paced world", "furthermore",
   "delve into", "it is important to note", "navigate the landscape of", etc.
3. Vary sentence length — burstiness. Mix short punches (5-8 words) with
   longer, information-dense sentences (20-30 words). Avoid uniform 15-20
   word stretches that feel mechanical.
4. Replace weak verbs ("is/are/was/were" as main verbs) with specific action
   verbs where it doesn't distort meaning.
5. Reduce passive voice unless the passive is genuinely the right voice.
6. Add concrete E-E-A-T signals where content supports them:
   - First-person experience statements ("In our audit of 200 sites…")
   - Author signals (named expertise, credentials)
   - Specific examples with names, numbers, dates
   - Appropriate external citations
7. Match the brand voice guidance below (if provided). The brand voice
   overrides generic editorial preferences when they conflict.

Return ONE JSON object, nothing else. Schema:

{
  "polished": string,
  "changelog": string[],
  "beforeAnalysis": {
    "readingLevel": number,
    "avgSentenceLength": number,
    "sentenceLengthStdev": number,
    "passiveVoiceRatio": number,
    "issues": {
      "cliches": string[],
      "weakVerbs": string[],
      "hedging": string[],
      "repetition": string[]
    },
    "eeat": {
      "hasFirstPersonExperience": boolean,
      "hasAuthorSignals": boolean,
      "hasSpecificExamples": boolean,
      "hasExternalCitations": boolean
    }
  },
  "afterAnalysis": { ... same shape as beforeAnalysis ... }
}`;

export interface PolishArgs {
  draft: string;
  brandVoice?: BrandVoiceDescriptor | null;
  tenantId?: string | null;
  brandId?: string | null;
  signal?: AbortSignal;
}

export async function polishDraft(args: PolishArgs): Promise<PolishResult> {
  if (!args.draft || args.draft.trim().length < 100) {
    throw new EditorialPolishError(
      "draft too short — need at least 100 chars",
      "parse",
    );
  }

  const voiceBlock = args.brandVoice
    ? renderVoiceBlock(args.brandVoice)
    : "";

  let response;
  try {
    response = await chat({
      model: "claude-sonnet-4-6",
      tenantId: args.tenantId,
      brandId: args.brandId,
      operation: "editorial.polish",
      temperature: 0.3,
      maxTokens: 6000,
      messages: [
        {
          role: "system",
          content: voiceBlock
            ? `${SYSTEM_PROMPT}\n\n${voiceBlock}`
            : SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Polish this draft:\n\n<draft>\n${args.draft}\n</draft>`,
        },
      ],
      signal: args.signal,
    });
  } catch (err) {
    throw new EditorialPolishError(
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
    throw new EditorialPolishError(
      `Invalid JSON: ${(err as Error).message}`,
      "parse",
    );
  }

  return normaliseResult(parsed);
}

function normaliseResult(raw: unknown): PolishResult {
  const r = raw as Record<string, unknown>;
  if (typeof r.polished !== "string") {
    throw new EditorialPolishError(
      "missing `polished` field in LLM response",
      "parse",
    );
  }
  const changelog = Array.isArray(r.changelog)
    ? (r.changelog as unknown[]).map(String)
    : [];
  return {
    polished: r.polished,
    changelog,
    before: normaliseAnalysis(r.beforeAnalysis as Record<string, unknown>),
    after: normaliseAnalysis(r.afterAnalysis as Record<string, unknown>),
  };
}

function normaliseAnalysis(
  raw: Record<string, unknown> | undefined,
): EditorialAnalysis {
  const r = raw ?? {};
  const issues = (r.issues ?? {}) as Record<string, unknown>;
  const eeat = (r.eeat ?? {}) as Record<string, unknown>;

  return {
    readingLevel: num(r.readingLevel),
    avgSentenceLength: num(r.avgSentenceLength),
    sentenceLengthStdev: num(r.sentenceLengthStdev),
    passiveVoiceRatio: num(r.passiveVoiceRatio),
    issues: {
      cliches: arr(issues.cliches),
      weakVerbs: arr(issues.weakVerbs),
      hedging: arr(issues.hedging),
      repetition: arr(issues.repetition),
    },
    eeat: {
      hasFirstPersonExperience: !!eeat.hasFirstPersonExperience,
      hasAuthorSignals: !!eeat.hasAuthorSignals,
      hasSpecificExamples: !!eeat.hasSpecificExamples,
      hasExternalCitations: !!eeat.hasExternalCitations,
    },
  };
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map(String) : [];
}
