/**
 * Structured logger for the Apex platform.
 *
 * - JSON output in production (NFR-OBS-003)
 * - Pretty output in development
 * - Request-scoped child loggers via `.child({ requestId, tenantId })`
 * - Integrates with Langfuse trace IDs when present in context
 *
 * Replaces ad-hoc `console.log`. Do not introduce new `console.*` calls in src/.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

type LogContext = Record<string, unknown>;

const MIN_LEVEL: LogLevel = (() => {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
})();

const IS_PROD = process.env.NODE_ENV === "production";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 6) return "[max-depth]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack?.split("\n").slice(0, 10).join("\n"),
    };
  }
  if (Array.isArray(obj)) return obj.map((v) => redact(v, depth + 1));
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/^(password|secret|token|api[-_]?key|authorization|cookie)/i.test(k)) {
      redacted[k] = "[redacted]";
    } else {
      redacted[k] = redact(v, depth + 1);
    }
  }
  return redacted;
}

function emit(level: LogLevel, message: string, context: LogContext): void {
  if (!shouldLog(level)) return;
  const redactedContext = redact(context) as Record<string, unknown>;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...redactedContext,
  };

  if (IS_PROD) {
    // Structured JSON — one line per record — pipe to Loki/Grafana
    process.stdout.write(JSON.stringify(record) + "\n");
    return;
  }

  // Dev: pretty
  const color = LEVEL_COLORS[level];
  const ctx =
    Object.keys(context).length > 0
      ? " " + JSON.stringify(redact(context))
      : "";
  process.stdout.write(
    `${color}[${level.padEnd(5)}]${RESET} ${record.ts} ${message}${ctx}\n`
  );
}

interface Logger {
  debug(message: string, context?: LogContext | unknown): void;
  info(message: string, context?: LogContext | unknown): void;
  warn(message: string, context?: LogContext | unknown): void;
  error(message: string, context?: LogContext | unknown): void;
  child(boundContext: LogContext): Logger;
}

/**
 * Coerce any second-arg value into a LogContext. Plain objects pass through;
 * Errors get unwrapped into { err: { name, message, stack } }; primitives /
 * arrays get wrapped as { value: … } so call sites that pass non-object
 * values still produce structured logs instead of type errors.
 *
 * Necessary because the project-wide console.log→logger.info migration
 * left many sites passing strings or unknown error catches as the second
 * argument; the old logger enforced Record<string, unknown> strictly.
 */
function toContext(input: unknown): LogContext {
  if (input === undefined || input === null) return {};
  if (input instanceof Error) {
    return {
      err: {
        name: input.name,
        message: input.message,
        stack: input.stack?.split("\n").slice(0, 10).join("\n"),
      },
    };
  }
  if (typeof input === "object" && !Array.isArray(input)) {
    return input as LogContext;
  }
  return { value: input };
}

function makeLogger(bound: LogContext = {}): Logger {
  return {
    debug(message, context) {
      emit("debug", message, { ...bound, ...toContext(context) });
    },
    info(message, context) {
      emit("info", message, { ...bound, ...toContext(context) });
    },
    warn(message, context) {
      emit("warn", message, { ...bound, ...toContext(context) });
    },
    error(message, context) {
      emit("error", message, { ...bound, ...toContext(context) });
    },
    child(boundContext: LogContext) {
      return makeLogger({ ...bound, ...boundContext });
    },
  };
}

export const logger = makeLogger();
export default logger;
export type { Logger, LogContext, LogLevel };
