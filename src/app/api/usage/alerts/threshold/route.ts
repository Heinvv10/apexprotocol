import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Alert Threshold API (F176)
 * POST /api/usage/alerts/threshold - Set alert threshold
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { UsageMetricType } from "@/hooks/useUsage";

// In-memory threshold storage (would be database in production)
const thresholdStore = new Map<string, Array<{ metric: UsageMetricType; threshold: number; enabled: boolean }>>();

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to set alert threshold",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
