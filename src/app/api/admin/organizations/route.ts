/**
 * Admin Organizations API
 * GET /api/admin/organizations - List all organizations
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { eq, sql, ilike, or, desc } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(request: NextRequest) {
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
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

    // Get organizations with user count
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
      })
      .from(organizations)
      .leftJoin(users, eq(users.organizationId, organizations.id))
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
  try {
    // In dev mode, allow access if DEV_SUPER_ADMIN is set
    const devSuperAdmin = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check super-admin status
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        return NextResponse.json(
          { error: "Forbidden - Super admin access required" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { organizationId, updates } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      organization: updated,
    });
  } catch (error) {
    console.error("Admin organizations PATCH error:", error);
    return NextResponse.json(
      {
        error: "Failed to update organization",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
