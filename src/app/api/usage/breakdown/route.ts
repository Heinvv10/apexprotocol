import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Usage Breakdown API (F176)
 * GET /api/usage/breakdown - Get usage breakdown by brand/user/feature
 * Wired to database: ai_usage table aggregations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";
import type { UsageBreakdown, UsageMetricType } from "@/hooks/useUsage";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryOrgId = searchParams.get("orgId") || orgId || userId;
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const periodDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Aggregate by user
    const userAggregation = await db
      .select({
        userId: schema.aiUsage.userId,
        totalTokens: sql<number>`COALESCE(SUM(${schema.aiUsage.totalTokens}), 0)`,
        operations: sql<number>`COUNT(*)`,
      })
      .from(schema.aiUsage)
      .where(
        and(
          eq(schema.aiUsage.organizationId, queryOrgId),
          gte(schema.aiUsage.createdAt, startDate)
        )
      )
      .groupBy(schema.aiUsage.userId);

    // Aggregate by feature/operation
    const featureAggregation = await db
      .select({
        feature: schema.aiUsage.operation,
        totalTokens: sql<number>`COALESCE(SUM(${schema.aiUsage.totalTokens}), 0)`,
        operations: sql<number>`COUNT(*)`,
      })
      .from(schema.aiUsage)
      .where(
        and(
          eq(schema.aiUsage.organizationId, queryOrgId),
          gte(schema.aiUsage.createdAt, startDate)
        )
      )
      .groupBy(schema.aiUsage.operation);

    // Build breakdown response with all required metric types
    const createMetrics = (overrides: Partial<Record<UsageMetricType, number>>): Record<UsageMetricType, number> => ({
      ai_tokens: 0,
      api_calls: 0,
      scans: 0,
      audits: 0,
      content_generations: 0,
      mentions_tracked: 0,
      storage_mb: 0,
      team_members: 0,
      ...overrides,
    });

    const breakdown: UsageBreakdown = {
      byBrand: [], // Brand breakdown would require joining with brands table
      byUser: userAggregation.map((row) => ({
        userId: row.userId || "unknown",
        userName: row.userId || "Unknown User",
        metrics: createMetrics({
          ai_tokens: Number(row.totalTokens),
          api_calls: Number(row.operations),
        }),
      })),
      byFeature: featureAggregation.map((row) => ({
        feature: (row.feature || "Unknown").charAt(0).toUpperCase() + (row.feature || "unknown").slice(1),
        metrics: createMetrics({
          ai_tokens: Number(row.totalTokens),
          audits: row.feature === "audit" ? Number(row.operations) : 0,
          scans: row.feature === "mention" ? Number(row.operations) : 0,
          content_generations: row.feature === "content" ? Number(row.operations) : 0,
          mentions_tracked: row.feature === "mention" ? Number(row.operations) : 0,
          api_calls: Number(row.operations),
        }),
      })),
    };

    return NextResponse.json(breakdown);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage breakdown",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
