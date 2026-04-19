import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _admin: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-side admin operations.
 * NEVER use in client code — service_role key bypasses RLS.
 */
export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase admin client not configured");
    }
    _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/**
 * Replaces Clerk's pattern of `clerkClient.users.getUser(id)`.
 * Looks up an Apex user (with email + name) by their Supabase auth uuid.
 */
export async function getUserByAuthId(authUserId: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      organizationId: users.organizationId,
      isSuperAdmin: users.isSuperAdmin,
    })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Lookup by public.users.id (cuid).
 */
export async function getUserById(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      authUserId: users.authUserId,
      email: users.email,
      name: users.name,
      role: users.role,
      organizationId: users.organizationId,
      isSuperAdmin: users.isSuperAdmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}
