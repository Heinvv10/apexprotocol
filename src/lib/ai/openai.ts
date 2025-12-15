/**
 * OpenAI Client Setup
 * Creates OpenAI SDK client for GPT-4 and embeddings
 */

import OpenAI from "openai";

// Singleton instance
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
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

    openaiClient = new OpenAI({
      apiKey,
    });
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
 * Send a message to OpenAI
 */
export async function sendMessage(
  systemPrompt: string,
  userMessage: string,
  model?: string,
  maxTokens?: number
): Promise<OpenAIResponse> {
  const client = getOpenAIClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await client.chat.completions.create({
    model: model || DEFAULT_MODELS.chat,
    max_tokens: maxTokens || DEFAULT_CONFIG.maxTokens,
    temperature: DEFAULT_CONFIG.temperature,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return {
    content,
    usage: {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0,
    },
  };
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
