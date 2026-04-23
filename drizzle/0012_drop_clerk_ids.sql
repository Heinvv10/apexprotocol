-- 0012_drop_clerk_ids: remove the Clerk-era columns and move dependent FKs to users.id
--
-- Context: the codebase migrated to Supabase Auth. `users.clerk_user_id` has been
-- storing the Supabase auth UUID in new rows and the original Clerk id in old rows.
-- `organizations.clerk_org_id` is no longer written and `getOrganizationId()` returns
-- the internal cuid. We:
--   1. Copy clerk_user_id into auth_user_id for rows where auth_user_id is null.
--   2. Drop the six FKs that reference users.clerk_user_id *before* touching the data
--      (otherwise UPDATE ... SET fk_col = users.id trips the old FK immediately).
--   3. Rewrite the FK columns (activity_log, user_gamification, user_achievements,
--      api_integrations.created_by/updated_by, system_audit_logs.actor_id) so they
--      hold users.id (cuid) instead of users.clerk_user_id.
--   4. Null/delete orphaned rows that can't be mapped back to a users.id.
--   5. Re-add FK constraints pointing at users.id.
--   6. Drop users.clerk_user_id and organizations.clerk_org_id.

-- 1. Backfill auth_user_id from clerk_user_id (clerk_user_id now mostly holds Supabase UUIDs)
UPDATE users
SET auth_user_id = clerk_user_id
WHERE auth_user_id IS NULL AND clerk_user_id IS NOT NULL;

--> statement-breakpoint

-- 2. Drop the six FKs that reference users.clerk_user_id.
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_users_clerk_user_id_fk;
ALTER TABLE user_gamification DROP CONSTRAINT IF EXISTS user_gamification_user_id_users_clerk_user_id_fk;
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_users_clerk_user_id_fk;
ALTER TABLE api_integrations DROP CONSTRAINT IF EXISTS api_integrations_created_by_users_clerk_user_id_fk;
ALTER TABLE api_integrations DROP CONSTRAINT IF EXISTS api_integrations_updated_by_users_clerk_user_id_fk;
ALTER TABLE system_audit_logs DROP CONSTRAINT IF EXISTS system_audit_logs_actor_id_users_clerk_user_id_fk;

--> statement-breakpoint

-- 3a. activity_log.user_id: remap old clerk_user_id values to users.id.
UPDATE activity_log
SET user_id = u.id
FROM users u
WHERE activity_log.user_id = u.clerk_user_id;

--> statement-breakpoint

-- 3b. Null any remaining orphans (values that aren't already a valid users.id).
UPDATE activity_log
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = activity_log.user_id);

--> statement-breakpoint

-- 4a. user_gamification.user_id (NOT NULL, UNIQUE): remap.
UPDATE user_gamification
SET user_id = u.id
FROM users u
WHERE user_gamification.user_id = u.clerk_user_id;

--> statement-breakpoint

-- 4b. Delete orphans (column is NOT NULL, can't null them).
DELETE FROM user_gamification
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_gamification.user_id);

--> statement-breakpoint

-- 5a. user_achievements.user_id (NOT NULL): remap.
UPDATE user_achievements
SET user_id = u.id
FROM users u
WHERE user_achievements.user_id = u.clerk_user_id;

--> statement-breakpoint

-- 5b. Delete orphans.
DELETE FROM user_achievements
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_achievements.user_id);

--> statement-breakpoint

-- 6a. api_integrations.created_by / updated_by: remap.
UPDATE api_integrations
SET created_by = u.id
FROM users u
WHERE api_integrations.created_by = u.clerk_user_id;

--> statement-breakpoint

UPDATE api_integrations
SET updated_by = u.id
FROM users u
WHERE api_integrations.updated_by = u.clerk_user_id;

--> statement-breakpoint

-- 6b. Null orphans.
UPDATE api_integrations
SET created_by = NULL
WHERE created_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = api_integrations.created_by);

--> statement-breakpoint

UPDATE api_integrations
SET updated_by = NULL
WHERE updated_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = api_integrations.updated_by);

--> statement-breakpoint

-- 7a. system_audit_logs.actor_id: remap old clerk_user_id values where applicable.
UPDATE system_audit_logs
SET actor_id = u.id
FROM users u
WHERE system_audit_logs.actor_id = u.clerk_user_id;

--> statement-breakpoint

-- 7b. Null orphans (dev-super-admin, stale Clerk ids, etc.).
UPDATE system_audit_logs
SET actor_id = NULL
WHERE actor_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = system_audit_logs.actor_id);

--> statement-breakpoint

-- 8. Re-add FKs pointing at users.id.
ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE set null;

ALTER TABLE user_gamification
  ADD CONSTRAINT user_gamification_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade;

ALTER TABLE user_achievements
  ADD CONSTRAINT user_achievements_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade;

ALTER TABLE api_integrations
  ADD CONSTRAINT api_integrations_created_by_users_id_fk
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE api_integrations
  ADD CONSTRAINT api_integrations_updated_by_users_id_fk
  FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE system_audit_logs
  ADD CONSTRAINT system_audit_logs_actor_id_users_id_fk
  FOREIGN KEY (actor_id) REFERENCES users(id);

--> statement-breakpoint

-- 9. Drop the clerk-era columns.
ALTER TABLE users DROP COLUMN IF EXISTS clerk_user_id;
ALTER TABLE organizations DROP COLUMN IF EXISTS clerk_org_id;
