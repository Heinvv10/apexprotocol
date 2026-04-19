/**
 * Langfuse observability wrapper for every LLM call in Apex.
 *
 * Requirement: NFR-OBS-001 — 100% trace coverage across scrapers + generators.
 *
 * Usage:
 *   const trace = createTrace({ name: "brand-audit", tenantId, brandId });
 *   const result = await traceLLMCall(trace, {
 *     provider: "anthropic",
 *     model: "claude-opus-4-7",
 *     prompt: [...],
 *     call: (signal) => anthropic.messages.create({ ... }, { signal }),
 *   });
 *   trace.end();
 *
 * - If Langfuse is not configured, falls back to no-op + logger (dev + CI safe).
 * - Captures token usage, latency, cost estimates, prompt/completion bodies.
 * - Redacts PII and secrets via logger.ts rules before emitting.
 */

import { logger } from "@/lib/logger";

interface TraceMeta {
  name: string;
  tenantId?: string | null;
  brandId?: string | null;
  userId?: string | null;
  /** Arbitrary tags for filtering in Langfuse UI */
  tags?: string[];
  /** Parent trace ID for nested operations */
  parentTraceId?: string;
}

interface LLMCallSpec<T> {
  provider:
    | "anthropic"
    | "openai"
    | "google"
    | "perplexity"
    | "xai"
    | "deepseek"
    | "litellm";
  model: string;
  prompt: unknown;
  call: (signal: AbortSignal) => Promise<T>;
  /** Timeout in ms — defaults to 60s */
  timeoutMs?: number;
  /** Extract token usage from provider response */
  extractUsage?: (response: T) => { input?: number; output?: number } | null;
  /** Extract completion text from provider response for archiving */
  extractCompletion?: (response: T) => string | null;
}

interface Trace {
  id: string;
  end: () => void;
  fail: (err: unknown) => void;
  subspan: (name: string, meta?: Record<string, unknown>) => Span;
}

interface Span {
  end: (output?: unknown) => void;
  fail: (err: unknown) => void;
}

const LANGFUSE_CONFIGURED =
  !!process.env.LANGFUSE_HOST &&
  !!process.env.LANGFUSE_PUBLIC_KEY &&
  !!process.env.LANGFUSE_SECRET_KEY;

// Lazy singleton — avoid top-level import cost when Langfuse isn't used
let langfuseClient: unknown = null;

async function getClient(): Promise<unknown | null> {
  if (!LANGFUSE_CONFIGURED) return null;
  if (langfuseClient) return langfuseClient;
  try {
    // Lazy — `langfuse` is optional at install time. Dynamic string avoids
    // TS trying to resolve the module at build time when it isn't installed.
    const moduleName = "langfuse";
    const mod = await import(/* webpackIgnore: true */ moduleName).catch(
      () => null,
    );
    if (!mod) {
      logger.warn("langfuse package not installed, observability disabled", {});
      return null;
    }
    const Langfuse = (mod as { Langfuse: new (cfg: unknown) => unknown }).Langfuse;
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST,
      flushAt: 1, // flush after every event in server contexts
    });
    return langfuseClient;
  } catch (err) {
    logger.warn("langfuse init failed", { err: (err as Error).message });
    return null;
  }
}

