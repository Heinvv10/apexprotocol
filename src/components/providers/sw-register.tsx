"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register";

/**
 * Client-side hook that kicks off service worker registration once on mount.
 * Kept as its own component so the root layout can stay server-rendered.
 *
 * We gate on NODE_ENV === "production" because an in-dev SW caches HMR chunks
 * and breaks hot reloading. In prod builds it registers /sw.js with scope "/".
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    registerServiceWorker();
  }, []);
  return null;
}
