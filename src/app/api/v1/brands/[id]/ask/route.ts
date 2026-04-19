/**
 * POST /api/v1/brands/:id/ask
 *
 * Natural-language analytics query (FR-INT-004).
 *
 * Body: { "question": string }
 * Response: { intent, rows, explanation, usage }
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { askYourData } from "@/lib/analytics/ask-your-data";

const BodySchema = z.object({
  question: z.string().min(3).max(500),
});

export const POST = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("invalid_request", "Missing or invalid `question`.");
    }

    const brandRows = await db
      .select({ id: brands.id })
      .from(brands)
      .where(
        and(eq(brands.id, brandId), eq(brands.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (brandRows.length === 0) {
      throw new ApiError("not_found", "Brand not found.");
    }

    const result = await askYourData({
      tenantId: auth.tenantId,
      brandId,
      question: parsed.data.question,
    });

    return NextResponse.json({
      data: {
        intent: result.intent,
        params: result.params,
        rows: result.rows,
        explanation: result.explanation,
        row_count: result.rows.length,
        usage: result.usage,
      },
    });
  },
);
