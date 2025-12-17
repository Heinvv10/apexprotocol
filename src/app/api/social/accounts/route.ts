/**
 * Social Accounts API
 * GET /api/social/accounts - List connected social accounts for a brand
 * DELETE /api/social/accounts - Disconnect a social account
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getBrandConnectedAccounts,
  disconnectAccount,
  isPlatformSupported,
  PLATFORM_METADATA,
  type SocialPlatform,
} from "@/lib/oauth";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/social/accounts
 * List all connected social accounts for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    // Verify brand belongs to organization
    const brand = await db.query.brands.findFirst({
      where: and(
        eq(brands.id, brandId),
        eq(brands.organizationId, orgId)
      ),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get connected accounts
    const connectedAccounts = await getBrandConnectedAccounts(brandId);

    // Enhance with platform metadata
    const enhancedAccounts = connectedAccounts.map((account) => ({
      ...account,
      platformInfo: isPlatformSupported(account.platform)
        ? PLATFORM_METADATA[account.platform as SocialPlatform]
        : null,
    }));

    // Get list of all supported platforms with connection status
    const allPlatforms = Object.entries(PLATFORM_METADATA).map(([key, meta]) => ({
      platform: key,
      ...meta,
      isConnected: connectedAccounts.some((a) => a.platform === key && a.isActive),
      connectedAccount: connectedAccounts.find((a) => a.platform === key && a.isActive) || null,
    }));

    return NextResponse.json({
      connectedAccounts: enhancedAccounts,
      platforms: allPlatforms,
    });
  } catch (error) {
    console.error("[Social Accounts] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected accounts" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/accounts
 * Disconnect a social account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const platform = searchParams.get("platform");

    if (!brandId) {
      return NextResponse.json({ error: "brandId is required" }, { status: 400 });
    }

    if (!platform) {
      return NextResponse.json({ error: "platform is required" }, { status: 400 });
    }

    if (!isPlatformSupported(platform)) {
      return NextResponse.json({ error: `Invalid platform: ${platform}` }, { status: 400 });
    }

    // Verify brand belongs to organization
    const brand = await db.query.brands.findFirst({
      where: and(
        eq(brands.id, brandId),
        eq(brands.organizationId, orgId)
      ),
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Disconnect the account
    const result = await disconnectAccount({
      brandId,
      platform: platform as SocialPlatform,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to disconnect account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${PLATFORM_METADATA[platform as SocialPlatform]?.displayName || platform} account disconnected`,
    });
  } catch (error) {
    console.error("[Social Accounts] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
