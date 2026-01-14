/**
 * AI Usage & Cost Dashboard API
 *
 * GET /api/admin/dashboard/ai-costs
 * Returns AI service usage and cost metrics by provider and operation
 *
 * Query Parameters:
 * - days: number of days to aggregate (default: 30)
 * - provider: filter by provider ('claude' | 'openai' | undefined for all)
 * - operation: filter by operation ('sentiment' | 'content' | 'recommendation' | undefined for all)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";
import { sql, gte, and, eq } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getUserId } from "@/lib/auth";

interface CostBreakdown {
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  usageCount: number;
}

interface CostSummary {
  totalCost: number;
  totalTokens: number;
  byProvider: Record<string, {
    cost: number;
    tokens: number;
    models: Record<string, { cost: number; tokens: number }>;
  }>;
  byOperation: Record<string, {
    cost: number;
    tokens: number;
    providers: Record<string, { cost: number; tokens: number }>;
  }>;
  breakdown: CostBreakdown[];
  timestamp: string;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

/**
 * Get AI usage and cost metrics
 */
async function getAICosts(
  organizationId?: string,
  days: number = 30,
  provider?: string,
  operation?: string
): Promise<CostSummary> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query conditions
    const conditions = [gte(aiUsage.createdAt, startDate)];

    if (organizationId) {
      conditions.push(eq(aiUsage.organizationId, organizationId));
    }

    if (provider) {
      conditions.push(eq(aiUsage.provider, provider));
    }

    if (operation) {
      conditions.push(eq(aiUsage.operation, operation));
    }

    // Fetch all AI usage records
    const records = await db
      .select()
      .from(aiUsage)
      .where(and(...conditions));

    // Calculate aggregates
    const summary: CostSummary = {
      totalCost: 0,
      totalTokens: 0,
      byProvider: {},
      byOperation: {},
      breakdown: [],
      timestamp: new Date().toISOString(),
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };

    // Group by provider, model, and operation
    const grouped = new Map<string, CostBreakdown>();

    for (const record of records) {
      const cost = parseFloat(record.cost || '0');
      const key = `${record.provider}|${record.model}|${record.operation}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.inputTokens += record.inputTokens || 0;
        existing.outputTokens += record.outputTokens || 0;
        existing.totalTokens += record.totalTokens || 0;
        existing.totalCost += cost;
        existing.usageCount += 1;
      } else {
        grouped.set(key, {
          provider: record.provider,
          model: record.model,
          operation: record.operation,
          inputTokens: record.inputTokens || 0,
          outputTokens: record.outputTokens || 0,
          totalTokens: record.totalTokens || 0,
          totalCost: cost,
          usageCount: 1,
        });
      }

      // Update totals
      summary.totalCost += cost;
      summary.totalTokens += record.totalTokens || 0;

      // Update by provider
      if (!summary.byProvider[record.provider]) {
        summary.byProvider[record.provider] = {
          cost: 0,
          tokens: 0,
          models: {},
        };
      }
      summary.byProvider[record.provider].cost += cost;
      summary.byProvider[record.provider].tokens += record.totalTokens || 0;

      // Update models within provider
      if (!summary.byProvider[record.provider].models[record.model]) {
        summary.byProvider[record.provider].models[record.model] = {
          cost: 0,
          tokens: 0,
        };
      }
      summary.byProvider[record.provider].models[record.model].cost += cost;
      summary.byProvider[record.provider].models[record.model].tokens += record.totalTokens || 0;

      // Update by operation
      if (!summary.byOperation[record.operation]) {
        summary.byOperation[record.operation] = {
          cost: 0,
          tokens: 0,
          providers: {},
        };
      }
      summary.byOperation[record.operation].cost += cost;
      summary.byOperation[record.operation].tokens += record.totalTokens || 0;

      // Update providers within operation
      if (!summary.byOperation[record.operation].providers[record.provider]) {
        summary.byOperation[record.operation].providers[record.provider] = {
          cost: 0,
          tokens: 0,
        };
      }
      summary.byOperation[record.operation].providers[record.provider].cost += cost;
      summary.byOperation[record.operation].providers[record.provider].tokens += record.totalTokens || 0;
    }

    // Convert grouped map to breakdown array
    summary.breakdown = Array.from(grouped.values()).sort(
      (a, b) => b.totalCost - a.totalCost
    );

    return summary;
  } catch (error) {
    console.error("Error fetching AI costs:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check super-admin status
    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    const provider = searchParams.get("provider") || undefined;
    const operation = searchParams.get("operation") || undefined;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Invalid days parameter. Must be between 1 and 365." },
        { status: 400 }
      );
    }

    // Fetch AI usage metrics (all organizations for super admin)
    const costSummary = await getAICosts(undefined, days, provider, operation);

    return NextResponse.json({
      success: true,
      data: costSummary,
    });
  } catch (error) {
    console.error("AI costs API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch AI usage and costs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
