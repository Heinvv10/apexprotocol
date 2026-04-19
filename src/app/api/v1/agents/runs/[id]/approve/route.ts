/**
 * POST /api/v1/agents/runs/:id/approve
 * POST /api/v1/agents/runs/:id/reject   (sibling route)
 *
 * Approval gate for agent runs. Status transitions awaiting_approval →
 * approved/rejected. Publish/side-effects gated on status=approved
 * downstream (Sprint 5 work to wire Shopify/WP publishers).
 *
 * FR-AGT-004.
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";
import { approveAgentRun } from "@/lib/agents/runner";

export const POST = withApiErrorHandling(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id } = await params;

    const rows = await db
      .select({ id: agentRuns.id, status: agentRuns.status })
      .from(agentRuns)
      .where(
        and(eq(agentRuns.id, id), eq(agentRuns.organizationId, auth.tenantId)),
      )
      .limit(1);
    if (rows.length === 0) {
      throw new ApiError("not_found", "Agent run not found.");
    }
    if (rows[0].status !== "awaiting_approval") {
      throw new ApiError(
        "conflict",
        `Run is in status "${rows[0].status}" — only awaiting_approval can be approved.`,
      );
    }

    const result = await approveAgentRun(id, auth.userId);
    return NextResponse.json({ data: result });
  },
);
