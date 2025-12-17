# Admin Phase 5.1 - Audit Logging Middleware Integration

**Protocol**: Doc-Driven TDD
**Author**: Claude Code Assistant
**Date**: 2025-12-17
**Status**: Specification Phase

---

## Overview

This specification defines the audit logging middleware that will automatically record all administrative actions across the Apex platform. This completes Phase 5 by making the audit log system functional and integrated.

### Goals

1. Create reusable audit logging utility
2. Integrate audit logging into all admin API routes
3. Automatically capture action metadata (IP, user agent, session, etc.)
4. Maintain integrity hash chain across all logs
5. Handle errors gracefully without breaking API operations
6. Provide 100% test coverage with unit and E2E tests

---

## Functional Requirements

### FR-1: Audit Logger Utility

**Description**: Create a reusable `createAuditLog()` function that can be called from any API route.

**Location**: `src/lib/audit-logger.ts`

**Acceptance Criteria**:
- AC-1.1: Function accepts log data and NextRequest object
- AC-1.2: Automatically extracts IP address from request headers
- AC-1.3: Automatically extracts user agent from request headers
- AC-1.4: Generates integrity hash using SHA-256
- AC-1.5: Retrieves previous log hash and chains to it
- AC-1.6: Inserts log into database using Drizzle ORM
- AC-1.7: Returns created log entry or null on failure
- AC-1.8: Never throws errors (logs errors internally)
- AC-1.9: Works with both authenticated and system actions

**Function Signature**:
```typescript
interface CreateAuditLogParams {
  // Actor (who performed the action)
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;

  // Action details
  action: string;
  actionType: "create" | "update" | "delete" | "access" | "security" | "system";
  description: string;

  // Target (what was affected)
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;

  // Changes (for update actions)
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  // Additional metadata
  metadata?: {
    sessionId?: string;
    requestId?: string;
    duration?: number;
  };

  // Status
  status?: "success" | "failure" | "warning";
  errorMessage?: string | null;
  errorStack?: string | null;
}

async function createAuditLog(
  params: CreateAuditLogParams,
  request: NextRequest
): Promise<AuditLog | null>
```

### FR-2: User Management Integration

**Description**: Add audit logging to all user management routes.

**Routes to Instrument**:
1. `GET /api/admin/users` - Log when super-admin lists users
2. `POST /api/admin/users` - Log user creation
3. `PATCH /api/admin/users/[id]` - Log user updates
4. `DELETE /api/admin/users/[id]` - Log user deletion
5. `POST /api/admin/users/[id]/suspend` - Log user suspension/activation
6. `POST /api/admin/users/[id]/super-admin` - Log super-admin grant/revoke

**Acceptance Criteria**:
- AC-2.1: All successful operations generate success audit logs
- AC-2.2: All failed operations generate failure audit logs with error details
- AC-2.3: Logs include before/after changes for updates
- AC-2.4: Super-admin grants include granter information
- AC-2.5: User suspensions include reason (if provided)

### FR-3: Organization Management Integration

**Description**: Add audit logging to organization management routes.

**Routes to Instrument**:
1. `GET /api/admin/organizations` - Log when super-admin lists organizations
2. `POST /api/admin/organizations` - Log organization creation
3. `PATCH /api/admin/organizations/[id]` - Log organization updates
4. `DELETE /api/admin/organizations/[id]` - Log organization deletion
5. `PATCH /api/admin/organizations/[id]/settings` - Log settings changes

**Acceptance Criteria**:
- AC-3.1: Organization creation logs include plan tier
- AC-3.2: Settings changes log before/after values
- AC-3.3: Deletion logs include affected user count
- AC-3.4: Plan changes (if any) log old and new plan

### FR-4: API Configuration Integration

**Description**: Add audit logging to API configuration routes.

**Routes to Instrument**:
1. `GET /api/admin/api-config` - Log when super-admin views configs
2. `POST /api/admin/api-config` - Log API config creation
3. `PATCH /api/admin/api-config/[id]` - Log config updates
4. `DELETE /api/admin/api-config/[id]` - Log config deletion
5. `POST /api/admin/api-config/[id]/test` - Log connection tests

**Acceptance Criteria**:
- AC-4.1: Sensitive data (API keys) NOT logged in changes
- AC-4.2: Config updates log before/after (excluding secrets)
- AC-4.3: Connection test results logged (success/failure)
- AC-4.4: Deletion logs include affected brands count

### FR-5: Metadata Capture

**Description**: Automatically capture request metadata for all audit logs.

**Acceptance Criteria**:
- AC-5.1: IP address extracted from x-forwarded-for or x-real-ip headers
- AC-5.2: User agent extracted from user-agent header
- AC-5.3: Session ID extracted from Clerk session (if available)
- AC-5.4: Request ID generated as unique identifier
- AC-5.5: Duration calculated for operations (start to end)
- AC-5.6: Location extracted from IP (optional, can be null)

### FR-6: Integrity Hash Chain

**Description**: Maintain cryptographic integrity chain across all audit logs.

**Acceptance Criteria**:
- AC-6.1: Each log generates SHA-256 hash of its contents
- AC-6.2: Hash includes previousLogHash to form chain
- AC-6.3: First log in database has null previousLogHash
- AC-6.4: Hash includes all critical fields (actor, action, target, timestamp)
- AC-6.5: Hash is deterministic (same input = same hash)
- AC-6.6: Previous log hash retrieved using database query

---

## Security Requirements

### SR-1: Data Protection

- No sensitive data (passwords, API keys, tokens) in audit logs
- Redact sensitive fields before logging changes
- Only super-admins can view audit logs

### SR-2: Integrity Protection

