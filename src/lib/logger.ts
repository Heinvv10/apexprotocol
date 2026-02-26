/**
 * Logger utility for consistent logging across the application
 * Provides structured logging with support for different log levels
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development" || process.env.LOG_LEVEL === "debug") {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatMessage("info", message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage("warn", message, context));
  },

  error(message: string, context?: LogContext): void {
    console.error(formatMessage("error", message, context));
  },
};

export default logger;
