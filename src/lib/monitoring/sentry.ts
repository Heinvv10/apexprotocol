/**
 * Sentry Error Tracking Integration (F147)
 * Error reporting, monitoring, and performance tracking
 */

// Note: In production, install @sentry/nextjs and configure properly
// This module provides a mock/stub implementation for development
// and documents the expected integration pattern

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  integrations?: unknown[];
  beforeSend?: (event: SentryEvent) => SentryEvent | null;
}

export interface SentryEvent {
  event_id: string;
  timestamp: string;
  platform: string;
  level: SentryLevel;
  message?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno: number;
          colno: number;
        }>;
      };
    }>;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: SentryUser;
  contexts?: Record<string, unknown>;
  breadcrumbs?: SentryBreadcrumb[];
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  segment?: string;
}

export interface SentryBreadcrumb {
  timestamp: number;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: SentryLevel;
  type?: string;
}

export type SentryLevel = "fatal" | "error" | "warning" | "info" | "debug";

export interface SentryTransaction {
  name: string;
  op: string;
  startTimestamp: number;
  status?: string;
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: unknown) => void;
  startChild: (options: { op: string; description: string }) => SentrySpan;
}

export interface SentrySpan {
  description: string;
  op: string;
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: unknown) => void;
}

// Sentry singleton state
let isInitialized = false;
let currentConfig: SentryConfig | null = null;
let currentUser: SentryUser | null = null;
const breadcrumbs: SentryBreadcrumb[] = [];
const tags: Record<string, string> = {};
const capturedEvents: SentryEvent[] = [];

/**
 * Initialize Sentry
 */
export function init(config: SentryConfig): void {
  if (isInitialized) {
    console.warn("[Sentry] Already initialized");
    return;
  }

  currentConfig = config;
  isInitialized = true;

  // Log initialization (in production, this would call Sentry.init)
    environment: config.environment,
    release: config.release,
    debug: config.debug,
    tracesSampleRate: config.tracesSampleRate,
  });
}

/**
 * Capture an exception
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: SentryUser;
    level?: SentryLevel;
  }
): string {
  if (!isInitialized) {
    console.warn("[Sentry] Not initialized. Call init() first.");
    return "";
  }

  const eventId = generateEventId();
  const event: SentryEvent = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: context?.level || "error",
    user: context?.user || currentUser || undefined,
    tags: { ...tags, ...context?.tags },
    extra: context?.extra,
    breadcrumbs: [...breadcrumbs],
  };

  if (error instanceof Error) {
    event.exception = {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: parseStacktrace(error.stack),
        },
      ],
    };
  } else {
    event.message = String(error);
  }

  // Apply beforeSend filter
  if (currentConfig?.beforeSend) {
    const filteredEvent = currentConfig.beforeSend(event);
    if (!filteredEvent) return eventId;
  }

  // Store event (in production, this would send to Sentry)
  capturedEvents.push(event);

  // Log for development
  if (currentConfig?.debug) {
    console.error("[Sentry] Captured exception:", {
      eventId,
      type: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      tags: event.tags,
    });
  }

  return eventId;
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  levelOrContext?: SentryLevel | { level?: SentryLevel; tags?: Record<string, string>; extra?: Record<string, unknown> }
): string {
  if (!isInitialized) {
    console.warn("[Sentry] Not initialized. Call init() first.");
    return "";
  }

  const eventId = generateEventId();
  const level = typeof levelOrContext === "string" ? levelOrContext : levelOrContext?.level || "info";
  const context = typeof levelOrContext === "object" ? levelOrContext : {};

  const event: SentryEvent = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level,
    message,
    user: currentUser || undefined,
    tags: { ...tags, ...context.tags },
    extra: context.extra,
    breadcrumbs: [...breadcrumbs],
  };

  capturedEvents.push(event);

  if (currentConfig?.debug) {
  }

  return eventId;
}

/**
 * Set user context
 */
export function setUser(user: SentryUser | null): void {
  currentUser = user;
  if (currentConfig?.debug) {
  }
}

