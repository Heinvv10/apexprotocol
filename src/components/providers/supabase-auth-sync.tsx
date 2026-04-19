"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { useAuthStore } from "@/stores/auth";

/**
 * Bridges Supabase Auth session into the Zustand auth store.
 * Mounted in src/app/layout.tsx. On any auth state change (sign-in,
 * sign-out, token refresh):
 *   1. Updates the user object from auth.users
 *   2. Fetches public.users + organization via /api/auth/context
 *   3. Populates organization + membership in the store
 */
export function SupabaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const setMembership = useAuthStore((s) => s.setMembership);
  const supabase = createBrowserClient();

  useEffect(() => {
    let mounted = true;

    async function syncFromAuthUser(authUserId: string, email: string, name: string | null) {
      if (!mounted) return;
      setUser({
        id: authUserId,
        email,
        firstName: name?.split(" ")[0],
        lastName: name?.split(" ").slice(1).join(" ") || undefined,
        fullName: name ?? undefined,
      });

      try {
        const res = await fetch("/api/auth/context", { cache: "no-store" });
        if (!res.ok) return;
        const { user, organization, membership } = await res.json();
        if (!mounted) return;
        if (user) {
          setUser({
            id: user.id,
            email: user.email,
            firstName: user.name?.split(" ")[0],
            lastName: user.name?.split(" ").slice(1).join(" ") || undefined,
            fullName: user.name ?? undefined,
          });
        }
        setOrganization(organization ?? null);
        setMembership(membership ?? null);
      } catch {
        // network error — leave whatever is already in store
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setUser(null);
        setOrganization(null);
        setMembership(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as { name?: string };
      void syncFromAuthUser(user.id, user.email ?? "", meta.name ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setOrganization(null);
          setMembership(null);
          return;
        }
        const meta = (session.user.user_metadata ?? {}) as { name?: string };
        void syncFromAuthUser(session.user.id, session.user.email ?? "", meta.name ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setOrganization, setMembership, supabase]);

  return null;
}
