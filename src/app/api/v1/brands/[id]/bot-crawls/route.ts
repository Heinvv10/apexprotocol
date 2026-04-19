/**
 * GET /api/v1/brands/:id/bot-crawls
 *
 * Aggregate bot-crawl analytics — "how often is GPTBot hitting my site?"
 *
 * Query params:
 *   - from (ISO, default 30d ago)
 *   - to   (ISO, default now)
 *   - crawler (optional — restrict to one)
 *   - group_by (crawler|path|day — default "crawler")
 */

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, botCrawls } from "@/lib/db/schema";
import { ApiError, withApiErrorHandling } from "@/lib/api/v1/error";
import { requireV1Auth } from "@/lib/api/v1/auth";

export const GET = withApiErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const auth = await requireV1Auth();
    const { id: brandId } = await params;
    const qp = request.nextUrl.searchParams;

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

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = qp.get("from") ? new Date(qp.get("from")!) : defaultFrom;
    const to = qp.get("to") ? new Date(qp.get("to")!) : now;

    const groupBy = qp.get("group_by") ?? "crawler";
    if (!["crawler", "path", "day"].includes(groupBy)) {
      throw new ApiError(
        "invalid_request",
        "group_by must be one of: crawler, path, day",
      );
    }

    const base = [
      eq(botCrawls.brandId, brandId),
      gte(botCrawls.occurredAt, from),
      lte(botCrawls.occurredAt, to),
    ];
    const crawlerFilter = qp.get("crawler");
    if (crawlerFilter) {
      base.push(
        sql`${botCrawls.crawler} = ${crawlerFilter}`,
      );
    }

    if (groupBy === "crawler") {
      const rows = await db
        .select({
          crawler: botCrawls.crawler,
          hits: sql<number>`COUNT(*)::int`,
          paths: sql<number>`COUNT(DISTINCT ${botCrawls.path})::int`,
        })
        .from(botCrawls)
        .where(and(...base))
        .groupBy(botCrawls.crawler);
      return NextResponse.json({
        data: rows.map((r) => ({
          crawler: r.crawler,
          hits: r.hits,
          unique_paths: r.paths,
        })),
      });
    }

    if (groupBy === "path") {
      const rows = await db
        .select({
          path: botCrawls.path,
          hits: sql<number>`COUNT(*)::int`,
          crawlers: sql<number>`COUNT(DISTINCT ${botCrawls.crawler})::int`,
        })
        .from(botCrawls)
        .where(and(...base))
        .groupBy(botCrawls.path)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(100);
      return NextResponse.json({
        data: rows.map((r) => ({
          path: r.path,
          hits: r.hits,
          unique_crawlers: r.crawlers,
        })),
      });
    }

    // group_by = day
    const rows = await db.execute<{
      day: string;
      hits: number;
    }>(sql`
      SELECT date_trunc('day', occurred_at)::date::text AS day,
             COUNT(*)::int AS hits
      FROM bot_crawls
      WHERE brand_id = ${brandId}
        AND occurred_at >= ${from}
        AND occurred_at <= ${to}
        ${crawlerFilter ? sql`AND crawler = ${crawlerFilter}` : sql``}
      GROUP BY day
      ORDER BY day ASC
    `);
    const out = Array.isArray(rows)
      ? rows
      : (((rows as unknown as { rows?: Array<{ day: string; hits: number }> })?.rows) ?? []);
    return NextResponse.json({
      data: out.map((r) => ({ day: r.day, hits: Number(r.hits) })),
    });
  },
);
