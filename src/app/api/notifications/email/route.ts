/**
 * Email Notifications API (F128-F130)
 * GET /api/notifications/email - Get status, templates, history
 * POST /api/notifications/email - Send, configure, test emails
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  emailManager,
  formatEmailDeliveryResponse,
  type EmailProvider,
  type AlertType,
} from "@/lib/notifications/email";

const VALID_ALERT_TYPES: AlertType[] = [
  "negative_mention",
  "score_drop",
  "crisis_detected",
  "competitor_surge",
  "audit_failed",
];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    switch (action) {
      case "status":
        return handleGetStatus();

      case "templates":
        return handleGetTemplates();

      case "history": {
        const limit = parseInt(searchParams.get("limit") || "50");
        return handleGetHistory(limit);
      }

      case "alertTypes":
        return handleGetAlertTypes();

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: status, templates, history, alertTypes" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process email request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "configure":
        return handleConfigure(body);

      case "test":
        return handleTestEmail(body);

      case "send":
        return handleSendEmail(body);

      case "sendWeeklyReport":
        return handleSendWeeklyReport(body);

      case "sendAlert":
        return handleSendAlert(body);

      case "retry":
        return handleRetryEmail(body);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: configure, test, send, sendWeeklyReport, sendAlert, retry" },
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
        error: "Email operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetStatus() {
  const status = emailManager.getStatus();

  return NextResponse.json({
    success: true,
    status: {
      configured: status.configured,
      provider: status.provider,
      fromEmail: status.fromEmail,
      fromName: status.fromName,
      deliveryCount: status.deliveryCount,
    },
  });
}

function handleGetTemplates() {
  const templates = [
    {
      id: "weekly_report",
      name: "Weekly Report",
      description: "Weekly GEO performance report with score trends and recommendations",
      variables: [
        "brandName",
        "currentScore",
        "scoreChange",
        "totalMentions",
        "positivePercentage",
        "negativeMentions",
        "keyHighlights",
        "recommendations",
        "periodStart",
        "periodEnd",
      ],
    },
    {
      id: "alert_notification",
      name: "Alert Notification",
      description: "Real-time alerts for negative mentions, score drops, and crisis detection",
      variables: [
        "brandName",
        "alertType",
        "severity",
        "title",
        "description",
        "triggeredAt",
        "affectedPlatforms",
        "mentionCount",
        "actionItems",
      ],
    },
    {
      id: "custom",
      name: "Custom Email",
      description: "Send custom emails with HTML or plain text content",
      variables: ["subject", "html", "text"],
    },
  ];

  return NextResponse.json({
    success: true,
    templates,
  });
}

function handleGetHistory(limit: number) {
  const history = emailManager.getDeliveryHistory(limit);

  return NextResponse.json({
    success: true,
    deliveries: history.map(formatEmailDeliveryResponse),
    count: history.length,
  });
}

function handleGetAlertTypes() {
  const alertTypes = [
    {
      type: "negative_mention",
      name: "Negative Mention",
      description: "Alert when a negative brand mention is detected",
      defaultSeverity: "medium",
    },
    {
      type: "score_drop",
      name: "Score Drop",
      description: "Alert when GEO score drops below threshold",
      defaultSeverity: "high",
    },
    {
      type: "crisis_detected",
      name: "Crisis Detected",
      description: "Critical alert for potential brand crisis",
      defaultSeverity: "critical",
    },
    {
      type: "competitor_surge",
      name: "Competitor Surge",
      description: "Alert when competitor gains significant visibility",
      defaultSeverity: "medium",
    },
    {
      type: "audit_failed",
      name: "Audit Failed",
      description: "Alert when a site audit fails to complete",
      defaultSeverity: "low",
    },
  ];

  return NextResponse.json({
    success: true,
    alertTypes,
  });
}

// POST handlers
function handleConfigure(body: unknown) {
  const schema = z.object({
    provider: z.enum(["resend", "sendgrid"]),
    apiKey: z.string().min(1),
    fromEmail: z.string().email(),
    fromName: z.string().min(1).max(100).optional(),
    replyTo: z.string().email().optional(),
  });

  const data = schema.parse(body);

  emailManager.configure({
    provider: data.provider as EmailProvider,
    apiKey: data.apiKey,
    fromEmail: data.fromEmail,
    fromName: data.fromName,
    replyTo: data.replyTo,
  });

  return NextResponse.json({
    success: true,
    message: `Email configured with ${data.provider}`,
    status: {
      configured: true,
      provider: data.provider,
      fromEmail: data.fromEmail,
      fromName: data.fromName,
    },
  });
}

async function handleTestEmail(body: unknown) {
  const schema = z.object({
    toEmail: z.string().email(),
  });

  const { toEmail } = schema.parse(body);

  const delivery = await emailManager.sendTestEmail(toEmail);

  return NextResponse.json({
    success: delivery.status === "sent",
    message: delivery.status === "sent"
      ? "Test email sent successfully"
      : "Failed to send test email",
    delivery: formatEmailDeliveryResponse(delivery),
  });
}

async function handleSendEmail(body: unknown) {
  const schema = z.object({
    to: z.union([z.string().email(), z.array(z.string().email())]),
    subject: z.string().min(1).max(200),
    html: z.string().optional(),
    text: z.string().optional(),
    replyTo: z.string().email().optional(),
    tags: z.array(z.string()).optional(),
  });

  const data = schema.parse(body);

  if (!data.html && !data.text) {
    return NextResponse.json(
      { error: "Either html or text content is required" },
      { status: 400 }
    );
  }

  const delivery = await emailManager.sendEmail({
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
    replyTo: data.replyTo,
    tags: data.tags,
  });

  return NextResponse.json({
    success: delivery.status === "sent",
    message: delivery.status === "sent"
      ? "Email sent successfully"
      : "Failed to send email",
    delivery: formatEmailDeliveryResponse(delivery),
  });
}

async function handleSendWeeklyReport(body: unknown) {
  const schema = z.object({
    toEmail: z.string().email(),
    brandName: z.string().min(1),
    currentScore: z.number().min(0).max(100),
    previousScore: z.number().min(0).max(100),
    totalMentions: z.number().min(0),
    positiveMentions: z.number().min(0),
    negativeMentions: z.number().min(0),
    neutralMentions: z.number().min(0),
    topPlatforms: z.array(z.object({
      name: z.string(),
      mentions: z.number(),
      sentiment: z.number(),
    })).optional(),
    keyHighlights: z.array(z.string()).optional(),
    recommendations: z.array(z.object({
      title: z.string(),
      priority: z.string(),
      category: z.string(),
    })).optional(),
    periodStart: z.string(),
    periodEnd: z.string(),
    dashboardUrl: z.string().url().optional(),
  });

  const data = schema.parse(body);

  const delivery = await emailManager.sendWeeklyReport(
    data.toEmail,
    {
      brandName: data.brandName,
      currentScore: data.currentScore,
      previousScore: data.previousScore,
      totalMentions: data.totalMentions,
      positiveMentions: data.positiveMentions,
      negativeMentions: data.negativeMentions,
      neutralMentions: data.neutralMentions,
      topPlatforms: data.topPlatforms,
      keyHighlights: data.keyHighlights,
      recommendations: data.recommendations,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
    data.dashboardUrl
  );

  return NextResponse.json({
    success: delivery.status === "sent",
    message: delivery.status === "sent"
      ? "Weekly report sent successfully"
      : "Failed to send weekly report",
    delivery: formatEmailDeliveryResponse(delivery),
  });
}

async function handleSendAlert(body: unknown) {
  const schema = z.object({
    toEmail: z.string().email(),
    brandName: z.string().min(1),
    alertType: z.enum(VALID_ALERT_TYPES as [string, ...string[]]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    title: z.string().min(1),
    description: z.string().min(1),
    triggeredAt: z.string().optional(),
    affectedPlatforms: z.array(z.string()).optional(),
    mentionCount: z.number().optional(),
    scoreChange: z.number().optional(),
    actionItems: z.array(z.string()).optional(),
    dashboardUrl: z.string().url().optional(),
  });

  const data = schema.parse(body);

  const delivery = await emailManager.sendAlertNotification(
    data.toEmail,
    {
      brandName: data.brandName,
      alertType: data.alertType as AlertType,
      severity: data.severity,
      title: data.title,
      description: data.description,
      triggeredAt: data.triggeredAt || new Date().toISOString(),
      affectedPlatforms: data.affectedPlatforms,
      mentionCount: data.mentionCount,
      scoreChange: data.scoreChange,
      actionItems: data.actionItems,
    },
    data.dashboardUrl
  );

  return NextResponse.json({
    success: delivery.status === "sent",
    message: delivery.status === "sent"
      ? "Alert notification sent successfully"
      : "Failed to send alert",
    delivery: formatEmailDeliveryResponse(delivery),
  });
}

async function handleRetryEmail(body: unknown) {
  const schema = z.object({
    deliveryId: z.string().min(1),
  });

  const { deliveryId } = schema.parse(body);

  const delivery = await emailManager.retryDelivery(deliveryId);

  if (!delivery) {
    return NextResponse.json(
      { error: "Delivery not found or not eligible for retry" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: delivery.status === "sent",
    message: delivery.status === "sent"
      ? "Retry successful"
      : "Retry failed",
    delivery: formatEmailDeliveryResponse(delivery),
  });
}
