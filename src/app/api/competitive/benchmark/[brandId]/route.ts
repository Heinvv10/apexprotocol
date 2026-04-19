/**
 * Competitive Benchmark API
 * Phase 9.1: Get benchmark data for brand vs competitors
 *
 * GET /api/competitive/benchmark/[brandId] - Get full benchmark
 * GET /api/competitive/benchmark/[brandId]?summary=true - Get quick summary
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrganizationId, getUserId } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateBenchmark,
  getQuickBenchmarkSummary,
} from "@/lib/competitive/benchmarking";

interface RouteParams {
  params: Promise<{ brandId: string }>;
}

/**
 * GET /api/competitive/benchmark/[brandId]
 * Get benchmark data comparing brand vs competitors
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const brandId = params.brandId;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const summaryOnly = searchParams.get("summary") === "true";
    const lookbackDays = parseInt(searchParams.get("lookbackDays") || "30", 10);
    const includeHistorical = searchParams.get("includeHistorical") === "true";

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Return summary if requested
    if (summaryOnly) {
      const summary = await getQuickBenchmarkSummary(brandId);
      return NextResponse.json({
        success: true,
        summary,
      });
    }

    // Calculate full benchmark
    const benchmark = await calculateBenchmark(brandId, {
      lookbackDays,
      includeHistorical,
    });

    return NextResponse.json({
      success: true,
      benchmark,
    });
  } catch (error) {
    console.error("Error getting benchmark:", error);

    // Handle specific errors
    if (error instanceof Error && error.message === "Brand not found") {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to get benchmark data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitive/benchmark/[brandId]
 * Trigger a benchmark recalculation (for on-demand refresh)
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const brandId = params.brandId;

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const { lookbackDays = 30, competitorIds } = body as {
      lookbackDays?: number;
      competitorIds?: string[];
    };

    // Verify brand exists
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Force recalculation
    const benchmark = await calculateBenchmark(brandId, {
      lookbackDays,
      competitorIds,
    });

    return NextResponse.json({
      success: true,
      message: "Benchmark recalculated successfully",
      benchmark,
    });
  } catch (error) {
    console.error("Error recalculating benchmark:", error);

    if (error instanceof Error && error.message === "Brand not found") {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to recalculate benchmark" },
      { status: 500 }
    );
  }
}
