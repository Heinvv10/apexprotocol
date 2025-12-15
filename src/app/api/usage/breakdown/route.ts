/**
 * Usage Breakdown API (F176)
 * GET /api/usage/breakdown - Get usage breakdown by brand/user/feature
 * TODO: Connect to database for real usage data
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { UsageBreakdown } from "@/hooks/useUsage";

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

    // TODO: Fetch real usage breakdown from database
    // Currently returning empty arrays - will be populated when database is connected
    const breakdown: UsageBreakdown = {
      byBrand: [],
      byUser: [],
      byFeature: [],
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
