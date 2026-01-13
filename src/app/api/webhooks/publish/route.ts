import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  contentItems,
  contentSchedules,
  publishingHistory,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Check if QStash is configured
const isQStashConfigured = () => {
  return !!process.env.QSTASH_CURRENT_SIGNING_KEY && !!process.env.QSTASH_NEXT_SIGNING_KEY;
};

// Validation schema for webhook payload
const webhookPayloadSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  platform: z.enum(["wordpress", "medium"]).catch("wordpress"),
  scheduledAt: z.string().optional(), // ISO timestamp from QStash for logging
});

/**
 * POST /api/webhooks/publish
 * QStash webhook handler for scheduled publishing
 * This endpoint is called by QStash at the scheduled time to publish content
 */
export async function POST(request: NextRequest) {
  try {
    // Verify QStash configuration
    if (!isQStashConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "QStash is not configured. Set QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY environment variables.",
        },
        { status: 503 }
      );
    }

    // Verify QStash signature
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    // Get the request body as text for signature verification
    const body = await request.text();

    // Get signature from headers
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing QStash signature" },
        { status: 401 }
      );
    }

    // Verify the signature
    try {
      await receiver.verify({
        signature,
        body,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { success: false, error: `QStash signature verification failed: ${message}` },
        { status: 401 }
      );
    }

    // Parse and validate the payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validatedData = webhookPayloadSchema.parse(payload);
    const { contentId, platform } = validatedData;

    // Database is required
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "postgresql://placeholder") {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    // Fetch the content from database
    const content = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId))
      .limit(1);

    if (content.length === 0) {
      return NextResponse.json(
        { success: false, error: `Content not found: ${contentId}` },
        { status: 404 }
      );
    }

    const contentItem = content[0];

    // Verify content is in scheduled state
    if (contentItem.status !== "scheduled") {
      return NextResponse.json(
        {
          success: false,
          error: `Content is not in scheduled state. Current status: ${contentItem.status}`,
        },
        { status: 400 }
      );
    }

    // Publish to the specified platform
    let externalId = "";
    let externalUrl = "";
    let publishError: string | null = null;

    try {
      if (platform === "wordpress") {
        // Check if WordPress is configured
        if (!process.env.WORDPRESS_URL || !process.env.WORDPRESS_USERNAME || !process.env.WORDPRESS_APP_PASSWORD) {
          throw new Error("WordPress is not configured. Set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD environment variables.");
        }

        // WordPress publishing will be implemented in Phase 4
        // For now, we'll create a stub that throws a clear error
        // When WordPress integration is complete, replace this with:
        // const { publishToWordPress } = await import("@/lib/publishing/wordpress");
        // const result = await publishToWordPress({ title: contentItem.title, body: contentItem.body });

        // Temporary stub - will be replaced when WordPress integration is implemented
        throw new Error("WordPress publishing not yet implemented. This will be available in Phase 4.");
      } else if (platform === "medium") {
        // Check if Medium is configured
        if (!process.env.MEDIUM_API_TOKEN) {
          throw new Error("Medium is not configured. Set MEDIUM_API_TOKEN environment variable.");
        }

        // Medium publishing will be implemented in Phase 6 (optional)
        // For now, we'll create a stub that throws a clear error
        // When Medium integration is complete, replace this with:
        // const { publishToMedium } = await import("@/lib/publishing/medium");
        // const result = await publishToMedium({ title: contentItem.title, body: contentItem.body });

        // Temporary stub - will be replaced when Medium integration is implemented
        throw new Error("Medium publishing not yet implemented. This will be available in Phase 6.");
      }
    } catch (error) {
      publishError = error instanceof Error ? error.message : "Unknown publishing error";

      // Record failed publishing attempt
      await db.insert(publishingHistory).values({
        contentId,
        platform,
        externalId: "",
        externalUrl: "",
        publishedAt: new Date(),
        status: "failed",
        errorMessage: publishError,
        metadata: {
          attemptedAt: new Date().toISOString(),
          error: publishError,
        },
      });

      // Update schedule status to failed
      await db
        .update(contentSchedules)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(contentSchedules.contentId, contentId));

      return NextResponse.json(
        {
          success: false,
          error: `Publishing failed: ${publishError}`,
          contentId,
          platform,
        },
        { status: 500 }
      );
    }

    // Update content status to published
    await db
      .update(contentItems)
      .set({
        status: "published",
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, contentId));

    // Record successful publishing history
    await db.insert(publishingHistory).values({
      contentId,
      platform,
      externalId,
      externalUrl,
      publishedAt: new Date(),
      status: "success",
      errorMessage: null,
      metadata: {
        publishedAt: new Date().toISOString(),
        scheduledAt: validatedData.scheduledAt,
      },
    });

    // Update schedule status to completed
    await db
      .update(contentSchedules)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(contentSchedules.contentId, contentId));

    return NextResponse.json({
      success: true,
      data: {
        contentId,
        platform,
        status: "published",
        externalId,
        externalUrl,
        publishedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues },
        { status: 400 }
      );
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
