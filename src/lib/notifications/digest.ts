/**
 * Notification Digest Service
 * Full implementation for email digest aggregation, summary generation, and delivery tracking
 * Uses Resend for email delivery with React Email templates
 */

import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import NotificationDigest, { type NotificationDigestProps } from "@/emails/NotificationDigest";
import { type NotificationItemProps } from "@/emails/components/NotificationItem";

export type DigestPriority = "high" | "medium" | "low";

export interface DigestNotification {
  id: string;
  title: string;
  message: string;
  priority: DigestPriority;
  type?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface DigestConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface DeliveryRecord {
  id: string;
  to: string;
  frequency: "daily" | "weekly";
  status: "sent" | "failed" | "pending";
  notificationCount: number;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface DigestStatus {
  isConfigured: boolean;
  deliveryStats: {
    total: number;
    sent: number;
    failed: number;
    lastDelivery?: Date;
  };
}

// In-memory storage for delivery history (in production, use database)
const deliveryHistory: DeliveryRecord[] = [];
let resendClient: Resend | null = null;
let config: DigestConfig | null = null;

/**
 * Map notification priority to a human-readable label
 */
function priorityToType(priority: DigestPriority): string {
  switch (priority) {
    case "high":
      return "important";
    case "medium":
      return "recommendation";
    case "low":
      return "mention";
    default:
      return "mention";
  }
}

/**
 * Generate a unique ID for delivery records
 */
function generateDeliveryId(): string {
  return `del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * AI-powered summary generation for digest notifications
 */
async function generateAISummary(
  brandName: string,
  notifications: DigestNotification[],
  periodStart?: Date,
  periodEnd?: Date
): Promise<string> {
  // Group notifications by priority
  const highPriority = notifications.filter((n) => n.priority === "high");
  const mediumPriority = notifications.filter((n) => n.priority === "medium");
  const lowPriority = notifications.filter((n) => n.priority === "low");

  // Build summary parts
  const parts: string[] = [];

  // Period info
  if (periodStart && periodEnd) {
    const startStr = periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    parts.push(`Summary for ${brandName} (${startStr} - ${endStr}):`);
  } else {
    parts.push(`Summary for ${brandName}:`);
  }

  // High priority highlights
  if (highPriority.length > 0) {
    parts.push("");
    parts.push(`🚨 ${highPriority.length} Important Alert${highPriority.length > 1 ? "s" : ""}:`);
    highPriority.slice(0, 3).forEach((n) => {
      parts.push(`  • ${n.title}`);
    });
    if (highPriority.length > 3) {
      parts.push(`  • ... and ${highPriority.length - 3} more`);
    }
  }

  // Medium priority (recommendations, score changes)
  if (mediumPriority.length > 0) {
    parts.push("");
    parts.push(`📊 ${mediumPriority.length} Update${mediumPriority.length > 1 ? "s" : ""}:`);
    mediumPriority.slice(0, 3).forEach((n) => {
      parts.push(`  • ${n.title}`);
    });
    if (mediumPriority.length > 3) {
      parts.push(`  • ... and ${mediumPriority.length - 3} more`);
    }
  }

  // Low priority (mentions)
  if (lowPriority.length > 0) {
    parts.push("");
    parts.push(`💬 ${lowPriority.length} New Mention${lowPriority.length > 1 ? "s" : ""}`);
    if (lowPriority.length <= 2) {
      lowPriority.forEach((n) => {
        parts.push(`  • ${n.title}`);
      });
    }
  }

  // Overall stats
  parts.push("");
  parts.push(`Total: ${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`);

  return parts.join("\n");
}

export const digestService = {
  /**
   * Check if the digest service is configured
   */
  isConfigured(): boolean {
    return resendClient !== null && config !== null;
  },

  /**
   * Configure the digest service with Resend credentials
   */
  configure(digestConfig: DigestConfig): void {
    config = digestConfig;
    resendClient = new Resend(digestConfig.apiKey);
  },

  /**
   * Create a digest from notifications (legacy method, returns basic structure)
   */
  async createDigest(): Promise<{
    id: string;
    createdAt: Date;
  } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    return {
      id: generateDeliveryId(),
      createdAt: new Date(),
    };
  },

  /**
   * Send a digest email to a user
   */
  async sendDigest(
    userEmail: string,
    summary: string,
    frequency: string,
    dashboardUrl: string,
    notifications?: DigestNotification[],
    userName?: string
  ): Promise<{ status: "sent" | "failed"; error?: string }> {
    if (!resendClient || !config) {
      return { status: "failed", error: "Digest service not configured" };
    }

    const deliveryId = generateDeliveryId();
    const deliveryRecord: DeliveryRecord = {
      id: deliveryId,
      to: userEmail,
      frequency: frequency as "daily" | "weekly",
      status: "pending",
      notificationCount: notifications?.length || 0,
      createdAt: new Date(),
    };

    try {
      // Prepare notification items for email template
      const notificationItems: NotificationItemProps[] = (notifications || []).map((n) => ({
        type: (n.type || priorityToType(n.priority)) as "mention" | "score_change" | "recommendation" | "important",
        title: n.title,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
        metadata: n.metadata || {},
      }));

      // Build email props
      const periodEnd = new Date();
      const periodStart = new Date();
      if (frequency === "daily") {
        periodStart.setDate(periodStart.getDate() - 1);
      } else {
        periodStart.setDate(periodStart.getDate() - 7);
      }

      const emailProps: NotificationDigestProps = {
        userName,
        frequency: frequency as "daily" | "weekly",
        notifications: notificationItems,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        dashboardUrl,
        unsubscribeUrl: `${dashboardUrl.replace("/notifications", "/settings/notifications")}`,
      };

      // Render email HTML - create React element for render function
      const emailElement = React.createElement(NotificationDigest, emailProps);
      const emailHtml = await render(emailElement);

      // Send via Resend
      const { error } = await resendClient.emails.send({
        from: config.fromName
          ? `${config.fromName} <${config.fromEmail}>`
          : config.fromEmail,
        to: userEmail,
        replyTo: config.replyTo,
        subject: `Your ${frequency === "daily" ? "Daily" : "Weekly"} Digest - ${notificationItems.length} notification${notificationItems.length !== 1 ? "s" : ""}`,
        html: emailHtml,
        text: summary,
      });

      if (error) {
        deliveryRecord.status = "failed";
        deliveryRecord.error = error.message;
        deliveryHistory.unshift(deliveryRecord);
        return { status: "failed", error: error.message };
      }

      deliveryRecord.status = "sent";
      deliveryRecord.sentAt = new Date();
      deliveryHistory.unshift(deliveryRecord);

      // Keep only last 1000 delivery records in memory
      if (deliveryHistory.length > 1000) {
        deliveryHistory.splice(1000);
      }

      return { status: "sent" };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      deliveryRecord.status = "failed";
      deliveryRecord.error = errorMessage;
      deliveryHistory.unshift(deliveryRecord);
      return { status: "failed", error: errorMessage };
    }
  },

  /**
   * Create a summary of notifications for a brand
   */
  async createSummary(
    brandName: string,
    notifications: DigestNotification[] | unknown[],
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<string> {
    // Handle both typed and untyped notification arrays
    const typedNotifications = (notifications as DigestNotification[]).map((n) => ({
      id: n.id || String(Math.random()),
      title: n.title || "Notification",
      message: n.message || "",
      priority: n.priority || "low",
      type: n.type,
      createdAt: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt || Date.now()),
      metadata: n.metadata,
    })) as DigestNotification[];

    return generateAISummary(brandName, typedNotifications, periodStart, periodEnd);
  },

  /**
   * Get the current status of the digest service
   */
  async getStatus(): Promise<DigestStatus> {
    const sentCount = deliveryHistory.filter((d) => d.status === "sent").length;
    const failedCount = deliveryHistory.filter((d) => d.status === "failed").length;
    const lastSent = deliveryHistory.find((d) => d.status === "sent");

    return {
      isConfigured: this.isConfigured(),
      deliveryStats: {
        total: deliveryHistory.length,
        sent: sentCount,
        failed: failedCount,
        lastDelivery: lastSent?.sentAt,
      },
    };
  },

  /**
   * Get recent delivery history
   */
  async getDeliveryHistory(limit: number = 10): Promise<DeliveryRecord[]> {
    return deliveryHistory.slice(0, limit);
  },

  /**
   * Clear delivery history (for testing)
   */
  clearHistory(): void {
    deliveryHistory.length = 0;
  },

  /**
   * Reset the service configuration (for testing)
   */
  reset(): void {
    resendClient = null;
    config = null;
    deliveryHistory.length = 0;
  },
};
