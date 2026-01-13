/**
 * Global LinkedIn OAuth API
 * Manages system-wide LinkedIn OAuth connection for people enrichment
 *
 * GET /api/settings/oauth/linkedin - Get global LinkedIn OAuth status
 * POST /api/settings/oauth/linkedin - Store LinkedIn OAuth tokens
 * DELETE /api/settings/oauth/linkedin - Remove LinkedIn OAuth connection
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId, getOrganizationId } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encryptToken, decryptToken } from "@/lib/oauth";
import { z } from "zod";

const GLOBAL_LINKEDIN_KEY = "global_linkedin_oauth";

// Validation schema
const linkedinTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().nullish(),
  expiresAt: z.string().or(z.number()),
  accountId: z.string(),
  accountName: z.string(),
  accountEmail: z.string().optional(),
  profileUrl: z.string().optional(),
});

// ============================================================================
// GET - Get global LinkedIn OAuth status
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Super-admin only
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
    }

    // Get global LinkedIn OAuth setting
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, GLOBAL_LINKEDIN_KEY),
    });

    if (!setting || !setting.isActive) {
      return NextResponse.json({
        isConnected: false,
        accountInfo: null,
      });
    }

    // Decrypt tokens to check expiry (but don't return them)
    const tokenData = setting.value as {
      encrypted: { encryptedData: string; iv: string; authTag: string };
      accountInfo: {
        accountId: string;
        accountName: string;
        accountEmail?: string;
        profileUrl?: string;
      };
      expiresAt: number;
      connectedAt: string;
      connectedBy: string;
    };

    const now = Date.now();
    const isExpired = tokenData.expiresAt < now;

    return NextResponse.json({
      isConnected: true,
      accountInfo: tokenData.accountInfo,
      connectedAt: tokenData.connectedAt,
      connectedBy: tokenData.connectedBy,
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
      isExpired,
      needsReconnect: isExpired,
    });
  } catch (error) {
    console.error("Error fetching LinkedIn OAuth status:", error);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn OAuth status" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Store LinkedIn OAuth tokens
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Super-admin only
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
    }

    const body = await request.json();
    console.log("[LinkedIn OAuth POST] Received body:", JSON.stringify(body, null, 2));
    const validation = linkedinTokenSchema.safeParse(body);

    if (!validation.success) {
      console.log("[LinkedIn OAuth POST] Validation failed:", JSON.stringify(validation.error.format(), null, 2));
      return NextResponse.json(
        { error: "Invalid token data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { accessToken, refreshToken, expiresAt, accountId, accountName, accountEmail, profileUrl } = validation.data;

    // Encrypt the tokens
    const encrypted = encryptToken(
      JSON.stringify({
        accessToken,
        refreshToken,
      })
    );

    const expiresAtTimestamp =
      typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt;

    // Store in system settings
    const settingData = {
      key: GLOBAL_LINKEDIN_KEY,
      type: "configuration" as const,
      category: "integrations",
      value: {
        encrypted,
        accountInfo: {
          accountId,
          accountName,
          accountEmail,
          profileUrl,
        },
        expiresAt: expiresAtTimestamp,
        connectedAt: new Date().toISOString(),
        connectedBy: userId,
      },
      description: "Global LinkedIn OAuth connection for people enrichment",
      isActive: true,
      lastModifiedBy: userId,
    };

    // Upsert the setting
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, GLOBAL_LINKEDIN_KEY),
    });

    if (existing) {
      await db
        .update(systemSettings)
        .set({
          ...settingData,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, GLOBAL_LINKEDIN_KEY));
    } else {
      await db.insert(systemSettings).values(settingData);
    }

    return NextResponse.json({
      success: true,
      message: "LinkedIn OAuth connection saved successfully",
      accountInfo: {
        accountId,
        accountName,
        accountEmail,
        profileUrl,
      },
    });
  } catch (error) {
    console.error("Error saving LinkedIn OAuth:", error);
    return NextResponse.json(
      { error: "Failed to save LinkedIn OAuth connection" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove LinkedIn OAuth connection
// ============================================================================

export async function DELETE(_request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Super-admin only
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    await db
      .update(systemSettings)
      .set({
        isActive: false,
        lastModifiedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.key, GLOBAL_LINKEDIN_KEY));

    return NextResponse.json({
      success: true,
      message: "LinkedIn OAuth connection removed successfully",
    });
  } catch (error) {
    console.error("Error removing LinkedIn OAuth:", error);
    return NextResponse.json(
      { error: "Failed to remove LinkedIn OAuth connection" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper function to get global LinkedIn tokens (for internal use)
// ============================================================================

export async function getGlobalLinkedInTokens(): Promise<{
  accessToken: string;
  refreshToken?: string;
} | null> {
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, GLOBAL_LINKEDIN_KEY),
    });

    if (!setting || !setting.isActive) {
      return null;
    }

    const tokenData = setting.value as {
      encrypted: string | { encryptedData: string; iv: string; authTag: string };
      expiresAt: number;
    };

    // Check if expired
    if (tokenData.expiresAt < Date.now()) {
      return null;
    }

    // Decrypt and return tokens
    const encryptedString = typeof tokenData.encrypted === 'string'
      ? tokenData.encrypted
      : tokenData.encrypted.encryptedData; // Fallback for old format
    const decrypted = decryptToken(encryptedString);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Error getting global LinkedIn tokens:", error);
    return null;
  }
}
