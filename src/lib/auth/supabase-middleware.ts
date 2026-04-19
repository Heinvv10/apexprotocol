import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh Supabase Auth cookies on every request so they don't expire
 * mid-session. Returns the response with updated cookies attached.
 *
 * Called from src/middleware.ts in the Supabase code path. Returns
 * the user id (or null) so the caller can route based on auth state.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
}> {
  let response = NextResponse.next({ request });

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
            request.cookies.set({ name, value, ...options });
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    }
  );

  // Calling getUser() refreshes the session cookie if needed
  const { data: { user } } = await supabase.auth.getUser();
  return { response, userId: user?.id ?? null };
}
