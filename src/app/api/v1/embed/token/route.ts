/**
 * POST /api/v1/embed/token
 *
 * Mint a signed embed token for an iframe widget. Tenant-scoped by API key.
 * FR-AGY-011 (🏆 premium marker #10).
 *
 * Body:
 *   { "brand_id": string,
 *     "widget": "score"|"mentions"|"recommendations",
 *     "ttl_seconds": number (optional, default 86400),
 *     "origin": string (optional — locks widget to this parent origin) }
 *
 * Response:
 *   { "token": string, "iframe_url": string, "expires_at": ISO }
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { signEmbedToken } from "@/lib/embed/signed-token";

const BodySchema = z.object({
  brand_id: z.string().min(1),
  widget: z.enum(["score", "mentions", "recommendations"]),
  ttl_seconds: z.number().int().positive().max(30 * 24 * 60 * 60).optional(),
  origin: z.string().url().optional(),
});

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
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

  // Verify brand belongs to caller's tenant
  const brandRows = await db
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.id, parsed.data.brand_id),
        eq(brands.organizationId, auth.tenantId),
      ),
    )
    .limit(1);
  if (brandRows.length === 0) {
    throw new ApiError("not_found", "Brand not found.");
  }

  const ttl = parsed.data.ttl_seconds ?? 60 * 60 * 24;
  const token = signEmbedToken({
    tenantId: auth.tenantId,
    brandId: parsed.data.brand_id,
    widget: parsed.data.widget,
    origin: parsed.data.origin,
    ttlSeconds: ttl,
  });

  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://apex.dev";
  const iframeUrl = `${base}/embed/${parsed.data.widget}?token=${encodeURIComponent(token)}`;

  return NextResponse.json({
    data: {
      token,
      iframe_url: iframeUrl,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
      widget: parsed.data.widget,
      brand_id: parsed.data.brand_id,
    },
  });
});
