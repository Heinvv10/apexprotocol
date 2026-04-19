/**
 * POST /api/brands/:id/voice-samples
 * GET  /api/brands/:id/voice-samples
 *
 * Manage brand-voice samples for FR-CRE-002 v0.5.
 *
 * POST body:
 *   { label: string, sourceType: "paste"|"url"|"upload",
 *     sourceUrl?: string, rawText: string }
 *
 * On create, we kick off descriptor extraction inline (single-shot LLM call,
 * ~5-15s). This is intentional — BullMQ enqueuing for a user-driven action
 * like this adds latency without benefit; the user is waiting on the result.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { brands, brandVoiceSamples } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/supabase-server";
import { getUserByAuthId } from "@/lib/auth/supabase-admin";
import { extractVoiceDescriptor, ExtractionError } from "@/lib/ai/brand-voice-extractor";
import { logger } from "@/lib/logger";

const MAX_SAMPLES_PER_BRAND = 5;
const MIN_TEXT_LENGTH = 200;
const MAX_TEXT_LENGTH = 40_000;

const CreateSampleSchema = z.object({
  label: z.string().min(1).max(100),
  sourceType: z.enum(["paste", "url", "upload"]),
  sourceUrl: z.string().url().max(2048).optional().nullable(),
  rawText: z
    .string()
    .min(MIN_TEXT_LENGTH, `Sample must be at least ${MIN_TEXT_LENGTH} characters.`)
    .max(MAX_TEXT_LENGTH, `Sample exceeds ${MAX_TEXT_LENGTH} characters.`),
});

async function resolveAuthContext(brandId: string) {
  const session = await requireSession();
  if (!session.orgId) {
    return null;
  }
  const user = await getUserByAuthId(session.userId);
  if (!user) return null;

  const brandRow = await db
    .select({ id: brands.id, organizationId: brands.organizationId })
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.organizationId, session.orgId)))
    .limit(1);
  if (brandRow.length === 0) return null;

  return { userId: user.id, orgId: session.orgId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: brandId } = await params;
  const ctx = await resolveAuthContext(brandId);
  if (!ctx) {
    return NextResponse.json(
      { error: "not_found", message: "Brand not found." },
      { status: 404 },
    );
  }

  const rows = await db
    .select()
    .from(brandVoiceSamples)
    .where(eq(brandVoiceSamples.brandId, brandId))
    .orderBy(desc(brandVoiceSamples.createdAt));

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      label: r.label,
      sourceType: r.sourceType,
      sourceUrl: r.sourceUrl,
      rawTextPreview: r.rawText.slice(0, 240),
      rawTextLength: r.rawText.length,
      descriptor: r.descriptorJson,
      extractionError: r.extractionError,
      extractedAt: r.extractedAt?.toISOString() ?? null,
      schemaVersion: r.schemaVersion,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    meta: { count: rows.length, maxSamples: MAX_SAMPLES_PER_BRAND },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: brandId } = await params;
  const ctx = await resolveAuthContext(brandId);
  if (!ctx) {
    return NextResponse.json(
      { error: "not_found", message: "Brand not found." },
      { status: 404 },
    );
  }

  // Cap samples per brand
  const existingCount = await db
    .select({ id: brandVoiceSamples.id })
    .from(brandVoiceSamples)
    .where(eq(brandVoiceSamples.brandId, brandId));
  if (existingCount.length >= MAX_SAMPLES_PER_BRAND) {
    return NextResponse.json(
      {
        error: "conflict",
        message: `Maximum of ${MAX_SAMPLES_PER_BRAND} samples per brand. Delete one before adding more.`,
      },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = CreateSampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Validation failed.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Insert the sample first — extraction can fail without losing the raw text
  const [inserted] = await db
    .insert(brandVoiceSamples)
    .values({
      brandId,
      createdById: ctx.userId,
      label: parsed.data.label,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl ?? null,
      rawText: parsed.data.rawText,
      schemaVersion: "0.5",
    })
    .returning();

  // Run extraction inline
  try {
    const descriptor = await extractVoiceDescriptor({
      text: parsed.data.rawText,
      tenantId: ctx.orgId,
      brandId,
    });

    const [updated] = await db
      .update(brandVoiceSamples)
      .set({
        descriptorJson: descriptor,
        extractedAt: new Date(),
        extractionError: null,
        updatedAt: new Date(),
      })
      .where(eq(brandVoiceSamples.id, inserted.id))
      .returning();

    return NextResponse.json(
      {
        data: {
          id: updated.id,
          label: updated.label,
          descriptor: updated.descriptorJson,
          extractionError: null,
          extractedAt: updated.extractedAt?.toISOString() ?? null,
          createdAt: updated.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const errMessage =
      err instanceof ExtractionError
        ? `${err.phase}: ${err.message}`
        : `unexpected: ${(err as Error).message}`;
    logger.warn("brand-voice.extraction_failed", {
      sampleId: inserted.id,
      brandId,
      error: errMessage,
    });
    await db
      .update(brandVoiceSamples)
      .set({ extractionError: errMessage, updatedAt: new Date() })
      .where(eq(brandVoiceSamples.id, inserted.id));

    return NextResponse.json(
      {
        data: {
          id: inserted.id,
          label: inserted.label,
          descriptor: null,
          extractionError: errMessage,
          createdAt: inserted.createdAt.toISOString(),
        },
        warning:
          "Sample saved but extraction failed. You can retry extraction from the UI.",
      },
      { status: 201 },
    );
  }
}
