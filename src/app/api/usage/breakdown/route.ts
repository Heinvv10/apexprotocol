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
    const { userId, orgId } = await auth();

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

    // Map feature names to metric types
    const featureToMetric: Record<string, UsageMetricType> = {
      sentiment: "ai_tokens",
      content: "ai_tokens",
      recommendation: "ai_tokens",
      embedding: "ai_tokens",
      analysis: "ai_tokens",
    };

    // Build breakdown response
    const breakdown: UsageBreakdown = {
      byBrand: [], // Brand breakdown would require joining with brands table
      byUser: userAggregation.map((row) => ({
        userId: row.userId || "unknown",
        userName: row.userId || "Unknown User",
        metrics: {
          ai_tokens: Number(row.totalTokens),
          audits: 0,
          mentions: 0,
          content_pieces: 0,
          recommendations: 0,
          api_calls: Number(row.operations),
          storage: 0,
        } as Record<UsageMetricType, number>,
      })),
      byFeature: featureAggregation.map((row) => ({
        featureId: row.feature || "unknown",
        featureName: (row.feature || "Unknown").charAt(0).toUpperCase() + (row.feature || "unknown").slice(1),
        metrics: {
          ai_tokens: Number(row.totalTokens),
          audits: row.feature === "audit" ? Number(row.operations) : 0,
          mentions: row.feature === "mention" ? Number(row.operations) : 0,
          content_pieces: row.feature === "content" ? Number(row.operations) : 0,
          recommendations: row.feature === "recommendation" ? Number(row.operations) : 0,
          api_calls: Number(row.operations),
          storage: 0,
        } as Record<UsageMetricType, number>,
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
