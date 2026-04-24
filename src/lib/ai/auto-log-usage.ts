/**
 * Auto-resolve the current org + user for AI usage logging.
 *
 * AI wrappers (openai.ts, claude.ts, adapters) don't know who's calling them,
 * and threading `organizationId` through every callsite would touch ~40 files.
 * Instead: when the wrapper fires, try to resolve the current org/user from
 * Next's request context. If that works we log usage; if it throws (because
 * we're in a worker, cron, or test), we silently skip.
 *
 * Call `logAIUsageAuto` right after any AI call completes. It's fire-and-
 * forget and never throws — AI features stay working even if logging fails.
 *
 * IMPORTANT: all heavy imports (usage-logger → db → pg, supabase-server
 * → cookies/headers) are DYNAMIC so this file doesn't drag pg into client
 * bundles. openai.ts is imported transitively from client components via
 * the rich-text editor's content-analyzer; a single static import of
 * `./usage-logger` here caused the build to fail trying to resolve `dns`
 * and `net` in the browser bundle.
 */

export interface AutoLogParams {
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget usage logging with request-context auto-resolution.
 * Safe to call from anywhere (route handlers, workers, scripts).
 */
export function logAIUsageAuto(params: AutoLogParams): void {
  if (params.inputTokens + params.outputTokens === 0) return;
  // No-op on the browser. Tokens are known only after the server-side AI
  // call completes, so a client-triggered call path shouldn't write usage
  // — and importing db in the browser bundle is impossible anyway.
  if (typeof window !== "undefined") return;

  // Detached async IIFE so callers don't need to await.
  void (async () => {
    try {
      const [{ getOrganizationId, getUserId }, { logAIUsage }] = await Promise.all([
        import("@/lib/auth/supabase-server"),
        import("./usage-logger"),
      ]);
      let organizationId: string | null = null;
      let userId: string | null = null;
      try {
        organizationId = await getOrganizationId();
        userId = await getUserId();
      } catch {
        // Not inside a request context (worker, CLI, cron). Skip.
        return;
      }
      if (!organizationId) return;

      await logAIUsage(
        organizationId,
        params.provider,
        params.model,
        params.operation,
        params.inputTokens,
        params.outputTokens,
        userId ?? undefined,
        params.metadata,
      );
    } catch (err) {
      // Swallow — never break the AI call path.
      // eslint-disable-next-line no-console
      console.warn("[ai-usage] auto-log failed", err);
    }
  })();
}
