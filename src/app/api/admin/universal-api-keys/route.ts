/**
 * Admin API - Universal API Keys Management
 * Allows admins to set/update universal API keys used by all users
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema/system-settings";
import { users } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/encryption";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";
// Validation schemas
const setApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "gemini"]),
  apiKey: z.string().min(10),
});

const getApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "gemini"]),
});

/**
 * Check if user is admin using proper role-based access control
 * Checks database user record (source of truth after Supabase Auth migration)
 */
async function isAdmin(): Promise<boolean> {
  const user = await currentDbUser();

  if (!user) {
    return false;
  }

  // Check database for super admin status (source of truth)
  try {
    const dbUser = await db
      .select({ isSuperAdmin: users.isSuperAdmin, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (dbUser[0]?.isSuperAdmin) {
      return true;
    }

    // Also check if user has admin role in database
    if (dbUser[0]?.role === "admin") {
      return true;
    }
  } catch (error) {
    console.error("Error checking admin status in database:", error);
  }

  return false;
}

/**
 * GET /api/admin/universal-api-keys
 * Get configured universal API keys (returns masked versions)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const provider = searchParams.get("provider");

    // Get all universal API keys
    const settings = await db
      .select()
      .from(systemSettings)
      .where(
        and(
          eq(systemSettings.type, "api_key"),
          eq(systemSettings.isActive, true)
        )
      );

    // If specific provider requested
    if (provider) {
      const setting = settings.find((s) => s.key === `universal_api_key_${provider}`);

      if (!setting) {
        return NextResponse.json({
          success: true,
          provider,
          configured: false,
        });
      }

      // Return masked key (show first 8 and last 4 characters)
      const decrypted = decrypt(setting.value as any);
      const masked = maskApiKey(decrypted);

      return NextResponse.json({
        success: true,
        provider,
        configured: true,
        maskedKey: masked,
        updatedAt: setting.updatedAt,
        updatedBy: setting.lastModifiedBy,
      });
    }

    // Return all configured keys (masked)
    const configured = settings.map((setting) => {
      const provider = setting.key.replace("universal_api_key_", "");
      const decrypted = decrypt(setting.value as any);
      const masked = maskApiKey(decrypted);

      return {
        provider,
        configured: true,
        maskedKey: masked,
        updatedAt: setting.updatedAt,
        updatedBy: setting.lastModifiedBy,
      };
    });

    return NextResponse.json({
      success: true,
      keys: configured,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Universal API keys GET error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/universal-api-keys
 * Set or update a universal API key
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const user = await currentDbUser();
    const body = await request.json();
    const params = setApiKeySchema.parse(body);

    // Encrypt the API key
    const encrypted = encrypt(params.apiKey);

    const settingKey = `universal_api_key_${params.provider}`;

    // Check if key already exists
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, settingKey))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(systemSettings)
        .set({
          value: encrypted,
          updatedAt: new Date(),
          lastModifiedBy: user?.id,
        })
        .where(eq(systemSettings.key, settingKey));
    } else {
      // Insert new
      await db.insert(systemSettings).values({
        key: settingKey,
        type: "api_key",
        category: "api_keys",
        value: encrypted,
        description: `Universal ${params.provider.toUpperCase()} API key for all users`,
        isActive: true,
        lastModifiedBy: user?.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Universal ${params.provider.toUpperCase()} API key ${existing.length > 0 ? "updated" : "created"} successfully`,
      provider: params.provider,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Universal API keys POST error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/universal-api-keys
 * Remove a universal API key
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider parameter required" },
        { status: 400 }
      );
    }

    const settingKey = `universal_api_key_${provider}`;

    // Soft delete (set inactive)
    await db
      .update(systemSettings)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.key, settingKey));

    return NextResponse.json({
      success: true,
      message: `Universal ${provider.toUpperCase()} API key removed successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Universal API keys DELETE error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Mask API key for display
 */
function maskApiKey(key: string): string {
  if (key.length <= 12) {
    return "***";
  }
  const start = key.substring(0, 8);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}
