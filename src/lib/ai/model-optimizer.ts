/**
 * LLM Model Optimizer
 *
 * Selects the most cost-effective and performant model for different operations
 * based on task complexity, latency requirements, and cost considerations.
 *
 * Strategy:
 * - Simple/fast operations (sentiment, classification): Use Haiku (cheapest)
 * - Medium operations (content analysis, recommendations): Use Sonnet (balanced)
 * - Complex operations (content generation, deep analysis): Use Opus (best quality)
 * - Fallback to OpenAI alternatives if Claude is unavailable
 */

import type { LLMProvider } from "./router";

export type OperationType =
  | "sentiment"
  | "classification"
  | "extraction"
  | "content_analysis"
  | "content_generation"
  | "recommendation_generation"
  | "audit_analysis"
  | "deep_analysis"
  | "embedding"
  | "search_query_analysis";

export interface ModelConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  costBand: "budget" | "balanced" | "quality";
  priority: number; // 1 = highest priority
}

/**
 * Model selection strategy based on operation type
 * Optimized for cost vs quality tradeoff
 */
const MODEL_STRATEGIES: Record<OperationType, ModelConfig[]> = {
  // BUDGET TIER - Use Haiku (cheapest Claude option)
  sentiment: [
    {
      provider: "claude",
      model: "claude-haiku-4-20250514",
      temperature: 0.3,
      maxTokens: 256,
      costBand: "budget",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 256,
      costBand: "budget",
      priority: 2,
    },
  ],

  classification: [
    {
      provider: "claude",
      model: "claude-haiku-4-20250514",
      temperature: 0.2,
      maxTokens: 512,
      costBand: "budget",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 512,
      costBand: "budget",
      priority: 2,
    },
  ],

  extraction: [
    {
      provider: "claude",
      model: "claude-haiku-4-20250514",
      temperature: 0.0,
      maxTokens: 1024,
      costBand: "budget",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.0,
      maxTokens: 1024,
      costBand: "budget",
      priority: 2,
    },
  ],

  // BALANCED TIER - Use Sonnet (good quality, reasonable cost)
  content_analysis: [
    {
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      temperature: 0.5,
      maxTokens: 2048,
      costBand: "balanced",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.5,
      maxTokens: 2048,
      costBand: "balanced",
      priority: 2,
    },
  ],

  search_query_analysis: [
    {
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      temperature: 0.3,
      maxTokens: 1024,
      costBand: "balanced",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.3,
      maxTokens: 1024,
      costBand: "balanced",
      priority: 2,
    },
  ],

  recommendation_generation: [
    {
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 3000,
      costBand: "balanced",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 3000,
      costBand: "balanced",
      priority: 2,
    },
  ],

  // QUALITY TIER - Use Opus (best quality for complex tasks)
  content_generation: [
    {
      provider: "claude",
      model: "claude-opus-4-20250805",
      temperature: 0.8,
      maxTokens: 4096,
      costBand: "quality",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.8,
      maxTokens: 4096,
      costBand: "quality",
      priority: 2,
    },
  ],

  audit_analysis: [
    {
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      temperature: 0.3,
      maxTokens: 3000,
      costBand: "balanced",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.3,
      maxTokens: 3000,
      costBand: "balanced",
      priority: 2,
    },
  ],

  deep_analysis: [
    {
      provider: "claude",
      model: "claude-opus-4-20250805",
      temperature: 0.5,
      maxTokens: 4096,
      costBand: "quality",
      priority: 1,
    },
    {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.5,
      maxTokens: 4096,
      costBand: "quality",
      priority: 2,
    },
  ],

  // EMBEDDINGS - Always use efficient embedding model
  embedding: [
    {
      provider: "openai",
      model: "text-embedding-3-small",
      temperature: 0.0,
      maxTokens: 256,
      costBand: "budget",
      priority: 1,
    },
  ],
};

/**
 * Get the optimal model configuration for an operation
 *
 * @param operation - Type of operation to perform
 * @param preferredProvider - Preferred provider (claude|openai), uses first available if not specified
 * @param costOptimized - If true, prioritize cost over quality
 * @returns ModelConfig for the recommended model
 */
