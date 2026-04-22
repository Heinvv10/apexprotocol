"use client";

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for use in client components.
 * Use for sign-in/out, OAuth flows, Realtime subscriptions, Storage uploads.
 */
export function createBrowserClient() {
  // NEXT_PUBLIC_* vars are inlined at build time. Fail the build loudly if they
  // are missing — a fallback placeholder would ship silently to browsers and
  // break login with ERR_NAME_NOT_RESOLVED.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY at build time. " +
        "Pass them as Docker build args (see Dockerfile) — runtime env does not apply to NEXT_PUBLIC_*.",
    );
  }
  return createSsrBrowserClient(url, key);
}
