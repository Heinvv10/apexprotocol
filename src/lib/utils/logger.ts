import { logger } from "@/lib/logger";
/**
 * Logger Utility
 *
 * Structured logging for the application with log levels and prefixes.
 * Production-ready with proper redaction of sensitive data.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  timestamp: string;
  level: LogLevel;
  prefix: string;
  message: string;
  data?: unknown;
}

export class Logger {
  private prefix: string;
  private logLevel: LogLevel;

  constructor(prefix: string, logLevel: LogLevel = "info") {
    this.prefix = prefix;
    this.logLevel = logLevel;
  }

  private formatContext(context: LogContext): string {
    const levelUpper = context.level.toUpperCase().padEnd(5);
    const message = context.data
      ? `${context.message} ${JSON.stringify(this.redactSensitive(context.data))}`
      : context.message;

    return `[${context.timestamp}] ${levelUpper} ${context.prefix} ${message}`;
  }

  private redactSensitive(obj: unknown): unknown {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitive(item));
    }

    const result = { ...obj } as Record<string, unknown>;
    const sensitiveKeys = [
      "password",
      "apiKey",
      "api_key",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "credentials",
      "auth",
      "authorization",
      "sessionData",
      "encryptedSessionData",
    ];

    for (const key of sensitiveKeys) {
      if (key in result) {
        result[key] = "[REDACTED]";
      }
    }

    return result;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      const context: LogContext = {
        timestamp: new Date().toISOString(),
        level: "debug",
        prefix: this.prefix,
        message,
        data,
      };
      logger.debug(this.formatContext(context));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      const context: LogContext = {
        timestamp: new Date().toISOString(),
        level: "info",
        prefix: this.prefix,
        message,
        data,
      };
      logger.info(this.formatContext(context));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      const context: LogContext = {
        timestamp: new Date().toISOString(),
        level: "warn",
        prefix: this.prefix,
        message,
        data,
      };
      console.warn(this.formatContext(context));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog("error")) {
      const context: LogContext = {
        timestamp: new Date().toISOString(),
        level: "error",
        prefix: this.prefix,
        message,
        data,
      };
      console.error(this.formatContext(context));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}
