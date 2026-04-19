import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/supabase-server";

/**
 * Returns the current user's full context for client-side stores.
 * Used by SupabaseAuthSync to populate Zustand on auth state changes.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, organization: null, membership: null });
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, session.userId))
    .limit(1);
  const user = userRows[0] ?? null;

  let organization = null;
  let membership = null;
  if (user?.organizationId) {
    const orgRows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);
    organization = orgRows[0]
      ? { id: orgRows[0].id, name: orgRows[0].name, slug: orgRows[0].slug ?? undefined }
      : null;
    membership = {
      id: user.id,
      role: user.role,
      userId: user.id,
      organizationId: user.organizationId,
    };
  }

  return NextResponse.json({ user: user ? { ...user, id: user.id } : null, organization, membership });
}
