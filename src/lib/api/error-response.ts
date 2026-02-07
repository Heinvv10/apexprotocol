/**
 * API Error Response Helper
 *
 * Returns generic error messages to clients while logging full details server-side.
 * Prevents leaking internal error details (stack traces, DB errors, etc.) to users.
 */

import { NextResponse } from "next/server";

/**
 * Create a safe error response that logs details server-side
 * but only returns a generic message to the client.
 *
 * @param error - The caught error
 * @param context - Human-readable context (e.g. "fetching brands")
 * @param status - HTTP status code (default: 500)
 */
export function safeErrorResponse(
  error: unknown,
  context: string,
  status: number = 500
): NextResponse {
  // Log full error details server-side
  console.error(`[API Error] ${context}:`, error);

  // Return generic message to client
  return NextResponse.json(
    { error: `Failed ${context}` },
    { status }
  );
}
