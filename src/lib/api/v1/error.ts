/**
 * Standardized error envelope for the Public REST API v1 (FR-API-001).
 *
 * All v1 errors return:
 *   { "error": { "code": "not_found", "message": "...", "docs_url": "..." } }
 *
 * Use the helpers below — never hand-roll NextResponse.json errors inside v1.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export type ApiErrorCode =
  | "invalid_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable"
  | "rate_limited"
  | "internal_error"
  | "not_implemented";

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  invalid_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable: 422,
  rate_limited: 429,
  internal_error: 500,
  not_implemented: 501,
};

const DOCS_BASE = process.env.NEXT_PUBLIC_API_DOCS_BASE ?? "https://apex.dev/api/docs";

interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    docs_url: string;
    /** Field-level validation details, when applicable */
    details?: Record<string, string>;
    /** Trace ID for support escalation */
    trace_id?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly displayMessage: string,
    public readonly details?: Record<string, string>,
    public readonly traceId?: string,
  ) {
    super(displayMessage);
    this.name = "ApiError";
  }
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  options: { details?: Record<string, string>; traceId?: string } = {},
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      docs_url: `${DOCS_BASE}#errors-${code}`,
      ...(options.details ? { details: options.details } : {}),
      ...(options.traceId ? { trace_id: options.traceId } : {}),
    },
  };
  return NextResponse.json(body, { status: HTTP_STATUS[code] });
}

/**
 * Wrap a route handler — converts thrown ApiError / other errors into proper
 * v1 envelope responses. Emits a logger.error for unexpected errors.
 */
export function withApiErrorHandling<T extends (...args: never[]) => Promise<Response>>(
  handler: T,
): T {
  return (async (...args: never[]) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return apiError(err.code, err.displayMessage, {
          details: err.details,
          traceId: err.traceId,
        });
      }
      const e = err as Error;
      logger.error("api.v1.unhandled_error", {
        name: e.name,
        message: e.message,
        stack: e.stack?.split("\n").slice(0, 5).join("\n"),
      });
      return apiError(
        "internal_error",
        "An unexpected error occurred. Please try again or contact support.",
      );
    }
  }) as T;
}

export type { ApiErrorBody };
