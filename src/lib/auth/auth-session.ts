/**
 * Shared session contract used by all three auth modes:
 *   - Supabase cookie session (post-Plan 3 production)
 *   - API-key auth (programmatic; sets x-apex-* headers in middleware)
 *   - Dev-mode mock (when SUPABASE_AUTH_CONFIGURED=false)
 *
 * Shape preserved exactly from the previous Clerk-era AuthSession so
 * the ~133 consumer files only need an import-line change.
 */

export interface AuthSession {
  /** auth.users.id (Supabase uuid) — was Clerk user_xxx pre-Plan 3 */
  userId: string;

  /** public.users.organization_id (cuid) — null if user hasn't completed onboarding */
  orgId: string | null;

  /** public.users.role — null if user has no membership */
  orgRole: "admin" | "editor" | "viewer" | null;

  /** public.organizations.slug — null if no org */
  orgSlug: string | null;
}
