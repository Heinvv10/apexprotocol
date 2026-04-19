/**
 * POST /api/v1/agents/runs — dispatch a new agent run
 * GET  /api/v1/agents/runs — list runs (paginated, filterable)
 *
 * FR-AGT-001/002/003/004/005.
 *
 * POST body:
 *   { "kind": "visibility_gap_brief" | "competitor_audit" | "content_refresh",
 *     "brand_id": string,
 *     "params": object (optional) }
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { agentRuns, brands } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { dispatchAgent } from "@/lib/agents/runner";

const DispatchSchema = z.object({
  kind: z.enum(["visibility_gap_brief", "competitor_audit", "content_refresh"]),
  brand_id: z.string().min(1),
  params: z.record(z.unknown()).optional(),
});

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const body = await request.json().catch(() => null);
  const parsed = DispatchSchema.safeParse(body);
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

  const runId = await dispatchAgent({
    kind: parsed.data.kind,
    organizationId: auth.tenantId,
    brandId: parsed.data.brand_id,
    triggeredById: auth.userId,
    params: parsed.data.params,
  });

  const [run] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.id, runId))
    .limit(1);

  return NextResponse.json(
    {
      data: {
        id: run.id,
        kind: run.kind,
        status: run.status,
        brand_id: run.brandId,
        output: run.output,
        duration_ms: run.durationMs,
        created_at: run.createdAt.toISOString(),
        completed_at: run.completedAt?.toISOString() ?? null,
      },
    },
    { status: 201 },
  );
});

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const auth = await requireV1Auth();
  const qp = request.nextUrl.searchParams;
  const brandId = qp.get("brand_id");
  const status = qp.get("status");
  const limit = Math.min(
    Math.max(Number.parseInt(qp.get("limit") ?? "50", 10) || 50, 1),
    200,
  );

  type RunStatus =
    | "pending"
    | "running"
    | "awaiting_approval"
    | "approved"
    | "rejected"
    | "completed"
    | "failed";
  const validStatuses: Set<string> = new Set([
    "pending",
    "running",
    "awaiting_approval",
    "approved",
    "rejected",
    "completed",
    "failed",
  ]);

  const filters = [eq(agentRuns.organizationId, auth.tenantId)];
  if (brandId) filters.push(eq(agentRuns.brandId, brandId));
  if (status) {
    if (!validStatuses.has(status)) {
      throw new ApiError("invalid_request", `Unknown status "${status}".`);
    }
    filters.push(eq(agentRuns.status, status as RunStatus));
  }

  const rows = await db
    .select()
    .from(agentRuns)
    .where(and(...filters))
    .orderBy(desc(agentRuns.createdAt))
    .limit(limit);

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      brand_id: r.brandId,
      params: r.params,
      output: r.output,
      error_message: r.errorMessage,
      duration_ms: r.durationMs,
      input_tokens: r.inputTokens,
      output_tokens: r.outputTokens,
      approved_by_id: r.approvedById,
      approved_at: r.approvedAt?.toISOString() ?? null,
      created_at: r.createdAt.toISOString(),
      completed_at: r.completedAt?.toISOString() ?? null,
    })),
    meta: { count: rows.length, limit },
  });
});
