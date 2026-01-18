import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Admin API Keys Management API - Individual Key Operations
 * GET /api/admin/api-keys/[id] - Get single API key details (masked)
 * PATCH /api/admin/api-keys/[id] - Update API key (re-encrypts if value changed)
 * DELETE /api/admin/api-keys/[id] - Soft-delete/revoke API key
 * Requires super-admin authentication
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";
import { encryptApiKey } from "@/lib/crypto/api-key-encryption";
import { hashApiKey, maskApiKey } from "@/lib/crypto/key-generation";

// Valid external service key types (excludes 'user' type)
const EXTERNAL_KEY_TYPES = ["anthropic", "openai", "serper", "pinecone", "custom"] as const;
type ExternalKeyType = (typeof EXTERNAL_KEY_TYPES)[number];

function isValidExternalKeyType(type: string): type is ExternalKeyType {
  return EXTERNAL_KEY_TYPES.includes(type as ExternalKeyType);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Helper to get and validate actor for admin operations
 * Returns null if not authorized, otherwise returns actor details
 */
async function getAuthorizedActor(): Promise<{
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  authorized: true;
} | {
  authorized: false;
  errorResponse: NextResponse;
}> {
  // In dev mode, allow access if DEV_SUPER_ADMIN is set
  const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

  if (devSuperAdmin) {
    return {
      authorized: true,
      actorId: "dev-super-admin",
      actorName: "Dev Super Admin",
      actorEmail: "dev@localhost",
    };
  }

  const userId = await getUserId();

  if (!userId) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // Get actor details from Clerk
  let actorName: string | null = null;
  let actorEmail: string | null = null;
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    actorName = user.fullName || user.firstName || null;
    actorEmail = user.emailAddresses[0]?.emailAddress || null;
  } catch (_error) {
    // Continue without actor details if Clerk fails
  }

  // Check super-admin status
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    actorId: userId,
    actorName,
    actorEmail,
  };
}

