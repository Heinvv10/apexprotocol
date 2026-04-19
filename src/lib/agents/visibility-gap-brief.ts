/**
 * Apex Agent — Visibility Gap → Brief (FR-AGT-001, flagship).
 *
 * One-click weekly loop: detect top-N underperforming prompts → generate
 * citation-optimized briefs → park in approval queue.
 *
 * Reuses existing `findPromptGaps` + `buildBriefSeed` so there's only one
 * definition of a "gap" in the codebase.
 */

import { chat } from "@/lib/llm/client";
import {
  findPromptGaps,
  buildBriefSeed,
  getBrandName,
} from "@/lib/ai/prompt-gap-analyzer";
import { renderVoiceBlock } from "@/lib/ai/brand-voice-extractor";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandVoiceSamples } from "@/lib/db/schema";
import type { BrandVoiceDescriptor } from "@/lib/db/schema";

export interface GapBriefParams {
  brandId: string;
  tenantId: string;
  /** How many gaps to turn into briefs this run */
  briefsPerRun?: number;
  /** Gap detection knobs */
  lookbackDays?: number;
  mentionRateThreshold?: number;
}

export interface GapBriefItem {
  query: string;
  mentioned_rate: number;
  total_runs: number;
  brief_markdown: string;
  talking_points: string[];
  context: {
    losing_platforms: Array<{ platform: string; mentioned_rate: number }>;
    top_competitors: Array<{ name: string; mentions: number }>;
  };
  tokens_used: { input: number; output: number };
}

export interface GapBriefOutput {
  briefs: GapBriefItem[];
  totalTokensUsed: { input: number; output: number };
  /** Gaps found vs briefs produced — helps users see if threshold was too strict */
  gapsFound: number;
}

const SYSTEM_PROMPT = [
  "You are a content strategist producing briefs that writers use to produce",
  "AI-citation-optimized content. Output a concrete, short brief in plain",
  "markdown with these sections and NOTHING else:",
  "",
  "## Target query",
  "## Content angle",
  "## Required claims",
  "## Structure",
  "## Signals for AI extraction",
  "## Differentiation from competitor excerpts",
  "",
  "Keep it tight. This is a brief for a writer, not a finished article.",
].join("\n");

export async function runVisibilityGapBrief(
  params: GapBriefParams,
): Promise<GapBriefOutput> {
  const brandName = await getBrandName(params.brandId);
  if (!brandName) {
    throw new Error(`Brand ${params.brandId} not found`);
  }

  const gaps = await findPromptGaps({
    brandId: params.brandId,
    lookbackDays: params.lookbackDays ?? 30,
    mentionRateThreshold: params.mentionRateThreshold ?? 0.2,
    minRuns: 3,
    limit: params.briefsPerRun ?? 5,
  });

  if (gaps.length === 0) {
    return {
      briefs: [],
      totalTokensUsed: { input: 0, output: 0 },
      gapsFound: 0,
    };
  }

  // Latest voice descriptor — reused across all briefs in this run
  const voiceRows = await db
    .select({ descriptor: brandVoiceSamples.descriptorJson })
    .from(brandVoiceSamples)
    .where(eq(brandVoiceSamples.brandId, params.brandId))
    .orderBy(desc(brandVoiceSamples.createdAt))
    .limit(1);
  const voiceDescriptor: BrandVoiceDescriptor | null =
    voiceRows[0]?.descriptor ?? null;
  const voiceBlock = voiceDescriptor ? renderVoiceBlock(voiceDescriptor) : null;

  const systemPrompt = voiceBlock
    ? `${SYSTEM_PROMPT}\n\n${voiceBlock}`
    : SYSTEM_PROMPT;

  const briefs: GapBriefItem[] = [];
  let totalIn = 0;
  let totalOut = 0;

  for (const gap of gaps) {
    const seed = buildBriefSeed(brandName, gap);
    const response = await chat({
      model: "claude-sonnet-4-6",
      tenantId: params.tenantId,
      brandId: params.brandId,
      operation: "agent.visibility_gap_brief",
      temperature: 0.4,
      maxTokens: 1600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: seed.briefPrompt },
      ],
    });

    totalIn += response.usage.inputTokens;
    totalOut += response.usage.outputTokens;

    briefs.push({
      query: gap.query,
      mentioned_rate: gap.mentionedRate,
      total_runs: gap.totalRuns,
      brief_markdown: response.content,
      talking_points: seed.talkingPoints,
      context: {
        losing_platforms: gap.losingPlatforms.map((p) => ({
          platform: p.platform,
          mentioned_rate: p.mentionedRate,
        })),
        top_competitors: gap.topCompetitors,
      },
      tokens_used: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    });
  }

  return {
    briefs,
    totalTokensUsed: { input: totalIn, output: totalOut },
    gapsFound: gaps.length,
  };
}
