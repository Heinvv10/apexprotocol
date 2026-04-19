/**
 * Real-Time Monitoring SSE Endpoint
 * Streams brand mention updates to connected clients via Server-Sent Events
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

// Type for streaming mention data
export interface StreamMention {
  id: string;
  brandId: string;
  platform: string;
  query: string;
  response: string;
  sentiment: "positive" | "neutral" | "negative" | "unrecognized";
  position: number | null;
  citationUrl: string | null;
  createdAt: string;
}

// SSE message types
type SSEMessageType = "mention" | "ping" | "connected" | "error";

interface SSEMessage {
  type: SSEMessageType;
  data: StreamMention | string | null;
  timestamp: string;
}

/**
 * Format an SSE message
 */
function formatSSE(message: SSEMessage): string {
  return `event: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;
}

/**
 * GET - SSE stream for real-time mentions
 */
export async function GET(request: NextRequest): Promise<Response> {
  // Authenticate via Clerk
  const __session = await getSession();
  const { userId, orgId } = __session ?? { userId: null, orgId: null, orgRole: null, orgSlug: null, sessionClaims: null };

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!orgId) {
    return new Response(
      JSON.stringify({ error: "Organization required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const redis = getRedisClient();
      const channelName = `mentions:${orgId}`;

      let isActive = true;
      let isClosed = false;
      let pingInterval: ReturnType<typeof setInterval> | null = null;
      let pollInterval: ReturnType<typeof setInterval> | null = null;

      // Safe enqueue that checks if controller is still open
      const safeEnqueue = (data: Uint8Array) => {
        if (!isActive || isClosed) return false;
        try {
          controller.enqueue(data);
          return true;
        } catch {
          isActive = false;
          isClosed = true;
          return false;
        }
      };

      // Safe close that only closes once
      const safeClose = () => {
        if (isClosed) return;
        isClosed = true;
        isActive = false;
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Send initial connection message
      const connectMessage: SSEMessage = {
        type: "connected",
        data: `Connected to ${channelName}`,
        timestamp: new Date().toISOString(),
      };
      safeEnqueue(encoder.encode(formatSSE(connectMessage)));

      logger.info("[SSE] Client connected", { userId, orgId, channel: channelName });

      // Set up ping every 30 seconds to keep connection alive
      pingInterval = setInterval(() => {
        if (!isActive || isClosed) return;

        const pingMessage: SSEMessage = {
          type: "ping",
          data: null,
          timestamp: new Date().toISOString(),
        };
        safeEnqueue(encoder.encode(formatSSE(pingMessage)));
      }, 30000);

      // Poll Redis for new messages (Upstash doesn't support traditional pub/sub subscribe)
      // We use a list-based approach: mentions are pushed to a Redis list, and we poll it
      const listKey = `mention_stream:${orgId}`;

      pollInterval = setInterval(async () => {
        if (!isActive || isClosed) return;

        try {
          // Pop messages from the list (LPOP removes and returns the first element)
          const rawMessage = await redis.lpop(listKey);

          if (rawMessage) {
            let mention: StreamMention;

            if (typeof rawMessage === "string") {
              try {
                mention = JSON.parse(rawMessage);
              } catch {
                return; // Invalid JSON, skip
              }
            } else {
              mention = rawMessage as unknown as StreamMention;
            }

            const sseMessage: SSEMessage = {
              type: "mention",
              data: mention,
              timestamp: new Date().toISOString(),
            };
            safeEnqueue(encoder.encode(formatSSE(sseMessage)));
          }
        } catch (error) {
          logger.error("[SSE] Error polling Redis", { error, orgId });
        }
      }, 1000); // Poll every second

      // Handle request abort (client disconnect)
      request.signal.addEventListener("abort", () => {
        isActive = false;
        if (pingInterval) clearInterval(pingInterval);
        if (pollInterval) clearInterval(pollInterval);
        logger.info("[SSE] Client disconnected", { userId, orgId });
        safeClose();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
