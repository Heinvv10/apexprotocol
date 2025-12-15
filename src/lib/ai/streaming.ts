/**
 * AI Streaming - SSE streaming for long AI responses
 * F090: Token-by-token streaming to frontend
 */

import Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude";
import { getOpenAIClient } from "./openai";
import { LLMProvider } from "./router";

// Stream event types
export type StreamEventType =
  | "start"
  | "token"
  | "content_block"
  | "usage"
  | "done"
  | "error";

export interface StreamUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface StreamEvent {
  type: StreamEventType;
  data: string | number | StreamUsage | Record<string, unknown>;
  timestamp: number;
}

export interface StreamOptions {
  provider?: LLMProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string, usage: StreamUsage) => void;
  onError?: (error: Error) => void;
}

/**
 * Stream response from Claude
 */
export async function* streamClaudeResponse(
  systemPrompt: string,
  userMessage: string,
  options: StreamOptions = {}
): AsyncGenerator<StreamEvent> {
  const client = getClaudeClient();
  const model = options.model || "claude-sonnet-4-20250514";
  const startTime = Date.now();

  yield {
    type: "start",
    data: { model, provider: "claude" },
    timestamp: Date.now(),
  };

  try {
    const stream = await client.messages.stream({
      model,
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    let fullText = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const token = event.delta.text;
        fullText += token;

        yield {
          type: "token",
          data: token,
          timestamp: Date.now(),
        };

        if (options.onToken) {
          options.onToken(token);
        }
      }
    }

    const finalMessage = await stream.finalMessage();
    const usage: StreamUsage = {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      totalTokens:
        finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
    };

    yield {
      type: "usage",
      data: usage,
      timestamp: Date.now(),
    };

    yield {
      type: "done",
      data: { fullText, duration: Date.now() - startTime },
      timestamp: Date.now(),
    };

    if (options.onComplete) {
      options.onComplete(fullText, usage);
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    yield {
      type: "error",
      data: { message: errorObj.message },
      timestamp: Date.now(),
    };

    if (options.onError) {
      options.onError(errorObj);
    }

    throw errorObj;
  }
}

/**
 * Stream response from OpenAI
 */
export async function* streamOpenAIResponse(
  systemPrompt: string,
  userMessage: string,
  options: StreamOptions = {}
): AsyncGenerator<StreamEvent> {
  const client = getOpenAIClient();
  const model = options.model || "gpt-4-turbo-preview";
  const startTime = Date.now();

  yield {
    type: "start",
    data: { model, provider: "openai" },
    timestamp: Date.now(),
  };

  try {
    const stream = await client.chat.completions.create({
      model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
    });

    let fullText = "";
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        completionTokens++; // Rough estimate

        yield {
          type: "token",
          data: delta,
          timestamp: Date.now(),
        };

        if (options.onToken) {
          options.onToken(delta);
        }
      }
    }

    // Estimate prompt tokens (OpenAI doesn't provide in stream)
    promptTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);

    const usage: StreamUsage = {
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
    };

    yield {
      type: "usage",
      data: usage,
      timestamp: Date.now(),
    };

    yield {
      type: "done",
      data: { fullText, duration: Date.now() - startTime },
      timestamp: Date.now(),
    };

    if (options.onComplete) {
      options.onComplete(fullText, usage);
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    yield {
      type: "error",
      data: { message: errorObj.message },
      timestamp: Date.now(),
    };

    if (options.onError) {
      options.onError(errorObj);
    }

    throw errorObj;
  }
}

/**
 * Unified streaming function with provider selection
 */
export async function* streamResponse(
  systemPrompt: string,
  userMessage: string,
  options: StreamOptions = {}
): AsyncGenerator<StreamEvent> {
  const provider = options.provider || "claude";

  if (provider === "claude") {
    yield* streamClaudeResponse(systemPrompt, userMessage, options);
  } else {
    yield* streamOpenAIResponse(systemPrompt, userMessage, options);
  }
}

/**
 * Convert stream to SSE format for API responses
 */
export function streamToSSE(
  stream: AsyncGenerator<StreamEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errorEvent: StreamEvent = {
          type: "error",
          data: {
            message:
              error instanceof Error ? error.message : "Unknown error",
          },
          timestamp: Date.now(),
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
        controller.close();
      }
    },
  });
}

/**
 * Create SSE response headers
 */
export function getSSEHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

/**
 * Helper to create streaming API response
 */
export function createStreamingResponse(
  systemPrompt: string,
  userMessage: string,
  options: StreamOptions = {}
): Response {
  const stream = streamResponse(systemPrompt, userMessage, options);
  const sseStream = streamToSSE(stream);

  return new Response(sseStream, {
    headers: getSSEHeaders(),
  });
}

/**
 * Collect stream into full response (for testing or non-streaming use)
 */
export async function collectStream(
  stream: AsyncGenerator<StreamEvent>
): Promise<{
  content: string;
  usage: StreamUsage;
  duration: number;
}> {
  let content = "";
  let usage: StreamUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let duration = 0;

  for await (const event of stream) {
    if (event.type === "token") {
      content += event.data;
    } else if (event.type === "usage") {
      usage = event.data as StreamUsage;
    } else if (event.type === "done") {
      const doneData = event.data as { fullText: string; duration: number };
      duration = doneData.duration;
    }
  }

  return { content, usage, duration };
}
