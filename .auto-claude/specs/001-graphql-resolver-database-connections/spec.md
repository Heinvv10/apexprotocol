# Specification: GraphQL Resolver Database Connections

## Overview

This task establishes database connectivity for all 50+ GraphQL resolvers in the Apex platform by connecting them to Neon PostgreSQL using Drizzle ORM. Currently, the platform displays static/mock data across all resolver categories (brands, mentions, GEO scores, recommendations, audits, content, subscriptions, and integrations). This is a critical foundation that blocks all features from functioning with real data persistence and retrieval.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature implementation that adds database connectivity infrastructure to existing GraphQL resolvers. While the resolvers already exist, they currently return mock data. This task transforms them into production-ready data access points by integrating Drizzle ORM queries and mutations, establishing connection pooling, and implementing error handling for database operations.

## Task Scope

### Services Involved
- **main** (primary) - Next.js application containing all GraphQL resolvers and database integration

### This Task Will:
- [x] Connect query resolvers (brands, mentions, GEO scores, recommendations, audits, content, subscriptions, integrations) to PostgreSQL
- [x] Connect mutation resolvers to persist changes to PostgreSQL database
- [x] Implement error handling for database connection failures and query errors
- [x] Configure production-ready connection pooling for Neon PostgreSQL
- [x] Replace all static/mock data with real database queries using Drizzle ORM
- [x] Define or verify Drizzle schema definitions for all resolver data types
- [x] Establish reusable database access patterns for resolver implementation

### Out of Scope:
- GraphQL schema modifications (existing API contracts must be preserved)
- Frontend component changes (this is backend/data layer only)
- Database schema migrations (assumes schema already exists or will be created separately)
- Authentication/authorization logic (focus is on data access only)
- Performance optimization beyond connection pooling (caching, query optimization as future work)

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Next.js
- ORM: Drizzle
- Database: PostgreSQL (Neon serverless)
- Key directories:
  - `src/` - Source code
  - `tests/` - Test files

**Entry Point:** Next.js application root

**How to Run:**
```bash
npm run dev
```

**Port:** 3000

**Database Connection:**
- Provider: Neon PostgreSQL (@neondatabase/serverless)
- ORM: Drizzle (drizzle-orm)
- Connection URL: `DATABASE_URL` environment variable (already configured)

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| **To be discovered** | main | GraphQL resolver files for brands queries/mutations |
| **To be discovered** | main | GraphQL resolver files for mentions queries/mutations |
| **To be discovered** | main | GraphQL resolver files for GEO scores queries/mutations |
| **To be discovered** | main | GraphQL resolver files for recommendations queries/mutations |
| **To be discovered** | main | GraphQL resolver files for audits queries/mutations |
| **To be discovered** | main | GraphQL resolver files for content queries/mutations |
| **To be discovered** | main | GraphQL resolver files for subscriptions queries/mutations |
| **To be discovered** | main | GraphQL resolver files for integrations queries/mutations |
| **To be discovered** | main | Database connection configuration/initialization |
| **To be discovered** | main | Drizzle schema definitions (verify or create) |

**Note**: Context discovery phase did not locate specific resolver files. Implementation agent must perform codebase exploration to identify:
- GraphQL resolver file locations (likely in `src/graphql/`, `src/api/`, or `src/server/`)
- Drizzle schema file locations (likely in `src/db/schema/` or `src/database/`)
- Existing database connection setup (if any)
- Mock data patterns to replace

## Files to Reference

**Patterns to discover during implementation**:

| Pattern Type | What to Look For |
|--------------|------------------|
| **Drizzle Schema** | Existing table definitions using `pgTable()`, column types, relationships |
| **Database Connection** | Existing Neon client initialization with `neon()` and `drizzle()` |
| **GraphQL Context** | How database client is passed to resolvers (context pattern) |
| **Resolver Structure** | Existing resolver organization (Query/Mutation separation, type resolvers) |
| **Error Handling** | Existing error handling patterns in API routes or server code |

## Patterns to Follow

### Drizzle + Neon Connection Pattern

Based on Neon serverless best practices:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Initialize connection (do this once, reuse across resolvers)
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });
```

**Key Points:**
- Use `neon-http` driver for serverless environments (lower latency)
- Initialize connection once and reuse (connection pooling handled automatically)
- Environment variable `DATABASE_URL` already configured in project

### GraphQL Resolver Database Access Pattern

Standard Apollo Server context pattern:

```typescript
// Context setup (in GraphQL server initialization)
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await startStandaloneServer(server, {
  context: async () => ({ db }),
});

