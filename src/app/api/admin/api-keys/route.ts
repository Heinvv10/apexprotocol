import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Admin API Keys Management API
 * GET /api/admin/api-keys - List all external service API keys with filters
 * POST /api/admin/api-keys - Create new encrypted external service API key
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, ne, ilike, or, desc, and } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";
import { encryptApiKey } from "@/lib/crypto/api-key-encryption";
import { hashApiKey, maskApiKey } from "@/lib/crypto/key-generation";
import { createId } from "@paralleldrive/cuid2";

// Valid external service key types (excludes 'user' type)
const EXTERNAL_KEY_TYPES = ["anthropic", "openai", "serper", "pinecone", "custom"] as const;
type ExternalKeyType = (typeof EXTERNAL_KEY_TYPES)[number];

function isValidExternalKeyType(type: string): type is ExternalKeyType {
  return EXTERNAL_KEY_TYPES.includes(type as ExternalKeyType);
}

/**
 * GET /api/admin/api-keys
 * List all external service API keys with optional filters
 * Returns masked key values for security
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const organizationId = searchParams.get("organizationId") || "";
    const status = searchParams.get("status") || ""; // "active", "inactive", or "all"

    // Build where conditions
    const conditions = [];

    // Only get external service keys (exclude user-generated keys)
    conditions.push(ne(apiKeys.type, "user"));

    // Search by name or display name
    if (search) {
      conditions.push(
        or(
          ilike(apiKeys.name, `%${search}%`),
          ilike(apiKeys.displayName, `%${search}%`)
        )
      );
    }

    // Filter by type
    if (type && type !== "all" && isValidExternalKeyType(type)) {
      conditions.push(eq(apiKeys.type, type));
    }

    // Filter by organization
    if (organizationId) {
      conditions.push(eq(apiKeys.organizationId, organizationId));
    }

    // Filter by status
    if (status === "active") {
      conditions.push(eq(apiKeys.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(apiKeys.isActive, false));
    }
    // "all" or empty shows both

    // Execute query
    const keysList = await db
      .select()
      .from(apiKeys)
      .where(and(...conditions))
      .orderBy(desc(apiKeys.createdAt));

    // Mask key values before returning
    const maskedKeys = keysList.map((key) => ({
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
      // Return masked key hash for display (first 4 + ... + last 4)
      maskedKey: maskApiKey(key.keyHash),
    }));

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_admin_api_keys",
        actionType: "access",
        description: `Super-admin listed external service API keys (${maskedKeys.length} results)`,
        metadata: {
          filters: {
            search,
            type,
            organizationId,
            status,
          },
          resultCount: maskedKeys.length,
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      apiKeys: maskedKeys,
      types: EXTERNAL_KEY_TYPES,
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_admin_api_keys",
        actionType: "access",
        description: "Failed to list external service API keys",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to fetch API keys",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new encrypted external service API key
 */
export async function POST(request: NextRequest) {
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
    const { organizationId, name, displayName, type, apiKey, expiresAt } = body;

    // Validation
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    if (!isValidExternalKeyType(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${EXTERNAL_KEY_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "apiKey is required" },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);
    const keyHash = await hashApiKey(apiKey);

    // Check for duplicate key hash (same key already exists)
    const existingKey = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (existingKey.length > 0) {
      return NextResponse.json(
        { error: "This API key already exists in the system" },
        { status: 409 }
      );
    }

    // Create the new API key record
    const newKeyId = createId();
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        id: newKeyId,
        organizationId,
        name,
        displayName: displayName || null,
        type,
        encryptedKey,
        keyHash,
        version: 1,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "create_admin_api_key",
        actionType: "create",
        description: `Super-admin created external service API key: ${name} (${type})`,
        targetType: "api_key",
        targetId: newKey.id,
        targetName: name,
        changes: {
          after: {
            id: newKey.id,
            organizationId: newKey.organizationId,
            name: newKey.name,
            displayName: newKey.displayName,
            type: newKey.type,
            version: newKey.version,
            isActive: newKey.isActive,
            expiresAt: newKey.expiresAt,
          },
        },
        status: "success",
      },
      request
    );

    // Return the new key (without the actual key value - it was provided by admin)
    return NextResponse.json({
      success: true,
      apiKey: {
        id: newKey.id,
        organizationId: newKey.organizationId,
        name: newKey.name,
        displayName: newKey.displayName,
        type: newKey.type,
        version: newKey.version,
        isActive: newKey.isActive,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
        updatedAt: newKey.updatedAt,
        maskedKey: maskApiKey(newKey.keyHash),
      },
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "create_admin_api_key",
        actionType: "create",
        description: "Failed to create external service API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to create API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
