/**
 * Admin API Configuration Management - Dynamic ID Routes
 * GET /api/admin/api-config/:id - Get integration details
 * PATCH /api/admin/api-config/:id - Update integration
 * DELETE /api/admin/api-config/:id - Delete integration
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";

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
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

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

      actorId = userId;

      // Get actor details from Clerk
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        actorName = user.fullName || user.firstName || null;
        actorEmail = user.emailAddresses[0]?.emailAddress || null;
      } catch (error) {
        // Continue without actor details if Clerk fails
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    } else {
      // Dev mode actor details
      actorId = "dev-super-admin";
      actorName = "Dev Super Admin";
      actorEmail = "dev@localhost";
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

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "view_api_integration",
        actionType: "access",
        description: `Super-admin viewed API integration ${integration.serviceName}`,
        targetType: "api_integration",
        targetId: params.id,
        targetName: integration.serviceName,
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      integration: maskedIntegration,
    });
  } catch (error) {
    console.error("Admin api-config GET (by ID) error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "view_api_integration",
        actionType: "access",
        description: "Failed to view API integration",
        targetType: "api_integration",
        targetId: params.id,
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

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
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

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
      actorId = userId;

      // Get actor details from Clerk
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        actorName = user.fullName || user.firstName || null;
        actorEmail = user.emailAddresses[0]?.emailAddress || null;
      } catch (error) {
        // Continue without actor details if Clerk fails
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    } else {
      // Dev mode actor details
      actorId = "dev-super-admin";
      actorName = "Dev Super Admin";
      actorEmail = "dev@localhost";
    }

    const body = await request.json();
    const { config, isEnabled } = body;

    // Get current integration state for audit logging
    const [targetIntegration] = await db
      .select()
      .from(apiIntegrations)
      .where(eq(apiIntegrations.id, params.id))
      .limit(1);

    if (!targetIntegration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

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

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_api_integration",
        actionType: "update",
        description: `Super-admin updated API integration ${targetIntegration.serviceName}`,
        targetType: "api_integration",
        targetId: params.id,
        targetName: targetIntegration.serviceName,
        changes: {
          before: {
            status: targetIntegration.status,
            isEnabled: targetIntegration.isEnabled,
            config: targetIntegration.config,
          },
          after: {
            status: updated.status,
            isEnabled: updated.isEnabled,
            config: updated.config,
          },
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      integration: updated,
    });
  } catch (error) {
    console.error("Admin api-config PATCH error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_api_integration",
        actionType: "update",
        description: "Failed to update API integration",
        targetType: "api_integration",
        targetId: params.id,
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

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
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

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

      actorId = userId;

      // Get actor details from Clerk
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        actorName = user.fullName || user.firstName || null;
        actorEmail = user.emailAddresses[0]?.emailAddress || null;
      } catch (error) {
        // Continue without actor details if Clerk fails
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    } else {
      // Dev mode actor details
      actorId = "dev-super-admin";
      actorName = "Dev Super Admin";
      actorEmail = "dev@localhost";
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

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "delete_api_integration",
        actionType: "delete",
        description: `Super-admin deleted API integration ${deleted.serviceName}`,
        targetType: "api_integration",
        targetId: params.id,
        targetName: deleted.serviceName,
        changes: {
          before: {
            serviceName: deleted.serviceName,
            provider: deleted.provider,
            category: deleted.category,
            status: deleted.status,
            isEnabled: deleted.isEnabled,
          },
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: "Integration deleted successfully",
    });
  } catch (error) {
    console.error("Admin api-config DELETE error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "delete_api_integration",
        actionType: "delete",
        description: "Failed to delete API integration",
        targetType: "api_integration",
        targetId: params.id,
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to delete integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
