import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrganizationId } from "@/lib/auth/supabase-server";

// Validation schema for team member invite
const inviteTeamMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().optional().nullable(),
  role: z.enum(["admin", "editor", "viewer"]).optional().default("viewer"),
});

// Validation schema for team member update
const updateTeamMemberSchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/settings/team
 * Returns all team members for the organization
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

    const teamMembers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isActive: users.isActive,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, orgId));

    return NextResponse.json({
      success: true,
      data: teamMembers,
      meta: {
        total: teamMembers.length,
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
 * POST /api/settings/team
 * Invites a new team member (creates placeholder user)
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
    const validatedData = inviteTeamMemberSchema.parse(body);

    // Check if user with email already exists in organization
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, validatedData.email),
          eq(users.organizationId, orgId)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists in the organization" },
        { status: 409 }
      );
    }

    // Create placeholder user. authUserId is left null until the invitee signs in
    // via Supabase Auth and the auth callback fills it in by email match.
    const newUser = await db
      .insert(users)
      .values({
        organizationId: orgId,
        email: validatedData.email,
        name: validatedData.name ?? null,
        role: validatedData.role,
        isActive: false, // Inactive until they accept invite
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          role: newUser[0].role,
          isActive: newUser[0].isActive,
          createdAt: newUser[0].createdAt,
        },
        message: "Invitation sent successfully",
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
 * PATCH /api/settings/team
 * Updates a team member (expects userId in query params)
 */
export async function PATCH(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    const userId = request.nextUrl.searchParams.get("userId");

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify user belongs to organization
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.organizationId, orgId)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateTeamMemberSchema.parse(body);

    const updatedUser = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        role: updatedUser[0].role,
        isActive: updatedUser[0].isActive,
        updatedAt: updatedUser[0].updatedAt,
      },
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

/**
 * DELETE /api/settings/team
 * Removes a team member (expects userId in query params)
 */
export async function DELETE(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    const userId = request.nextUrl.searchParams.get("userId");

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify user belongs to organization
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.organizationId, orgId)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    // Soft delete - deactivate the user
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
