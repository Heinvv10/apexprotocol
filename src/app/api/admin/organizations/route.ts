import { getUserId, getOrganizationId } from "@/lib/auth/supabase-server";
/**
 * Admin Organizations API
 * GET /api/admin/organizations - List all organizations
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, users, brands } from "@/lib/db/schema";
import { eq, sql, ilike, or, desc } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { createAuditLog } from "@/lib/audit-logger";
import { getUserByAuthId } from "@/lib/auth/supabase-admin";

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
                const user = await getUserByAuthId(userId);
        actorName = user.name || user.name || null;
        actorEmail = user.email || null;
      } catch (error) {
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
    const plan = searchParams.get("plan") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(organizations.name, `%${search}%`),
          ilike(organizations.slug, `%${search}%`)
        )
      );
    }

    if (plan && plan !== "all") {
      conditions.push(eq(organizations.plan, plan as "starter" | "professional" | "enterprise"));
    }

    if (status === "active") {
      conditions.push(eq(organizations.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(organizations.isActive, false));
    }

    // Get organizations with user count and brand count
    const orgsQuery = db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        plan: organizations.plan,
        brandLimit: organizations.brandLimit,
        userLimit: organizations.userLimit,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        userCount: sql<number>`cast(count(distinct ${users.id}) as int)`,
        brandCount: sql<number>`cast(count(distinct ${brands.id}) as int)`,
      })
      .from(organizations)
      .leftJoin(users, eq(users.organizationId, organizations.id))
      .leftJoin(brands, eq(brands.organizationId, organizations.id))
      .groupBy(organizations.id)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply conditions if any
    if (conditions.length > 0) {
      orgsQuery.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    const orgs = await orgsQuery;

    // Get total count
    const totalQuery = db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(organizations);

    if (conditions.length > 0) {
      totalQuery.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    const [{ count: total }] = await totalQuery;

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_organizations",
        actionType: "access",
        description: `Super-admin listed organizations (page ${page}, ${orgs.length} results)`,
        metadata: {
          filters: {
            search,
            plan,
            status,
          },
          pagination: {
            page,
            limit,
            total,
          },
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      organizations: orgs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin organizations API error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "list_organizations",
        actionType: "access",
        description: "Failed to list organizations",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to fetch organizations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
                const user = await getUserByAuthId(userId);
        actorName = user.name || user.name || null;
        actorEmail = user.email || null;
      } catch (error) {
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
    const { organizationId, updates } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Get current organization state for audit logging
    const [targetOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!targetOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update organization
    const [updated] = await db
      .update(organizations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Create success audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_organization",
        actionType: "update",
        description: `Super-admin updated organization ${targetOrg.name || organizationId}`,
        targetType: "organization",
        targetId: organizationId,
        targetName: targetOrg.name || null,
        changes: {
          before: {
            name: targetOrg.name,
            plan: targetOrg.plan,
            isActive: targetOrg.isActive,
            brandLimit: targetOrg.brandLimit,
            userLimit: targetOrg.userLimit,
          },
          after: {
            name: updated.name,
            plan: updated.plan,
            isActive: updated.isActive,
            brandLimit: updated.brandLimit,
            userLimit: updated.userLimit,
          },
        },
        status: "success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      organization: updated,
    });
  } catch (error) {
    console.error("Admin organizations PATCH error:", error);

    // Create failure audit log
    await createAuditLog(
      {
        actorId,
        actorName,
        actorEmail,
        action: "update_organization",
        actionType: "update",
        description: "Failed to update organization",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : null,
      },
      request
    );

    return NextResponse.json(
      {
        error: "Failed to update organization",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