/**
 * Set tag
 */
export function setTag(key: string, value: string): void {
  tags[key] = value;
}

/**
 * Set multiple tags
 */
export function setTags(newTags: Record<string, string>): void {
  Object.assign(tags, newTags);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Omit<SentryBreadcrumb, "timestamp">): void {
  breadcrumbs.push({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  });

  // Keep only last 100 breadcrumbs
  while (breadcrumbs.length > 100) {
    breadcrumbs.shift();
  }
}

/**
 * Start a performance transaction
 */
export function startTransaction(options: { name: string; op: string }): SentryTransaction {
  const startTimestamp = Date.now() / 1000;

  const transaction: SentryTransaction = {
    name: options.name,
    op: options.op,
    startTimestamp,
    finish: () => {
      if (currentConfig?.debug) {
        const duration = Date.now() / 1000 - startTimestamp;
      }
    },
    setTag: (key, value) => {
      // In production, this sets tag on the transaction
    },
    setData: (key, value) => {
      // In production, this sets data on the transaction
    },
    startChild: (childOptions) => createSpan(childOptions),
  };

  return transaction;
}

/**
 * Create a span (child of transaction)
 */
function createSpan(options: { op: string; description: string }): SentrySpan {
  const startTimestamp = Date.now() / 1000;

  return {
    description: options.description,
    op: options.op,
    finish: () => {
      if (currentConfig?.debug) {
        const duration = Date.now() / 1000 - startTimestamp;
      }
    },
    setTag: () => {},
    setData: () => {},
  };
}

/**
 * Flush events (wait for them to be sent)
 */
export async function flush(timeout?: number): Promise<boolean> {
  // In production, this would flush pending events to Sentry
  return true;
}

/**
 * Close the SDK
 */
export async function close(timeout?: number): Promise<boolean> {
  isInitialized = false;
  currentConfig = null;
  currentUser = null;
  breadcrumbs.length = 0;
  Object.keys(tags).forEach((key) => delete tags[key]);
  return true;
}

/**
 * Check if Sentry is initialized
 */
export function isEnabled(): boolean {
  return isInitialized;
}

/**
 * Get captured events (for testing/development)
 */
export function getCapturedEvents(): SentryEvent[] {
  return [...capturedEvents];
}

/**
 * Clear captured events (for testing)
 */
export function clearCapturedEvents(): void {
  capturedEvents.length = 0;
}

// Helper functions
function generateEventId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function parseStacktrace(stack?: string): { frames: Array<{ filename: string; function: string; lineno: number; colno: number }> } | undefined {
  if (!stack) return undefined;

  const frames = stack
    .split("\n")
    .slice(1)
    .map((line) => {
      const match = line.match(/at (\S+) \((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
      filename: string;
      function: string;
      lineno: number;
      colno: number;
    }>;

  return { frames };
}

/**
 * Express/Next.js error handler middleware
 */
export function errorHandler(
  error: Error,
  request: { url?: string; method?: string; headers?: Record<string, string> }
): string {
  return captureException(error, {
    extra: {
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers,
      },
    },
  });
}

/**
 * Wrap an async function to automatically capture errors
 */
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: { name?: string; tags?: Record<string, string> }
): T {
  return (async (...args: Parameters<T>) => {
    const transaction = startTransaction({
      name: context?.name || fn.name || "anonymous",
      op: "function",
    });

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        transaction.setTag(key, value);
      });
    }

    try {
      const result = await fn(...args);
      transaction.status = "ok";
      return result;
    } catch (error) {
      transaction.status = "error";
      captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }) as T;
}

// Export default Sentry-like object
export const Sentry = {
  init,
  captureException,
  captureMessage,
  setUser,
  setTag,
  setTags,
  addBreadcrumb,
  startTransaction,
  flush,
  close,
  isEnabled,
  errorHandler,
  withSentry,
  // Development helpers
  getCapturedEvents,
  clearCapturedEvents,
};

export default Sentry;
