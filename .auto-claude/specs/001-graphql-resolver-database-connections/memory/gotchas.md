# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2025-12-23 01:16]
Integration tests still execute individual test cases even when isDatabaseReachable() returns false in beforeAll. The skipIfNotReachable() helper was added but individual tests need to call it at the start of each test or describe block to properly skip.

_Context: The tests/integration/setup.ts was updated with reachability checking, but tests like edge-cases.test.ts don't use the skip helper at the individual test level. This causes 59 test failures when database is unavailable instead of graceful skipping._

## [2025-12-23 01:27]
Development database has schema type mismatch - brands.id is TEXT but Drizzle schema expects UUID. This prevents integration tests from seeding test data.

_Context: Subtask 5.2 integration test execution. The dev Neon database has different column types (text vs uuid for IDs) than the Drizzle ORM schema definitions. This requires either a fresh database with drizzle-kit push or a schema migration to fix._

## [2025-12-23 01:27]
Integration tests require database schema to be in sync. If tests fail with "relation does not exist" or "incompatible types" errors, run `npx drizzle-kit push --force` to sync the schema. Also ensure .env.local has a valid DATABASE_URL.

_Context: Subtask 5.2 - Integration test verification. Development database had schema mismatch (brands.id TEXT vs UUID, missing tables)._

## [2025-12-23 01:36]
Next.js 16.0.8 deprecates middleware.ts in favor of proxy.ts. All API routes return 404 until src/middleware.ts is migrated to the new src/proxy.ts pattern. The server shows warning: "The middleware file convention is deprecated. Please use proxy instead."

_Context: Subtask 5.3 - GraphQL Playground manual testing. Development server starts but all requests to /api/graphql return 404 due to the middleware deprecation in Next.js 16._

## [2025-12-23 01:37]
Next.js 16.0.8 deprecated middleware.ts in favor of proxy.ts - all API routes return 404 until migration is completed

_Context: Subtask 5.3 - GraphQL endpoint returns 404 due to middleware deprecation in Next.js 16. Server logs show: 'The "middleware" file convention is deprecated. Please use "proxy" instead.' The GraphQL route file is correctly configured but middleware-based auth/routing doesn't work._
