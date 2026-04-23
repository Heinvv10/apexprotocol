/**
 * Per-brand-per-platform engagement autonomy settings.
 *
 * Default for any new row is `drafted` — every reply is queued for a human
 * to approve. Operators can promote a brand+platform combination to
 * `autonomous` once trust is earned (e.g. 20 consecutive approved drafts
 * that a reviewer wouldn't have edited), or demote to `off` if the brand
 * no longer wants automated engagement.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  socialEngagementSettings,
  type SocialEngagementSettings,
} from "@/lib/db/schema/social-engagement";
import type { SocialPlatform } from "@/lib/oauth/token-service";

export type AutonomyMode = SocialEngagementSettings["autonomyMode"];

/**
 * Return the effective autonomy mode for a brand on a platform. If no row
 * exists, returns 'drafted' (the safe default).
 */
export async function getAutonomyMode(
  brandId: string,
  platform: SocialPlatform,
): Promise<AutonomyMode> {
  const db = getDb();
  const row = await db.query.socialEngagementSettings.findFirst({
    where: and(
      eq(socialEngagementSettings.brandId, brandId),
      eq(socialEngagementSettings.platform, platform),
    ),
  });
  return row?.autonomyMode ?? "drafted";
}

export interface EnsureSettingsInput {
  brandId: string;
  platform: SocialPlatform;
  autonomyMode?: AutonomyMode;
  topicAllowlist?: string[];
}

/**
 * Upsert the settings row for a brand+platform. Used by the admin UI or
 * CLI — not called from the hot path.
 */
export async function ensureSettings(
  input: EnsureSettingsInput,
): Promise<SocialEngagementSettings> {
  const db = getDb();
  const existing = await db.query.socialEngagementSettings.findFirst({
    where: and(
      eq(socialEngagementSettings.brandId, input.brandId),
      eq(socialEngagementSettings.platform, input.platform),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(socialEngagementSettings)
      .set({
        autonomyMode: input.autonomyMode ?? existing.autonomyMode,
        topicAllowlist:
          input.topicAllowlist !== undefined
            ? input.topicAllowlist
            : existing.topicAllowlist,
        updatedAt: new Date(),
      })
      .where(eq(socialEngagementSettings.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(socialEngagementSettings)
    .values({
      brandId: input.brandId,
      platform: input.platform,
      autonomyMode: input.autonomyMode ?? "drafted",
      topicAllowlist: input.topicAllowlist ?? null,
    })
    .returning();
  return inserted;
}
