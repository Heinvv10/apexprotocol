import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Check if Clerk is properly configured
const CLERK_CONFIGURED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

// Dev mode - super admin is enabled by default for testing
const DEV_SUPER_ADMIN_ENABLED = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

/**
 * Check if the current user is a super-admin
 * Uses hybrid approach: Clerk publicMetadata + Database flag
 *
 * Priority:
 * 1. Clerk publicMetadata.isSuperAdmin (fast, in JWT)
 * 2. Database users.isSuperAdmin (source of truth)
 */
export async function isSuperAdmin(): Promise<boolean> {
  // Development mode fallback
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    return DEV_SUPER_ADMIN_ENABLED;
  }

  try {
    // First check: Clerk metadata (fastest, in JWT claims)
    const { sessionClaims, userId } = await auth();

    if (!userId) {
      return false;
    }

    // Check Clerk publicMetadata - cast to proper type
    const publicMetadata = sessionClaims?.publicMetadata as { isSuperAdmin?: boolean } | undefined;
    const clerkSuperAdmin = publicMetadata?.isSuperAdmin === true;

    if (clerkSuperAdmin) {
      return true;
    }

    // Second check: Database (source of truth)
    const dbUser = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    return dbUser[0]?.isSuperAdmin ?? false;
  } catch {
    // In development, fall back to dev setting
    if (process.env.NODE_ENV === "development") {
      return DEV_SUPER_ADMIN_ENABLED;
    }
    return false;
  }
}

/**
 * Require super-admin access - throws if not super-admin
 * Use this in API routes and server components
 */
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  // Development mode fallback
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    if (!DEV_SUPER_ADMIN_ENABLED) {
      throw new Error("Super admin access required. Set DEV_SUPER_ADMIN=true in .env");
    }
    return { userId: "dev-super-admin" };
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Authentication required");
    }

    const isSuper = await isSuperAdmin();

    if (!isSuper) {
      throw new Error("Super admin access required");
    }

    return { userId };
  } catch (error) {
    if (process.env.NODE_ENV === "development" && DEV_SUPER_ADMIN_ENABLED) {
      return { userId: "dev-super-admin" };
    }
    throw error;
  }
}

/**
 * Get super-admin user details with validation
 */
export async function getSuperAdminUser(): Promise<{
  userId: string;
  email: string;
  name: string | null;
  isSuperAdmin: true;
} | null> {
  // Development mode fallback
  if (!CLERK_CONFIGURED && process.env.NODE_ENV === "development") {
    if (DEV_SUPER_ADMIN_ENABLED) {
      return {
        userId: "dev-super-admin",
        email: "superadmin@dev.local",
        name: "Dev Super Admin",
        isSuperAdmin: true,
      };
    }
    return null;
  }

  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    const isSuper = await isSuperAdmin();

    if (!isSuper) {
      return null;
    }

    return {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      name: user.fullName,
      isSuperAdmin: true,
    };
  } catch {
    if (process.env.NODE_ENV === "development" && DEV_SUPER_ADMIN_ENABLED) {
      return {
        userId: "dev-super-admin",
        email: "superadmin@dev.local",
        name: "Dev Super Admin",
        isSuperAdmin: true,
      };
    }
    return null;
  }
}

/**
 * Grant super-admin status to a user
 * Only callable by existing super-admins
 */
export async function grantSuperAdmin(
  targetUserId: string,
  grantedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the granting user is a super-admin
    const granter = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.clerkUserId, grantedByUserId))
      .limit(1);

    if (!granter[0]?.isSuperAdmin) {
      return { success: false, error: "Only super-admins can grant super-admin status" };
    }

    // Update the target user
    await db
      .update(users)
      .set({
        isSuperAdmin: true,
        superAdminGrantedAt: new Date(),
        superAdminGrantedBy: grantedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, targetUserId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grant super-admin status",
    };
  }
}

/**
 * Revoke super-admin status from a user
 * Only callable by existing super-admins
 */
export async function revokeSuperAdmin(
  targetUserId: string,
  revokedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the revoking user is a super-admin
    const revoker = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.clerkUserId, revokedByUserId))
      .limit(1);

    if (!revoker[0]?.isSuperAdmin) {
      return { success: false, error: "Only super-admins can revoke super-admin status" };
    }

    // Prevent self-revocation (safety measure)
    if (targetUserId === revokedByUserId) {
      return { success: false, error: "Cannot revoke your own super-admin status" };
    }

    // Update the target user
    await db
      .update(users)
      .set({
        isSuperAdmin: false,
        superAdminGrantedAt: null,
        superAdminGrantedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, targetUserId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke super-admin status",
    };
  }
}

/**
 * List all super-admin users
 * Only callable by super-admins
 */
export async function listSuperAdmins(): Promise<
  Array<{
    id: string;
    clerkUserId: string;
    email: string;
    name: string | null;
    superAdminGrantedAt: Date | null;
    superAdminGrantedBy: string | null;
  }>
> {
  const superAdmins = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      email: users.email,
      name: users.name,
      superAdminGrantedAt: users.superAdminGrantedAt,
      superAdminGrantedBy: users.superAdminGrantedBy,
    })
    .from(users)
    .where(eq(users.isSuperAdmin, true));

  return superAdmins;
}