// Resolver implementation
const resolvers = {
  Query: {
    getBrand: async (_parent, { id }, contextValue) => {
      // Access database through context
      const brand = await contextValue.db
        .select()
        .from(brands)
        .where(eq(brands.id, id))
        .limit(1);

      return brand[0] || null;
    },
  },
  Mutation: {
    createBrand: async (_parent, { input }, contextValue) => {
      const [newBrand] = await contextValue.db
        .insert(brands)
        .values(input)
        .returning();

      return newBrand;
    },
  },
};
```

**Key Points:**
- Pass `db` instance through Apollo Server context
- Access via `contextValue.db` in all resolvers
- Use Drizzle's chainable query builder
- Use `.returning()` for PostgreSQL insert/update/delete operations

### Drizzle Query Patterns

```typescript
// Import query builders
import { eq, and, or, like, gt, lt } from 'drizzle-orm';

// SELECT with WHERE
const results = await db.select()
  .from(table)
  .where(eq(table.id, id));

// SELECT with multiple conditions
const filtered = await db.select()
  .from(table)
  .where(and(
    eq(table.status, 'active'),
    gt(table.score, 50)
  ));

// INSERT with RETURNING
const [created] = await db.insert(table)
  .values({ name: 'Example', status: 'active' })
  .returning();

// UPDATE with RETURNING
const [updated] = await db.update(table)
  .set({ status: 'inactive' })
  .where(eq(table.id, id))
  .returning();

// UPSERT (INSERT with conflict handling)
const [upserted] = await db.insert(table)
  .values({ id, name: 'Example' })
  .onConflictDoUpdate({
    target: table.id,
    set: { name: 'Example' },
  })
  .returning();
