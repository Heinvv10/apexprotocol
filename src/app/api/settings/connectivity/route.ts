/**
 * Connectivity Settings API
 * GET /api/settings/connectivity - Get user's connectivity preferences
 * PATCH /api/settings/connectivity - Update user's connectivity preferences
 *
 * Manages loadshedding mode, low-bandwidth mode, and auto-detect settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { UserPreferences } from "@/lib/db/schema/users";

// Validation schema for connectivity settings
const connectivitySettingsSchema = z.object({
  loadsheddingMode: z.boolean().optional(),
  lowBandwidthMode: z.boolean().optional(),
  autoDetectConnection: z.boolean().optional(),
});

export type ConnectivitySettings = z.infer<typeof connectivitySettingsSchema>;

// GET - Retrieve current connectivity settings
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by Clerk ID
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      // Return defaults if user not found
      return NextResponse.json({
        success: true,
        data: {
          loadsheddingMode: false,
          lowBandwidthMode: false,
          autoDetectConnection: true,
        },
      });
    }

    const preferences = user.preferences as UserPreferences | null;

    return NextResponse.json({
      success: true,
      data: {
        loadsheddingMode: preferences?.loadsheddingMode ?? false,
        lowBandwidthMode: preferences?.lowBandwidthMode ?? false,
        autoDetectConnection: preferences?.autoDetectConnection ?? true,
      },
    });
  } catch (error) {
    console.error("Error fetching connectivity settings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch connectivity settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update connectivity settings
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = connectivitySettingsSchema.parse(body);

    // Find user by Clerk ID
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Merge with existing preferences
    const currentPreferences = (user.preferences as UserPreferences) || {
      theme: "dark",
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      mentionAlerts: true,
      auditAlerts: true,
    };

    const updatedPreferences: UserPreferences = {
      ...currentPreferences,
      loadsheddingMode: validatedData.loadsheddingMode ?? currentPreferences.loadsheddingMode,
      lowBandwidthMode: validatedData.lowBandwidthMode ?? currentPreferences.lowBandwidthMode,
      autoDetectConnection: validatedData.autoDetectConnection ?? currentPreferences.autoDetectConnection,
    };

    // Update user preferences
    await db
      .update(users)
      .set({
        preferences: updatedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      data: {
        loadsheddingMode: updatedPreferences.loadsheddingMode ?? false,
        lowBandwidthMode: updatedPreferences.lowBandwidthMode ?? false,
        autoDetectConnection: updatedPreferences.autoDetectConnection ?? true,
      },
      message: "Connectivity settings updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating connectivity settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update connectivity settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
