import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Validation schema for WordPress publishing request
const publishWordPressSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  status: z.enum(["publish", "draft"]).optional().default("publish"),
  excerpt: z.string().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featuredMedia: z.number().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/publishing/wordpress
 * Publish content to WordPress site
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Database is required
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Database not configured. Please set DATABASE_URL." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = publishWordPressSchema.parse(body);

    // Dynamic imports for database operations
    const { db } = await import("@/lib/db");
    const { contentItems, publishingHistory } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Fetch content from database
    const content = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.id, validatedData.contentId),
          eq(contentItems.organizationId, orgId)
        )
      )
      .limit(1);

    if (content.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    const contentItem = content[0];

    // Check if WordPress is configured
    const { isWordPressConfigured, publishToWordPress } = await import(
      "@/lib/publishing/wordpress"
    );

    if (!isWordPressConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WordPress is not configured. Please set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD environment variables.",
        },
        { status: 503 }
      );
    }

    // Publish to WordPress
    try {
      const publishResult = await publishToWordPress({
        title: contentItem.title,
        body: contentItem.body,
        status: validatedData.status,
        excerpt: validatedData.excerpt,
        categories: validatedData.categories,
        tags: validatedData.tags,
        featuredMedia: validatedData.featuredMedia,
        meta: validatedData.meta,
      });

      // Record in publishing history
      const now = new Date();
      await db.insert(publishingHistory).values({
        contentId: contentItem.id,
        platform: "wordpress",
        externalId: publishResult.postId.toString(),
        externalUrl: publishResult.postUrl,
        publishedAt: now,
        status: "success",
        metadata: {
          wordpressResponse: publishResult.response,
          publishedStatus: validatedData.status,
        },
      });

      // Update content status to published (only if publishing, not drafting)
      if (validatedData.status === "publish") {
        await db
          .update(contentItems)
          .set({
            status: "published",
            updatedAt: now,
          })
          .where(eq(contentItems.id, contentItem.id));
      }

      return NextResponse.json({
        success: true,
        data: {
          postId: publishResult.postId,
          postUrl: publishResult.postUrl,
          platform: "wordpress",
          publishedAt: now.toISOString(),
          contentId: contentItem.id,
        },
      });
    } catch (publishError) {
      // Record failed publishing attempt
      await db.insert(publishingHistory).values({
        contentId: contentItem.id,
        platform: "wordpress",
        externalId: "",
        externalUrl: "",
        publishedAt: new Date(),
        status: "failed",
        errorMessage:
          publishError instanceof Error
            ? publishError.message
            : "Unknown publishing error",
        metadata: {
          error: publishError instanceof Error ? publishError.message : String(publishError),
        },
      });

      // Handle specific WordPress errors
      if (
        publishError instanceof Error &&
        publishError.message.includes("authentication failed")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: publishError.message,
            hint: "Please verify your WordPress Application Password is correct and has sufficient permissions.",
          },
          { status: 401 }
        );
      }

      if (
        publishError instanceof Error &&
        publishError.message.includes("Failed to connect")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: publishError.message,
            hint: "Please verify the WordPress URL is correct and accessible.",
          },
          { status: 503 }
        );
      }

      // Generic publishing error
      return NextResponse.json(
        {
          success: false,
          error: publishError instanceof Error ? publishError.message : "Failed to publish to WordPress",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    // Generic error handler
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
