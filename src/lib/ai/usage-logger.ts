/**
 * AI Usage Logger
 *
 * Tracks and logs all AI service usage (tokens, costs, operations) to the database
 * for billing, monitoring, and analytics purposes
 */

import { db } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";
import { Decimal } from "decimal.js";
import { gte, eq, and } from "drizzle-orm";

/**
 * Configuration for different AI models and their pricing
 * Updated based on official pricing as of January 2026
 */
const MODEL_PRICING: Record<string, {
  inputCostPer1M: number;   // Cost per million input tokens in USD
  outputCostPer1M: number;  // Cost per million output tokens in USD
}> = {
  // Claude models
  "claude-opus-4-20250805": {
    inputCostPer1M: 15,      // $15 per 1M input tokens
    outputCostPer1M: 45,     // $45 per 1M output tokens
  },
  "claude-sonnet-4-20250514": {
    inputCostPer1M: 3,       // $3 per 1M input tokens
    outputCostPer1M: 15,     // $15 per 1M output tokens
  },
  "claude-sonnet-4-20240229": {
    inputCostPer1M: 3,
    outputCostPer1M: 15,
  },
  "claude-haiku-4-20250514": {
    inputCostPer1M: 0.80,    // $0.80 per 1M input tokens
    outputCostPer1M: 4,      // $4 per 1M output tokens
  },
  "claude-haiku-3.5-20241226": {
    inputCostPer1M: 0.80,
    outputCostPer1M: 4,
  },

  // OpenAI models
  "gpt-4": {
    inputCostPer1M: 30,
    outputCostPer1M: 60,
  },
  "gpt-4-turbo": {
    inputCostPer1M: 10,
    outputCostPer1M: 30,
  },
  "gpt-4o": {
    inputCostPer1M: 2.50,
    outputCostPer1M: 10,
  },
  "gpt-4o-mini": {
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  "gpt-3.5-turbo": {
    inputCostPer1M: 0.50,
    outputCostPer1M: 1.50,
  },
};

/**
 * Calculate the cost of tokens for a given model
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    // Default pricing if model not found (approximation)
    const avgInputCost = 0.001; // $0.001 per 1K input tokens
    const avgOutputCost = 0.002; // $0.002 per 1K output tokens
    return (inputTokens * avgInputCost + outputTokens * avgOutputCost) / 1000;
  }

  const inputCost = (inputTokens / 1000000) * pricing.inputCostPer1M;
  const outputCost = (outputTokens / 1000000) * pricing.outputCostPer1M;

  return inputCost + outputCost;
}

/**
 * Log AI usage to the database
 *
 * @param organizationId - Organization ID (required)
 * @param userId - User ID (optional)
 * @param provider - AI provider ('claude' or 'openai')
 * @param model - Model name (e.g., 'claude-sonnet-4-20250514')
 * @param operation - Operation type ('sentiment', 'content', 'recommendation', 'audit', etc.)
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens used
 * @param metadata - Additional metadata to store (optional)
 */
export async function logAIUsage(
  organizationId: string,
  provider: string,
  model: string,
  operation: string,
  inputTokens: number,
  outputTokens: number,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const totalTokens = inputTokens + outputTokens;
    const cost = calculateCost(model, inputTokens, outputTokens);

    // Store cost as string to preserve decimal precision
    const costString = new Decimal(cost).toFixed(6);

    await db.insert(aiUsage).values({
      organizationId,
      userId: userId || null,
      provider,
      model,
      operation,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: costString,
      metadata: metadata || {},
      createdAt: new Date(),
    });
  } catch (error) {
    // Log error but don't throw - we don't want usage logging failures to break features
    console.error("Failed to log AI usage:", error);
  }
}

/**
 * Log multiple AI usages at once (batch operation)
 *
 * Useful for batch processing where multiple operations occur together
 */
export async function logAIUsageBatch(
  organizationId: string,
  usages: Array<{
    provider: string;
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    userId?: string;
    metadata?: Record<string, unknown>;
  }>
): Promise<void> {
  try {
    const records = usages.map(usage => {
      const totalTokens = usage.inputTokens + usage.outputTokens;
      const cost = calculateCost(usage.model, usage.inputTokens, usage.outputTokens);
      const costString = new Decimal(cost).toFixed(6);

      return {
        organizationId,
        userId: usage.userId || null,
        provider: usage.provider,
        model: usage.model,
        operation: usage.operation,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens,
        cost: costString,
        metadata: usage.metadata || {},
        createdAt: new Date(),
      };
    });

    await db.insert(aiUsage).values(records);
  } catch (error) {
    console.error("Failed to log batch AI usage:", error);
  }
}

/**
 * Get monthly cost projection
 *
 * Based on current usage rate, estimate the monthly cost
 */
export async function getMonthlyProjection(organizationId: string): Promise<number> {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysIntoMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Get current month usage
    const currentMonthUsage = await db
      .select()
      .from(aiUsage)
      .where(
        gte(aiUsage.createdAt, startOfMonth)
      );

    const currentCost = currentMonthUsage.reduce((sum, record) => {
      return sum + parseFloat(record.cost || "0");
    }, 0);

    // Project to full month
    const projectedCost = (currentCost / daysIntoMonth) * daysInMonth;

    return projectedCost;
  } catch (error) {
    console.error("Failed to calculate monthly projection:", error);
    return 0;
  }
}

/**
 * Get cost breakdown by provider
 */
export async function getCostByProvider(
  organizationId: string,
  days: number = 30
): Promise<Record<string, number>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await db
      .select()
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.organizationId, organizationId),
          gte(aiUsage.createdAt, startDate)
        )
      );

    const breakdown: Record<string, number> = {};

    for (const record of records) {
      if (!breakdown[record.provider]) {
        breakdown[record.provider] = 0;
      }
      breakdown[record.provider] += parseFloat(record.cost || "0");
    }

    return breakdown;
  } catch (error) {
    console.error("Failed to get cost breakdown:", error);
    return {};
  }
}

/**
 * Get cost breakdown by operation
 */
export async function getCostByOperation(
  organizationId: string,
  days: number = 30
): Promise<Record<string, number>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await db
      .select()
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.organizationId, organizationId),
          gte(aiUsage.createdAt, startDate)
        )
      );

    const breakdown: Record<string, number> = {};

    for (const record of records) {
      if (!breakdown[record.operation]) {
        breakdown[record.operation] = 0;
      }
      breakdown[record.operation] += parseFloat(record.cost || "0");
    }

    return breakdown;
  } catch (error) {
    console.error("Failed to get operation breakdown:", error);
    return {};
  }
}
