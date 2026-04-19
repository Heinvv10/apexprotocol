import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Admin API Configuration Management - Dynamic ID Routes
 * GET /api/admin/api-config/:id - Get integration details
 * PATCH /api/admin/api-config/:id - Update integration
 * DELETE /api/admin/api-config/:id - Delete integration
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";
import { encryptConfigApiKey, maskConfigApiKey } from "@/lib/security";
import { getUserByAuthId } from "@/lib/auth/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      actorId = userId;

      // Get actor details from Clerk
      try {
                const user = await getUserByAuthId(userId);
        actorName = user.name || user.name || null;
        actorEmail = user.email || null;
      } catch (_error) {
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
      .where(eq(apiIntegrations.id, id))
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
      config: integration.config ? maskConfigApiKey(integration.config) : null,
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
        targetId: id,
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
        targetId: id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    let currentUserId = "dev-super-admin";

    if (!devSuperAdmin) {
      const userId = await getUserId();

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
                const user = await getUserByAuthId(userId);
        actorName = user.name || user.name || null;
        actorEmail = user.email || null;
      } catch (_error) {
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
      .where(eq(apiIntegrations.id, id))
      .limit(1);

    if (!targetIntegration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: currentUserId,
    };

    // FR-2: Update configuration with encrypted API key
    if (config) {
      // Encrypt API key before storage
      updateData.config = config.apiKey ? encryptConfigApiKey(config) : config;
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
      .where(eq(apiIntegrations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Create success audit log (mask API keys in audit log)
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_api_integration",
        actionType: "update",
        description: `Super-admin updated API integration ${targetIntegration.serviceName}`,
        targetType: "api_integration",
        targetId: id,
        targetName: targetIntegration.serviceName,
        changes: {
          before: {
            status: targetIntegration.status,
            isEnabled: targetIntegration.isEnabled,
            config: targetIntegration.config ? maskConfigApiKey(targetIntegration.config) : null,
          },
          after: {
            status: updated.status,
            isEnabled: updated.isEnabled,
            config: updated.config ? maskConfigApiKey(updated.config) : null,
          },
        },
        status: "success",
      },
      request
    );

    // Return with masked API key
    return NextResponse.json({
      success: true,
      integration: {
        ...updated,
        config: updated.config ? maskConfigApiKey(updated.config) : null,
      },
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
        targetId: id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      actorId = userId;

      // Get actor details from Clerk
      try {
                const user = await getUserByAuthId(userId);
        actorName = user.name || user.name || null;
        actorEmail = user.email || null;
      } catch (_error) {
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
      .where(eq(apiIntegrations.id, id))
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
        targetId: id,
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
        targetId: id,
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
