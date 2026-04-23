/**
 * Reply-draft generator.
 *
 * Given a brand + platform + a mention the skill wants to engage with,
 * produces a reply draft using Claude in the brand's voice and writes it
 * to `social_engagement_drafts` with status='pending'.
 *
 * Callers are typically scanners (mention pipelines) or the skill itself
 * (when the user says "draft a reply to this X mention <URL>"). The
 * dispatcher picks drafts up separately.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import {
  socialEngagementDrafts,
  type SocialEngagementDraft,
} from "@/lib/db/schema/social-engagement";
import { socialBrowserCredentials } from "@/lib/db/schema/social-browser-auth";
import type { SocialPlatform } from "@/lib/oauth/token-service";
import { getClaudeClient } from "@/lib/ai/claude";
import { getAutonomyMode } from "./settings";

export interface MentionContext {
  platform: SocialPlatform;
  targetUrl: string;
  sourceRef?: string;
  // The text we're replying to — author's handle + content
  authorHandle: string;
  content: string;
  // Optional parent thread if it's a deeply-nested comment
  parentContext?: string;
}

export interface GenerateDraftInput {
  brandId: string;
  credentialId: string;
  mention: MentionContext;
  kind: "reply" | "comment" | "answer" | "quote";
  // Override the auto-inferred prompt with operator-supplied guidance
  operatorNote?: string;
}

export type GenerateDraftResult =
  | { status: "skipped"; reason: string }
  | { status: "queued"; draft: SocialEngagementDraft };

const PLATFORM_CHAR_LIMITS: Partial<Record<SocialPlatform, number>> = {
  twitter: 280,
  linkedin: 3000,
  reddit: 10000,
  threads: 500,
  bluesky: 300,
};

export async function generateReplyDraft(
  input: GenerateDraftInput,
): Promise<GenerateDraftResult> {
  const mode = await getAutonomyMode(input.brandId, input.mention.platform);
  if (mode === "off") {
    return { status: "skipped", reason: `engagement autonomy off for ${input.mention.platform}` };
  }

  const db = getDb();

  // Dedupe: one pending/approved draft per (brand, platform, sourceRef).
  if (input.mention.sourceRef) {
    const existing = await db.query.socialEngagementDrafts.findFirst({
      where: and(
        eq(socialEngagementDrafts.brandId, input.brandId),
        eq(socialEngagementDrafts.platform, input.mention.platform),
        eq(socialEngagementDrafts.sourceRef, input.mention.sourceRef),
      ),
    });
    if (existing && existing.status !== "rejected" && existing.status !== "failed") {
      return { status: "skipped", reason: `draft already exists: ${existing.id} (${existing.status})` };
    }
  }

  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, input.brandId),
  });
  if (!brand) {
    throw new Error(`Brand ${input.brandId} not found`);
  }

  const credential = await db.query.socialBrowserCredentials.findFirst({
    where: eq(socialBrowserCredentials.id, input.credentialId),
  });
  if (!credential || credential.status !== "active") {
    return {
      status: "skipped",
      reason: `credential ${input.credentialId} is ${credential?.status ?? "missing"}`,
    };
  }

  const charLimit = PLATFORM_CHAR_LIMITS[input.mention.platform];
  const draftText = await callClaudeForDraft({
    brandName: brand.name,
    brandVoice: brand.voice as Record<string, unknown> | null,
    platform: input.mention.platform,
    kind: input.kind,
    mention: input.mention,
    operatorNote: input.operatorNote,
    charLimit,
  });

  const [inserted] = await db
    .insert(socialEngagementDrafts)
    .values({
      brandId: input.brandId,
      credentialId: input.credentialId,
      platform: input.mention.platform,
      kind: input.kind,
      targetUrl: input.mention.targetUrl,
      sourceRef: input.mention.sourceRef,
      draftText,
      generationContext: {
        authorHandle: input.mention.authorHandle,
        autonomyMode: mode,
        operatorNote: input.operatorNote ?? null,
      },
      status: "pending",
    })
    .returning();

  return { status: "queued", draft: inserted };
}

interface ClaudePromptArgs {
  brandName: string;
  brandVoice: Record<string, unknown> | null;
  platform: SocialPlatform;
  kind: "reply" | "comment" | "answer" | "quote";
  mention: MentionContext;
  operatorNote?: string;
  charLimit?: number;
}

async function callClaudeForDraft(args: ClaudePromptArgs): Promise<string> {
  const client = getClaudeClient();

  const voiceSummary = args.brandVoice
    ? `tone=${args.brandVoice["tone"] ?? "professional"}, avoid=${JSON.stringify(args.brandVoice["avoidTopics"] ?? [])}`
    : "default professional";

  const limitNote = args.charLimit
    ? `Hard limit: ${args.charLimit} characters — stay well under it.`
    : "No hard character limit, but keep replies tight — 2–4 sentences unless a longer answer genuinely helps.";

  const systemPrompt = [
    `You are writing a ${args.kind} on ${args.platform} on behalf of ${args.brandName}.`,
    `Brand voice: ${voiceSummary}.`,
    `Reply to the author directly and add real value — do not flatter, do not shill.`,
    `Never fabricate statistics. If a claim needs a number and you don't have one, drop the claim.`,
    `No hashtag spam. One link maximum, only if the link genuinely helps.`,
    limitNote,
    args.operatorNote ? `Operator guidance: ${args.operatorNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = [
    `Author: @${args.mention.authorHandle}`,
    `Content: """${args.mention.content}"""`,
    args.mention.parentContext
      ? `Parent context: """${args.mention.parentContext}"""`
      : "",
    "",
    "Write the reply text only — no preamble, no quotes, no markdown.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = (await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })) as { content: Array<{ type: string; text?: string }> };

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock?.text?.trim() ?? "";
  if (!text) {
    throw new Error("Claude returned empty draft");
  }
  if (args.charLimit && text.length > args.charLimit) {
    // Trim rather than re-prompt — keeps costs bounded. The truncation is
    // conservative (to last sentence end within the limit).
    return trimToLimit(text, args.charLimit);
  }
  return text;
}

function trimToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const truncated = text.slice(0, limit);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  );
  if (lastSentenceEnd > limit * 0.6) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }
  return truncated;
}
