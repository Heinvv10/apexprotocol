/**
 * LLM Router - Abstraction layer to switch between Claude/OpenAI
 * F086: Provides unified interface with automatic fallback
 * Enhanced with intelligent model selection per feature type
 */

import { getClaudeClient, sendMessage as sendClaudeMessage, CLAUDE_MODELS } from "./claude";
import {
  getOpenAIClient,
  sendMessage as sendOpenAIMessage,
  GPT_MODELS,
} from "./openai";

// LLM Provider types
export type LLMProvider = "claude" | "openai";

// Operation types for intelligent model selection
export type OperationType =
  | "sentiment"           // Quick sentiment analysis
  | "content_generation"  // Long-form content creation
  | "recommendation"      // Recommendation generation
  | "audit_analysis"      // Site audit analysis
  | "brief_generation"    // Content brief creation
  | "competitive_analysis"// Competitor analysis
  | "insight_generation"  // AI insights generation
  | "embedding"           // Text embeddings
  | "classification"      // Quick classification tasks
  | "summarization"       // Text summarization
  | "chat"                // General chat/Q&A
  | "default";            // Default fallback

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackEnabled?: boolean;
  operation?: OperationType;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
}

// Model profiles for each operation type
// Optimized for cost/quality/speed balance
interface ModelProfile {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  costPerMToken: number; // Cost per 1M tokens (for tracking)
  description: string;
}

const MODEL_PROFILES: Record<OperationType, ModelProfile> = {
  // Quick tasks - Use Haiku (fast, cheap)
  sentiment: {
    provider: "claude",
    model: CLAUDE_MODELS.HAIKU_3_5,
    temperature: 0.3,
    maxTokens: 500,
    costPerMToken: 1.0,
    description: "Sentiment analysis - fast and accurate",
  },
  classification: {
    provider: "claude",
    model: CLAUDE_MODELS.HAIKU_3_5,
    temperature: 0.2,
    maxTokens: 500,
    costPerMToken: 1.0,
    description: "Classification - quick categorization",
  },
  summarization: {
    provider: "claude",
    model: CLAUDE_MODELS.HAIKU_3_5,
    temperature: 0.5,
    maxTokens: 1024,
    costPerMToken: 1.0,
    description: "Summarization - concise summaries",
  },

  // Medium complexity - Use Sonnet (balanced)
  recommendation: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.7,
    maxTokens: 2048,
    costPerMToken: 3.0,
    description: "Recommendations - balanced quality and cost",
  },
  audit_analysis: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.5,
    maxTokens: 4096,
    costPerMToken: 3.0,
    description: "Audit analysis - detailed technical review",
  },
  competitive_analysis: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.6,
    maxTokens: 3000,
    costPerMToken: 3.0,
    description: "Competitive analysis - thorough comparison",
  },
  insight_generation: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.7,
    maxTokens: 2500,
    costPerMToken: 3.0,
    description: "AI insights - actionable intelligence",
  },

  // Complex/creative tasks - Use Sonnet (high quality)
  content_generation: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.8,
    maxTokens: 4096,
    costPerMToken: 3.0,
    description: "Content generation - creative, high quality",
  },
  brief_generation: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.7,
    maxTokens: 4096,
    costPerMToken: 3.0,
    description: "Brief generation - structured content briefs",
  },

  // General chat - Use GPT-4o-mini for cost efficiency
  chat: {
    provider: "openai",
    model: GPT_MODELS.GPT4O_MINI,
    temperature: 0.7,
    maxTokens: 2048,
    costPerMToken: 0.15,
    description: "Chat/Q&A - fast and cost-effective",
  },

  // Embeddings - always use OpenAI's embedding model (handled separately)
  embedding: {
    provider: "openai",
    model: "text-embedding-3-small",
    temperature: 0,
    maxTokens: 0,
    costPerMToken: 0.02,
    description: "Text embeddings - vector representations",
  },

  // Default fallback - Use Sonnet
  default: {
    provider: "claude",
    model: CLAUDE_MODELS.SONNET_3_5,
    temperature: 0.7,
    maxTokens: 4096,
    costPerMToken: 3.0,
    description: "Default - balanced quality",
  },
};

/**
 * Get optimal model profile for an operation type
 */
export function getModelProfile(operation: OperationType = "default"): ModelProfile {
  return MODEL_PROFILES[operation] || MODEL_PROFILES.default;
}

/**
 * Get all available model profiles
 */
export function getAllModelProfiles(): Record<OperationType, ModelProfile> {
  return { ...MODEL_PROFILES };
}

// Default configuration
const DEFAULT_CONFIG: LLMConfig = {
  provider: "claude",
  temperature: 0.7,
  maxTokens: 4096,
  fallbackEnabled: true,
};

// Get provider from environment or use default
export function getDefaultProvider(): LLMProvider {
  const envProvider = process.env.DEFAULT_LLM_PROVIDER;
  if (envProvider === "openai") return "openai";
  return "claude"; // Default to Claude
}

/**
 * Send a message through the LLM router
 * Automatically handles provider selection and fallback
 * Uses intelligent model selection when operation is specified
 */
