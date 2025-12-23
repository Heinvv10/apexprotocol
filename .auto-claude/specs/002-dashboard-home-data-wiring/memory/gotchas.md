# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2025-12-23 02:45]
Next.js Turbopack fails in worktrees with "Error: Next.js inferred your workspace root, but it may not be correct" because node_modules are in parent directory. Use the main Apex directory's dev server on port 3000 for testing.

_Context: Running npm run dev in worktree directories_
