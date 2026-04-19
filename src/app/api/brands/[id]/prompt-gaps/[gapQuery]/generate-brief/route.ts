/**
 * POST /api/brands/:id/prompt-gaps/:gapQuery/generate-brief
 *
 * One-click MONITOR → CREATE: takes a detected prompt gap and generates a
 * content brief with the MONITOR context preserved.
 *
 * FR-CRE-014. The UI surfaces a "Write about this" button next to every
 * gap; that button hits this endpoint. The response is ready to paste into
 * the content editor (or fire directly at `generateContent`).
 *
 * `gapQuery` is URL-encoded because it's a free-form user query.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, brandVoiceSamples } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/supabase-server";
import {
  findPromptGaps,
  buildBriefSeed,
} from "@/lib/ai/prompt-gap-analyzer";
import { chat } from "@/lib/llm/client";
import { renderVoiceBlock } from "@/lib/ai/brand-voice-extractor";
import type { BrandVoiceDescriptor } from "@/lib/db/schema";

export async function POST(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; gapQuery: string }> },
) {
  const session = await requireSession();
  if (!session.orgId) {
    return NextResponse.json(
      { error: "unauthorized", message: "No active org." },
      { status: 401 },
    );
  }

  const { id: brandId, gapQuery } = await params;
  const query = decodeURIComponent(gapQuery);

  const brandRows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.organizationId, session.orgId)))
    .limit(1);
  if (brandRows.length === 0) {
    return NextResponse.json(
      { error: "not_found", message: "Brand not found." },
      { status: 404 },
    );
  }
  const brand = brandRows[0];

  // Re-derive the specific gap so we have fresh context (not a stale
  // snapshot the client might pass). If the query no longer qualifies as a
  // gap, we surface that honestly rather than generating filler.
  const gaps = await findPromptGaps({
    brandId,
    lookbackDays: 30,
    mentionRateThreshold: 1, // no threshold — we want exact-match even if rate flipped
    minRuns: 1,
    limit: 200,
  });
  const gap = gaps.find((g) => g.query === query);
  if (!gap) {
    return NextResponse.json(
      {
        error: "not_found",
        message:
          "This prompt has no observed mentions in the last 30 days. Run monitoring first.",
      },
      { status: 404 },
    );
  }

  const seed = buildBriefSeed(brand.name, gap);

  // Pull latest brand voice descriptor if the user has set one up
  const voiceRows = await db
    .select({ descriptor: brandVoiceSamples.descriptorJson })
    .from(brandVoiceSamples)
    .where(eq(brandVoiceSamples.brandId, brandId))
    .orderBy(brandVoiceSamples.createdAt)
    .limit(5);
  const descriptors: BrandVoiceDescriptor[] = voiceRows
    .map((v) => v.descriptor)
    .filter((v): v is BrandVoiceDescriptor => !!v);
  const voiceBlock =
    descriptors.length > 0 ? renderVoiceBlock(descriptors[0]) : null;

  // LLM composes the full content brief — not a draft, a BRIEF.
  const systemPrompt = [
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
    voiceBlock ? `\n${voiceBlock}` : "",
  ].join("\n");

  const response = await chat({
    model: "claude-sonnet-4-6",
    tenantId: session.orgId,
    brandId,
    operation: "monitor.create.brief",
    temperature: 0.4,
    maxTokens: 1600,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: seed.briefPrompt },
    ],
  });

  return NextResponse.json({
    data: {
      brand_id: brandId,
      query,
      brief_markdown: response.content,
      talking_points: seed.talkingPoints,
      seed_prompt: seed.briefPrompt,
      context: {
        total_runs: gap.totalRuns,
        mentioned_runs: gap.mentionedRuns,
        mentioned_rate: gap.mentionedRate,
        losing_platforms: gap.losingPlatforms,
        top_competitors: gap.topCompetitors,
      },
      usage: {
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
      },
    },
  });
}
