import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";

const DEV_SUPER_ADMIN_ENABLED = process.env.NODE_ENV === "development" && process.env.DEV_SUPER_ADMIN === "true";

/**
 * Check if the current user is a super-admin.
 * Uses database as source of truth.
 */
export async function isSuperAdmin(): Promise<boolean> {
  if (process.env.NODE_ENV === "development" && DEV_SUPER_ADMIN_ENABLED) {
    return true;
  }

  try {
    const session = await getSession();
    if (!session?.userId) return false;

    const dbUser = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.clerkUserId, session.userId))
      .limit(1);

    return dbUser[0]?.isSuperAdmin ?? false;
  } catch {
    return false;
  }
}

/**
 * Require super-admin access — throws if not super-admin.
 */
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  if (process.env.NODE_ENV === "development" && DEV_SUPER_ADMIN_ENABLED) {
    return { userId: "dev-super-admin" };
  }

  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Authentication required");
  }

  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Super admin access required");
  }

  return { userId: session.userId };
}

/**
 * Get super-admin user details with validation.
 */
export async function getSuperAdminUser(): Promise<{
  userId: string;
  email: string;
  name: string | null;
  isSuperAdmin: true;
} | null> {
  if (process.env.NODE_ENV === "development" && DEV_SUPER_ADMIN_ENABLED) {
    return {
      userId: "dev-super-admin",
      email: "superadmin@dev.local",
      name: "Dev Super Admin",
      isSuperAdmin: true,
    };
  }

  try {
    const user = await currentDbUser();
    if (!user) return null;

    const isSuper = await isSuperAdmin();
    if (!isSuper) return null;

    return {
      userId: user.id,
      email: user.email ?? "",
      name: user.name,
      isSuperAdmin: true,
    };
  } catch {
    return null;
  }
}

/**
 * Grant super-admin status to a user.
 * Only callable by existing super-admins.
 */
export async function grantSuperAdmin(
  targetUserId: string,
  grantedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const granter = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.clerkUserId, grantedByUserId))
      .limit(1);

    if (!granter[0]?.isSuperAdmin) {
      return { success: false, error: "Only super-admins can grant super-admin status" };
    }

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
 * Revoke super-admin status from a user.
 * Only callable by existing super-admins.
 */
export async function revokeSuperAdmin(
  targetUserId: string,
  revokedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const revoker = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.clerkUserId, revokedByUserId))
      .limit(1);

    if (!revoker[0]?.isSuperAdmin) {
      return { success: false, error: "Only super-admins can revoke super-admin status" };
    }

    if (targetUserId === revokedByUserId) {
      return { success: false, error: "Cannot revoke your own super-admin status" };
    }

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
 * List all super-admin users.
 */
export async function listSuperAdmins(): Promise<
  Array<{
    id: string;
    clerkUserId: string | null;
    email: string;
    name: string | null;
    superAdminGrantedAt: Date | null;
    superAdminGrantedBy: string | null;
  }>
> {
  return db
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
}
