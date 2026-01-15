/**
 * Token Usage Tracker - Track AI token usage per organization
 * F088: For billing, quotas, and usage analytics
 */

import { getDb } from "../db";
import { aiUsage } from "../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { LLMProvider } from "./router";
import { formatTokenCount, formatCost } from "@/lib/utils";

export interface TokenUsageRecord {
  orgId: string;
  userId?: string;
  provider: LLMProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  operation: string;
  metadata?: Record<string, unknown>;
}

// Token pricing (per 1M tokens) - Updated Dec 2024
export const TOKEN_PRICING: Record<
  string,
  { input: number; output: number }
> = {
  // Claude models
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  // OpenAI models
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo-preview": { input: 10.0, output: 30.0 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  // Embedding models
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "text-embedding-3-large": { input: 0.13, output: 0 },
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = TOKEN_PRICING[model];
  if (!pricing) {
    // Default pricing for unknown models
    return (inputTokens * 0.01 + outputTokens * 0.03) / 1000;
  }

  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Record token usage in the database
 */
export async function recordTokenUsage(
  record: TokenUsageRecord
): Promise<string> {
  const db = getDb();
  const cost = calculateCost(
    record.model,
    record.inputTokens,
    record.outputTokens
  );

  const [inserted] = await db
    .insert(aiUsage)
    .values({
      organizationId: record.orgId,
      userId: record.userId,
      provider: record.provider,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      totalTokens: record.totalTokens,
      cost: cost.toString(),
      operation: record.operation,
      metadata: record.metadata || {},
    })
    .returning({ id: aiUsage.id });

  return inserted.id;
}

/**
 * Get usage summary for an organization
 */
export async function getUsageSummary(
  orgId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byOperation: Record<string, { requests: number; tokens: number; cost: number }>;
}> {
  const db = getDb();
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate || new Date();

  const records = await db
    .select()
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.organizationId, orgId),
        gte(aiUsage.createdAt, start),
        lte(aiUsage.createdAt, end)
      )
    );

  const summary = {
    totalRequests: records.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    byProvider: {} as Record<string, { requests: number; tokens: number; cost: number }>,
    byModel: {} as Record<string, { requests: number; tokens: number; cost: number }>,
    byOperation: {} as Record<string, { requests: number; tokens: number; cost: number }>,
  };

  for (const record of records) {
    const cost = parseFloat(record.cost || "0");

    summary.totalInputTokens += record.inputTokens || 0;
    summary.totalOutputTokens += record.outputTokens || 0;
    summary.totalTokens += record.totalTokens || 0;
    summary.totalCost += cost;

    // By provider
    const provider = record.provider || "unknown";
    if (!summary.byProvider[provider]) {
      summary.byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    summary.byProvider[provider].requests++;
    summary.byProvider[provider].tokens += record.totalTokens || 0;
    summary.byProvider[provider].cost += cost;

    // By model
    const model = record.model || "unknown";
    if (!summary.byModel[model]) {
      summary.byModel[model] = { requests: 0, tokens: 0, cost: 0 };
    }
    summary.byModel[model].requests++;
    summary.byModel[model].tokens += record.totalTokens || 0;
    summary.byModel[model].cost += cost;

    // By operation
    const operation = record.operation || "unknown";
    if (!summary.byOperation[operation]) {
      summary.byOperation[operation] = { requests: 0, tokens: 0, cost: 0 };
    }
    summary.byOperation[operation].requests++;
    summary.byOperation[operation].tokens += record.totalTokens || 0;
    summary.byOperation[operation].cost += cost;
  }

  summary.totalCost = Number(summary.totalCost.toFixed(6));

  return summary;
}

/**
 * Get daily usage for charts
 */
export async function getDailyUsage(
  orgId: string,
  days: number = 30
): Promise<
  Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>
> {
  const db = getDb();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const records = await db
    .select()
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.organizationId, orgId),
        gte(aiUsage.createdAt, startDate)
      )
    );

  // Group by date
  const dailyMap = new Map<
    string,
    { requests: number; tokens: number; cost: number }
  >();

  for (const record of records) {
    const date = record.createdAt?.toISOString().split("T")[0] || "unknown";
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { requests: 0, tokens: 0, cost: 0 });
    }
    const day = dailyMap.get(date)!;
    day.requests++;
    day.tokens += record.totalTokens || 0;
    day.cost += parseFloat(record.cost || "0");
  }

  // Convert to array and sort by date
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      requests: data.requests,
      tokens: data.tokens,
      cost: Number(data.cost.toFixed(6)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get remaining quota for an organization
 */
export async function getRemainingQuota(
  orgId: string,
  tier: string = "free"
): Promise<{
  dailyTokensRemaining: number;
  monthlyTokensRemaining: number;
  dailyRequestsRemaining: number;
  monthlyRequestsRemaining: number;
}> {
  // Quota limits by tier
  const quotas: Record<
    string,
    {
      dailyTokens: number;
      monthlyTokens: number;
      dailyRequests: number;
      monthlyRequests: number;
    }
  > = {
    free: {
      dailyTokens: 50000,
      monthlyTokens: 500000,
      dailyRequests: 200,
      monthlyRequests: 2000,
    },
    starter: {
      dailyTokens: 500000,
      monthlyTokens: 5000000,
      dailyRequests: 1000,
      monthlyRequests: 10000,
    },
    professional: {
      dailyTokens: 2000000,
      monthlyTokens: 20000000,
      dailyRequests: 5000,
      monthlyRequests: 50000,
    },
    enterprise: {
      dailyTokens: 10000000,
      monthlyTokens: 100000000,
      dailyRequests: 20000,
      monthlyRequests: 200000,
    },
  };

  const quota = quotas[tier] || quotas.free;

  // Get today's usage
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get this month's usage
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [dailyUsage, monthlyUsage] = await Promise.all([
    getUsageSummary(orgId, todayStart, new Date()),
    getUsageSummary(orgId, monthStart, new Date()),
  ]);

  return {
    dailyTokensRemaining: Math.max(0, quota.dailyTokens - dailyUsage.totalTokens),
    monthlyTokensRemaining: Math.max(
      0,
      quota.monthlyTokens - monthlyUsage.totalTokens
    ),
    dailyRequestsRemaining: Math.max(
      0,
      quota.dailyRequests - dailyUsage.totalRequests
    ),
    monthlyRequestsRemaining: Math.max(
      0,
      quota.monthlyRequests - monthlyUsage.totalRequests
    ),
  };
}

/**
 * Estimate tokens from text (rough approximation)
 * Uses ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ðŸŸ¢ WORKING: Migrated to centralized formatters in @/lib/utils
// formatTokenCount and formatCost are now imported from centralized library
// These functions were removed from this file and are available via import above

/**
 * Simplified usage tracking interface
 * Used by API routes for quick tracking
 */
export interface TrackUsageParams {
  organizationId: string;
  userId?: string;
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track AI usage - simplified wrapper for recordTokenUsage
 */
export async function trackUsage(params: TrackUsageParams): Promise<void> {
  const totalTokens = params.inputTokens + params.outputTokens;

  await recordTokenUsage({
    orgId: params.organizationId,
    userId: params.userId,
    provider: params.provider as LLMProvider,
    model: params.model,
    operation: params.operation,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens,
    cost: calculateCost(params.model, params.inputTokens, params.outputTokens),
    metadata: params.metadata,
  });
}
