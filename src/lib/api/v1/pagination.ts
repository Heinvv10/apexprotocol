/**
 * Cursor-based pagination helper for v1 list endpoints.
 *
 * Request:
 *   GET /api/v1/resource?limit=50&cursor=<opaque>
 *
 * Response envelope:
 *   { "data": [...], "pagination": { "next_cursor": "...", "has_more": true, "limit": 50 } }
 *
 * Cursors are opaque base64url-encoded JSON — safe to return as strings.
 * Implemented keyset-style using an ordered (created_at, id) tuple.
 */

interface CursorPayload {
  /** ISO timestamp — the sort key */
  ts: string;
  /** Tiebreaker on equal timestamps */
  id: string;
}

export interface PaginationOptions {
  limit: number;
  cursor?: CursorPayload;
}

export interface PaginationMeta {
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parsePagination(params: URLSearchParams): PaginationOptions {
  const rawLimit = params.get("limit");
  let limit = DEFAULT_LIMIT;
  if (rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }
  const rawCursor = params.get("cursor");
  if (!rawCursor) return { limit };

  try {
    const decoded = Buffer.from(rawCursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as CursorPayload;
    if (typeof payload.ts !== "string" || typeof payload.id !== "string") {
      return { limit };
    }
    return { limit, cursor: payload };
  } catch {
    return { limit };
  }
}

export function encodeCursor(record: { createdAt: Date | string; id: string }): string {
  const ts =
    record.createdAt instanceof Date
      ? record.createdAt.toISOString()
      : record.createdAt;
  const payload: CursorPayload = { ts, id: record.id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function paginate<T extends { createdAt: Date | string; id: string }>(
  rows: T[],
  opts: PaginationOptions,
): { data: T[]; pagination: PaginationMeta } {
  const hasMore = rows.length > opts.limit;
  const data = hasMore ? rows.slice(0, opts.limit) : rows;
  const last = data[data.length - 1];
  return {
    data,
    pagination: {
      next_cursor: hasMore && last ? encodeCursor(last) : null,
      has_more: hasMore,
      limit: opts.limit,
    },
  };
}
