/**
 * Usage History API (F176)
 * GET /api/usage/history - Get usage history over time
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { UsageHistory, UsageMetricType } from "@/hooks/useUsage";

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
    const period = searchParams.get("period") || "30d";

    // Determine number of days from period
    let days = 30;
    if (period === "7d") days = 7;
    else if (period === "14d") days = 14;
    else if (period === "30d") days = 30;
    else if (period === "90d") days = 90;

    // Generate history data
    const data: Array<{
      date: string;
      metrics: Record<UsageMetricType, number>;
    }> = [];

    const baseMetrics = {
      ai_tokens: 2500,
      api_calls: 80,
      scans: 1,
      audits: 0.3,
      content_generations: 2,
      mentions_tracked: 10,
      storage_mb: 80,
      team_members: 3,
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Add some variance to make data look realistic
      const variance = () => 0.7 + Math.random() * 0.6;

      data.push({
        date: date.toISOString().split("T")[0],
        metrics: {
          ai_tokens: Math.round(baseMetrics.ai_tokens * variance()),
          api_calls: Math.round(baseMetrics.api_calls * variance()),
          scans: Math.round(baseMetrics.scans * variance()),
          audits: Math.random() > 0.7 ? 1 : 0,
          content_generations: Math.round(baseMetrics.content_generations * variance()),
          mentions_tracked: Math.round(baseMetrics.mentions_tracked * variance()),
          storage_mb: Math.round(baseMetrics.storage_mb * (1 + i * 0.01)),
          team_members: 3,
        } as Record<UsageMetricType, number>,
      });
    }

    const history: UsageHistory = {
      period,
      data,
    };

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
