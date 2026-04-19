/**
 * Apex Agent — Competitor Audit (FR-AGT-002).
 *
 * Monthly run: summarise the top N competitors' GEO performance changes
 * month-over-month so the user doesn't have to eyeball it.
 *
 * Uses existing brand_mentions + competitors jsonb column. No new data
 * sources — just surfacing the delta.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export interface CompetitorAuditParams {
  brandId: string;
  tenantId: string;
  /** Top N competitors to report on — default 5 */
  topN?: number;
}

export interface CompetitorDelta {
  competitor: string;
  mentionsThisPeriod: number;
  mentionsLastPeriod: number;
  change: number;
  changePct: number | null;
  /** Platforms where this competitor gained most ground */
  risingPlatforms: string[];
}

export interface CompetitorAuditOutput {
  period: {
    current: { from: string; to: string };
    previous: { from: string; to: string };
  };
  deltas: CompetitorDelta[];
  summary: string;
}

export async function runCompetitorAudit(
  params: CompetitorAuditParams,
): Promise<CompetitorAuditOutput> {
  const topN = params.topN ?? 5;
  const now = new Date();
  const currentFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const previousTo = currentFrom;

  // Current-period competitor counts
  const currentRows = await db.execute<{
    competitor_name: string;
    mention_count: number;
  }>(sql`
    SELECT comp->>'name' AS competitor_name,
           COUNT(*)::int AS mention_count
    FROM brand_mentions, jsonb_array_elements(competitors) AS comp
    WHERE brand_id = ${params.brandId}
      AND timestamp >= ${currentFrom}
      AND comp->>'name' IS NOT NULL
    GROUP BY comp->>'name'
  `);

  // Previous-period competitor counts
  const previousRows = await db.execute<{
    competitor_name: string;
    mention_count: number;
  }>(sql`
    SELECT comp->>'name' AS competitor_name,
           COUNT(*)::int AS mention_count
    FROM brand_mentions, jsonb_array_elements(competitors) AS comp
    WHERE brand_id = ${params.brandId}
      AND timestamp >= ${previousFrom}
      AND timestamp < ${previousTo}
      AND comp->>'name' IS NOT NULL
    GROUP BY comp->>'name'
  `);

  // Rising-platform rollup per competitor
  const platformRows = await db.execute<{
    competitor_name: string;
    platform: string;
    delta: number;
  }>(sql`
    WITH current_p AS (
      SELECT comp->>'name' AS competitor_name, platform, COUNT(*)::int AS cnt
      FROM brand_mentions, jsonb_array_elements(competitors) AS comp
      WHERE brand_id = ${params.brandId}
        AND timestamp >= ${currentFrom}
        AND comp->>'name' IS NOT NULL
      GROUP BY comp->>'name', platform
    ),
    previous_p AS (
      SELECT comp->>'name' AS competitor_name, platform, COUNT(*)::int AS cnt
      FROM brand_mentions, jsonb_array_elements(competitors) AS comp
      WHERE brand_id = ${params.brandId}
        AND timestamp >= ${previousFrom}
        AND timestamp < ${previousTo}
        AND comp->>'name' IS NOT NULL
      GROUP BY comp->>'name', platform
    )
    SELECT
      COALESCE(c.competitor_name, p.competitor_name) AS competitor_name,
      COALESCE(c.platform, p.platform) AS platform,
      (COALESCE(c.cnt, 0) - COALESCE(p.cnt, 0))::int AS delta
    FROM current_p c
    FULL OUTER JOIN previous_p p
      ON c.competitor_name = p.competitor_name AND c.platform = p.platform
  `);

  const currentMap = new Map(
    asRows<{ competitor_name: string; mention_count: number }>(currentRows).map((r) => [
      r.competitor_name,
      Number(r.mention_count),
    ]),
  );
  const previousMap = new Map(
    asRows<{ competitor_name: string; mention_count: number }>(previousRows).map((r) => [
      r.competitor_name,
      Number(r.mention_count),
    ]),
  );
  const platformDeltas = new Map<string, Array<{ platform: string; delta: number }>>();
  for (const r of asRows<{ competitor_name: string; platform: string; delta: number }>(
    platformRows,
  )) {
    const list = platformDeltas.get(r.competitor_name) ?? [];
    list.push({ platform: r.platform, delta: Number(r.delta) });
    platformDeltas.set(r.competitor_name, list);
  }

  const allNames = new Set<string>([
    ...currentMap.keys(),
    ...previousMap.keys(),
  ]);

  const deltas: CompetitorDelta[] = Array.from(allNames)
    .map((name) => {
      const cur = currentMap.get(name) ?? 0;
      const prev = previousMap.get(name) ?? 0;
      const change = cur - prev;
      const changePct = prev === 0 ? null : (change / prev) * 100;
      const rising = (platformDeltas.get(name) ?? [])
        .filter((p) => p.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3)
        .map((p) => p.platform);
      return {
        competitor: name,
        mentionsThisPeriod: cur,
        mentionsLastPeriod: prev,
        change,
        changePct,
        risingPlatforms: rising,
      };
    })
    .sort((a, b) => b.mentionsThisPeriod - a.mentionsThisPeriod)
    .slice(0, topN);

  const summary = buildSummary(deltas);

  return {
    period: {
      current: {
        from: currentFrom.toISOString(),
        to: now.toISOString(),
      },
      previous: {
        from: previousFrom.toISOString(),
        to: previousTo.toISOString(),
      },
    },
    deltas,
    summary,
  };
}

function asRows<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  return (
    ((res as { rows?: T[] })?.rows ?? []) as T[]
  );
}

function buildSummary(deltas: CompetitorDelta[]): string {
  if (deltas.length === 0) {
    return "No competitor mentions recorded in either period.";
  }
  const winner = deltas.reduce((best, d) =>
    d.change > best.change ? d : best,
  );
  const loser = deltas.reduce((worst, d) =>
    d.change < worst.change ? d : worst,
  );
  const lines: string[] = [
    `Top competitor: ${deltas[0].competitor} (${deltas[0].mentionsThisPeriod} mentions this period).`,
  ];
  if (winner.change > 0) {
    lines.push(
      `${winner.competitor} gained ${winner.change} mentions vs last period${winner.risingPlatforms.length > 0 ? ` (rising on ${winner.risingPlatforms.join(", ")})` : ""}.`,
    );
  }
  if (loser.change < 0) {
    lines.push(
      `${loser.competitor} lost ${Math.abs(loser.change)} mentions — opportunity window.`,
    );
  }
  return lines.join(" ");
}
