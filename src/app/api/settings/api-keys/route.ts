import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { getOrganizationId } from "@/lib/auth/clerk";

// Encryption configuration
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || "default-dev-key-change-in-production!";

// Encrypt API key
function encryptApiKey(plainKey: string): { encrypted: string; iv: string; tag: string } {
  const key = createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

// Decrypt API key
function decryptApiKey(encrypted: string, iv: string, tag: string): string {
  const key = createHash("sha256").update(ENCRYPTION_KEY).digest();
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Generate key hash for verification
function hashApiKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

// Mask API key for display (show first 4 and last 4 chars)
function maskApiKey(plainKey: string): string {
  if (plainKey.length <= 8) {
    return "****";
  }
  return `${plainKey.slice(0, 4)}...${plainKey.slice(-4)}`;
}

// Validation schema for creating API key
const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["anthropic", "openai", "serper", "pinecone", "custom"]),
  key: z.string().min(1, "API key is required"),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/settings/api-keys
 * Returns all API keys for the organization (masked)
 */
export async function GET(_request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        type: apiKeys.type,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, orgId));

    return NextResponse.json({
      success: true,
      data: keys,
      meta: {
        total: keys.length,
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
 * POST /api/settings/api-keys
 * Creates a new API key (encrypted)
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Encrypt the API key
    const { encrypted, iv, tag } = encryptApiKey(validatedData.key);
    const keyHash = hashApiKey(validatedData.key);
    const maskedKey = maskApiKey(validatedData.key);

    // Store encrypted key with iv and tag concatenated
    const encryptedKey = `${encrypted}:${iv}:${tag}`;

    const newKey = await db
      .insert(apiKeys)
      .values({
        organizationId: orgId,
        name: validatedData.name,
        type: validatedData.type,
        encryptedKey,
        keyHash,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newKey[0].id,
          name: newKey[0].name,
          type: newKey[0].type,
          maskedKey,
          expiresAt: newKey[0].expiresAt,
          isActive: newKey[0].isActive,
          createdAt: newKey[0].createdAt,
        },
        message: "API key created successfully",
      },
      { status: 201 }
    );
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

/**
 * DELETE /api/settings/api-keys
 * Revokes an API key (expects keyId in query params)
 */
export async function DELETE(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    const keyId = request.nextUrl.searchParams.get("keyId");

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: "keyId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify key belongs to organization
    const existingKey = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, orgId)))
      .limit(1);

    if (existingKey.length === 0) {
      return NextResponse.json(
        { success: false, error: "API key not found" },
        { status: 404 }
      );
    }

    // Soft delete - deactivate the key
    await db
      .update(apiKeys)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Export encryption utilities for use in other modules
export { encryptApiKey, decryptApiKey, hashApiKey, maskApiKey };
