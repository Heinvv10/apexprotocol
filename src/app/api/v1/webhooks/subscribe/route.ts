/**
 * POST   /api/v1/webhooks/subscribe   — Zapier REST Hook subscription
 * DELETE /api/v1/webhooks/subscribe   — unsubscribe by id
 *
 * Zapier calls these during Zap setup. FR-ITG-004.
 *
 * POST body:
 *   { "event": "score_changed"|"new_recommendation"|"alert_fired"|"mention_detected"|"audit_completed",
 *     "target_url": "https://hooks.zapier.com/hooks/...",
 *     "brand_id": optional,
 *     "zapier_bundle_id": optional }
 *
 * Response: { id, event, target_url, created_at }
 *
 * DELETE body: { "id": "sub_..." }
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { zapierSubscriptions } from "@/lib/db/schema";
import { withApiErrorHandling, ApiError } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";

const SubscribeSchema = z.object({
  event: z.enum([
    "score_changed",
    "new_recommendation",
    "alert_fired",
    "mention_detected",
    "audit_completed",
  ]),
  target_url: z.string().url().max(2048),
  brand_id: z.string().optional().nullable(),
  zapier_bundle_id: z.string().optional().nullable(),
});

const UnsubscribeSchema = z.object({
  id: z.string().min(1),
});

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const body = await request.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "invalid_request",
      "Validation failed.",
      Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.join("; ") : String(v),
        ]),
      ),
    );
  }

  const [created] = await db
    .insert(zapierSubscriptions)
    .values({
      organizationId: auth.tenantId,
      event: parsed.data.event,
      targetUrl: parsed.data.target_url,
      brandId: parsed.data.brand_id ?? null,
      zapierBundleId: parsed.data.zapier_bundle_id ?? null,
    })
    .returning();

  return NextResponse.json(
    {
      data: {
        id: created.id,
        event: created.event,
        target_url: created.targetUrl,
        brand_id: created.brandId,
        created_at: created.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
});

export const DELETE = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const body = await request.json().catch(() => null);
  const parsed = UnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError("invalid_request", "Missing or invalid `id`.");
  }

  const deleted = await db
    .delete(zapierSubscriptions)
    .where(
      and(
        eq(zapierSubscriptions.id, parsed.data.id),
        eq(zapierSubscriptions.organizationId, auth.tenantId),
      ),
    )
    .returning({ id: zapierSubscriptions.id });

  if (deleted.length === 0) {
    throw new ApiError("not_found", "Subscription not found.");
  }

  return new NextResponse(null, { status: 204 });
});
