/**
 * Share-of-Voice aggregation.
 *
 * Requirement: FR-MON-023 competitor share-of-voice.
 *
 * SoV = percentage of AI responses (over a window) that mention a given
 * entity, across a set of prompts tracked for a brand. Tracked separately
 * per-platform AND rolled up across all platforms.
 *
 * This module computes SoV on-demand from `brand_mentions`. We also write
 * daily snapshots into the `share_of_voice` table so trend views don't
 * recompute every load — that's done by a BullMQ worker (not here).
 */

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandMentions } from "@/lib/db/schema";

export interface SoVPoint {
  entity: string;
  /** Is this the client's own brand vs. a competitor/other */
  isOwn: boolean;
  mentionCount: number;
  sovPercentage: number;
}

export interface SoVWindow {
  brandId: string;
  platform?: string | null;
  from: Date;
  to: Date;
}

/**
 * Compute current SoV for a brand vs. any entities that appeared in the
 * same `brand_mentions` rows' competitor arrays.
 *
 * Implementation note: `brand_mentions.competitors` is a jsonb array of
 * { name: string, position?: number } per row. We aggregate by unnesting.
 */
export async function computeShareOfVoice(
  window: SoVWindow,
): Promise<SoVPoint[]> {
  const filters = [
    eq(brandMentions.brandId, window.brandId),
    gte(brandMentions.timestamp, window.from),
  ];
  if (window.platform) {
    filters.push(
      sql`${brandMentions.platform} = ${window.platform}`,
    );
  }

  // Two queries: own-brand mention count (where position is not null or
  // response flagged as brand-mentioned), and competitor mention counts.
  const ownRows = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(brandMentions)
    .where(
      and(
        ...filters,
        sql`${brandMentions.position} IS NOT NULL`,
      ),
    );

  const totalRows = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(brandMentions)
    .where(and(...filters));

  // Competitor rollup via unnest
  const competitorRows = await db.execute<{
    competitor_name: string;
    mention_count: number;
  }>(sql`
    SELECT
      comp->>'name' AS competitor_name,
      COUNT(*)::int AS mention_count
    FROM brand_mentions,
         jsonb_array_elements(competitors) AS comp
    WHERE brand_id = ${window.brandId}
      AND timestamp >= ${window.from}
      ${window.to ? sql`AND timestamp <= ${window.to}` : sql``}
      ${window.platform ? sql`AND platform = ${window.platform}` : sql``}
      AND comp->>'name' IS NOT NULL
    GROUP BY comp->>'name'
    ORDER BY mention_count DESC
    LIMIT 25
  `);

  const ownCount = ownRows[0]?.count ?? 0;
  const totalCount = totalRows[0]?.count ?? 0;
  if (totalCount === 0) return [];

  const points: SoVPoint[] = [];

  // Resolve the "own brand" entity name
  // (We don't have brand.name here — caller should post-process or we can
  // look it up; leaving as "__own__" and expecting caller to swap.)
  points.push({
    entity: "__own__",
    isOwn: true,
    mentionCount: ownCount,
    sovPercentage: (ownCount / totalCount) * 100,
  });

  const compRows = Array.isArray(competitorRows)
    ? competitorRows
    : ((competitorRows as unknown as { rows: Array<{ competitor_name: string; mention_count: number }> }).rows ?? []);

  for (const row of compRows) {
    points.push({
      entity: row.competitor_name,
      isOwn: false,
      mentionCount: Number(row.mention_count),
      sovPercentage: (Number(row.mention_count) / totalCount) * 100,
    });
  }

  return points.sort((a, b) => b.mentionCount - a.mentionCount);
}
