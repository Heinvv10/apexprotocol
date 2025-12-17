/**
 * Admin Users API
 * GET /api/admin/users - List all users across organizations
 * PATCH /api/admin/users - Update user settings (suspend/activate, grant/revoke super-admin)
 * Requires super-admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq, sql, ilike, or, desc, and } from "drizzle-orm";
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
    const organizationId = searchParams.get("organizationId") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // FR-2: Search by name, email, or organization name
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(organizations.name, `%${search}%`)
        )
      );
    }

    // FR-3: Filter by organization
    if (organizationId && organizationId !== "all") {
      conditions.push(eq(users.organizationId, organizationId));
    }

    // FR-3: Filter by role
    if (role && role !== "all") {
      if (role === "super-admin") {
        conditions.push(eq(users.isSuperAdmin, true));
      } else {
        // For org:admin and org:member, we'd need role data from Clerk
        // For now, filter by non-super-admin
        if (role === "org:admin" || role === "org:member") {
          conditions.push(eq(users.isSuperAdmin, false));
        }
      }
    }

    // FR-3: Filter by status
    if (status === "active") {
      conditions.push(eq(users.isActive, true));
    } else if (status === "suspended") {
      conditions.push(eq(users.isActive, false));
    }

    // FR-1: Get users with organization data
    const usersQuery = db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        name: users.name,
        email: users.email,
        organizationId: users.organizationId,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        role: users.role,
        isSuperAdmin: users.isSuperAdmin,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastActiveAt,
        superAdminGrantedAt: users.superAdminGrantedAt,
        superAdminGrantedBy: users.superAdminGrantedBy,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply conditions if any
    if (conditions.length > 0) {
      usersQuery.where(
        conditions.length === 1
          ? conditions[0]
          : and(...conditions)
      );
    }

    const usersList = await usersQuery;

    // Get total count for pagination
    const totalQuery = db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id));

    if (conditions.length > 0) {
      totalQuery.where(
        conditions.length === 1
          ? conditions[0]
          : and(...conditions)
      );
    }

    const [{ count: total }] = await totalQuery;

    return NextResponse.json({
      success: true,
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
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

    let currentUserId = "dev-super-admin";

    if (!devSuperAdmin) {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      currentUserId = userId;

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
    const { userId, updates } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!updates) {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }

    // FR-6 AC-6.5: Cannot revoke own super-admin status
    if (updates.isSuperAdmin === false) {
      // Get the target user's Clerk ID
      const targetUser = await db
        .select({ clerkUserId: users.clerkUserId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (targetUser[0]?.clerkUserId === currentUserId) {
        return NextResponse.json(
          { error: "Cannot revoke your own super-admin status" },
          { status: 403 }
        );
      }
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    // FR-5: Suspend/Activate user
    if (typeof updates.isActive === "boolean") {
      updateData.isActive = updates.isActive;
    }

    // FR-6: Grant/Revoke super-admin
    if (typeof updates.isSuperAdmin === "boolean") {
      updateData.isSuperAdmin = updates.isSuperAdmin;

      if (updates.isSuperAdmin) {
        // Granting super-admin
        updateData.superAdminGrantedAt = new Date();
        updateData.superAdminGrantedBy = currentUserId;
      } else {
        // Revoking super-admin
        updateData.superAdminGrantedAt = null;
        updateData.superAdminGrantedBy = null;
      }
    }

    // Update user
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      {
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
