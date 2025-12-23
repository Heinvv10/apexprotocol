# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2025-12-23 02:53]
The npm run db:migrate command fails because the __drizzle_migrations table is out of sync - it tries to re-run old migrations (like CREATE TYPE ai_platform) that already exist. Use custom migration scripts or db:push --force for worktrees.

_Context: When applying migrations in git worktrees, the drizzle migration tracking may not match the database state. Our custom script (scripts/apply-completion-tracking-migration.ts) successfully applied the completion tracking columns using IF NOT EXISTS._
