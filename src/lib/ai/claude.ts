/**
 * Claude AI Client Setup
 * Creates Anthropic Claude SDK client with API key from environment
 */

import Anthropic from "@anthropic-ai/sdk";

// Singleton instance
let claudeClient: Anthropic | null = null;

/**
 * Get or create Claude client instance
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    claudeClient = new Anthropic({
      apiKey,
    });
  }

  return claudeClient;
}

/**
 * Available Claude models
 */
export const CLAUDE_MODELS = {
  // Latest and most capable
  SONNET_3_5: "claude-3-5-sonnet-20241022",
  // Fast and efficient
  HAIKU_3_5: "claude-3-5-haiku-20241022",
  // Previous generation
  OPUS_3: "claude-3-opus-20240229",
  SONNET_3: "claude-3-sonnet-20240229",
  HAIKU_3: "claude-3-haiku-20240307",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

/**
 * Default model for different use cases
 */
export const DEFAULT_MODELS = {
  // General purpose - balanced quality and speed
  default: CLAUDE_MODELS.SONNET_3_5,
  // Quick responses - fastest
  fast: CLAUDE_MODELS.HAIKU_3_5,
  // Highest quality - for complex tasks
  quality: CLAUDE_MODELS.SONNET_3_5,
  // Content generation
  content: CLAUDE_MODELS.SONNET_3_5,
  // Analysis and sentiment
  analysis: CLAUDE_MODELS.SONNET_3_5,
} as const;

/**
 * Claude API configuration
 */
export interface ClaudeConfig {
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<Omit<ClaudeConfig, "system">> = {
  model: DEFAULT_MODELS.default,
  maxTokens: 4096,
  temperature: 0.7,
};

/**
 * Send a message to Claude
 */
export async function sendMessage(
  message: string,
  config: ClaudeConfig = {}
): Promise<string> {
  const client = getClaudeClient();
  const { model, maxTokens, temperature, system } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: system || undefined,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return textContent.text;
}

/**
 * Send a conversation to Claude
 */
export async function sendConversation(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  config: ClaudeConfig = {}
): Promise<string> {
  const client = getClaudeClient();
  const { model, maxTokens, temperature, system } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: system || undefined,
    messages,
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return textContent.text;
}

/**
 * Stream a message from Claude
 */
export async function* streamMessage(
  message: string,
  config: ClaudeConfig = {}
): AsyncGenerator<string, void, unknown> {
  const client = getClaudeClient();
  const { model, maxTokens, temperature, system } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const stream = await client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: system || undefined,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Analyze sentiment of text
 */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  reasoning: string;
  usage?: { input_tokens: number; output_tokens: number };
}> {
  const client = getClaudeClient();

  const systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment of the provided text and respond with a JSON object containing:
- sentiment: one of "positive", "negative", "neutral", or "mixed"
- confidence: a number from 0 to 1 indicating your confidence
- reasoning: a brief explanation (1-2 sentences)

Respond ONLY with valid JSON, no markdown or other formatting.`;

  const response = await client.messages.create({
    model: DEFAULT_MODELS.analysis,
    max_tokens: 500,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze the sentiment of this text:\n\n"${text}"`,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  try {
    const result = JSON.parse(textContent.text);
    return {
      sentiment: result.sentiment || "neutral",
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || "Unable to determine reasoning",
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  } catch {
    // Default response if parsing fails
    return {
      sentiment: "neutral",
      confidence: 0.5,
      reasoning: "Unable to parse sentiment analysis result",
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  }
}

// Export client getter for advanced usage
export { claudeClient };
