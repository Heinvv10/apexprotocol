/**
 * Apex Agents runner — persists every run to agent_runs, dispatches to
 * the right handler, enforces approval gate.
 *
 * Agents NEVER auto-publish or push to external systems. This runner
 * sets status=awaiting_approval; actual publish requires an explicit
 * approve action by a user.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, type NewAgentRun } from "@/lib/db/schema";
import { runVisibilityGapBrief } from "./visibility-gap-brief";
import { runCompetitorAudit } from "./competitor-audit";
import { runContentRefresh } from "./content-refresh";
import { logger } from "@/lib/logger";

export type AgentKind =
  | "visibility_gap_brief"
  | "competitor_audit"
  | "content_refresh";

export interface DispatchArgs {
  kind: AgentKind;
  organizationId: string;
  brandId: string;
  triggeredById?: string;
  params?: Record<string, unknown>;
}

export async function dispatchAgent(args: DispatchArgs): Promise<string> {
  const insert: NewAgentRun = {
    organizationId: args.organizationId,
    brandId: args.brandId,
    triggeredById: args.triggeredById,
    kind: args.kind,
    status: "running",
    params: args.params ?? {},
    startedAt: new Date(),
  };

  const [run] = await db.insert(agentRuns).values(insert).returning();

  // Run sync for now. BullMQ worker integration is a Sprint-5 task; for
  // now these execute in the request context (all three are sub-60s).
  try {
    const start = Date.now();
    const output = await runByKind(args.kind, {
      brandId: args.brandId,
      tenantId: args.organizationId,
      ...(args.params ?? {}),
    });

    await db
      .update(agentRuns)
      .set({
        status: "awaiting_approval",
        output,
        completedAt: new Date(),
        durationMs: Date.now() - start,
        updatedAt: new Date(),
      })
      .where(eq(agentRuns.id, run.id));

    logger.info("agent.completed", {
      runId: run.id,
      kind: args.kind,
      tenantId: args.organizationId,
      brandId: args.brandId,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    const msg = (err as Error).message;
    await db
      .update(agentRuns)
      .set({
        status: "failed",
        errorMessage: msg,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentRuns.id, run.id));
    logger.error("agent.failed", {
      runId: run.id,
      kind: args.kind,
      err: msg,
    });
    throw err;
  }

  return run.id;
}

async function runByKind(
  kind: AgentKind,
  params: { brandId: string; tenantId: string } & Record<string, unknown>,
): Promise<Record<string, unknown>> {
  switch (kind) {
    case "visibility_gap_brief":
      return (await runVisibilityGapBrief({
        brandId: params.brandId,
        tenantId: params.tenantId,
        briefsPerRun: numberParam(params.briefs_per_run, 5),
        lookbackDays: numberParam(params.lookback_days, 30),
        mentionRateThreshold: numberParam(params.mention_rate_threshold, 0.2),
      })) as unknown as Record<string, unknown>;

    case "competitor_audit":
      return (await runCompetitorAudit({
        brandId: params.brandId,
        tenantId: params.tenantId,
        topN: numberParam(params.top_n, 5),
      })) as unknown as Record<string, unknown>;

    case "content_refresh":
      return (await runContentRefresh({
        brandId: params.brandId,
        tenantId: params.tenantId,
        topN: numberParam(params.top_n, 5),
        minHistoricalMentions: numberParam(params.min_historical_mentions, 3),
      })) as unknown as Record<string, unknown>;
  }
}

function numberParam(v: unknown, def: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return def;
}

export interface ApprovalResult {
  runId: string;
  status: "approved" | "rejected";
}

export async function approveAgentRun(
  runId: string,
  approvedById: string,
): Promise<ApprovalResult> {
  await db
    .update(agentRuns)
    .set({
      status: "approved",
      approvedById,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));
  return { runId, status: "approved" };
}

export async function rejectAgentRun(
  runId: string,
  approvedById: string,
  reason: string,
): Promise<ApprovalResult> {
  await db
    .update(agentRuns)
    .set({
      status: "rejected",
      approvedById,
      approvedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));
  return { runId, status: "rejected" };
}
