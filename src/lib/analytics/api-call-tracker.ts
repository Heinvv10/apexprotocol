/**
 * Request-scoped API call tracker.
 *
 * Writes one row to `api_call_tracking` per incoming /api/* request. Called
 * from `src/middleware.ts` after auth resolves the userId + orgId.
 *
 * Fire-and-forget — never blocks the response and never throws. Failures go
 * to the logger but are otherwise swallowed. Missing rows are an acceptable
 * cost; a broken API call path is not.
 *
 * We intentionally DON'T capture response status or latency here — Next
 * middleware runs before the handler, so both are unknown at log time. For
 * those we'd need route-handler instrumentation, which we can add later.
 */

/**
 * NOTE: This module is imported from `src/middleware.ts`. Next.js's Turbopack
 * tries to statically analyse the middleware dependency graph to decide what
 * to bundle — and `pg` (pulled in by drizzle at module scope) uses Node APIs
 * like `dns` that break the build if they end up in the middleware bundle.
 *
 * We therefore DYNAMIC-import db + schema inside the async IIFE so the pg
 * driver stays out of the middleware's static import graph. The runtime can
 * still load it since middleware is declared `runtime = "nodejs"`.
 */

export interface TrackApiCallParams {
  endpoint: string;
  method: string;
  userId?: string | null;
  organizationId?: string | null;
  /** Status code at the time of middleware return — usually 200 for routes
   *  that get through auth, a real 4xx/5xx if middleware itself blocks. */
  statusCode?: number;
  /** Optional additional context the route might want searchable later. */
  metadata?: Record<string, unknown>;
}

export function trackApiCall(params: TrackApiCallParams): void {
  if (!params.organizationId) return; // Can't attribute — skip.

  void (async () => {
    try {
      const [{ db }, { apiCallTracking }] = await Promise.all([
        import("@/lib/db"),
        import("@/lib/db/schema"),
      ]);
      await db.insert(apiCallTracking).values({
        endpoint: params.endpoint.slice(0, 500),
        method: params.method.slice(0, 10),
        statusCode: params.statusCode ?? 200,
        responseTime: null,
        userId: params.userId ?? null,
        organizationId: params.organizationId as string,
        metadata: params.metadata ?? {},
      });
    } catch (err) {
      // Logger imported dynamically for the same bundling reason. If it
      // can't load we fall back to plain console.
      try {
        const { logger } = await import("@/lib/logger");
        logger.warn("[api-tracker] insert failed", {
          error: err instanceof Error ? err.message : String(err),
          endpoint: params.endpoint,
        });
      } catch {
        console.warn("[api-tracker] insert failed", err);
      }
    }
  })();
}
