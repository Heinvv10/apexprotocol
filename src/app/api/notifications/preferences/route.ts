import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
import {
  getOrCreatePreferences,
  updatePreferences,
} from "@/lib/notifications/service";

// Validation schema for updating preferences
const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailDigestFrequency: z.enum(["none", "daily", "weekly"]).optional(),
  emailAddress: z.string().email().optional().nullable(),
  inAppEnabled: z.boolean().optional(),
  mentionNotifications: z.boolean().optional(),
  scoreChangeNotifications: z.boolean().optional(),
  recommendationNotifications: z.boolean().optional(),
  importantNotifications: z.boolean().optional(),
  timezone: z.string().optional(),
  digestHour: z.number().int().min(0).max(23).optional(),
});

/**
 * GET /api/notifications/preferences
 * Returns notification preferences for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    // Get or create preferences for the user
    const preferences = await getOrCreatePreferences(userId, orgId);

    return NextResponse.json({
      success: true,
      data: preferences,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Updates notification preferences for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePreferencesSchema.parse(body);

    // Ensure preferences exist before updating
    await getOrCreatePreferences(userId, orgId);

    // Update preferences
    const updatedPreferences = await updatePreferences(userId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
