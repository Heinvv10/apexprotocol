import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/clerk";

// Validation schema for organization update
const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      logoUrl: z.string().optional().nullable(),
      faviconUrl: z.string().optional().nullable(),
      appName: z.string().optional().nullable(),
      customDomain: z.string().optional().nullable(),
    })
    .optional(),
  settings: z
    .object({
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      defaultLanguage: z.string().optional(),
      shareUsageData: z.boolean().optional(),
      aiModelFeedback: z.boolean().optional(),
      marketingComms: z.boolean().optional(),
    })
    .optional(),
});

/**
 * GET /api/settings/organization
 * Returns the current organization profile (creates default if doesn't exist)
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

    let org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    // Create default organization if doesn't exist
    if (org.length === 0) {
      const newOrg = await db
        .insert(organizations)
        .values({
          id: orgId,
          name: "My Organization",
          slug: "my-organization",
        })
        .returning();
      org = newOrg;
    }

    return NextResponse.json({
      success: true,
      data: org[0],
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
 * PUT /api/settings/organization
 * Updates the current organization profile (creates if doesn't exist)
 */
export async function PUT(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    // Check if organization exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    // Create organization if it doesn't exist
    if (existingOrg.length === 0) {
      const defaultBranding = {
        themeId: "apexgeo-default",
        primaryColor: "#00E5CC",
        accentColor: "#8B5CF6",
        logoUrl: null,
        logoDarkUrl: null,
        faviconUrl: null,
        appName: null,
        tagline: null,
        customDomain: null,
        supportEmail: null,
        showPoweredBy: true,
        customFooterText: null,
      };
      const defaultSettings = {
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        defaultLanguage: "en",
      };
      const insertValues: typeof organizations.$inferInsert = {
        name: validatedData.name || "My Organization",
        slug: `org-${Date.now()}`,
        branding: validatedData.branding
          ? { ...defaultBranding, ...validatedData.branding }
          : defaultBranding,
        settings: validatedData.settings
          ? { ...defaultSettings, ...validatedData.settings }
          : defaultSettings,
      };
      const newOrg = await db
        .insert(organizations)
        .values(insertValues)
        .returning();

      return NextResponse.json({
        success: true,
        data: newOrg[0],
      });
    }

    // Merge branding and settings with existing values
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name) {
      updateData.name = validatedData.name;
    }

    if (validatedData.branding) {
      updateData.branding = {
        ...existingOrg[0].branding,
        ...validatedData.branding,
      };
    }

    if (validatedData.settings) {
      updateData.settings = {
        ...existingOrg[0].settings,
        ...validatedData.settings,
      };
    }

    const updatedOrg = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedOrg[0],
    });
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
