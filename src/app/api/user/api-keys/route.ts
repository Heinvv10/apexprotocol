import { getUserId, getOrganizationId } from "@/lib/auth";
/**
 * User API Keys Management API
 * GET /api/user/api-keys - List user's API keys (masked values)
 * POST /api/user/api-keys - Generate a new user API key
 * Requires user authentication
 * Rate limited: 10 key generations per hour per user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit-logger";
import { encryptApiKey } from "@/lib/crypto/api-key-encryption";
import { generateApiKey, maskApiKey } from "@/lib/crypto/key-generation";
import { createId } from "@paralleldrive/cuid2";

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_GENERATIONS_PER_HOUR = 10;

/**
 * GET /api/user/api-keys
 * List the current user's API keys with masked values
 * Never returns the full key value - that's only shown once at generation
 */
export async function GET(request: NextRequest) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;
  let organizationId: string | null = null;

  try {
    // Get authenticated user
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    actorId = userId;
    organizationId = orgId || null;

    // Get actor details from Clerk
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      actorName = user.fullName || user.firstName || null;
      actorEmail = user.emailAddresses[0]?.emailAddress || null;
    } catch (_error) {
      // Continue without actor details if Clerk fails
    }

    // Organization is required for API key access
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization context required. Please select an organization." },
        { status: 400 }
      );
    }

    // Query user's API keys (only type='user' keys belonging to this user)
    const userKeys = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.organizationId, organizationId),
          eq(apiKeys.type, "user")
        )
      )
      .orderBy(desc(apiKeys.createdAt));

    // Mask key values before returning
    const maskedKeys = userKeys.map((key) => ({
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
      // Return masked key for display (first 4 + ... + last 4)
      maskedKey: maskApiKey(key.keyHash),
    }));

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_user_api_keys",
        actionType: "access",
        description: `User listed their API keys (${maskedKeys.length} results)`,
        metadata: {
          organizationId,
          resultCount: maskedKeys.length,
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      apiKeys: maskedKeys,
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_user_api_keys",
        actionType: "access",
        description: "Failed to list user API keys",
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
 * POST /api/user/api-keys
 * Generate a new user API key
 * Returns the full key ONCE only - it cannot be retrieved again
 * Rate limited to 10 generations per hour per user
 */
export async function POST(request: NextRequest) {
  // Declare actor variables at function scope for audit logging
  let actorId: string | null = null;
  let actorName: string | null = null;
  let actorEmail: string | null = null;
  let organizationId: string | null = null;

  try {
    // Get authenticated user
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    actorId = userId;
    organizationId = orgId || null;

    // Get actor details from Clerk
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      actorName = user.fullName || user.firstName || null;
      actorEmail = user.emailAddresses[0]?.emailAddress || null;
    } catch (_error) {
      // Continue without actor details if Clerk fails
    }

    // Organization is required for API key generation
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization context required. Please select an organization." },
        { status: 400 }
      );
    }

    // Rate limiting: Check how many keys were generated in the last hour
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.type, "user"),
          gte(apiKeys.createdAt, oneHourAgo)
        )
      );

    if (recentKeys.length >= MAX_GENERATIONS_PER_HOUR) {
      // Log rate limit hit
      await createAuditLog(
        {
          actorId,
          actorName,
          actorEmail,
          action: "generate_user_api_key",
          actionType: "security",
          description: `Rate limit exceeded: ${recentKeys.length} keys generated in last hour (max ${MAX_GENERATIONS_PER_HOUR})`,
          metadata: {
            organizationId,
            recentKeyCount: recentKeys.length,
            rateLimit: MAX_GENERATIONS_PER_HOUR,
          },
          status: "failure",
          errorMessage: "Rate limit exceeded",
        },
        request
      );

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `You can only generate ${MAX_GENERATIONS_PER_HOUR} API keys per hour. Please try again later.`,
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
        },
        { status: 429 }
      );
    }

    // Parse request body for optional name/displayName
    let name = "API Key";
    let displayName: string | null = null;
    let expiresAt: Date | null = null;

    try {
      const body = await request.json();
      if (body.name && typeof body.name === "string") {
        name = body.name.trim() || "API Key";
      }
      if (body.displayName && typeof body.displayName === "string") {
        displayName = body.displayName.trim() || null;
      }
      if (body.expiresAt) {
        expiresAt = new Date(body.expiresAt);
        // Validate expiration date is in the future
        if (expiresAt <= new Date()) {
          return NextResponse.json(
            { error: "Expiration date must be in the future" },
            { status: 400 }
          );
        }
      }
    } catch (_error) {
      // No body or invalid JSON is fine - use defaults
    }

    // Generate a new API key
    const { key, hash } = await generateApiKey();

    // Encrypt the key for storage
    const encryptedKey = encryptApiKey(key);

    // Create the new API key record
    const newKeyId = createId();
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        id: newKeyId,
        organizationId,
        userId,
        name,
        displayName,
        type: "user",
        encryptedKey,
        keyHash: hash,
        version: 1,
        isActive: true,
        expiresAt,
      })
      .returning();

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "generate_user_api_key",
        actionType: "create",
        description: `User generated a new API key: ${name}`,
        targetType: "api_key",
        targetId: newKey.id,
        targetName: name,
        changes: {
          after: {
            id: newKey.id,
            organizationId: newKey.organizationId,
            userId: newKey.userId,
            name: newKey.name,
            displayName: newKey.displayName,
            type: newKey.type,
            version: newKey.version,
            isActive: newKey.isActive,
            expiresAt: newKey.expiresAt,
          },
        },
        metadata: {
          organizationId,
        },
        status: "success",
      },
      request
    );

    // Return the new key with the full key value shown ONCE
    // This is the ONLY time the user will see the full key
    return NextResponse.json({
      success: true,
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        displayName: newKey.displayName,
        version: newKey.version,
        isActive: newKey.isActive,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
        // THE FULL KEY - ONLY SHOWN ONCE
        key,
        // Also provide masked version for reference
        maskedKey: maskApiKey(key),
      },
      // Important: Warn the user this is the only time they'll see the key
      warning: "This is the only time you will see this API key. Please copy it now and store it securely.",
    });
  } catch (error) {
    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "generate_user_api_key",
        actionType: "create",
        description: "Failed to generate user API key",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to generate API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
