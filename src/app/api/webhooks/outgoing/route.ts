import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Outgoing Webhooks API (F127)
 * GET /api/webhooks/outgoing - Get webhooks, deliveries
 * POST /api/webhooks/outgoing - Register, update, delete webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  webhookManager,
  formatWebhookResponse,
  formatDeliveryResponse,
  type WebhookEventType,
  type WebhookConfig,
} from "@/lib/notifications/webhooks";

const VALID_EVENTS: WebhookEventType[] = [
  "mention.new",
  "mention.sentiment_change",
  "audit.started",
  "audit.completed",
  "audit.failed",
  "score.updated",
  "score.threshold_reached",
  "recommendation.created",
  "recommendation.completed",
  "alert.crisis",
  "alert.negative_spike",
  "report.weekly_ready",
  "content.published",
  "competitor.change",
];

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const action = searchParams.get("action") || "list";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "list":
        return handleListWebhooks(brandId);

      case "get": {
        const webhookId = searchParams.get("webhookId");
        if (!webhookId) {
          return NextResponse.json(
            { error: "webhookId is required" },
            { status: 400 }
          );
        }
        return handleGetWebhook(webhookId);
      }

      case "deliveries": {
        const webhookId = searchParams.get("webhookId");
        if (!webhookId) {
          return NextResponse.json(
            { error: "webhookId is required" },
            { status: 400 }
          );
        }
        const limit = parseInt(searchParams.get("limit") || "50");
        return handleGetDeliveries(webhookId, limit);
      }

      case "events":
        return handleGetEvents();

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: list, get, deliveries, events" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process webhook request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "register":
        return handleRegisterWebhook(body);

      case "update":
        return handleUpdateWebhook(body);

      case "delete":
        return handleDeleteWebhook(body);

      case "enable":
        return handleSetEnabled(body, true);

      case "disable":
        return handleSetEnabled(body, false);

      case "test":
        return handleTestWebhook(body);

      case "retry":
        return handleRetryDelivery(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: register, update, delete, enable, disable, test, retry" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Webhook operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleListWebhooks(brandId: string) {
  const webhooks = webhookManager.getWebhooksForBrand(brandId);

  return NextResponse.json({
    success: true,
    webhooks: webhooks.map(formatWebhookResponse),
    count: webhooks.length,
  });
}

