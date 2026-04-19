/**
 * Unified OpenAI-compatible LLM client pointed at LiteLLM proxy.
 *
 * Requirement: TR-ARC-002 — LiteLLM proxy for provider routing + budgets.
 *
 * Every LLM call in the app goes through this client. LiteLLM handles:
 *   - Provider routing (anthropic / openai / google / perplexity / xai / deepseek)
 *   - Per-tenant budgets
 *   - Fallback on 429 / 5xx
 *   - Unified error shapes
 *
 * In dev/ci without LiteLLM running, the client falls through to direct
 * provider SDKs via adapter functions in `./providers/*`. This keeps local
 * dev and tests fast without needing the proxy up.
 */

import { createTrace, traceLLMCall, type Trace } from "./observability";

const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL ?? "http://litellm:4000/v1";
const LITELLM_API_KEY = process.env.LITELLM_API_KEY ?? "";
const USE_LITELLM =
  process.env.NODE_ENV === "production" ||
  process.env.LITELLM_ENABLED === "true";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  /** Model alias as defined in infra/litellm/config.yaml */
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** For Langfuse tracing — identifies the calling tenant */
  tenantId?: string | null;
  /** For Langfuse tracing — identifies the brand being worked on */
  brandId?: string | null;
  /** Logical operation name for trace naming */
  operation?: string;
  /** Signal to cancel the request */
  signal?: AbortSignal;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  raw: unknown;
}

interface LiteLLMChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface LiteLLMResponse {
  id: string;
  model: string;
  choices: LiteLLMChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly provider: string,
    public readonly model: string,
    public readonly traceId?: string,
  ) {
    super(message);
    this.name = "LLMClientError";
  }
}

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const trace = await createTrace({
    name: req.operation ?? `llm.chat:${req.model}`,
    tenantId: req.tenantId,
    brandId: req.brandId,
  });

  try {
    const response = await traceLLMCall<ChatResponse>(trace, {
      provider: "litellm",
      model: req.model,
      prompt: req.messages,
      timeoutMs: 60_000,
      call: (signal) => executeChat(req, signal),
      extractUsage: (r) => ({
        input: r.usage.inputTokens,
        output: r.usage.outputTokens,
      }),
      extractCompletion: (r) => r.content,
    });
    trace.end();
    return response;
  } catch (err) {
    trace.fail(err);
    throw err;
  }
}

async function executeChat(
  req: ChatRequest,
  signal: AbortSignal,
): Promise<ChatResponse> {
  if (!USE_LITELLM) {
    return callDirectSDK(req, signal);
  }

  const res = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
    method: "POST",
    signal: req.signal ?? signal,
    headers: {
      "Content-Type": "application/json",
      ...(LITELLM_API_KEY ? { Authorization: `Bearer ${LITELLM_API_KEY}` } : {}),
      ...(req.tenantId ? { "X-Tenant-Id": req.tenantId } : {}),
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens,
      user: req.tenantId ?? undefined,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new LLMClientError(
      `LiteLLM ${res.status}: ${errBody.slice(0, 200)}`,
      res.status,
      "litellm",
      req.model,
    );
  }

  const data = (await res.json()) as LiteLLMResponse;
  const choice = data.choices?.[0];
  if (!choice) {
    throw new LLMClientError(
      "LiteLLM returned no choices",
      500,
      "litellm",
      req.model,
    );
  }

  return {
    id: data.id,
    model: data.model,
    content: choice.message.content,
    usage: {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    },
    raw: data,
  };
}

/**
 * Fallback path for dev/CI when LiteLLM proxy isn't running. Calls provider
 * SDKs directly via a narrow adapter. Kept minimal — the real routing is in
 * LiteLLM config.yaml.
 */
async function callDirectSDK(
  req: ChatRequest,
  signal: AbortSignal,
): Promise<ChatResponse> {
  // Resolve model alias → provider. Keep this list in sync with
  // infra/litellm/config.yaml `model_name` entries.
  const modelToProvider: Record<string, "anthropic" | "openai"> = {
    "claude-opus-4-7": "anthropic",
    "claude-sonnet-4-6": "anthropic",
    "claude-haiku-4-5": "anthropic",
    "claude-3-5-sonnet": "anthropic",
    "gpt-5": "openai",
    "gpt-5.2": "openai",
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
  };
  const provider = modelToProvider[req.model];

  if (provider === "anthropic") {
    return callAnthropic(req, signal);
  }
  if (provider === "openai") {
    return callOpenAI(req, signal);
  }
  throw new LLMClientError(
    `No direct SDK adapter for model "${req.model}" — run LiteLLM proxy or add an adapter`,
    501,
    "unknown",
    req.model,
  );
}

async function callAnthropic(
  req: ChatRequest,
  signal: AbortSignal,
): Promise<ChatResponse> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemMessages = req.messages.filter((m) => m.role === "system");
  const chatMessages = req.messages.filter((m) => m.role !== "system");

  const response = await client.messages.create(
    {
      model: req.model,
      system:
        systemMessages.length > 0
          ? systemMessages.map((m) => m.content).join("\n\n")
          : undefined,
      messages: chatMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
    },
    { signal: req.signal ?? signal },
  );

  const text =
    response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("") ?? "";

  return {
    id: response.id,
    model: response.model,
    content: text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    raw: response,
  };
}

async function callOpenAI(
  req: ChatRequest,
  signal: AbortSignal,
): Promise<ChatResponse> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create(
    {
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens,
    },
    { signal: req.signal ?? signal },
  );

  const choice = response.choices[0];
  if (!choice) {
    throw new LLMClientError(
      "OpenAI returned no choices",
      500,
      "openai",
      req.model,
    );
  }

  return {
    id: response.id,
    model: response.model,
    content: choice.message.content ?? "",
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    },
    raw: response,
  };
}

export type { Trace };
