/**
 * LLM Router - Abstraction layer to switch between Claude/OpenAI
 * F086: Provides unified interface with automatic fallback
 */

import { getClaudeClient, sendMessage as sendClaudeMessage } from "./claude";
import {
  getOpenAIClient,
  sendMessage as sendOpenAIMessage,
  GPT_MODELS,
} from "./openai";

// LLM Provider types
export type LLMProvider = "claude" | "openai";

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackEnabled?: boolean;
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
 */
export async function routeMessage(
  systemPrompt: string,
  userMessage: string,
  config: Partial<LLMConfig> = {}
): Promise<LLMResponse> {
  const mergedConfig: LLMConfig = {
    ...DEFAULT_CONFIG,
    provider: getDefaultProvider(),
    ...config,
  };

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
    const model = config.model || "claude-sonnet-4-20250514";

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
