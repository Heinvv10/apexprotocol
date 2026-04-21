/**
 * Retention Policy (Phase 1.3)
 *
 * Plan-tiered retention with scheduled cleanup across the main growing tables:
 *   - brand_mentions (monitoring volume — largest table)
 *   - audits (completed audit runs)
 *   - brand_sentiment_history (aggregates, if present)
 *
 * Retention windows per plan:
 *   - starter:      90 days
 *   - professional: 180 days (~6 months)
 *   - enterprise:   720 days (~24 months)
 *
 * The purge is scoped per-organization so we honor each org's tier.
 */

import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { audits, brandMentions, brands, organizations } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export const RETENTION_DAYS_BY_PLAN = {
  starter: 90,
  professional: 180,
  enterprise: 720,
} as const;

export type PlanTier = keyof typeof RETENTION_DAYS_BY_PLAN;

export interface PurgeResult {
  organizationId: string;
  plan: PlanTier;
  retentionDays: number;
  cutoffDate: Date;
  purgedMentions: number;
  purgedAudits: number;
  purgedAuditsFailed: number;
  errors: string[];
}

export interface RetentionRunSummary {
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  organizationsProcessed: number;
  totalPurgedMentions: number;
  totalPurgedAudits: number;
  results: PurgeResult[];
}

function cutoffFor(plan: PlanTier): Date {
  const days = RETENTION_DAYS_BY_PLAN[plan];
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function purgeOrganization(
  organizationId: string,
  plan: PlanTier,
): Promise<PurgeResult> {
  const cutoff = cutoffFor(plan);
  const errors: string[] = [];
  let purgedMentions = 0;
  let purgedAudits = 0;
  let purgedAuditsFailed = 0;

  // Resolve brand ids for this org (cascade safety — mentions reference brand)
  const orgBrands = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.organizationId, organizationId));
  const brandIds = orgBrands.map((b) => b.id);
  if (brandIds.length === 0) {
    return {
      organizationId,
      plan,
      retentionDays: RETENTION_DAYS_BY_PLAN[plan],
      cutoffDate: cutoff,
      purgedMentions: 0,
      purgedAudits: 0,
      purgedAuditsFailed: 0,
      errors: [],
    };
  }

  // Purge brand_mentions
  try {
    const mentionsRes = await db
      .delete(brandMentions)
      .where(
        and(
          inArray(brandMentions.brandId, brandIds),
          lt(brandMentions.timestamp, cutoff),
        ),
      )
      .returning({ id: brandMentions.id });
    purgedMentions = mentionsRes.length;
  } catch (e) {
    errors.push(
      `mentions:${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Purge completed audits older than cutoff
  try {
    const auditsRes = await db
      .delete(audits)
      .where(
        and(
          inArray(audits.brandId, brandIds),
          eq(audits.status, "completed"),
          lt(audits.completedAt, cutoff),
        ),
      )
      .returning({ id: audits.id });
    purgedAudits = auditsRes.length;
  } catch (e) {
    errors.push(`audits:${e instanceof Error ? e.message : String(e)}`);
  }

  // Purge failed audits older than 30 days (regardless of plan — they're noise)
  try {
    const failedCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const failedRes = await db
      .delete(audits)
      .where(
        and(
          inArray(audits.brandId, brandIds),
          eq(audits.status, "failed"),
          lt(audits.createdAt, failedCutoff),
        ),
      )
      .returning({ id: audits.id });
    purgedAuditsFailed = failedRes.length;
  } catch (e) {
    errors.push(`audits_failed:${e instanceof Error ? e.message : String(e)}`);
  }

  logger.info("retention.org_purged", {
    organizationId,
    plan,
    retentionDays: RETENTION_DAYS_BY_PLAN[plan],
    purgedMentions,
    purgedAudits,
    purgedAuditsFailed,
    errorCount: errors.length,
  });

  return {
    organizationId,
    plan,
    retentionDays: RETENTION_DAYS_BY_PLAN[plan],
    cutoffDate: cutoff,
    purgedMentions,
    purgedAudits,
    purgedAuditsFailed,
    errors,
  };
}

/**
 * Run retention purge across all organizations. Safe to call idempotently —
 * each invocation only deletes rows past that org's cutoff.
 */
export async function runRetentionPurge(options: {
  dryRun?: boolean;
} = {}): Promise<RetentionRunSummary> {
  const startedAt = new Date();

  if (options.dryRun) {
    // Dry-run: count rows that would be deleted, don't mutate
    const orgs = await db
      .select({ id: organizations.id, plan: organizations.plan })
      .from(organizations);
    const results: PurgeResult[] = orgs.map((o) => ({
      organizationId: o.id,
      plan: o.plan as PlanTier,
      retentionDays: RETENTION_DAYS_BY_PLAN[o.plan as PlanTier],
      cutoffDate: cutoffFor(o.plan as PlanTier),
      purgedMentions: 0,
      purgedAudits: 0,
      purgedAuditsFailed: 0,
      errors: ["dry-run — no deletes performed"],
    }));
    const finishedAt = new Date();
    return {
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      organizationsProcessed: results.length,
      totalPurgedMentions: 0,
      totalPurgedAudits: 0,
      results,
    };
  }

  const orgs = await db
    .select({ id: organizations.id, plan: organizations.plan })
    .from(organizations);

  const results: PurgeResult[] = [];
  for (const org of orgs) {
    try {
      const result = await purgeOrganization(org.id, org.plan as PlanTier);
      results.push(result);
    } catch (e) {
      logger.error("retention.org_failed", {
        organizationId: org.id,
        error: e instanceof Error ? e.message : String(e),
      });
      results.push({
        organizationId: org.id,
        plan: org.plan as PlanTier,
        retentionDays: RETENTION_DAYS_BY_PLAN[org.plan as PlanTier],
        cutoffDate: cutoffFor(org.plan as PlanTier),
        purgedMentions: 0,
        purgedAudits: 0,
        purgedAuditsFailed: 0,
        errors: [e instanceof Error ? e.message : String(e)],
      });
    }
  }

  const finishedAt = new Date();
  const totalPurgedMentions = results.reduce(
    (s, r) => s + r.purgedMentions,
    0,
  );
  const totalPurgedAudits = results.reduce(
    (s, r) => s + r.purgedAudits + r.purgedAuditsFailed,
    0,
  );

  logger.info("retention.run_complete", {
    organizationsProcessed: results.length,
    totalPurgedMentions,
    totalPurgedAudits,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  });

  return {
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    organizationsProcessed: results.length,
    totalPurgedMentions,
    totalPurgedAudits,
    results,
  };
}
