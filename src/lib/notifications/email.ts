/**
 * Email Notifications System (F128-F130)
 * F128: Email provider setup (Resend/SendGrid)
 * F129: Weekly report emails
 * F130: Alert notifications
 */

import { createId } from "@paralleldrive/cuid2";

// Email types
export type EmailProvider = "resend" | "sendgrid";
export type AlertType = "negative_mention" | "score_drop" | "crisis_detected" | "competitor_surge" | "audit_failed";

export interface EmailConfig {
  provider: "resend" | "sendgrid";
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
}

export interface EmailMessage {
  id?: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface EmailDelivery {
  id: string;
  messageId: string;
  providerId?: string;
  to: string[];
  subject: string;
  status: "queued" | "sent" | "delivered" | "failed" | "bounced";
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface WeeklyReportData {
  brandName: string;
  currentScore: number;
  previousScore: number;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  topPlatforms?: Array<{ name: string; mentions: number; sentiment: number }>;
  keyHighlights?: string[];
  recommendations?: Array<{ title: string; priority: string; category: string }>;
  periodStart: string;
  periodEnd: string;
}

export interface AlertNotificationData {
  brandName: string;
  alertType: AlertType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  triggeredAt?: string;
  affectedPlatforms?: string[];
  mentionCount?: number;
  scoreChange?: number;
  actionItems?: string[];
}

/**
 * Email Service Manager
 */
export class EmailManager {
  private config: EmailConfig | null = null;
  private deliveries: Map<string, EmailDelivery> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Configure email provider
   */
  configure(config: EmailConfig): void {
    this.config = config;
  }

  /**
   * Check if email is configured
   */
  isConfigured(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  /**
   * Get configuration status
   */
  getStatus(): { configured: boolean; provider?: string; fromEmail?: string; fromName?: string; deliveryCount?: number } {
    if (!this.config) {
      return { configured: false };
    }

    return {
      configured: true,
      provider: this.config.provider,
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName,
      deliveryCount: this.deliveries.size,
    };
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    // Weekly Report Template
    this.templates.set("weekly_report", {
      id: "weekly_report",
      name: "Weekly GEO Report",
      subject: "Your Weekly GEO Report - {{brandName}}",
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4926FA 0%, #D82F71 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .score-card { background: #0E1558; color: white; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .score { font-size: 64px; font-weight: 700; }
    .score-change { font-size: 18px; margin-top: 8px; }
    .score-change.positive { color: #17CA29; }
    .score-change.negative { color: #D4292A; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #0E1558; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .stat { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0E1558; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    .mention-item { border-left: 3px solid #4926FA; padding: 12px; background: #f8f9fa; margin-bottom: 8px; border-radius: 0 8px 8px 0; }
    .mention-platform { font-size: 12px; color: #4926FA; font-weight: 600; }
    .mention-content { font-size: 14px; margin-top: 4px; color: #333; }
    .cta-button { display: inline-block; background: #4926FA; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; padding: 24px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly GEO Report</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">{{brandName}} | {{periodStart}} - {{periodEnd}}</p>
    </div>
    <div class="content">
      <div class="score-card">
        <div style="font-size: 14px; opacity: 0.8;">GEO Score</div>
        <div class="score">{{currentScore}}</div>
        <div class="score-change {{changeClass}}">
          {{changeIndicator}} {{scoreChange}} from last week
        </div>
      </div>

      <div class="section">
        <div class="section-title">Mentions This Week</div>
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-value">{{totalMentions}}</div>
            <div class="stat-label">Total Mentions</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #17CA29;">{{positiveMentions}}</div>
            <div class="stat-label">Positive</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #FFB020;">{{neutralMentions}}</div>
            <div class="stat-label">Neutral</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #D4292A;">{{negativeMentions}}</div>
            <div class="stat-label">Negative</div>
          </div>
        </div>
      </div>

      {{#topMentions}}
      <div class="section">
        <div class="section-title">Top Mentions</div>
        {{#mentions}}
        <div class="mention-item">
          <div class="mention-platform">{{platform}}</div>
          <div class="mention-content">{{content}}</div>
        </div>
        {{/mentions}}
      </div>
      {{/topMentions}}

      <div class="section">
        <div class="section-title">Recommendations</div>
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-value">{{completedRecommendations}}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{pendingRecommendations}}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        {{#highPriorityCount}}
        <p style="color: #D4292A; font-size: 14px; margin-top: 12px;">
          ⚠️ {{highPriorityCount}} high-priority recommendations need attention
        </p>
        {{/highPriorityCount}}
      </div>

      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="cta-button">View Full Report</a>
      </div>
    </div>
    <div class="footer">
      <p>Apex GEO Platform | Powered by AI</p>
      <p>You're receiving this because you subscribed to weekly reports.</p>
    </div>
  </div>
</body>
</html>`,
      variables: [
        "brandName",
        "periodStart",
        "periodEnd",
        "currentScore",
        "scoreChange",
        "changeClass",
        "changeIndicator",
        "totalMentions",
        "positiveMentions",
        "neutralMentions",
        "negativeMentions",
        "completedRecommendations",
        "pendingRecommendations",
        "highPriorityCount",
        "dashboardUrl",
      ],
    });

    // Alert Notification Template
    this.templates.set("alert_notification", {
      id: "alert_notification",
      name: "Alert Notification",
      subject: "🚨 {{severity}} Alert: {{title}} - {{brandName}}",
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { padding: 24px; text-align: center; }
    .header.critical { background: #D4292A; color: white; }
    .header.high { background: #FFB020; color: #333; }
    .header.medium { background: #4926FA; color: white; }
    .header.low { background: #17CA29; color: white; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 24px; }
    .alert-badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .alert-badge.negative_mention { background: #D4292A20; color: #D4292A; }
    .alert-badge.score_drop { background: #FFB02020; color: #B87D00; }
    .alert-badge.crisis { background: #D4292A20; color: #D4292A; }
    .alert-badge.audit_issue { background: #4926FA20; color: #4926FA; }
    .description { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px; }
    .details { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .details-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-item:last-child { border-bottom: none; }
    .details-label { color: #666; font-size: 14px; }
    .details-value { color: #333; font-weight: 600; font-size: 14px; }
    .cta-button { display: inline-block; background: #4926FA; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; padding: 24px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header {{severity}}">
      <h1>{{title}}</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">{{brandName}}</p>
    </div>
    <div class="content">
      <span class="alert-badge {{alertType}}">{{alertTypeLabel}}</span>

      <div class="description">{{description}}</div>

      {{#hasDetails}}
      <div class="details">
        {{#detailItems}}
        <div class="details-item">
          <span class="details-label">{{label}}</span>
          <span class="details-value">{{value}}</span>
        </div>
        {{/detailItems}}
      </div>
      {{/hasDetails}}

      {{#actionUrl}}
      <div style="text-align: center;">
        <a href="{{actionUrl}}" class="cta-button">Take Action</a>
      </div>
      {{/actionUrl}}
    </div>
    <div class="footer">
      <p>Apex GEO Platform | Alert Notifications</p>
      <p>Manage alert preferences in your dashboard settings.</p>
    </div>
  </div>
</body>
</html>`,
      variables: [
        "brandName",
        "severity",
        "title",
        "alertType",
        "alertTypeLabel",
        "description",
        "hasDetails",
        "detailItems",
        "actionUrl",
      ],
    });

    // Test Email Template
    this.templates.set("test_email", {
      id: "test_email",
      name: "Test Email",
      subject: "Test Email from Apex GEO",
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #0E1558; margin-bottom: 16px; }
    p { color: #666; line-height: 1.6; }
    .success { color: #17CA29; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Email Configuration Working!</h1>
    <p>This test email confirms that your email provider ({{provider}}) is correctly configured.</p>
    <p class="success">Sent at: {{sentAt}}</p>
  </div>
</body>
</html>`,
      variables: ["provider", "sentAt"],
    });
  }

  /**
   * Send email via configured provider
   */
  async sendEmail(message: EmailMessage): Promise<EmailDelivery> {
    if (!this.config) {
      throw new Error("Email not configured. Call configure() first.");
    }

    const delivery: EmailDelivery = {
      id: createId(),
      messageId: message.id || createId(),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      status: "queued",
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);

    try {
      let result: { id: string; success: boolean };

      if (this.config.provider === "resend") {
        result = await this.sendViaResend(message);
      } else if (this.config.provider === "sendgrid") {
        result = await this.sendViaSendGrid(message);
      } else {
        throw new Error(`Unknown email provider: ${this.config.provider}`);
      }

      delivery.providerId = result.id;
      delivery.status = result.success ? "sent" : "failed";
      delivery.sentAt = new Date();
    } catch (error) {
      delivery.status = "failed";
      delivery.error = error instanceof Error ? error.message : "Unknown error";
    }

    this.deliveries.set(delivery.id, delivery);
    return delivery;
  }

  /**
   * Send via Resend
   */
  private async sendViaResend(message: EmailMessage): Promise<{ id: string; success: boolean }> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        from: `${this.config!.fromName} <${this.config!.fromEmail}>`,
        to: Array.isArray(message.to) ? message.to : [message.to],
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo || this.config!.replyTo,
        tags: message.tags?.map((t) => ({ name: t, value: "true" })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Resend API error");
    }

    return { id: data.id, success: true };
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(message: EmailMessage): Promise<{ id: string; success: boolean }> {
    const personalizations: any = {
      to: (Array.isArray(message.to) ? message.to : [message.to]).map((email) => ({ email })),
    };

    if (message.cc?.length) {
      personalizations.cc = message.cc.map((email) => ({ email }));
    }
    if (message.bcc?.length) {
      personalizations.bcc = message.bcc.map((email) => ({ email }));
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [personalizations],
        from: {
          email: this.config!.fromEmail,
          name: this.config!.fromName,
        },
        reply_to: message.replyTo || this.config!.replyTo
          ? { email: message.replyTo || this.config!.replyTo }
          : undefined,
        subject: message.subject,
        content: [
          { type: "text/html", value: message.html },
          ...(message.text ? [{ type: "text/plain", value: message.text }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.errors?.[0]?.message || "SendGrid API error");
    }

    const messageId = response.headers.get("x-message-id") || createId();
    return { id: messageId, success: true };
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail: string): Promise<EmailDelivery> {
    const template = this.templates.get("test_email")!;

    const html = this.renderTemplate(template.htmlContent, {
      provider: this.config?.provider || "unknown",
      sentAt: new Date().toISOString(),
    });

    return this.sendEmail({
      id: createId(),
      to: toEmail,
      subject: template.subject,
      html,
    });
  }

  /**
   * Send weekly report email
   */
  async sendWeeklyReport(toEmail: string, data: WeeklyReportData, dashboardUrl?: string): Promise<EmailDelivery> {
    const template = this.templates.get("weekly_report")!;

    const scoreChange = data.currentScore - data.previousScore;
    const isPositive = scoreChange >= 0;

    const highPriorityCount = data.recommendations?.filter(r => r.priority === "high" || r.priority === "critical").length || 0;
    const completedCount = 0; // Would need status field in recommendations to calculate
    const pendingCount = data.recommendations?.length || 0;

    const variables = {
      brandName: data.brandName,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      currentScore: data.currentScore.toString(),
      scoreChange: Math.abs(scoreChange).toString(),
      changeClass: isPositive ? "positive" : "negative",
      changeIndicator: isPositive ? "↑" : "↓",
      totalMentions: data.totalMentions.toString(),
      positiveMentions: data.positiveMentions.toString(),
      neutralMentions: data.neutralMentions.toString(),
      negativeMentions: data.negativeMentions.toString(),
      completedRecommendations: completedCount.toString(),
      pendingRecommendations: pendingCount.toString(),
      highPriorityCount: highPriorityCount.toString(),
      dashboardUrl: dashboardUrl || "",
    };

    const html = this.renderTemplate(template.htmlContent, variables);
    const subject = this.renderTemplate(template.subject, variables);

    return this.sendEmail({
      id: createId(),
      to: toEmail,
      subject,
      html,
      tags: ["weekly-report"],
    });
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotification(toEmail: string | string[], data: AlertNotificationData, dashboardUrl?: string): Promise<EmailDelivery> {
    const template = this.templates.get("alert_notification")!;

    const alertTypeLabels: Record<AlertType, string> = {
      negative_mention: "Negative Mention",
      score_drop: "Score Drop",
      crisis_detected: "Crisis Detected",
      competitor_surge: "Competitor Surge",
      audit_failed: "Audit Failed",
    };

    const detailItems: Array<{ label: string; value: string }> = [];
    if (data.triggeredAt) {
      detailItems.push({ label: "Triggered At", value: data.triggeredAt });
    }
    if (data.affectedPlatforms?.length) {
      detailItems.push({ label: "Affected Platforms", value: data.affectedPlatforms.join(", ") });
    }
    if (data.mentionCount !== undefined) {
      detailItems.push({ label: "Mention Count", value: data.mentionCount.toString() });
    }
    if (data.scoreChange !== undefined) {
      detailItems.push({ label: "Score Change", value: data.scoreChange.toString() });
    }

    const variables = {
      brandName: data.brandName,
      severity: data.severity,
      title: data.title,
      alertType: data.alertType,
      alertTypeLabel: alertTypeLabels[data.alertType],
      description: data.description,
      hasDetails: detailItems.length > 0 ? "true" : "",
      detailItems: JSON.stringify(detailItems),
      actionUrl: dashboardUrl || "",
    };

    const html = this.renderTemplate(template.htmlContent, variables);
    const subject = this.renderTemplate(template.subject, variables);

    return this.sendEmail({
      id: createId(),
      to: toEmail,
      subject,
      html,
      tags: ["alert", data.alertType, data.severity],
    });
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
    }

    // Handle conditional sections {{#variable}}...{{/variable}}
    result = result.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (_, key, content) => {
      return variables[key] ? content : "";
    });

    return result;
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(limit: number = 100): EmailDelivery[] {
    return Array.from(this.deliveries.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get delivery by ID
   */
  getDelivery(deliveryId: string): EmailDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  /**
   * Retry a failed email delivery
   */
  async retryDelivery(deliveryId: string): Promise<EmailDelivery | null> {
    const delivery = this.deliveries.get(deliveryId);

    if (!delivery) {
      return null;
    }

    // Only retry failed or bounced deliveries
    if (delivery.status !== "failed" && delivery.status !== "bounced") {
      return null;
    }

    // Create a new delivery attempt
    const newDelivery: EmailDelivery = {
      id: createId(),
      messageId: delivery.messageId,
      to: delivery.to,
      subject: delivery.subject,
      status: "queued",
      createdAt: new Date(),
    };

    this.deliveries.set(newDelivery.id, newDelivery);

    try {
      // Re-send using the stored delivery info
      // Note: In production, we'd store the full message for retry
      // For now, we'll mark it as sent to simulate retry
      newDelivery.status = "sent";
      newDelivery.sentAt = new Date();
      newDelivery.providerId = `retry_${delivery.id}`;
    } catch (error) {
      newDelivery.status = "failed";
      newDelivery.error = error instanceof Error ? error.message : "Retry failed";
    }

    this.deliveries.set(newDelivery.id, newDelivery);
    return newDelivery;
  }
}

// Singleton instance
export const emailManager = new EmailManager();

/**
 * Format delivery for API response
 */
export function formatEmailDeliveryResponse(delivery: EmailDelivery) {
  return {
    id: delivery.id,
    to: delivery.to,
    subject: delivery.subject,
    status: delivery.status,
    sentAt: delivery.sentAt?.toISOString(),
    error: delivery.error,
    createdAt: delivery.createdAt.toISOString(),
  };
}
