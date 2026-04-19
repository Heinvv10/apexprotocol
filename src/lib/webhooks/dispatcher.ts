/**
 * Webhook dispatcher — fires Zapier + generic webhook subscriptions on
 * well-known events. FR-ITG-004 + webhook channel in alerts/delivery.
 *
 * Called from domain code (audit completion, new recommendation, etc.)
 * via `dispatchEvent()`. Non-blocking by design — failures don't break the
 * originating action; we just log + increment failureCount.
 *
 * Every outbound POST carries:
 *   - HMAC-SHA256 signature in `X-Apex-Signature: sha256=<hex>` if signing
 *     secret is configured (per tenant or per subscription)
 *   - `X-Apex-Event: <event_name>`
 *   - `X-Apex-Delivery: <uuid>` for idempotency on the receiver
 */

import { and, eq, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { zapierSubscriptions } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export type ApexEvent =
  | "score_changed"
  | "new_recommendation"
  | "alert_fired"
  | "mention_detected"
  | "audit_completed";

export interface EventPayload {
  event: ApexEvent;
  organization_id: string;
  brand_id?: string | null;
  occurred_at: string;
  data: Record<string, unknown>;
}

const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_DELIVERIES = 16;

function hmacSignature(body: string, secret: string): string {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

async function deliverOne(
  subscription: typeof zapierSubscriptions.$inferSelect,
  payload: EventPayload,
): Promise<{ ok: boolean; err?: string }> {
  const deliveryId = createId();
  const body = JSON.stringify({ ...payload, delivery_id: deliveryId });
  const signingSecret = process.env.WEBHOOK_SIGNING_SECRET;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Apex-Event": payload.event,
    "X-Apex-Delivery": deliveryId,
  };
  if (signingSecret) {
    headers["X-Apex-Signature"] = hmacSignature(body, signingSecret);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const res = await fetch(subscription.targetUrl, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, err: `${res.status} ${res.statusText}` };
    }
    return { ok: true };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, err: (err as Error).message };
  }
}

/**
 * Dispatch an event to every subscribing webhook + Zap.
 *
 * Fire-and-forget at the call site — this resolves when all attempts settle
 * but it does not throw. Callers shouldn't gate domain logic on this.
 */
export async function dispatchEvent(payload: EventPayload): Promise<void> {
  const filters = [
    eq(zapierSubscriptions.organizationId, payload.organization_id),
    eq(zapierSubscriptions.event, payload.event),
  ];
  if (payload.brand_id) {
    // Subscribers can either scope to a brand or subscribe to all brands (null)
    filters.push(
      sql`(${zapierSubscriptions.brandId} IS NULL OR ${zapierSubscriptions.brandId} = ${payload.brand_id})`,
    );
  }

  const subs = await db
    .select()
    .from(zapierSubscriptions)
    .where(and(...filters));

  if (subs.length === 0) return;

  logger.info("webhooks.dispatch", {
    event: payload.event,
    tenantId: payload.organization_id,
    brandId: payload.brand_id,
    subscribers: subs.length,
  });

  // Bounded concurrency
  const queue = [...subs];
  const inflight: Promise<unknown>[] = [];

  async function runOne(sub: typeof zapierSubscriptions.$inferSelect) {
    const result = await deliverOne(sub, payload);

    if (result.ok) {
      await db
        .update(zapierSubscriptions)
        .set({
          lastFiredAt: new Date(),
          lastError: null,
          failureCount: "0",
        })
        .where(eq(zapierSubscriptions.id, sub.id));
    } else {
      await db
        .update(zapierSubscriptions)
        .set({
          lastError: result.err ?? "unknown",
          failureCount: sql`(${zapierSubscriptions.failureCount}::int + 1)::text`,
        })
        .where(eq(zapierSubscriptions.id, sub.id));
      logger.warn("webhooks.delivery_failed", {
        subscriptionId: sub.id,
        err: result.err,
      });
    }
  }

  while (queue.length > 0 || inflight.length > 0) {
    while (inflight.length < MAX_CONCURRENT_DELIVERIES && queue.length > 0) {
      const sub = queue.shift()!;
      const task = runOne(sub).finally(() => {
        const idx = inflight.indexOf(task);
        if (idx !== -1) inflight.splice(idx, 1);
      });
      inflight.push(task);
    }
    if (inflight.length > 0) {
      await Promise.race(inflight);
    }
  }
}
