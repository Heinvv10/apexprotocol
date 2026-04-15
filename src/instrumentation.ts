import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

type OnRequestErrorRequest = {
  path?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

// Next.js invokes this for every uncaught error in a request (App + Pages routers).
// We stamp request-scoped tags before forwarding to Sentry so Bugsink events carry
// `route` + `request_id`. No-op when SENTRY_ENABLED is not 'true'.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export function onRequestError(err: unknown, request: OnRequestErrorRequest): void {
  if (process.env.SENTRY_ENABLED !== 'true') return;
  const route = (request.path ?? 'unknown').split('?')[0] ?? 'unknown';
  const rawId = request.headers['x-request-id'];
  const requestId = typeof rawId === 'string' ? rawId : undefined;
  Sentry.withScope((scope) => {
    scope.setTag('route', route);
    if (requestId) scope.setTag('request_id', requestId);
    Sentry.captureException(err);
  });
}