/**
 * GET /api/admin/api-keys/[id]
 * Get a single external service API key by ID
 * Returns masked key value for security
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    const { id } = await params;

    // Check authorization
    const authResult = await getAuthorizedActor();
    if (!authResult.authorized) {
      return authResult.errorResponse;
    }
    actorId = authResult.actorId;
    actorName = authResult.actorName;
    actorEmail = authResult.actorEmail;

    // Find the API key (only external service keys, not user-generated)
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), ne(apiKeys.type, "user")))
      .limit(1);

    if (!key) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "get_admin_api_key",
          actionType: "access",
          description: `Super-admin attempted to access non-existent API key: ${id}`,
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
        action: "get_admin_api_key",
        actionType: "access",
        description: `Super-admin accessed API key: ${key.name} (${key.type})`,
        targetType: "api_key",
        targetId: key.id,
        targetName: key.name,
        status: "success",
      },
      request
    );

    // Return masked key value
    return NextResponse.json({
      success: true,
      apiKey: {
        id: key.id,
        organizationId: key.organizationId,
        name: key.name,
        displayName: key.displayName,
        type: key.type,
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
        action: "get_admin_api_key",
        actionType: "access",
        description: "Failed to get external service API key",
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
 * PATCH /api/admin/api-keys/[id]
 * Update an external service API key
 * If apiKey value is provided, it will be re-encrypted
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;

  try {
    const { id } = await params;

    // Check authorization
    const authResult = await getAuthorizedActor();
    if (!authResult.authorized) {
      return authResult.errorResponse;
    }
    actorId = authResult.actorId;
    actorName = authResult.actorName;
    actorEmail = authResult.actorEmail;

    // Find the API key (only external service keys, not user-generated)
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), ne(apiKeys.type, "user")))
      .limit(1);

    if (!existingKey) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "update_admin_api_key",
          actionType: "update",
          description: `Super-admin attempted to update non-existent API key: ${id}`,
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
    const { name, displayName, type, apiKey, isActive, expiresAt } = body;

    // Build update data
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
      changesBefore.name = existingKey.name;
      changesAfter.name = name;
      updateData.name = name;
    }

    // Update displayName
    if (displayName !== undefined && displayName !== existingKey.displayName) {
      changesBefore.displayName = existingKey.displayName;
      changesAfter.displayName = displayName;
      updateData.displayName = displayName || null;
    }

    // Update type
    if (type !== undefined && type !== existingKey.type) {
      if (!isValidExternalKeyType(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${EXTERNAL_KEY_TYPES.join(", ")}` },
          { status: 400 }
        );
      }
      changesBefore.type = existingKey.type;
      changesAfter.type = type;
      updateData.type = type;
    }

    // Update API key value (requires re-encryption)
    if (apiKey !== undefined) {
      if (!apiKey || typeof apiKey !== "string") {
        return NextResponse.json(
          { error: "apiKey must be a non-empty string" },
          { status: 400 }
        );
      }

      const newKeyHash = await hashApiKey(apiKey);

      // Check if the new key hash already exists (duplicate key)
      if (newKeyHash !== existingKey.keyHash) {
        const [duplicateKey] = await db
          .select({ id: apiKeys.id })
          .from(apiKeys)
          .where(eq(apiKeys.keyHash, newKeyHash))
          .limit(1);

        if (duplicateKey) {
          return NextResponse.json(
            { error: "This API key already exists in the system" },
            { status: 409 }
          );
        }

        // Encrypt and update the key
        updateData.encryptedKey = encryptApiKey(apiKey);
        updateData.keyHash = newKeyHash;
        changesAfter.keyUpdated = true;
      }
    }

    // Update isActive
    if (isActive !== undefined && isActive !== existingKey.isActive) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 }
        );
      }
      changesBefore.isActive = existingKey.isActive;
      changesAfter.isActive = isActive;
      updateData.isActive = isActive;
    }

    // Update expiresAt
    if (expiresAt !== undefined) {
      const newExpiry = expiresAt ? new Date(expiresAt) : null;
      if (expiresAt && isNaN(newExpiry!.getTime())) {
        return NextResponse.json(
          { error: "expiresAt must be a valid date string or null" },
          { status: 400 }
        );
      }
      changesBefore.expiresAt = existingKey.expiresAt;
      changesAfter.expiresAt = newExpiry;
      updateData.expiresAt = newExpiry;
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 1) {
      // Only updatedAt was set, no actual changes
      return NextResponse.json({
        success: true,
        message: "No changes to apply",
        apiKey: {
          id: existingKey.id,
          organizationId: existingKey.organizationId,
          name: existingKey.name,
          displayName: existingKey.displayName,
          type: existingKey.type,
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
        action: "update_admin_api_key",
        actionType: "update",
        description: `Super-admin updated API key: ${updatedKey.name} (${updatedKey.type})`,
        targetType: "api_key",
        targetId: updatedKey.id,
        targetName: updatedKey.name,
        changes: {
          before: changesBefore,
          after: changesAfter,
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      apiKey: {
        id: updatedKey.id,
        organizationId: updatedKey.organizationId,
        name: updatedKey.name,
        displayName: updatedKey.displayName,
        type: updatedKey.type,
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
        action: "update_admin_api_key",
        actionType: "update",
        description: "Failed to update external service API key",
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
 * DELETE /api/admin/api-keys/[id]
 * Soft-delete (revoke) an external service API key
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
    const authResult = await getAuthorizedActor();
    if (!authResult.authorized) {
      return authResult.errorResponse;
    }
    actorId = authResult.actorId;
    actorName = authResult.actorName;
    actorEmail = authResult.actorEmail;

    // Check for force delete parameter (hard delete vs soft delete)
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    // Find the API key (only external service keys, not user-generated)
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), ne(apiKeys.type, "user")))
      .limit(1);

    if (!existingKey) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: forceDelete ? "hard_delete_admin_api_key" : "revoke_admin_api_key",
          actionType: "delete",
          description: `Super-admin attempted to ${forceDelete ? "delete" : "revoke"} non-existent API key: ${id}`,
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

    if (forceDelete) {
      // Hard delete - permanently remove the key
      await db.delete(apiKeys).where(eq(apiKeys.id, id));

      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "hard_delete_admin_api_key",
          actionType: "delete",
          description: `Super-admin permanently deleted API key: ${existingKey.name} (${existingKey.type})`,
          targetType: "api_key",
          targetId: existingKey.id,
          targetName: existingKey.name,
          changes: {
            before: {
              id: existingKey.id,
              name: existingKey.name,
              type: existingKey.type,
              isActive: existingKey.isActive,
            },
            after: undefined,
          },
          status: "success",
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: "API key permanently deleted",
        deleted: {
          id: existingKey.id,
          name: existingKey.name,
          type: existingKey.type,
        },
      });
    } else {
      // Soft delete - set isActive to false (revoke)
      if (!existingKey.isActive) {
        return NextResponse.json(
          { error: "API key is already revoked" },
          { status: 400 }
        );
      }

      const [revokedKey] = await db
        .update(apiKeys)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, id))
        .returning();

      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "revoke_admin_api_key",
          actionType: "delete",
          description: `Super-admin revoked API key: ${revokedKey.name} (${revokedKey.type})`,
          targetType: "api_key",
          targetId: revokedKey.id,
          targetName: revokedKey.name,
          changes: {
            before: { isActive: true },
            after: { isActive: false },
          },
          status: "success",
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: "API key revoked",
        apiKey: {
          id: revokedKey.id,
          organizationId: revokedKey.organizationId,
          name: revokedKey.name,
          displayName: revokedKey.displayName,
          type: revokedKey.type,
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
    }
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "delete_admin_api_key",
        actionType: "delete",
        description: "Failed to delete/revoke external service API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to delete API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
