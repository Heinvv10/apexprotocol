/**
 * OpenAI Client Setup
 * Creates OpenAI SDK client for GPT-4 and embeddings
 */

import OpenAI from "openai";
import { logAIUsageAuto } from "./auto-log-usage";

// Singleton instance
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance.
 *
 * The returned client has `chat.completions.create` wrapped to auto-log
 * every call into the `ai_usage` table. This catches all direct SDK users
 * (not just the sendMessage/sendMessageWithConfig helpers in this file),
 * so any module that does `getOpenAIClient().chat.completions.create(...)`
 * gets usage attribution for free.
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    const raw = new OpenAI({ apiKey });

    // Wrap chat.completions.create to log usage after each call. The SDK's
    // create signature is heavily overloaded; we cast to unknown rather than
    // try to reproduce every overload just to instrument a side effect.
    const originalCreate = raw.chat.completions.create.bind(raw.chat.completions) as unknown as (
      body: unknown,
      options?: unknown,
    ) => Promise<unknown>;
    (raw.chat.completions as unknown as { create: (b: unknown, o?: unknown) => Promise<unknown> }).create = async function (body: unknown, options?: unknown) {
      const res = await originalCreate(body, options);
      try {
        if (res && typeof res === "object" && "usage" in res) {
          const usage = (res as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
          const model = String(((body as { model?: unknown })?.model) ?? "unknown");
          logAIUsageAuto({
            provider: "openai",
            model,
            operation: "chat",
            inputTokens: usage?.prompt_tokens || 0,
            outputTokens: usage?.completion_tokens || 0,
          });
        }
      } catch { /* never let logging break the call */ }
      return res;
    };

    openaiClient = raw;
  }

  return openaiClient;
}

/**
 * Available GPT models
 */
export const GPT_MODELS = {
  // Latest GPT-4 Turbo
  GPT4_TURBO: "gpt-4-turbo-preview",
  GPT4_TURBO_0125: "gpt-4-0125-preview",
  // GPT-4
  GPT4: "gpt-4",
  GPT4_32K: "gpt-4-32k",
  // GPT-3.5
  GPT35_TURBO: "gpt-3.5-turbo",
  GPT35_TURBO_16K: "gpt-3.5-turbo-16k",
  // Latest models
  GPT4O: "gpt-4o",
  GPT4O_MINI: "gpt-4o-mini",
} as const;

export type GPTModel = (typeof GPT_MODELS)[keyof typeof GPT_MODELS];

/**
 * Available embedding models
 */
export const EMBEDDING_MODELS = {
  TEXT_3_SMALL: "text-embedding-3-small",
  TEXT_3_LARGE: "text-embedding-3-large",
  ADA_002: "text-embedding-ada-002",
} as const;

export type EmbeddingModel =
  (typeof EMBEDDING_MODELS)[keyof typeof EMBEDDING_MODELS];

/**
 * Default models for different use cases
 */
export const DEFAULT_MODELS = {
  // General purpose chat
  chat: GPT_MODELS.GPT4O,
  // Fast responses
  fast: GPT_MODELS.GPT4O_MINI,
  // Embeddings - best quality/cost balance
  embedding: EMBEDDING_MODELS.TEXT_3_SMALL,
} as const;

/**
 * OpenAI configuration for chat completions
 */
export interface OpenAIConfig {
  model?: GPTModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<Omit<OpenAIConfig, "systemPrompt">> = {
  model: DEFAULT_MODELS.chat,
  maxTokens: 4096,
  temperature: 0.7,
};

export interface OpenAIResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Should we fall back to Anthropic on this OpenAI error? True for quota /
 * rate / auth failures, NOT for user-caused 4xx like bad model name — those
 * would fail the same way on the fallback and mask the real bug.
 */
function shouldFallbackToAnthropic(err: unknown): boolean {
  if (!err) return false;
  const e = err as { status?: number; code?: string; message?: string };
  if (e.status === 429 || e.status === 401 || e.status === 403) return true;
  const msg = (e.message || "").toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("insufficient_quota") ||
    msg.includes("rate limit") ||
    msg.includes("openai_api_key") ||
    msg.includes("api key") ||
    e.code === "insufficient_quota"
  );
}

async function sendMessageViaAnthropic(
  systemPrompt: string,
  userMessage: string,
  maxTokens?: number,
): Promise<OpenAIResponse> {
  // Lazy import so environments without the Anthropic SDK don't explode at
  // module init when they never hit the fallback path.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI call failed and ANTHROPIC_API_KEY is not set — cannot fall back."
    );
  }
  const client = new Anthropic({ apiKey });
  const modelUsed = "claude-sonnet-4-5-20250929";
  const response = await client.messages.create({
    model: modelUsed,
    max_tokens: maxTokens || DEFAULT_CONFIG.maxTokens,
    temperature: DEFAULT_CONFIG.temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Anthropic fallback response");
  }
  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  logAIUsageAuto({
    provider: "anthropic",
    model: modelUsed,
    operation: "chat",
    inputTokens,
    outputTokens,
    metadata: { fallback_from: "openai" },
  });
  return {
    content: textBlock.text,
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
  };
}

/**
 * Send a message to OpenAI, falling back to Anthropic (Claude) on
 * quota/auth/key errors. Silent on the success path; logs a single warn
 * line when the fallback fires so we can see OpenAI outages in production.
 */
export async function sendMessage(
  systemPrompt: string,
  userMessage: string,
  model?: string,
  maxTokens?: number
): Promise<OpenAIResponse> {
  try {
    const client = getOpenAIClient();
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    const modelUsed = model || DEFAULT_MODELS.chat;
    const response = await client.chat.completions.create({
      model: modelUsed,
      max_tokens: maxTokens || DEFAULT_CONFIG.maxTokens,
      temperature: DEFAULT_CONFIG.temperature,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const usage = {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0,
    };

    logAIUsageAuto({
      provider: "openai",
      model: modelUsed,
      operation: "chat",
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
    });

    return { content, usage };
  } catch (err) {
    if (shouldFallbackToAnthropic(err)) {
      console.warn(
        "[ai/openai] OpenAI failed (%s), falling back to Anthropic",
        (err as Error)?.message?.slice(0, 120) ?? err,
      );
      return sendMessageViaAnthropic(systemPrompt, userMessage, maxTokens);
    }
    throw err;
  }
}

/**
 * Send a message to OpenAI (config-based)
 */
export async function sendMessageWithConfig(
  message: string,
  config: OpenAIConfig = {}
): Promise<string> {
  const client = getOpenAIClient();
  const { model, maxTokens, temperature, systemPrompt } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: message });

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  logAIUsageAuto({
    provider: "openai",
    model,
    operation: "chat",
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
  });

  return content;
}

/**
 * Send a conversation to OpenAI
 */
export async function sendConversation(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  config: OpenAIConfig = {}
): Promise<string> {
  const client = getOpenAIClient();
  const { model, maxTokens, temperature } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  logAIUsageAuto({
    provider: "openai",
    model,
    operation: "conversation",
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
  });

  return content;
}

/**
 * Stream a message from OpenAI
 */
export async function* streamMessage(
  message: string,
  config: OpenAIConfig = {}
): AsyncGenerator<string, void, unknown> {
  const client = getOpenAIClient();
  const { model, maxTokens, temperature, systemPrompt } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: message });

  const stream = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Export client getter for advanced usage
export { openaiClient };