```

**Key Points:**
- Use `eq()`, `and()`, `or()` from drizzle-orm for WHERE clauses
- Chain `.where()`, `.limit()`, `.orderBy()` for complex queries
- Always use `.returning()` for mutations to get created/updated data
- Drizzle returns arrays - destructure single results with `[result]` or `results[0]`

### Error Handling Pattern

```typescript
const resolver = async (_parent, args, contextValue) => {
  try {
    const result = await contextValue.db
      .select()
      .from(table)
      .where(eq(table.id, args.id));

    if (!result[0]) {
      throw new Error(`Entity with id ${args.id} not found`);
    }

    return result[0];
  } catch (error) {
    // Log error for debugging
    console.error('Database query failed:', error);

    // Throw GraphQL-friendly error
    throw new Error(`Failed to fetch entity: ${error.message}`);
  }
};
```

**Key Points:**
- Wrap database calls in try-catch
- Handle not found cases explicitly
- Log errors for debugging
- Throw user-friendly error messages
- GraphQL will automatically format errors in response

## Requirements

### Functional Requirements

1. **Query Resolver Database Integration**
   - Description: All query resolvers (brands, mentions, GEO scores, recommendations, audits, content, subscriptions, integrations) must fetch data from PostgreSQL using Drizzle ORM
   - Acceptance: Query any resolver endpoint and receive PostgreSQL data (no mock/static data)

2. **Mutation Resolver Database Persistence**
   - Description: All mutation resolvers must persist changes (create, update, delete) to PostgreSQL database
   - Acceptance: Execute mutation and verify data persists in database (query returns updated data)

3. **Database Connection Pooling**
   - Description: Configure production-ready connection pooling for Neon PostgreSQL to handle concurrent requests
   - Acceptance: Multiple concurrent requests succeed without connection errors

4. **Error Handling**
   - Description: Implement error handling for database connection failures, query errors, and constraint violations
   - Acceptance: Database failures return user-friendly GraphQL errors (not raw database errors)

5. **Schema Definitions**
   - Description: Ensure Drizzle schema definitions exist for all resolver data types (brands, mentions, etc.)
   - Acceptance: TypeScript types inferred from schema match GraphQL types

### Edge Cases

1. **Record Not Found** - Return `null` for optional fields, throw error for required queries
2. **Duplicate Key Violations** - Handle unique constraint errors with appropriate error messages
3. **Connection Timeout** - Retry logic or graceful degradation for Neon connection timeouts
4. **Invalid Foreign Keys** - Validate referenced entities exist before creating relationships
5. **Concurrent Updates** - Use database transactions for multi-step mutations to prevent partial updates
6. **Empty Result Sets** - Return empty arrays for list queries with no results (not null/undefined)

## Implementation Notes

### DO
- **Discover resolver locations first** - Use `grep` or file search to find all GraphQL resolver files before modifying
- **Verify Drizzle schemas exist** - Check for existing schema definitions in `src/db/schema/` or similar
- **Follow existing patterns** - If any resolvers already use database, replicate that pattern
- **Use TypeScript types** - Infer types from Drizzle schema using `typeof table.$inferSelect`
- **Test incrementally** - Connect one resolver category at a time and verify before moving to next
- **Preserve GraphQL API contracts** - Do not change field names, types, or resolver signatures
- **Reuse database connection** - Initialize Neon client once, pass through Apollo context to all resolvers
- **Use `.returning()` on mutations** - PostgreSQL best practice for getting created/updated data

### DON'T
- **Don't create new connection per request** - Neon handles pooling, but initialize client once
- **Don't modify GraphQL schema** - Only change resolver implementations, not type definitions
- **Don't skip error handling** - Every database call must be wrapped in try-catch
- **Don't use raw SQL** - Use Drizzle's query builder for type safety
- **Don't commit sensitive data** - Verify DATABASE_URL stays in .env (not version controlled)
- **Don't modify mock data files** - Keep them for testing/development, just don't use in resolvers

## Development Environment

### Start Services

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

### Service URLs
- main: http://localhost:3000
- GraphQL endpoint: http://localhost:3000/api/graphql (typical Next.js API route location)

### Required Environment Variables

**Already configured** (from project_index.json):
- `DATABASE_URL`: PostgreSQL connection string for Neon database
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Authentication (Clerk)
- `CLERK_SECRET_KEY`: Authentication (Clerk)

**Additional dependencies to verify**:
- `drizzle-orm`: Drizzle ORM package
- `@neondatabase/serverless`: Neon PostgreSQL client

**Install if missing**:
```bash
npm install drizzle-orm @neondatabase/serverless
```

## Success Criteria

The task is complete when:

1. [x] All query resolvers (brands, mentions, GEO scores, recommendations, audits, content, subscriptions, integrations) return data from PostgreSQL database
2. [x] All mutation resolvers persist changes to PostgreSQL database
3. [x] Error handling implemented for database connection failures and query errors
4. [x] Production-ready connection pooling configured (Neon handles this by default)
5. [x] No console errors when querying any resolver endpoint
6. [x] Existing GraphQL API contracts preserved (no breaking changes to schema)
7. [x] Database connection initialized once and reused across all resolvers
8. [x] TypeScript types inferred from Drizzle schema (no type errors)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| **Database connection initialization** | `tests/db/connection.test.ts` (create if missing) | Verify Neon client initializes successfully with DATABASE_URL |
| **Query resolver returns database data** | `tests/resolvers/query.test.ts` (create if missing) | Mock database query and verify resolver calls correct Drizzle method |
| **Mutation resolver persists data** | `tests/resolvers/mutation.test.ts` (create if missing) | Mock database insert and verify resolver uses `.returning()` |
| **Error handling for database failures** | `tests/resolvers/error-handling.test.ts` (create if missing) | Mock database error and verify resolver throws user-friendly message |

**Testing Strategy**:
- Use Vitest (already configured in project)
- Mock Drizzle database client for unit tests
- Test resolver logic without actual database connection

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| **Query resolver fetches real data** | main ↔ PostgreSQL | Execute GraphQL query and verify response matches database record |
| **Mutation resolver persists real data** | main ↔ PostgreSQL | Execute GraphQL mutation and verify database contains new record |
| **Error handling for not found** | main ↔ PostgreSQL | Query non-existent ID and verify returns null or error |
| **Concurrent queries** | main ↔ PostgreSQL | Execute multiple queries simultaneously and verify all succeed |

**Testing Strategy**:
- Use test database or Neon branch (not production)
- Seed database with test data
- Execute actual GraphQL queries through Apollo Server
- Verify database state after mutations

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| **Query brand data** | 1. Navigate to brands page 2. Verify data loads | Brand data from PostgreSQL displays in UI |
| **Create brand** | 1. Fill brand form 2. Submit 3. Verify persists | New brand appears in database and UI |
| **Update brand** | 1. Edit brand 2. Save 3. Verify persists | Updated brand data in database and UI |
| **Query mentions** | 1. Navigate to mentions page 2. Verify data loads | Mention data from PostgreSQL displays in UI |
| **Query GEO scores** | 1. Navigate to GEO scores page 2. Verify data loads | GEO score data from PostgreSQL displays in UI |

**Testing Strategy**:
- Use Playwright (already configured in project)
- Run against local development server
- Verify end-to-end data flow from UI → GraphQL → Database

### Browser Verification

| Page/Component | URL | Checks |
|----------------|-----|--------|
| **Brands Dashboard** | `http://localhost:3000/dashboard/brands` (estimate) | ✓ Brands load from database<br>✓ No mock data placeholders<br>✓ No console errors |
| **Mentions View** | `http://localhost:3000/dashboard/mentions` (estimate) | ✓ Mentions load from database<br>✓ Real-time data updates |
| **GEO Scores** | `http://localhost:3000/dashboard/geo-scores` (estimate) | ✓ GEO scores load from database<br>✓ Charts render with real data |
| **GraphQL Playground** | `http://localhost:3000/api/graphql` (estimate) | ✓ Query any resolver and receive data<br>✓ Mutations persist to database |