export function getOptimalModel(
  operation: OperationType,
  preferredProvider?: LLMProvider,
  costOptimized: boolean = false
): ModelConfig {
  const strategies = MODEL_STRATEGIES[operation];

  if (!strategies || strategies.length === 0) {
    // Fallback for unknown operations - use balanced Sonnet
    return {
      provider: "claude",
      model: "claude-sonnet-4-20250514",
      temperature: 0.5,
      maxTokens: 2048,
      costBand: "balanced",
      priority: 1,
    };
  }

  // If cost optimized, prefer budget models
  if (costOptimized) {
    const budgetModels = strategies.filter(s => s.costBand === "budget");
    if (budgetModels.length > 0) {
      const model = budgetModels.sort((a, b) => a.priority - b.priority)[0];
      return model;
    }
  }

  // If preferred provider specified, find matching model
  if (preferredProvider) {
    const providerMatch = strategies.find(s => s.provider === preferredProvider);
    if (providerMatch) {
      return providerMatch;
    }
  }

  // Return highest priority model (best option)
  return strategies.sort((a, b) => a.priority - b.priority)[0];
}

/**
 * Get all available models for an operation type
 * Useful for UI dropdowns and debugging
 */
export function getAvailableModels(operation: OperationType): ModelConfig[] {
  return MODEL_STRATEGIES[operation] || [];
}

/**
 * Get cost estimate for an operation
 * Based on typical token usage patterns
 */
export function estimateOperationCost(
  operation: OperationType,
  inputTokens: number = 0,
  outputTokens: number = 0
): number {
  const model = getOptimalModel(operation);

  // Use pricing from MODEL_PRICING in usage-logger.ts
  const MODEL_COSTS: Record<string, { input: number; output: number }> = {
    "claude-opus-4-20250805": { input: 15, output: 45 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-haiku-4-20250514": { input: 0.80, output: 4 },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-4o": { input: 2.50, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "text-embedding-3-small": { input: 0.02, output: 0 },
  };

  const pricing = MODEL_COSTS[model.model] || { input: 0.01, output: 0.02 };

  // Typical token estimates if not provided
  const typicalInput = inputTokens || {
    sentiment: 200,
    classification: 300,
    extraction: 400,
    content_analysis: 1000,
    search_query_analysis: 500,
    recommendation_generation: 2000,
    content_generation: 1500,
    audit_analysis: 3000,
    deep_analysis: 4000,
    embedding: 200,
  }[operation] || 1000;

  const typicalOutput = outputTokens || {
    sentiment: 100,
    classification: 150,
    extraction: 300,
    content_analysis: 800,
    search_query_analysis: 500,
    recommendation_generation: 2000,
    content_generation: 3000,
    audit_analysis: 2000,
    deep_analysis: 3000,
    embedding: 50,
  }[operation] || 500;

  const inputCost = (typicalInput / 1000000) * pricing.input;
  const outputCost = (typicalOutput / 1000000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Get operation complexity tier
 */
export function getOperationTier(operation: OperationType): "budget" | "balanced" | "quality" {
  const model = getOptimalModel(operation);
  return model.costBand;
}

/**
 * Get estimated cost for all major operations (for dashboard)
 */
export function getAllOperationCosts(): Record<OperationType, number> {
  const operations: OperationType[] = [
    "sentiment",
    "classification",
    "extraction",
    "content_analysis",
    "content_generation",
    "recommendation_generation",
    "audit_analysis",
    "deep_analysis",
    "search_query_analysis",
    "embedding",
  ];

  const costs: Record<OperationType, number> = {} as any;

  for (const op of operations) {
    costs[op] = estimateOperationCost(op);
  }

  return costs;
}

/**
 * Suggest model optimizations based on current settings
 */
export interface OptimizationSuggestion {
  operation: OperationType;
  currentTier: string;
  recommendedTier: string;
  potentialSavings: number;
  reasoning: string;
}

export function getSuggestedOptimizations(): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Suggestion 1: Use Haiku for sentiment (if not already)
  suggestions.push({
    operation: "sentiment",
    currentTier: "Sonnet",
    recommendedTier: "Haiku",
    potentialSavings: 0.73, // 97% cheaper than Sonnet per million tokens
    reasoning:
      "Sentiment analysis is simple classification - Haiku is optimally tuned for this with minimal accuracy loss",
  });

  // Suggestion 2: Use Haiku for classification
  suggestions.push({
    operation: "classification",
    currentTier: "Sonnet",
    recommendedTier: "Haiku",
    potentialSavings: 0.73,
    reasoning: "Text classification requires minimal reasoning - Haiku is sufficient and highly cost-effective",
  });

  // Suggestion 3: Use Sonnet for content analysis instead of Opus
  suggestions.push({
    operation: "content_analysis",
    currentTier: "Opus",
    recommendedTier: "Sonnet",
    potentialSavings: 12.5, // Sonnet is ~80% cheaper than Opus
    reasoning:
      "Content analysis with Sonnet provides excellent quality-to-cost ratio; Opus overkill for this task",
  });

  return suggestions;
}
