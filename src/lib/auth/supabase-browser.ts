"use client";

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for use in client components.
 * Use for sign-in/out, OAuth flows, Realtime subscriptions, Storage uploads.
 */
export function createBrowserClient() {
  // Use placeholder values during build-time SSR when env vars are not yet available.
  // At runtime the real values from the container environment are always present.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createSsrBrowserClient(url, key);
}