### Database Verification

| Check | Query/Command | Expected |
|-------|---------------|----------|
| **Database connection** | `psql $DATABASE_URL -c "SELECT 1"` | Returns `1` (connection successful) |
| **Tables exist** | `psql $DATABASE_URL -c "\dt"` | Shows tables: brands, mentions, geo_scores, etc. |
| **Drizzle schema matches** | Compare `src/db/schema/` to database schema | Schema files match actual tables |
| **Data persistence** | Execute mutation → query database | Mutation data exists in database |

### QA Sign-off Requirements

- [x] All unit tests pass (`npm run test`)
- [x] All integration tests pass (GraphQL queries/mutations work with real database)
- [x] All E2E tests pass (`npm run test:e2e`)
- [x] Browser verification complete (all pages load database data)
- [x] Database state verified (mutations persist, queries return correct data)
- [x] No regressions in existing functionality (GraphQL API contracts preserved)
- [x] Code follows established patterns (Drizzle query builder, Apollo context pattern)
- [x] No security vulnerabilities introduced (DATABASE_URL not exposed client-side)
- [x] Error handling verified (database failures return user-friendly errors)
- [x] Connection pooling verified (concurrent requests succeed)

## Implementation Roadmap

**Phase 1: Discovery & Setup** (Prerequisite exploration)
1. Locate all GraphQL resolver files in codebase
2. Verify Drizzle schema definitions exist for all entities
3. Identify existing database connection setup (if any)
4. Map resolver categories to schema tables

**Phase 2: Database Connection Infrastructure**
1. Initialize Neon client with DATABASE_URL
2. Configure Drizzle ORM with Neon HTTP driver
3. Set up Apollo Server context to pass database client
4. Test connection with simple query

**Phase 3: Resolver Implementation** (Incremental by category)
1. **Brands resolvers** - Query and mutation resolvers
2. **Mentions resolvers** - Query and mutation resolvers
3. **GEO scores resolvers** - Query and mutation resolvers
4. **Recommendations resolvers** - Query and mutation resolvers
5. **Audits resolvers** - Query and mutation resolvers
6. **Content resolvers** - Query and mutation resolvers
7. **Subscriptions resolvers** - Query and mutation resolvers
8. **Integrations resolvers** - Query and mutation resolvers

**Phase 4: Error Handling & Testing**
1. Add try-catch to all resolver database calls
2. Write unit tests for resolver logic
3. Write integration tests for database operations
4. Write E2E tests for user flows

**Phase 5: QA Verification**
1. Run all tests (unit, integration, E2E)
2. Verify browser functionality for each category
3. Test concurrent requests and error scenarios
4. Validate database state after mutations

## Critical Dependencies

**Required for implementation**:
- Drizzle schema definitions for all entities (brands, mentions, GEO scores, recommendations, audits, content, subscriptions, integrations)
- GraphQL type definitions (already exist, must preserve)
- DATABASE_URL environment variable (already configured)

**Blockers if missing**:
- No GraphQL resolver files found → Cannot implement
- No Drizzle schema files found → Cannot query database
- DATABASE_URL not configured → Cannot connect

## Notes for Implementation Agent

⚠️ **Context Discovery Gap**: The context phase did not identify specific files to modify. You MUST perform codebase exploration first:

1. **Find GraphQL resolvers**: Search for files containing "resolvers", "Query", "Mutation", "GraphQL"
   ```bash
   # Example search commands
   grep -r "Query:" src/
   grep -r "Mutation:" src/
   find src/ -name "*resolver*"
   find src/ -name "*graphql*"
   ```

2. **Find Drizzle schemas**: Search for files containing "pgTable", "drizzle", "schema"
   ```bash
   grep -r "pgTable" src/
   find src/ -name "*schema*"
   ```

3. **Find database connection**: Search for Neon client initialization
   ```bash
   grep -r "neon(" src/
   grep -r "drizzle(" src/
   ```

4. **Document findings** before implementing:
   - List all resolver file paths
   - List all schema file paths
   - Note any existing database patterns

**Only proceed with implementation after completing discovery phase.**
