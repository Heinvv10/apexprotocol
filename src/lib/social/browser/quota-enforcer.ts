/**
 * Quota enforcer for browser-automation social actions.
 *
 * Hard caps (per credential, per day) and a min-interval between writes keep
 * our posting rate well below what platforms consider bot-like. Refusing a
 * request is correct behaviour, not a bug — see apex-social-browser PRD §6.
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  socialBrowserActions,
  type SocialBrowserAction,
} from "@/lib/db/schema/social-browser-auth";
import type { SocialBrowserCredential } from "@/lib/db/schema/social-browser-auth";

interface PlatformQuota {
  dailyWriteCap: number;
  minIntervalMs: number;
}

const WRITE_ACTIONS: ReadonlySet<SocialBrowserAction["actionType"]> = new Set([
  "post",
  "thread",
  "reply",
  "quote",
  "comment",
]);

/**
 * Conservative per-platform caps. These sit well under each platform's
 * de-facto automation thresholds so the same credential can run for years
 * without attracting attention.
 */
const QUOTAS: Record<SocialBrowserCredential["platform"], PlatformQuota> = {
  twitter: { dailyWriteCap: 10, minIntervalMs: 30 * 60 * 1000 },
  linkedin: { dailyWriteCap: 5, minIntervalMs: 60 * 60 * 1000 },
  reddit: { dailyWriteCap: 3, minIntervalMs: 90 * 60 * 1000 },
  youtube: { dailyWriteCap: 5, minIntervalMs: 60 * 60 * 1000 },
  medium: { dailyWriteCap: 2, minIntervalMs: 4 * 60 * 60 * 1000 },
  facebook: { dailyWriteCap: 5, minIntervalMs: 60 * 60 * 1000 },
  instagram: { dailyWriteCap: 3, minIntervalMs: 2 * 60 * 60 * 1000 },
  tiktok: { dailyWriteCap: 3, minIntervalMs: 2 * 60 * 60 * 1000 },
  threads: { dailyWriteCap: 10, minIntervalMs: 30 * 60 * 1000 },
  mastodon: { dailyWriteCap: 10, minIntervalMs: 30 * 60 * 1000 },
  bluesky: { dailyWriteCap: 10, minIntervalMs: 30 * 60 * 1000 },
  github: { dailyWriteCap: 5, minIntervalMs: 60 * 60 * 1000 },
  pinterest: { dailyWriteCap: 5, minIntervalMs: 60 * 60 * 1000 },
  discord: { dailyWriteCap: 10, minIntervalMs: 30 * 60 * 1000 },
  quora: { dailyWriteCap: 2, minIntervalMs: 4 * 60 * 60 * 1000 },
};

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly credentialId: string,
    public readonly platform: SocialBrowserCredential["platform"],
    public readonly reason: "daily_cap" | "min_interval",
  ) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export interface QuotaCheckResult {
  ok: boolean;
  writesToday: number;
  dailyCap: number;
  lastWriteAt: Date | null;
  nextEligibleAt: Date | null;
}

/**
 * Check whether the credential can perform another write action right now.
 * Does not throw — callers can inspect `ok` and `nextEligibleAt` to decide
 * whether to wait.
 */
export async function checkWriteQuota(
  credentialId: string,
  platform: SocialBrowserCredential["platform"],
): Promise<QuotaCheckResult> {
  const quota = QUOTAS[platform];
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const todayActions = await db
    .select({
      createdAt: socialBrowserActions.createdAt,
      actionType: socialBrowserActions.actionType,
      status: socialBrowserActions.status,
    })
    .from(socialBrowserActions)
    .where(
      and(
        eq(socialBrowserActions.credentialId, credentialId),
        gte(socialBrowserActions.createdAt, startOfDay),
      ),
    )
    .orderBy(desc(socialBrowserActions.createdAt));

  const writesToday = todayActions.filter(
    (a) => WRITE_ACTIONS.has(a.actionType) && a.status === "success",
  ).length;
  const lastWrite = todayActions.find(
    (a) => WRITE_ACTIONS.has(a.actionType) && a.status === "success",
  );
  const lastWriteAt = lastWrite?.createdAt ?? null;

  const nextEligibleAt = lastWriteAt
    ? new Date(lastWriteAt.getTime() + quota.minIntervalMs)
    : null;

  const intervalOk = !nextEligibleAt || nextEligibleAt <= new Date();
  const capOk = writesToday < quota.dailyWriteCap;

  return {
    ok: intervalOk && capOk,
    writesToday,
    dailyCap: quota.dailyWriteCap,
    lastWriteAt,
    nextEligibleAt,
  };
}

/** Same check but throws QuotaExceededError when blocked. */
export async function assertWriteQuota(
  credentialId: string,
  platform: SocialBrowserCredential["platform"],
): Promise<void> {
  const result = await checkWriteQuota(credentialId, platform);
  if (result.ok) return;

  if (result.writesToday >= result.dailyCap) {
    throw new QuotaExceededError(
      `Daily write cap reached for credential ${credentialId} on ${platform}: ${result.writesToday}/${result.dailyCap}`,
      credentialId,
      platform,
      "daily_cap",
    );
  }
  throw new QuotaExceededError(
    `Min interval not yet elapsed for credential ${credentialId} on ${platform}. Next eligible at ${result.nextEligibleAt?.toISOString()}`,
    credentialId,
    platform,
    "min_interval",
  );
}
