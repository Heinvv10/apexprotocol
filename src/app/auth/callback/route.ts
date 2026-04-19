import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Handles Supabase Auth redirects after:
 *   - OAuth sign-in (Google, GitHub)
 *   - Email-confirmation links
 *   - Magic-link / password-reset tokens
 *
 * Reads the `code` query param, exchanges it for a session, then
 * redirects to /onboarding (new users) or /dashboard (returning users).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
    );
  }

  // Determine onboarding vs dashboard route
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select({ orgId: users.organizationId })
      .from(users)
      .where(eq(users.authUserId, user.id))
      .limit(1);
    if (rows.length === 0 || !rows[0].orgId) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return response;
}
