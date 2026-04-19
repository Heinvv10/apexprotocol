import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * User API Keys Management API - Individual Key Operations
 * GET /api/user/api-keys/[id] - Get single API key metadata (never the actual key)
 * PATCH /api/user/api-keys/[id] - Update API key name/displayName only
 * DELETE /api/user/api-keys/[id] - Revoke API key (soft-delete)
 * Requires user authentication
 * Users can only manage their own keys
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit-logger";
import { maskApiKey } from "@/lib/crypto/key-generation";
import { getUserByAuthId } from "@/lib/auth/supabase-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Helper to get and validate actor for user operations
 * Returns null if not authorized, otherwise returns actor details
 */
async function getAuthorizedUser(): Promise<{
  userId: string;
  organizationId: string;
  actorName: string | null;
  actorEmail: string | null;
  authorized: true;
} | {
  authorized: false;
  errorResponse: NextResponse;
}> {
  const userId = await getUserId();
    const orgId = await getOrganizationId();

  if (!userId) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!orgId) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Organization context required. Please select an organization." },
        { status: 400 }
      ),
    };
  }

  // Get actor details from Clerk
  let actorName: string | null = null;
  let actorEmail: string | null = null;
  try {
        const user = await getUserByAuthId(userId);
    actorName = user.name || user.name || null;
    actorEmail = user.email || null;
  } catch (_error) {
    // Continue without actor details if Clerk fails
  }

  return {
    authorized: true,
    userId,
    organizationId: orgId,
    actorName,
    actorEmail,
  };
}

