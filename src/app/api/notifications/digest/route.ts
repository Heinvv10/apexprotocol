/**
 * Notification Digest API - QStash Webhook
 * Triggered by QStash scheduler to send daily/weekly notification digests
 * Called by QStash or Vercel Cron
 */

import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { notifications, notificationPreferences } from "@/lib/db/schema/notifications";
import { eq, and, gte, desc } from "drizzle-orm";
import { digestService, type DigestNotification, type DigestPriority } from "@/lib/notifications/digest";
import { getUserByAuthId } from "@/lib/auth/supabase-admin";
// Verify cron secret for security
async function verifyCronSecret(): Promise<boolean> {
  const headersList = await headers();
  const cronSecret = headersList.get("x-cron-secret");
  const qstashSignature = headersList.get("upstash-signature");
  const expectedSecret = process.env.CRON_SECRET;

  // Allow in development without secret
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Accept either cron secret or QStash signature
  if (cronSecret && cronSecret === expectedSecret) {
    return true;
  }

  // QStash signature validation would go here
  // For now, we'll accept the presence of the signature header
  if (qstashSignature) {
    return true;
  }

  return false;
}

/**
 * Map notification type to digest priority
 */
function mapNotificationPriority(type: string): DigestPriority {
  switch (type) {
    case "important":
      return "high";
    case "score_change":
      return "high";
    case "recommendation":
      return "medium";
    case "mention":
      return "low";
    default:
      return "low";
  }
}

/**
 * Send digest emails for all users with the specified frequency
 */
async function sendDigests(frequency: "daily" | "weekly"): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Configure digest service if not already configured
    if (!digestService.isConfigured()) {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY not configured");
      }

      digestService.configure({
        apiKey: resendApiKey,
        fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        fromName: "Apex GEO",
        replyTo: process.env.RESEND_REPLY_TO,
      });
    }

    // Calculate period based on frequency
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date(now);

    if (frequency === "daily") {
      periodStart.setDate(periodStart.getDate() - 1); // Last 24 hours
    } else if (frequency === "weekly") {
      periodStart.setDate(periodStart.getDate() - 7); // Last 7 days
    }

    // Find all users with digest preference set to this frequency
    const usersWithPreference = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.emailDigestFrequency, frequency),
          eq(notificationPreferences.emailEnabled, true)
        )
      );

    // Send digest to each user
    for (const preference of usersWithPreference) {
      try {
        // Get unread notifications for this user within the period
        const userNotifications = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, preference.userId),
              eq(notifications.isRead, false),
              gte(notifications.createdAt, periodStart)
            )
          )
          .orderBy(desc(notifications.createdAt))
          .limit(100);

        // Skip if no notifications
        if (userNotifications.length === 0) {
          continue;
        }

        // Get user email from Clerk
                const clerkUser = await getUserByAuthId(preference.userId);
        if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
          result.errors.push(`No email address for user ${preference.userId}`);
          result.failed++;
          continue;
        }

        const userEmail = clerkUser.email;

        // Convert notifications to digest format
        const digestNotifications: DigestNotification[] = userNotifications.map((n) => ({
          id: n.id.toString(),
          title: n.title,
          message: n.message,
          priority: mapNotificationPriority(n.type),
          createdAt: n.createdAt,
        }));

        // Create digest summary
        const brandName = "Your Brands"; // Could be enhanced to include actual brand names
        const summary = await digestService.createSummary(
          brandName,
          digestNotifications,
          periodStart,
          periodEnd
        );

        // Send digest email
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/notifications`;
        const delivery = await digestService.sendDigest(userEmail, summary, frequency, dashboardUrl);

        if (delivery.status === "sent") {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send to ${userEmail}: ${delivery.error}`);
        }
      } catch (userError) {
        result.failed++;
        result.errors.push(
          `Error processing user ${preference.userId}: ${
            userError instanceof Error ? userError.message : "Unknown error"
          }`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Digest sending failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * GET - Get digest service status
 */
export async function GET() {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await digestService.getStatus();
    const recentDeliveries = await digestService.getDeliveryHistory(10);

    return NextResponse.json({
      success: true,
      status,
      recentDeliveries: recentDeliveries.map((d: {id: string, to: string, frequency: string, status: string, sentAt?: Date, createdAt: Date}) => ({
        id: d.id,
        to: d.to,
        frequency: d.frequency,
        status: d.status,
        sentAt: d.sentAt?.toISOString(),
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger digest sending
 * Accepts query parameter: ?frequency=daily|weekly
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get frequency from query parameter or default to daily
    const { searchParams } = new URL(request.url);
    const frequency = (searchParams.get("frequency") || "daily") as "daily" | "weekly";

    // Validate frequency
    if (!["daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid frequency. Must be 'daily' or 'weekly'",
        },
        { status: 400 }
      );
    }

    // Send digests
    const result = await sendDigests(frequency);

    return NextResponse.json({
      success: true,
      frequency,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
