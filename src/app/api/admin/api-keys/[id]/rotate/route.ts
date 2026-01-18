import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Admin API Keys Rotation API
 * POST /api/admin/api-keys/[id]/rotate - Rotate an external service API key
 * Creates new version of key with optional grace period where old key remains valid
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";
import { encryptApiKey } from "@/lib/crypto/api-key-encryption";
import { hashApiKey, maskApiKey } from "@/lib/crypto/key-generation";
import { createId } from "@paralleldrive/cuid2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Helper to get and validate actor for admin operations
 * Returns null if not authorized, otherwise returns actor details
 */
async function getAuthorizedActor(): Promise<
  | {
      actorId: string;
      actorName: string | null;
      actorEmail: string | null;
      authorized: true;
    }
  | {
      authorized: false;
      errorResponse: NextResponse;
    }
> {
  // In dev mode, allow access if DEV_SUPER_ADMIN is set
  const devSuperAdmin =
    process.env.NODE_ENV === "development" &&
    process.env.DEV_SUPER_ADMIN === "true";

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
 * POST /api/admin/api-keys/[id]/rotate
 * Rotate an external service API key
 *
 * Request body:
 * - newApiKey: string (required) - The new API key value
 * - gracePeriodMinutes: number (optional) - Minutes to keep old key active (default: 0)
 * - reason: string (optional) - Reason for rotation (for audit)
 *
 * Key rotation flow:
 * 1. If gracePeriodMinutes > 0:
 *    - Create a new record with the new key (marked as current version)
 *    - Set expiration on old key to gracePeriodMinutes from now
 *    - Old key remains active until it expires
 * 2. If gracePeriodMinutes = 0 (default):
 *    - Update existing key in place with new encrypted value
 *    - Increment version number
 *    - Update lastRotatedAt timestamp
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
          action: "rotate_admin_api_key",
          actionType: "update",
          description: `Super-admin attempted to rotate non-existent API key: ${id}`,
          targetType: "api_key",
          targetId: id,
          status: "failure",
          errorMessage: "API key not found",
        },
        request
      );

      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Check if key is active
    if (!existingKey.isActive) {
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "rotate_admin_api_key",
          actionType: "update",
          description: `Super-admin attempted to rotate revoked API key: ${existingKey.name}`,
          targetType: "api_key",
          targetId: id,
          targetName: existingKey.name,
          status: "failure",
          errorMessage: "Cannot rotate a revoked key",
        },
        request
      );

      return NextResponse.json(
        { error: "Cannot rotate a revoked API key. Reactivate it first or create a new key." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { newApiKey, gracePeriodMinutes = 0, reason } = body;

    // Validation
    if (!newApiKey) {
      return NextResponse.json(
        { error: "newApiKey is required" },
        { status: 400 }
      );
    }

    if (typeof newApiKey !== "string" || newApiKey.length < 8) {
      return NextResponse.json(
        { error: "newApiKey must be a string with at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate grace period
    const gracePeriod = typeof gracePeriodMinutes === "number" ? Math.max(0, gracePeriodMinutes) : 0;
    const maxGracePeriod = 10080; // 7 days in minutes
    if (gracePeriod > maxGracePeriod) {
      return NextResponse.json(
        { error: `gracePeriodMinutes cannot exceed ${maxGracePeriod} (7 days)` },
        { status: 400 }
      );
    }

    // Generate new key hash
    const newKeyHash = await hashApiKey(newApiKey);

    // Check if new key hash already exists (duplicate key)
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

    // Encrypt the new API key
    const encryptedNewKey = encryptApiKey(newApiKey);
    const newVersion = existingKey.version + 1;
    const rotatedAt = new Date();

    let result;
    let oldKeyId: string | undefined;

    if (gracePeriod > 0) {
      // Grace period rotation: Create new record for new key, set expiration on old key
      // This allows both keys to be valid during the transition period

      // Calculate old key expiration
      const oldKeyExpiration = new Date(rotatedAt.getTime() + gracePeriod * 60 * 1000);

      // Create new key record (current version)
      const newKeyId = createId();
      const [newKeyRecord] = await db
        .insert(apiKeys)
        .values({
          id: newKeyId,
          organizationId: existingKey.organizationId,
          userId: existingKey.userId,
          name: existingKey.name,
          displayName: existingKey.displayName,
          type: existingKey.type,
          encryptedKey: encryptedNewKey,
          keyHash: newKeyHash,
          version: newVersion,
          lastRotatedAt: rotatedAt,
          scopes: existingKey.scopes,
          isActive: true,
          expiresAt: existingKey.expiresAt, // Inherit original expiration if any
        })
        .returning();

      // Set expiration on old key
      const [updatedOldKey] = await db
        .update(apiKeys)
        .set({
          expiresAt: oldKeyExpiration,
          updatedAt: rotatedAt,
        })
        .where(eq(apiKeys.id, id))
        .returning();

      oldKeyId = updatedOldKey.id;
      result = newKeyRecord;

      // Create success audit log for grace period rotation
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "rotate_admin_api_key_with_grace",
          actionType: "update",
          description: `Super-admin rotated API key with ${gracePeriod}m grace period: ${existingKey.name} (${existingKey.type}) v${existingKey.version} -> v${newVersion}`,
          targetType: "api_key",
          targetId: newKeyRecord.id,
          targetName: existingKey.name,
          changes: {
            before: {
              id: existingKey.id,
              version: existingKey.version,
              keyHash: maskApiKey(existingKey.keyHash),
            },
            after: {
              id: newKeyRecord.id,
              version: newVersion,
              keyHash: maskApiKey(newKeyHash),
              gracePeriodMinutes: gracePeriod,
              oldKeyExpiresAt: oldKeyExpiration.toISOString(),
            },
          },
          metadata: {
            reason,
            gracePeriodMinutes: gracePeriod,
            previousKeyId: existingKey.id,
          },
          status: "success",
        },
        request
      );
    } else {
      // Immediate rotation: Update existing key in place
      const [updatedKey] = await db
        .update(apiKeys)
        .set({
          encryptedKey: encryptedNewKey,
          keyHash: newKeyHash,
          version: newVersion,
          lastRotatedAt: rotatedAt,
          updatedAt: rotatedAt,
        })
        .where(eq(apiKeys.id, id))
        .returning();

      result = updatedKey;

      // Create success audit log for immediate rotation
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "rotate_admin_api_key",
          actionType: "update",
          description: `Super-admin rotated API key: ${existingKey.name} (${existingKey.type}) v${existingKey.version} -> v${newVersion}`,
          targetType: "api_key",
          targetId: id,
          targetName: existingKey.name,
          changes: {
            before: {
              version: existingKey.version,
              keyHash: maskApiKey(existingKey.keyHash),
              lastRotatedAt: existingKey.lastRotatedAt,
            },
            after: {
              version: newVersion,
              keyHash: maskApiKey(newKeyHash),
              lastRotatedAt: rotatedAt.toISOString(),
            },
          },
          metadata: {
            reason,
          },
          status: "success",
        },
        request
      );
    }

    // Prepare response
    const response: {
      success: boolean;
      message: string;
      apiKey: {
        id: string;
        organizationId: string;
        name: string;
        displayName: string | null;
        type: string;
        version: number;
        isActive: boolean;
        lastRotatedAt: Date | null;
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        maskedKey: string;
      };
      rotation: {
        previousVersion: number;
        newVersion: number;
        gracePeriodMinutes: number;
        oldKeyExpiresAt?: string;
        oldKeyId?: string;
      };
    } = {
      success: true,
      message:
        gracePeriod > 0
          ? `API key rotated with ${gracePeriod} minute grace period. Old key will expire at ${new Date(rotatedAt.getTime() + gracePeriod * 60 * 1000).toISOString()}`
          : "API key rotated successfully",
      apiKey: {
        id: result.id,
        organizationId: result.organizationId,
        name: result.name,
        displayName: result.displayName,
        type: result.type,
        version: result.version,
        isActive: result.isActive,
        lastRotatedAt: result.lastRotatedAt,
        expiresAt: result.expiresAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        maskedKey: maskApiKey(result.keyHash),
      },
      rotation: {
        previousVersion: existingKey.version,
        newVersion,
        gracePeriodMinutes: gracePeriod,
      },
    };

    // Add grace period details if applicable
    if (gracePeriod > 0 && oldKeyId) {
      response.rotation.oldKeyExpiresAt = new Date(
        rotatedAt.getTime() + gracePeriod * 60 * 1000
      ).toISOString();
      response.rotation.oldKeyId = oldKeyId;
    }

    return NextResponse.json(response);
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "rotate_admin_api_key",
        actionType: "update",
        description: "Failed to rotate external service API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to rotate API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
