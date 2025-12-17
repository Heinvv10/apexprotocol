/**
 * Admin API Configuration Management - Dynamic ID Routes
 * GET /api/admin/api-config/:id - Get integration details
 * PATCH /api/admin/api-config/:id - Update integration
 * DELETE /api/admin/api-config/:id - Delete integration
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

// Helper function to mask API key (show only last 4 characters)
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return "****";
  }
  return "****-****-" + apiKey.slice(-4);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    }

    // FR-5: Get integration details
    const [integration] = await db
      .select()
      .from(apiIntegrations)
      .where(eq(apiIntegrations.id, params.id))
      .limit(1);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // AC-5.2: Mask API key except last 4 characters
    const maskedIntegration = {
      ...integration,
      config: {
        ...integration.config,
        apiKey: integration.config.apiKey
          ? maskApiKey(integration.config.apiKey)
          : undefined,
      },
    };

    return NextResponse.json({
      success: true,
      integration: maskedIntegration,
    });
  } catch (error) {
    console.error("Admin api-config GET (by ID) error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    let currentUserId = "dev-super-admin";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      currentUserId = userId;

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { config, isEnabled } = body;

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: currentUserId,
    };

    // FR-2: Update configuration
    if (config) {
      updateData.config = config;
      // TODO: Encrypt API key before storage in production
    }

    // FR-4: Enable/Disable integration
    if (typeof isEnabled === "boolean") {
      updateData.isEnabled = isEnabled;

      // AC-4.2: Set status to disabled when isEnabled = false
      if (!isEnabled) {
        updateData.status = "disabled";
      } else {
        // If re-enabling, set status back to configured (if it has config)
        updateData.status = "configured";
      }
    }

    // Update integration
    const [updated] = await db
      .update(apiIntegrations)
      .set(updateData)
      .where(eq(apiIntegrations.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      integration: updated,
    });
  } catch (error) {
    console.error("Admin api-config PATCH error:", error);
    return NextResponse.json(
      {
        error: "Failed to update integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    }

    // FR-6: Delete integration
    const [deleted] = await db
      .delete(apiIntegrations)
      .where(eq(apiIntegrations.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // SR-4: Audit logging would go here in production

    return NextResponse.json({
      success: true,
      message: "Integration deleted successfully",
    });
  } catch (error) {
    console.error("Admin api-config DELETE error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