/**
 * GET /api/user/api-keys/[id]
 * Get a single user API key by ID
 * Returns metadata only - never the actual key value
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    const { id } = await params;

    // Check authorization
    const authResult = await getAuthorizedUser();
    if (!authResult.authorized) {
      return authResult.errorResponse;
    }
    actorId = authResult.userId;
    actorName = authResult.actorName;
    actorEmail = authResult.actorEmail;

    // Find the API key (only user's own keys)
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, authResult.userId),
          eq(apiKeys.organizationId, authResult.organizationId),
          eq(apiKeys.type, "user")
        )
      )
      .limit(1);

    if (!key) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "get_user_api_key",
          actionType: "access",
          description: `User attempted to access non-existent or unauthorized API key: ${id}`,
          targetType: "api_key",
          targetId: id,
          status: "failure",
          errorMessage: "API key not found",
        },
        request
      );

      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "get_user_api_key",
        actionType: "access",
        description: `User accessed API key: ${key.name}`,
        targetType: "api_key",
        targetId: key.id,
        targetName: key.name,
        metadata: {
          organizationId: authResult.organizationId,
        },
        status: "success",
      },
      request
    );

    // Return key metadata (never the actual key value)
    return NextResponse.json({
      success: true,
      apiKey: {
        id: key.id,
        name: key.name,
        displayName: key.displayName,
        version: key.version,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        lastRotatedAt: key.lastRotatedAt,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        maskedKey: maskApiKey(key.keyHash),
      },
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "get_user_api_key",
        actionType: "access",
        description: "Failed to get user API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to get API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/api-keys/[id]
 * Update a user API key's name or displayName
 * Does NOT allow updating the actual key value - use regeneration instead
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    const { id } = await params;

    // Check authorization
    const authResult = await getAuthorizedUser();
    if (!authResult.authorized) {
      return authResult.errorResponse;
    }
    actorId = authResult.userId;
    actorName = authResult.actorName;
    actorEmail = authResult.actorEmail;

    // Find the API key (only user's own keys)
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, authResult.userId),
          eq(apiKeys.organizationId, authResult.organizationId),
          eq(apiKeys.type, "user")
        )
      )
      .limit(1);

    if (!existingKey) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "update_user_api_key",
          actionType: "update",
          description: `User attempted to update non-existent or unauthorized API key: ${id}`,
          targetType: "api_key",
          targetId: id,
          status: "failure",
          errorMessage: "API key not found",
        },
        request
      );

      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, displayName } = body;

    // Build update data - only allow name and displayName updates
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Track changes for audit log
    const changesBefore: Record<string, unknown> = {};
    const changesAfter: Record<string, unknown> = {};

    // Update name
    if (name !== undefined && name !== existingKey.name) {
      if (!name || typeof name !== "string") {
        return NextResponse.json(
          { error: "name must be a non-empty string" },
          { status: 400 }
        );
      }
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: "name cannot be empty" },
          { status: 400 }
        );
      }
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { error: "name must be 100 characters or less" },
          { status: 400 }
        );
      }
      changesBefore.name = existingKey.name;
      changesAfter.name = trimmedName;
      updateData.name = trimmedName;
    }

    // Update displayName
    if (displayName !== undefined && displayName !== existingKey.displayName) {
      if (displayName !== null && typeof displayName !== "string") {
        return NextResponse.json(
          { error: "displayName must be a string or null" },
          { status: 400 }
        );
      }
      const trimmedDisplayName = displayName?.trim() || null;
      if (trimmedDisplayName && trimmedDisplayName.length > 200) {
        return NextResponse.json(
          { error: "displayName must be 200 characters or less" },
          { status: 400 }
        );
      }
      changesBefore.displayName = existingKey.displayName;
      changesAfter.displayName = trimmedDisplayName;
      updateData.displayName = trimmedDisplayName;
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 1) {
      // Only updatedAt was set, no actual changes
      return NextResponse.json({
        success: true,
        message: "No changes to apply",
        apiKey: {
          id: existingKey.id,
          name: existingKey.name,
          displayName: existingKey.displayName,
          version: existingKey.version,
          isActive: existingKey.isActive,
          lastUsedAt: existingKey.lastUsedAt,
          lastRotatedAt: existingKey.lastRotatedAt,
          expiresAt: existingKey.expiresAt,
          createdAt: existingKey.createdAt,
          updatedAt: existingKey.updatedAt,
          maskedKey: maskApiKey(existingKey.keyHash),
        },
      });
    }

    // Apply the update
    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(eq(apiKeys.id, id))
      .returning();

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_user_api_key",
        actionType: "update",
        description: `User updated API key: ${updatedKey.name}`,
        targetType: "api_key",
        targetId: updatedKey.id,
        targetName: updatedKey.name,
        changes: {
          before: changesBefore,
          after: changesAfter,
        },
        metadata: {
          organizationId: authResult.organizationId,
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        displayName: updatedKey.displayName,
        version: updatedKey.version,
        isActive: updatedKey.isActive,
        lastUsedAt: updatedKey.lastUsedAt,
        lastRotatedAt: updatedKey.lastRotatedAt,
        expiresAt: updatedKey.expiresAt,
        createdAt: updatedKey.createdAt,
        updatedAt: updatedKey.updatedAt,
        maskedKey: maskApiKey(updatedKey.keyHash),
      },
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_user_api_key",
        actionType: "update",
        description: "Failed to update user API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to update API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/api-keys/[id]
 * Revoke a user API key (soft-delete)
 * Sets isActive to false rather than actually deleting
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    const { id } = await params;

    // Check authorization
    const authResult = await getAuthorizedUser();
    if (!authResult.authorized) {
      return authResult.errorResponse;
    }
    actorId = authResult.userId;
    actorName = authResult.actorName;
    actorEmail = authResult.actorEmail;

    // Find the API key (only user's own keys)
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, authResult.userId),
          eq(apiKeys.organizationId, authResult.organizationId),
          eq(apiKeys.type, "user")
        )
      )
      .limit(1);

    if (!existingKey) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "revoke_user_api_key",
          actionType: "delete",
          description: `User attempted to revoke non-existent or unauthorized API key: ${id}`,
          targetType: "api_key",
          targetId: id,
          status: "failure",
          errorMessage: "API key not found",
        },
        request
      );

      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // Check if key is already revoked
    if (!existingKey.isActive) {
      return NextResponse.json(
        { error: "API key is already revoked" },
        { status: 400 }
      );
    }

    // Soft delete - set isActive to false (revoke)
    const [revokedKey] = await db
      .update(apiKeys)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, id))
      .returning();

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "revoke_user_api_key",
        actionType: "delete",
        description: `User revoked API key: ${revokedKey.name}`,
        targetType: "api_key",
        targetId: revokedKey.id,
        targetName: revokedKey.name,
        changes: {
          before: { isActive: true },
          after: { isActive: false },
        },
        metadata: {
          organizationId: authResult.organizationId,
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
      apiKey: {
        id: revokedKey.id,
        name: revokedKey.name,
        displayName: revokedKey.displayName,
        version: revokedKey.version,
        isActive: revokedKey.isActive,
        lastUsedAt: revokedKey.lastUsedAt,
        lastRotatedAt: revokedKey.lastRotatedAt,
        expiresAt: revokedKey.expiresAt,
        createdAt: revokedKey.createdAt,
        updatedAt: revokedKey.updatedAt,
        maskedKey: maskApiKey(revokedKey.keyHash),
      },
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "revoke_user_api_key",
        actionType: "delete",
        description: "Failed to revoke user API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to revoke API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
