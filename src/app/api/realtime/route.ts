/**
 * Real-time SSE API using Upstash Realtime
 * GET /api/realtime - SSE endpoint for real-time notification delivery
 *
 * This endpoint provides Server-Sent Events (SSE) for real-time notifications
 * using Upstash Realtime with automatic reconnection and message history.
 */

import { Realtime, handle } from '@upstash/realtime';
import { Redis } from '@upstash/redis';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

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
 * Initialize Redis client from environment variables
 * Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 */
const redis = Redis.fromEnv();

/**
 * Configure Upstash Realtime instance
 * - maxDurationSecs: 300 (5 minutes) for Vercel free tier compatibility
 * - history: Keeps last 100 messages for 24 hours to support reconnection recovery
 */
const realtime = new Realtime({
  schema: notificationSchema,
  redis,
  maxDurationSecs: 300, // Vercel free tier timeout limit
  history: {
    maxLength: 100, // Keep last 100 messages
    expireAfterSecs: 86400, // Expire after 24 hours
  },
});

/**
 * GET handler for SSE connections
 * Authenticates users and establishes user-specific notification channels
 *
 * Channel naming pattern: notifications:${userId}
 * - Each user gets their own private notification channel
 * - Middleware ensures only authenticated users can connect
 * - Returns 401 for unauthenticated requests
 */
export const GET = handle({
  realtime,
  middleware: async (request) => {
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    return {
      channel: `notifications:${userId}`,
    };
  },
});
