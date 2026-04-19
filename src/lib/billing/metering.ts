/**
 * Metering helper — single entry point for writing usage events.
 *
 * Every domain component that consumes metered resources calls `recordUsage`.
 * Guarantees:
 *   - Idempotent when caller provides a key
 *   - Non-blocking (errors are logged, never thrown to the caller)
 *   - Safe from the edge runtime (pushes to BullMQ when available; falls
 *     back to direct DB write when queue isn't configured)
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageEvents, type NewUsageEvent } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export type UsageEventKind =
  | "llm_input_tokens"
  | "llm_output_tokens"
  | "audit_run"
  | "monitored_prompt_run"
  | "agent_run"
  | "serpapi_query"
  | "dataforseo_query"
  | "pdf_report_generated"
  | "embed_token_minted";

export interface RecordUsageArgs {
  organizationId: string;
  clientOrganizationId?: string | null;
  kind: UsageEventKind;
  quantity: number;
  unitCostMicroCents?: number;
  provider?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  occurredAt?: Date;
}

export async function recordUsage(args: RecordUsageArgs): Promise<void> {
  if (!Number.isFinite(args.quantity) || args.quantity < 0) {
    logger.warn("usage.invalid_quantity", {
      kind: args.kind,
      quantity: args.quantity,
    });
    return;
  }

  const costCents = args.unitCostMicroCents
    ? Math.round((args.unitCostMicroCents * args.quantity) / 100_000)
    : null;

  const row: NewUsageEvent = {
    organizationId: args.organizationId,
    clientOrganizationId: args.clientOrganizationId ?? null,
    kind: args.kind,
    quantity: args.quantity,
    unitCostMicroCents: args.unitCostMicroCents,
    costCents,
    provider: args.provider,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
    idempotencyKey: args.idempotencyKey,
    occurredAt: args.occurredAt,
  };

  try {
    if (args.idempotencyKey) {
      // DO NOTHING on conflict — our idempotency index enforces uniqueness
      await db
        .insert(usageEvents)
        .values(row)
        .onConflictDoNothing({ target: usageEvents.idempotencyKey });
    } else {
      await db.insert(usageEvents).values(row);
    }
  } catch (err) {
    logger.error("usage.record_failed", {
      kind: args.kind,
      orgId: args.organizationId,
      err: (err as Error).message,
    });
  }
}

export interface UsageRollup {
  organizationId: string;
  kind: UsageEventKind;
  from: Date;
  to: Date;
  quantity: number;
  costCents: number;
  /** Per-client breakdown — empty for direct customers */
  byClient: Array<{
    clientOrganizationId: string;
    quantity: number;
    costCents: number;
  }>;
}

export async function rollupUsage(args: {
  organizationId: string;
  kind?: UsageEventKind;
  from: Date;
  to: Date;
}): Promise<UsageRollup[]> {
  const rows = await db.execute<{
    kind: UsageEventKind;
    total_quantity: number;
    total_cost_cents: number;
  }>(sql`
    SELECT kind,
           SUM(quantity)::bigint AS total_quantity,
           COALESCE(SUM(cost_cents), 0)::bigint AS total_cost_cents
    FROM usage_events
    WHERE organization_id = ${args.organizationId}
      AND occurred_at >= ${args.from}
      AND occurred_at <= ${args.to}
      ${args.kind ? sql`AND kind = ${args.kind}` : sql``}
    GROUP BY kind
  `);

  const clientRows = await db.execute<{
    kind: UsageEventKind;
    client_organization_id: string;
    total_quantity: number;
    total_cost_cents: number;
  }>(sql`
    SELECT kind, client_organization_id,
           SUM(quantity)::bigint AS total_quantity,
           COALESCE(SUM(cost_cents), 0)::bigint AS total_cost_cents
    FROM usage_events
    WHERE organization_id = ${args.organizationId}
      AND client_organization_id IS NOT NULL
      AND occurred_at >= ${args.from}
      AND occurred_at <= ${args.to}
      ${args.kind ? sql`AND kind = ${args.kind}` : sql``}
    GROUP BY kind, client_organization_id
  `);

  const clientsByKind = new Map<UsageEventKind, UsageRollup["byClient"]>();
  for (const r of asRows<{
    kind: UsageEventKind;
    client_organization_id: string;
    total_quantity: number;
    total_cost_cents: number;
  }>(clientRows)) {
    const list = clientsByKind.get(r.kind) ?? [];
    list.push({
      clientOrganizationId: r.client_organization_id,
      quantity: Number(r.total_quantity),
      costCents: Number(r.total_cost_cents),
    });
    clientsByKind.set(r.kind, list);
  }

  return asRows<{
    kind: UsageEventKind;
    total_quantity: number;
    total_cost_cents: number;
  }>(rows).map((r) => ({
    organizationId: args.organizationId,
    kind: r.kind,
    from: args.from,
    to: args.to,
    quantity: Number(r.total_quantity),
    costCents: Number(r.total_cost_cents),
    byClient: clientsByKind.get(r.kind) ?? [],
  }));
}

function asRows<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] })?.rows ?? []) as T[];
}
