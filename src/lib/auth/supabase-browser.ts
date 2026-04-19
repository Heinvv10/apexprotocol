"use client";

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for use in client components.
 * Use for sign-in/out, OAuth flows, Realtime subscriptions, Storage uploads.
 */
export function createBrowserClient() {
  return createSsrBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