export async function routeMessage(
  systemPrompt: string,
  userMessage: string,
  config: Partial<LLMConfig> = {}
): Promise<LLMResponse> {
  // If operation is specified, get optimal model profile
  let mergedConfig: LLMConfig;

  if (config.operation && !config.model) {
    const profile = getModelProfile(config.operation);
    mergedConfig = {
      ...DEFAULT_CONFIG,
      provider: profile.provider,
      model: profile.model,
      temperature: profile.temperature,
      maxTokens: profile.maxTokens,
      ...config,
    };
  } else {
    mergedConfig = {
      ...DEFAULT_CONFIG,
      provider: getDefaultProvider(),
      ...config,
    };
  }

  const startTime = Date.now();

  try {
    // Try primary provider
    const response = await sendToProvider(
      mergedConfig.provider,
      systemPrompt,
      userMessage,
      mergedConfig
    );
    return response;
  } catch (primaryError) {
    // If fallback is enabled and primary fails, try secondary
    if (mergedConfig.fallbackEnabled) {
      const fallbackProvider: LLMProvider =
        mergedConfig.provider === "claude" ? "openai" : "claude";

      console.warn(
        `Primary provider ${mergedConfig.provider} failed, falling back to ${fallbackProvider}:`,
        primaryError instanceof Error ? primaryError.message : primaryError
      );

      try {
        const response = await sendToProvider(
          fallbackProvider,
          systemPrompt,
          userMessage,
          { ...mergedConfig, provider: fallbackProvider }
        );
        return response;
      } catch (fallbackError) {
        // Both providers failed
        throw new Error(
          `All LLM providers failed. Primary (${mergedConfig.provider}): ${
            primaryError instanceof Error ? primaryError.message : primaryError
          }. Fallback (${fallbackProvider}): ${
            fallbackError instanceof Error
              ? fallbackError.message
              : fallbackError
          }`
        );
      }
    }

    throw primaryError;
  }
}

/**
 * Send message to specific provider
 */
async function sendToProvider(
  provider: LLMProvider,
  systemPrompt: string,
  userMessage: string,
  config: LLMConfig
): Promise<LLMResponse> {
  const startTime = Date.now();

  if (provider === "claude") {
    const client = getClaudeClient();
    const model = config.model || CLAUDE_MODELS.SONNET_3_5;

    const response = await client.messages.create({
      model,
      max_tokens: config.maxTokens || 4096,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return {
      content,
      provider: "claude",
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      latencyMs: Date.now() - startTime,
    };
  } else {
    // OpenAI
    const model = config.model || GPT_MODELS.GPT4_TURBO;

    const response = await sendOpenAIMessage(
      systemPrompt,
      userMessage,
      model,
      config.maxTokens
    );

    return {
      content: response.content,
      provider: "openai",
      model,
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Batch route multiple messages (for parallel processing)
 */
export async function routeBatch(
  requests: Array<{
    systemPrompt: string;
    userMessage: string;
    config?: Partial<LLMConfig>;
  }>
): Promise<LLMResponse[]> {
  return Promise.all(
    requests.map((req) =>
      routeMessage(req.systemPrompt, req.userMessage, req.config)
    )
  );
}

/**
 * Check if a specific provider is available
 */
export function isProviderAvailable(provider: LLMProvider): boolean {
  if (provider === "claude") {
    return !!process.env.ANTHROPIC_API_KEY;
  } else {
    return !!process.env.OPENAI_API_KEY;
  }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];
  if (isProviderAvailable("claude")) providers.push("claude");
  if (isProviderAvailable("openai")) providers.push("openai");
  return providers;
}

// ============================================================================
// Convenience functions for operation-specific routing
// ============================================================================

/**
 * Route a sentiment analysis request (uses Haiku for speed)
 */
export async function routeSentiment(
  text: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const defaultPrompt = `Analyze the sentiment of the following text. Respond with JSON containing:
- sentiment: "positive", "negative", "neutral", or "mixed"
- confidence: number from 0 to 1
- reasoning: brief explanation`;

  return routeMessage(
    systemPrompt || defaultPrompt,
    text,
    { operation: "sentiment" }
  );
}

/**
 * Route a content generation request (uses Sonnet for quality)
 */
export async function routeContentGeneration(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<LLMResponse> {
  return routeMessage(systemPrompt, userMessage, {
    operation: "content_generation",
    ...options,
  });
}

/**
 * Route a recommendation request (uses Sonnet)
 */
export async function routeRecommendation(
  systemPrompt: string,
  context: string
): Promise<LLMResponse> {
  return routeMessage(systemPrompt, context, {
    operation: "recommendation",
  });
}

/**
 * Route an audit analysis request (uses Sonnet for technical depth)
 */
export async function routeAuditAnalysis(
  systemPrompt: string,
  auditData: string
): Promise<LLMResponse> {
  return routeMessage(systemPrompt, auditData, {
    operation: "audit_analysis",
  });
}

/**
 * Route an insight generation request (uses Sonnet)
 */
export async function routeInsightGeneration(
  systemPrompt: string,
  data: string
): Promise<LLMResponse> {
  return routeMessage(systemPrompt, data, {
    operation: "insight_generation",
  });
}

/**
 * Route a classification request (uses Haiku for speed)
 */
export async function routeClassification(
  systemPrompt: string,
  text: string
): Promise<LLMResponse> {
  return routeMessage(systemPrompt, text, {
    operation: "classification",
  });
}

/**
 * Route a summarization request (uses Haiku)
 */
export async function routeSummarization(
  text: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const defaultPrompt = `Summarize the following text concisely while preserving key information.`;

  return routeMessage(
    systemPrompt || defaultPrompt,
    text,
    { operation: "summarization" }
  );
}

/**
 * Route a chat request (uses GPT-4o-mini for cost efficiency)
 */
export async function routeChat(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  return routeMessage(systemPrompt, userMessage, {
    operation: "chat",
  });
}

/**
 * Estimate cost for a given operation and token count
 */
export function estimateCost(
  operation: OperationType,
  inputTokens: number,
  outputTokens: number
): number {
  const profile = getModelProfile(operation);
  const totalTokens = inputTokens + outputTokens;
  return (totalTokens / 1_000_000) * profile.costPerMToken;
}
