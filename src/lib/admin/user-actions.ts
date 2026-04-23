/**
 * Admin user actions - CRUD operations for user management
 * Implements full user action functionality with Drizzle ORM
 */

import { db } from "@/lib/db";
import { users, roleEnum, type User } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Valid roles from the schema
type UserRole = (typeof roleEnum.enumValues)[number];

/**
 * Get a user by their internal ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

/**
 * Update a user's role
 * @returns The updated user or null if not found
 */
export async function updateUserRole(
  userId: string,
  role: string
): Promise<User | null> {
  // Validate role is a valid enum value
  if (!roleEnum.enumValues.includes(role as UserRole)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${roleEnum.enumValues.join(", ")}`);
  }

  const [updated] = await db
    .update(users)
    .set({
      role: role as UserRole,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}

/**
 * Deactivate a user (soft delete - sets isActive to false)
 * @returns The updated user or null if not found
 */
export async function deactivateUser(userId: string): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}

/**
 * Activate a user (sets isActive to true)
 * @returns The updated user or null if not found
 */
export async function activateUser(userId: string): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}

/**
 * Permanently delete a user (hard delete)
 * WARNING: This is irreversible. Consider using deactivateUser for soft deletion.
 * @returns true if user was deleted, false if not found
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const result = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  return result.length > 0;
}

/**
 * Update user's last active timestamp
 */
export async function updateUserLastActive(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Grant super admin privileges to a user
 * @param userId The user to grant super admin to
 * @param grantedBy The ID of the admin granting the privilege
 */
export async function grantSuperAdmin(
  userId: string,
  grantedBy: string
): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set({
      isSuperAdmin: true,
      superAdminGrantedAt: new Date(),
      superAdminGrantedBy: grantedBy,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}

/**
 * Revoke super admin privileges from a user
 */
export async function revokeSuperAdmin(userId: string): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set({
      isSuperAdmin: false,
      superAdminGrantedAt: null,
      superAdminGrantedBy: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}