- Integrity hash prevents log tampering
- Previous log hash creates verifiable chain
- Any chain break detectable via verification

### SR-3: Error Handling

- Audit logging failures never break API operations
- Errors logged internally but not exposed to clients
- Failed audit logs attempt retry (optional)

---

## Edge Cases

### EC-1: Database Connection Failure

**Scenario**: Database unavailable when creating audit log
**Handling**: Log error, return null, API operation continues
**Test**: Mock database failure, verify API still works

### EC-2: Concurrent Log Creation

**Scenario**: Multiple logs created simultaneously
**Handling**: Database handles concurrent inserts correctly
**Test**: Create logs in parallel, verify all saved
**Note**: Previous hash may not chain perfectly if concurrent

### EC-3: Missing Request Context

**Scenario**: Audit log created without NextRequest (system action)
**Handling**: Use null/default values for IP, user agent
**Test**: Call createAuditLog with null request

### EC-4: Sensitive Data in Changes

**Scenario**: Changes object contains API keys or passwords
**Handling**: Redact sensitive fields before logging
**Test**: Pass changes with "apiKey", verify redacted

### EC-5: Very Long Descriptions

**Scenario**: Description exceeds reasonable length
**Handling**: Truncate to 1000 characters
**Test**: Pass 2000 character description, verify truncated

---

## Test Strategy

### Unit Tests (`src/lib/audit-logger.test.ts`)

1. **Hash Generation**
   - Test deterministic hash generation
   - Test hash includes all fields
   - Test hash chains correctly

2. **Metadata Extraction**
   - Test IP address extraction from headers
   - Test user agent extraction
   - Test session ID extraction (mocked Clerk)

3. **Sensitive Data Redaction**
   - Test password redaction
   - Test API key redaction
   - Test token redaction

4. **Error Handling**
   - Test database failure handling
   - Test null request handling
   - Test invalid data handling

5. **Previous Hash Retrieval**
   - Test gets latest log hash
   - Test handles empty database
   - Test handles concurrent inserts

### Integration Tests (API Route Tests)

For each instrumented route:
1. Test successful operation creates audit log
2. Test failed operation creates failure audit log
3. Test audit log contains correct data
4. Test changes captured correctly
5. Test API works even if audit logging fails

### E2E Tests (`tests/e2e/audit-logging.spec.ts`)

1. **User Management Journey**
   - Super-admin creates user
   - Verify audit log appears in UI
   - Super-admin suspends user
   - Verify suspension logged
   - View log details modal
   - Verify all fields present

2. **Organization Management Journey**
   - Create organization
   - Update settings
   - Verify both logs appear
   - Check integrity chain

3. **API Config Journey**
   - Create API config
   - Test connection
   - Update config
   - Verify all three actions logged

4. **Audit Log Search**
   - Filter by actor
   - Filter by action type
   - Search by description
   - Verify correct results

5. **Export Functionality**
   - Perform several actions
   - Export to CSV
   - Verify all actions in export

---

## Implementation Phases

### Phase 1: Core Utility (RED → GREEN)
1. Write `audit-logger.test.ts` (RED phase)
2. Implement `audit-logger.ts` (GREEN phase)
3. Run tests, achieve 100% coverage

### Phase 2: User Management Integration (RED → GREEN)
1. Write tests for each user route
2. Integrate createAuditLog into routes
3. Run tests, verify all pass

### Phase 3: Organization Management Integration (RED → GREEN)
1. Write tests for each org route
2. Integrate createAuditLog into routes
3. Run tests, verify all pass

### Phase 4: API Config Integration (RED → GREEN)
1. Write tests for each API config route
2. Integrate createAuditLog into routes
3. Run tests, verify all pass

### Phase 5: E2E Testing
1. Write Playwright E2E tests
2. Run full journey tests
3. Verify UI shows logs correctly

### Phase 6: Zero Tolerance Check
1. Run `npm run lint`
2. Run `npm run type-check`
3. Run `node scripts/zero-tolerance-check.js`
4. Fix any violations
5. Verify 0 errors

---

## Success Criteria

- [ ] All unit tests pass (>95% coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Zero console.log statements
- [ ] Zero DGTS violations
- [ ] Audit logs appear in UI after actions
- [ ] Integrity chain verifiable
- [ ] Export includes all logged actions
- [ ] API operations work even if audit logging fails

---

## NLNH Commitments

**What I KNOW**:
- ✅ Database schema supports all required fields
- ✅ API routes exist and are functional
- ✅ Audit logs API is tested and working
- ✅ Next.js request headers API
- ✅ SHA-256 hashing in Node.js

**What I DON'T KNOW** (will verify):
- ⚠️ Exact header names used by VPS reverse proxy
- ⚠️ Whether Clerk session provides session ID in request
- ⚠️ Exact format of changes objects in existing routes
- ⚠️ Current error handling patterns in existing routes

**DGTS Protocol**:
- Will read existing route implementations before modifying
- Will test header extraction with actual requests
- Will verify database queries work correctly
- Will not assume Clerk API without checking docs

---

## Definition of Done

1. Specification reviewed and approved ✅
2. Test specifications written
3. All RED phase tests written and failing
4. All GREEN phase implementations complete
5. All tests passing (unit + integration + E2E)
6. Zero Tolerance validation passing
7. Code reviewed for NLNH violations
8. Documentation updated
9. Committed with proper message
10. Verified in production-like environment

---

**Next Steps**:
1. Create test specifications document
2. Write RED phase tests for audit-logger.ts
3. Implement audit-logger.ts (GREEN phase)
4. Integrate into routes one by one
5. Write E2E tests
6. Run Zero Tolerance checks

---

**Protocol**: Doc-Driven TDD
**Status**: Specification Complete - Ready for Test Specs