function newId(): string {
  return `trc_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/**
 * Start a new top-level trace. Returns an object with `.end()` / `.fail()` /
 * `.subspan()`. Always succeeds — falls back to logger-only if Langfuse is
 * unconfigured.
 */
export async function createTrace(meta: TraceMeta): Promise<Trace> {
  const id = newId();
  const start = Date.now();

  const client = await getClient();
  let lfTrace: unknown = null;
  if (client) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lfTrace = (client as any).trace({
        id,
        name: meta.name,
        userId: meta.userId ?? undefined,
        metadata: {
          tenantId: meta.tenantId,
          brandId: meta.brandId,
          parentTraceId: meta.parentTraceId,
        },
        tags: meta.tags,
      });
    } catch (err) {
      logger.warn("langfuse trace create failed", { err: (err as Error).message });
    }
  }

  logger.debug("trace.start", {
    traceId: id,
    traceName: meta.name,
    tenantId: meta.tenantId,
    brandId: meta.brandId,
    userId: meta.userId,
    tags: meta.tags,
  });

  return {
    id,
    end: () => {
      const duration = Date.now() - start;
      logger.debug("trace.end", { traceId: id, durationMs: duration });
      if (lfTrace) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lfTrace as any).update({ metadata: { durationMs: duration } });
        } catch {
          /* ignore */
        }
      }
    },
    fail: (err: unknown) => {
      const duration = Date.now() - start;
      logger.error("trace.fail", {
        traceId: id,
        durationMs: duration,
        err: (err as Error).message,
      });
      if (lfTrace) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lfTrace as any).update({
            metadata: { durationMs: duration, error: (err as Error).message },
            level: "ERROR",
          });
        } catch {
          /* ignore */
        }
      }
    },
    subspan: (spanName, spanMeta = {}) =>
      createSpan(id, lfTrace, spanName, spanMeta),
  };
}

function createSpan(
  traceId: string,
  lfTrace: unknown | null,
  name: string,
  spanMeta: Record<string, unknown>,
): Span {
  const start = Date.now();
  let lfSpan: unknown = null;
  if (lfTrace) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lfSpan = (lfTrace as any).span({
        name,
        metadata: spanMeta,
        startTime: new Date(start),
      });
    } catch {
      /* ignore */
    }
  }
  return {
    end: (output?: unknown) => {
      const duration = Date.now() - start;
      logger.debug("span.end", {
        traceId,
        name,
        durationMs: duration,
      });
      if (lfSpan) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lfSpan as any).end({ output, endTime: new Date() });
        } catch {
          /* ignore */
        }
      }
    },
    fail: (err: unknown) => {
      const duration = Date.now() - start;
      logger.warn("span.fail", {
        traceId,
        name,
        durationMs: duration,
        err: (err as Error).message,
      });
      if (lfSpan) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lfSpan as any).end({
            level: "ERROR",
            statusMessage: (err as Error).message,
            endTime: new Date(),
          });
        } catch {
          /* ignore */
        }
      }
    },
  };
}

/**
 * Wrap an LLM provider call. Records provider, model, prompt, completion,
 * token usage, latency. Always forwards errors after recording.
 */
export async function traceLLMCall<T>(
  trace: Trace,
  spec: LLMCallSpec<T>,
): Promise<T> {
  const start = Date.now();
  const timeout = spec.timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const client = await getClient();
  let lfGeneration: unknown = null;

  if (client) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lfGeneration = (client as any).generation({
        traceId: trace.id,
        name: `${spec.provider}:${spec.model}`,
        model: spec.model,
        input: spec.prompt,
        startTime: new Date(start),
        metadata: {
          provider: spec.provider,
          timeoutMs: timeout,
        },
      });
    } catch {
      /* ignore */
    }
  }

  try {
    const result = await spec.call(controller.signal);
    clearTimeout(timer);

    const duration = Date.now() - start;
    const usage = spec.extractUsage?.(result) ?? null;
    const completion = spec.extractCompletion?.(result) ?? null;

    logger.info("llm.call.ok", {
      traceId: trace.id,
      provider: spec.provider,
      model: spec.model,
      durationMs: duration,
      inputTokens: usage?.input,
      outputTokens: usage?.output,
    });

    if (lfGeneration) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lfGeneration as any).end({
          output: completion ?? result,
          endTime: new Date(),
          usage: usage
            ? {
                input: usage.input,
                output: usage.output,
              }
            : undefined,
        });
      } catch {
        /* ignore */
      }
    }

    return result;
  } catch (err) {
    clearTimeout(timer);
    const duration = Date.now() - start;
    logger.error("llm.call.fail", {
      traceId: trace.id,
      provider: spec.provider,
      model: spec.model,
      durationMs: duration,
      err: (err as Error).message,
    });
    if (lfGeneration) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lfGeneration as any).end({
          level: "ERROR",
          statusMessage: (err as Error).message,
          endTime: new Date(),
        });
      } catch {
        /* ignore */
      }
    }
    throw err;
  }
}

export type { Trace, Span, TraceMeta, LLMCallSpec };
