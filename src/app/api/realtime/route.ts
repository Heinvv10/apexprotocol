/**
 * Real-time SSE API using Upstash Realtime
 * GET /api/realtime - SSE endpoint for real-time notification delivery
 *
 * This endpoint provides Server-Sent Events (SSE) for real-time notifications
 * using Upstash Realtime with automatic reconnection and message history.
 */

import { Realtime, handle } from '@upstash/realtime';
import { Redis } from '@upstash/redis';
import { getUserId } from '@/lib/auth';
import { z } from 'zod';
import { NextRequest } from 'next/server';

/**
 * Zod schema for notification events streamed via SSE
 * Ensures type-safe real-time event delivery
 */
const notificationSchema = z.object({
  id: z.number(),
  type: z.string(), // 'mention', 'score_change', 'recommendation', 'important'
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isRead: z.boolean().optional(),
  createdAt: z.string(),
});

/**
 * Check if Redis is configured
 */
const isRedisConfigured = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!url && !!token && url !== "undefined" && token !== "undefined";
};

/**
 * Initialize Redis client from environment variables (only if configured)
 */
let redis: Redis | null = null;
type RealtimeOpts = {
  schema: { notification: typeof notificationSchema };
  redis: Redis;
  maxDurationSecs: number;
  history: { maxLength: number; expireAfterSecs: number };
};
let realtime: Realtime<RealtimeOpts> | null = null;

if (isRedisConfigured()) {
  redis = Redis.fromEnv();

  /**
   * Configure Upstash Realtime instance
   * - maxDurationSecs: 300 (5 minutes) for Vercel free tier compatibility
   * - history: Keeps last 100 messages for 24 hours to support reconnection recovery
   */
  realtime = new Realtime({
    schema: notificationSchema as any,
    redis,
    maxDurationSecs: 300, // Vercel free tier timeout limit
    history: {
      maxLength: 100, // Keep last 100 messages
      expireAfterSecs: 86400, // Expire after 24 hours
    },
  });
}

/**
 * Mock SSE response for when Redis is not configured
 */
function createMockSSEResponse(): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send a heartbeat message
      const message = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(message));

      // Keep connection open with periodic heartbeats
      const interval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      // Auto-close after 80 seconds (matching original behavior)
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 80000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * GET handler for SSE connections
 * Authenticates users and establishes user-specific notification channels
 *
 * Channel naming pattern: notifications:${userId}
 * - Each user gets their own private notification channel
 * - Middleware ensures only authenticated users can connect
 * - Returns 401 for unauthenticated requests
 */
export async function GET(request: NextRequest) {
  // If Redis is not configured, return a mock SSE stream
  if (!realtime) {
    return createMockSSEResponse();
  }

  // Use the handle function from @upstash/realtime
  const handler = handle({
    realtime,
    middleware: async () => {
      const userId = await getUserId();
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }
      // Middleware returns void on success, allowing connection to proceed
    },
  });

  return handler(request);
}
