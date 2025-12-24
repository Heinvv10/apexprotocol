"use client";

import { RealtimeProvider as BaseRealtimeProvider } from "@upstash/realtime/client";
import type { ReactNode } from "react";

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * Realtime Provider wrapper for SSE-based notifications
 * Wraps the application with Upstash Realtime to enable real-time notification delivery
 * via Server-Sent Events (SSE) with automatic reconnection and message recovery.
 */
export function RealtimeProvider({ children }: RealtimeProviderProps) {
  return (
    <BaseRealtimeProvider
      api={{ url: "/api/realtime", withCredentials: false }}
      maxReconnectAttempts={3}
    >
      {children}
    </BaseRealtimeProvider>
  );
}