function handleGetWebhook(webhookId: string) {
  const webhook = webhookManager.getWebhook(webhookId);

  if (!webhook) {
    return NextResponse.json(
      { error: "Webhook not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    webhook: formatWebhookResponse(webhook),
  });
}

function handleGetDeliveries(webhookId: string, limit: number) {
  const deliveries = webhookManager.getDeliveryHistory(webhookId, limit);

  const stats = {
    total: deliveries.length,
    success: deliveries.filter((d) => d.status === "success").length,
    failed: deliveries.filter((d) => d.status === "failed").length,
    pending: deliveries.filter((d) => d.status === "pending" || d.status === "retrying").length,
  };

  return NextResponse.json({
    success: true,
    deliveries: deliveries.map(formatDeliveryResponse),
    stats,
  });
}

function handleGetEvents() {
  const eventDescriptions: Record<WebhookEventType, string> = {
    "mention.new": "Triggered when a new brand mention is detected",
    "mention.sentiment_change": "Triggered when a mention's sentiment changes",
    "audit.started": "Triggered when a site audit begins",
    "audit.completed": "Triggered when a site audit completes successfully",
    "audit.failed": "Triggered when a site audit fails",
    "score.updated": "Triggered when the GEO score is updated",
    "score.threshold_reached": "Triggered when score crosses a configured threshold",
    "recommendation.created": "Triggered when a new recommendation is created",
    "recommendation.completed": "Triggered when a recommendation is marked complete",
    "alert.crisis": "Triggered on crisis detection",
    "alert.negative_spike": "Triggered on spike in negative sentiment",
    "report.weekly_ready": "Triggered when weekly report is generated",
    "content.published": "Triggered when content is published",
    "competitor.change": "Triggered when competitor data changes",
  };

  return NextResponse.json({
    success: true,
    events: VALID_EVENTS.map((event) => ({
      name: event,
      description: eventDescriptions[event],
    })),
  });
}

// POST handlers
function handleRegisterWebhook(body: unknown) {
  const schema = z.object({
    brandId: z.string().min(1),
    name: z.string().min(1).max(100),
    url: z.string().url(),
    secret: z.string().optional(),
    events: z.array(z.enum(VALID_EVENTS as [string, ...string[]])).min(1),
    headers: z.record(z.string(), z.string()).optional(),
    retryPolicy: z.object({
      maxRetries: z.number().min(0).max(10).optional(),
      retryDelayMs: z.number().min(100).max(60000).optional(),
      exponentialBackoff: z.boolean().optional(),
    }).optional(),
  });

  const data = schema.parse(body);

  const webhook = webhookManager.registerWebhook(data.brandId, {
    name: data.name,
    url: data.url,
    secret: data.secret,
    events: data.events as WebhookEventType[],
    headers: data.headers,
    retryPolicy: data.retryPolicy,
  });

  return NextResponse.json({
    success: true,
    message: "Webhook registered successfully",
    webhook: formatWebhookResponse(webhook),
  });
}

function handleUpdateWebhook(body: unknown) {
  const schema = z.object({
    webhookId: z.string().min(1),
    name: z.string().min(1).max(100).optional(),
    url: z.string().url().optional(),
    secret: z.string().optional(),
    events: z.array(z.enum(VALID_EVENTS as [string, ...string[]])).min(1).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    retryPolicy: z.object({
      maxRetries: z.number().min(0).max(10).optional(),
      retryDelayMs: z.number().min(100).max(60000).optional(),
      exponentialBackoff: z.boolean().optional(),
    }).optional(),
  });

  const { webhookId, ...updates } = schema.parse(body);

  const webhook = webhookManager.updateWebhook(
    webhookId,
    updates as Partial<Omit<WebhookConfig, "id" | "brandId" | "createdAt">>
  );

  if (!webhook) {
    return NextResponse.json(
      { error: "Webhook not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Webhook updated successfully",
    webhook: formatWebhookResponse(webhook),
  });
}

function handleDeleteWebhook(body: unknown) {
  const schema = z.object({
    webhookId: z.string().min(1),
  });

  const { webhookId } = schema.parse(body);

  const deleted = webhookManager.deleteWebhook(webhookId);

  if (!deleted) {
    return NextResponse.json(
      { error: "Webhook not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Webhook deleted",
  });
}

function handleSetEnabled(body: unknown, enabled: boolean) {
  const schema = z.object({
    webhookId: z.string().min(1),
  });

  const { webhookId } = schema.parse(body);

  const webhook = webhookManager.setWebhookEnabled(webhookId, enabled);

  if (!webhook) {
    return NextResponse.json(
      { error: "Webhook not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: enabled ? "Webhook enabled" : "Webhook disabled",
    webhook: formatWebhookResponse(webhook),
  });
}

async function handleTestWebhook(body: unknown) {
  const schema = z.object({
    webhookId: z.string().min(1),
  });

  const { webhookId } = schema.parse(body);

  const result = await webhookManager.testWebhook(webhookId);

  return NextResponse.json({
    success: result.success,
    message: result.success ? "Webhook test successful" : "Webhook test failed",
    result: {
      statusCode: result.statusCode,
      responseBody: result.responseBody,
      error: result.error,
      durationMs: result.durationMs,
    },
  });
}

async function handleRetryDelivery(body: unknown) {
  const schema = z.object({
    deliveryId: z.string().min(1),
  });

  const { deliveryId } = schema.parse(body);

  const delivery = await webhookManager.retryDelivery(deliveryId);

  if (!delivery) {
    return NextResponse.json(
      { error: "Delivery not found or not eligible for retry" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: delivery.status === "success" ? "Retry successful" : "Retry failed",
    delivery: formatDeliveryResponse(delivery),
  });
}
