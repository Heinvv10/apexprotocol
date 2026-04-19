-- ============================================================================
-- Migration 0017: Supabase Auth swap
-- ============================================================================
-- Adds bridge from Supabase auth.users to public.users via auth_user_id column,
-- plus a trigger that auto-creates public.users rows on auth.users insert.
-- Keeps clerk_user_id column for one release as historical data; drop in
-- a follow-up migration after Plan 6 cutover stability is verified.
-- ============================================================================

-- 1. Add auth_user_id column linking public.users to auth.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Drop the old unique constraint on clerk_user_id (try both possible names —
--    Drizzle generates _unique suffix, hand-written schema gets _key suffix)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_clerk_user_id_unique;
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_clerk_user_id_key;

-- 3. Make clerk_user_id nullable (so new Supabase signups don't fail NOT NULL)
ALTER TABLE public.users
  ALTER COLUMN clerk_user_id DROP NOT NULL;

-- 4. Trigger function: create public.users row when auth.users row appears.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Include `extensions` in search_path so gen_random_bytes() resolves
-- (Supabase installs pgcrypto into the extensions schema, not public).
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, name, role, organization_id)
  VALUES (
    encode(extensions.gen_random_bytes(12), 'hex'),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'viewer',
    NULL
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Wire trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. Grant trigger function execute permission to GoTrue's role
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin;
