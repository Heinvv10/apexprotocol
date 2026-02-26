/**
 * Real-Time Monitor Hook
 * Provides SSE connection for live brand mention updates
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useOrganizationId } from "@/stores/auth";

// Type for streamed mention data
export interface StreamMention {
  id: string;
  brandId: string;
  platform: string;
  query: string;
  response: string;
  sentiment: "positive" | "neutral" | "negative";
  position: number | null;
  citationUrl: string | null;
  createdAt: string;
}

// SSE message types
interface SSEMessage {
  type: "mention" | "ping" | "connected" | "error";
  data: StreamMention | string | null;
  timestamp: string;
}

// Hook return type
interface UseRealtimeMonitorReturn {
  mentions: StreamMention[];
  isConnected: boolean;
  error: Error | null;
  clearMentions: () => void;
}

// Configuration options
interface UseRealtimeMonitorOptions {
  enabled?: boolean;
  maxMentions?: number;
  onMention?: (mention: StreamMention) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for real-time monitoring via SSE
 */
export function useRealtimeMonitor(
  options: UseRealtimeMonitorOptions = {}
): UseRealtimeMonitorReturn {
  const {
    enabled = true,
    maxMentions = 100,
    onMention,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const orgId = useOrganizationId();
  const [mentions, setMentions] = useState<StreamMention[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  // Exponential backoff config: 1s -> 2s -> 4s -> 8s -> 16s -> 30s (max)
  const baseReconnectDelay = 1000;
  const maxReconnectDelay = 30000; // Max 30 seconds

  // Clear mentions
  const clearMentions = useCallback(() => {
    setMentions([]);
  }, []);

  // Handle incoming mention
  const handleMention = useCallback(
    (mention: StreamMention) => {
      setMentions((prev) => {
        // Add to beginning and limit size
        const updated = [mention, ...prev];
        return updated.slice(0, maxMentions);
      });

      // Call optional callback
      onMention?.(mention);
    },
    [maxMentions, onMention]
  );

  // Connect to SSE
  const connect = useCallback(() => {
    if (!orgId || !enabled) {
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource("/api/monitor/stream");
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      // Handle connected event
      eventSource.addEventListener("connected", () => {
        setIsConnected(true);
        setError(null);
      });

      // Handle mention event
      eventSource.addEventListener("mention", (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          if (message.data && typeof message.data !== "string") {
            handleMention(message.data);
          }
        } catch (parseError) {
          console.error("[useRealtimeMonitor] Failed to parse mention:", parseError);
        }
      });

      // Handle ping event (keep-alive)
      eventSource.addEventListener("ping", () => {
        // Ping received, connection is alive
      });

      // Handle error event from server
      eventSource.addEventListener("error", (event) => {
        if (event instanceof MessageEvent) {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            const errorMessage = typeof message.data === "string" ? message.data : "Unknown error";
            const sseError = new Error(errorMessage);
            setError(sseError);
            onError?.(sseError);
          } catch {
            // Not a parsed error, handle as connection error
          }
        }
      });

      // Handle connection error
      eventSource.onerror = () => {
        setIsConnected(false);
        onDisconnect?.();

        // Attempt reconnect with exponential backoff, capped at maxReconnectDelay (30s)
        const delay = Math.min(
          baseReconnectDelay * Math.pow(2, reconnectAttempts.current),
          maxReconnectDelay
        );
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (connectError) {
      const err = connectError instanceof Error ? connectError : new Error(String(connectError));
      setError(err);
      onError?.(err);
    }
  }, [orgId, enabled, handleMention, onConnect, onDisconnect, onError]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled && orgId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled, orgId]);

  return {
    mentions,
    isConnected,
    error,
    clearMentions,
  };
}

export default useRealtimeMonitor;
