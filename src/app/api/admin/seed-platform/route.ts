/**
 * Admin API to seed the "platform" brand for OAuth token storage.
 * This creates or updates a special brand with ID "platform" that is used
 * for storing OAuth tokens for admin-level social accounts.
 *
 * POST /api/admin/seed-platform
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema/organizations";
import { brands } from "@/lib/db/schema/brands";
import { eq, sql } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/auth/super-admin";

const PLATFORM_ORG_ID = "platform";
const PLATFORM_BRAND_ID = "platform";

export async function POST() {
  try {
    await requireSuperAdmin();
    // Step 1: Check/create platform organization
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, PLATFORM_ORG_ID),
    });

    if (!existingOrg) {
      // Create platform organization using raw SQL to set specific ID
      await db.execute(sql`
        INSERT INTO organizations (id, name, slug, plan, brand_limit, user_limit, is_active, created_at, updated_at)
        VALUES (
          ${PLATFORM_ORG_ID},
          'Apex Platform',
          'apex-platform',
          'enterprise',
          999,
          999,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `);
      console.log("Created platform organization");
    }

    // Step 2: Check/create platform brand
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, PLATFORM_BRAND_ID),
    });

    if (!existingBrand) {
      // Create platform brand using raw SQL to set specific ID
      await db.execute(sql`
        INSERT INTO brands (id, organization_id, name, domain, description, industry, monitoring_enabled, is_active, created_at, updated_at)
        VALUES (
          ${PLATFORM_BRAND_ID},
          ${PLATFORM_ORG_ID},
          'Apex Platform',
          'apex.io',
          'Apex GEO/AEO Platform - The official platform brand for social media management.',
          'Marketing Technology',
          true,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `);
      console.log("Created platform brand");
    }

    // Verify creation
    const verifyOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, PLATFORM_ORG_ID),
    });
    const verifyBrand = await db.query.brands.findFirst({
      where: eq(brands.id, PLATFORM_BRAND_ID),
    });

    return NextResponse.json({
      success: true,
      data: {
        organization: verifyOrg ? { id: verifyOrg.id, name: verifyOrg.name } : null,
        brand: verifyBrand ? { id: verifyBrand.id, name: verifyBrand.name } : null,
      },
      message: "Platform organization and brand are ready for OAuth token storage.",
    });
  } catch (error) {
    console.error("[Seed Platform] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to seed platform brand",
      },
      { status: 500 }
    );
  }
}
