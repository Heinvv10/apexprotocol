import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import type { AuthSession } from "./auth-session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_AUTH_CONFIGURED =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "https://placeholder.supabase.co";

const DEV_USER_ID = "dev-user-id";
const DEV_ORG_ID = "demo-org-id";

const DEV_SESSION: AuthSession = {
  userId: DEV_USER_ID,
  orgId: DEV_ORG_ID,
  orgRole: "admin",
  orgSlug: "demo-org",
};

async function getSupabaseServerClient() {
  if (!SUPABASE_AUTH_CONFIGURED) {
    throw new Error("Supabase Auth not configured");
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // cookies().set() throws in server components — middleware refreshes
        }
      },
    },
  });
}

export async function getSession(): Promise<AuthSession | null> {
  // 1. API-key auth (set by middleware via x-apex-* headers)
  try {
    const headersList = await headers();
    const authType = headersList.get("x-apex-auth-type");
    if (authType === "api-key") {
      const userId = headersList.get("x-apex-user-id");
      const orgId = headersList.get("x-apex-org-id");
      if (userId) {
        return {
          userId,
          orgId: orgId || null,
          orgRole: null,
          orgSlug: null,
        };
      }
    }
  } catch {
    // headers() may throw outside request context — fall through
  }

  // 2. Dev mode bypass when Supabase isn't configured
  if (!SUPABASE_AUTH_CONFIGURED && process.env.NODE_ENV === "development") {
    return DEV_SESSION;
  }

  // 3. Supabase cookie session
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const orgCtx = await getOrgContextForAuthUser(user.id);
    return {
      userId: user.id,
      orgId: orgCtx?.orgId ?? null,
      orgRole: orgCtx?.role ?? null,
      orgSlug: orgCtx?.slug ?? null,
    };
  } catch {
    if (process.env.NODE_ENV === "development") {
      return DEV_SESSION;
    }
    return null;
  }
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized — no active session");
  }
  return session;
}

async function getOrgContextForAuthUser(authUserId: string): Promise<
  { orgId: string; role: "admin" | "editor" | "viewer"; slug: string | null } | null
> {
  const rows = await db
    .select({
      orgId: users.organizationId,
      role: users.role,
      slug: organizations.slug,
    })
    .from(users)
    .leftJoin(organizations, eq(organizations.id, users.organizationId))
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  if (!row.orgId) return null;
  return {
    orgId: row.orgId,
    role: row.role,
    slug: row.slug ?? null,
  };
}

export async function getOrgContext(authUserId: string) {
  return getOrgContextForAuthUser(authUserId);
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

export async function getOrganizationId(): Promise<string | null> {
  const session = await getSession();
  return session?.orgId ?? null;
}

/**
 * Returns the current user's full DB row (or null).
 * Replaces Clerk's currentUser() helper.
 */
export async function currentDbUser() {
  const session = await getSession();
  if (!session) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, session.userId))
    .limit(1);
  return rows[0] ?? null;
}
