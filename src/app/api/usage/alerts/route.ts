import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * Usage Alerts API (F176)
 * GET /api/usage/alerts - Get usage alerts
 * POST /api/usage/alerts/threshold - Set alert threshold
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { UsageAlert, UsageMetricType } from "@/hooks/useUsage";

// In-memory alert storage (would be database in production)
const alertStore = new Map<string, UsageAlert[]>();
const thresholdStore = new Map<string, { metric: UsageMetricType; threshold: number; enabled: boolean }[]>();

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

    // Get stored alerts or generate defaults
    let alerts = alertStore.get(queryOrgId);

    if (!alerts) {
      // Generate sample alerts for demo
      alerts = [
        {
          id: "alert-ai-tokens-warning",
          type: "warning" as const,
          metric: "ai_tokens" as UsageMetricType,
          message: "AI token usage is at 75% of monthly limit",
          threshold: 80,
          currentValue: 75420,
        },
        {
          id: "alert-audits-info",
          type: "info" as const,
          metric: "audits" as UsageMetricType,
          message: "You have used 7 of 10 monthly audits",
          threshold: 70,
          currentValue: 7,
        },
      ];
      alertStore.set(queryOrgId, alerts);
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch usage alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizationId = orgId || userId;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "threshold") {
      return handleSetThreshold(organizationId, body);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process alert request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function handleSetThreshold(organizationId: string, body: unknown) {
  const schema = z.object({
    metric: z.enum([
      "ai_tokens",
      "api_calls",
      "scans",
      "audits",
      "content_generations",
      "mentions_tracked",
      "storage_mb",
      "team_members",
    ]),
    threshold: z.number().min(0).max(100),
    enabled: z.boolean(),
  });

  const data = schema.parse(body);

  // Get or create threshold settings for org
  const thresholds = thresholdStore.get(organizationId) || [];

  // Update or add threshold
  const existingIndex = thresholds.findIndex((t) => t.metric === data.metric);
  if (existingIndex >= 0) {
    thresholds[existingIndex] = data;
  } else {
    thresholds.push(data);
  }

  thresholdStore.set(organizationId, thresholds);

  return NextResponse.json({
    success: true,
    message: `Alert threshold for ${data.metric} set to ${data.threshold}%`,
    threshold: data,
  });
}
