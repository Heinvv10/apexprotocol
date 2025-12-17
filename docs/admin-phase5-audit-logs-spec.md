# Phase 5: System Audit Logs - Requirements Specification

**Version**: 1.0
**Date**: 2025-12-17
**Status**: Draft
**Protocol**: Doc-Driven TDD

---

## Overview

Phase 5 implements a comprehensive System Audit Logs feature for the super-admin panel, enabling tracking and monitoring of all admin actions, user activities, and system events for security, compliance, and debugging purposes.

This is different from the existing `audits` table (which tracks SEO/GEO website audits). This new feature tracks system-level activities and administrative actions.

---

## Functional Requirements

### FR-1: View Audit Logs
**User Story**: As a super-admin, I want to view a chronological list of all system activities so I can monitor platform usage and security.

**Acceptance Criteria**:
- AC-1.1: Display audit logs in a table with columns: Timestamp, Actor, Action, Target, Details, IP Address, Status
- AC-1.2: Show logs in reverse chronological order (newest first)
- AC-1.3: Display actor with user name, email, and role badge
- AC-1.4: Color-code actions by type (create=green, update=blue, delete=red, access=gray, security=yellow)
- AC-1.5: Show status badges (success=green, failure=red, warning=yellow)
- AC-1.6: Display human-readable timestamps with relative time ("2 hours ago")
- AC-1.7: Support pagination (50 logs per page)
- AC-1.8: Show total count of logs matching current filters

### FR-2: Filter Audit Logs
**User Story**: As a super-admin, I want to filter audit logs by various criteria so I can quickly find relevant activities.

**Acceptance Criteria**:
- AC-2.1: Filter by actor (user ID or email)
- AC-2.2: Filter by action type (create, update, delete, access, security, system)
- AC-2.3: Filter by target type (user, organization, brand, api_config, system_setting)
- AC-2.4: Filter by status (success, failure, warning)
- AC-2.5: Filter by date range (today, last 7 days, last 30 days, custom range)
- AC-2.6: Support combining multiple filters
- AC-2.7: Show active filters as dismissible chips
- AC-2.8: Provide "Clear all filters" option

### FR-3: Search Audit Logs
**User Story**: As a super-admin, I want to search audit logs by keywords so I can find specific events.

**Acceptance Criteria**:
- AC-3.1: Search across actor name, actor email, action, target, details
- AC-3.2: Case-insensitive search
- AC-3.3: Real-time search (debounced by 300ms)
- AC-3.4: Highlight matching terms in results
- AC-3.5: Show "No results found" message when no matches

### FR-4: View Audit Log Details
**User Story**: As a super-admin, I want to view detailed information about a specific log entry so I can investigate events thoroughly.

**Acceptance Criteria**:
- AC-4.1: Click log row to open details modal
- AC-4.2: Display full event details including:
  - Timestamp (with timezone)
  - Actor (name, email, role, user ID)
  - Action type and description
  - Target (type, ID, name)
  - Changes (before/after values for update actions)
  - Request metadata (IP address, user agent, location)
  - Additional context (error messages, stack traces for failures)
- AC-4.3: Format JSON data with syntax highlighting
- AC-4.4: Display changes as a diff view for update actions
- AC-4.5: Show related logs (other actions by same actor in same session)

### FR-5: Export Audit Logs
**User Story**: As a super-admin, I want to export audit logs so I can analyze them offline or meet compliance requirements.

**Acceptance Criteria**:
- AC-5.1: Export current view (respecting active filters) to CSV
- AC-5.2: Export current view to JSON
- AC-5.3: Include all fields in export
- AC-5.4: Generate filename with timestamp: `apex-audit-logs-YYYY-MM-DD-HHmmss.csv`
- AC-5.5: Show progress indicator for large exports
- AC-5.6: Limit exports to 10,000 records at a time

### FR-6: Real-time Log Updates
**User Story**: As a super-admin, I want to see new audit logs appear automatically so I can monitor live activity.

**Acceptance Criteria**:
- AC-6.1: Poll for new logs every 5 seconds when page is active
- AC-6.2: Show notification badge when new logs available
- AC-6.3: Click badge to reload and show new logs
- AC-6.4: Pause auto-refresh when viewing log details modal
- AC-6.5: Resume auto-refresh when modal is closed

### FR-7: Audit Log Retention
**User Story**: As a system administrator, I want audit logs to be retained according to compliance requirements so we meet legal obligations.

**Acceptance Criteria**:
- AC-7.1: Retain all audit logs for minimum 90 days
- AC-7.2: Archive logs older than 90 days to separate table
- AC-7.3: Provide access to archived logs via separate interface
- AC-7.4: Support configurable retention periods (90, 180, 365 days)
- AC-7.5: Display retention policy on logs page

---

## Security Requirements

### SR-1: Authentication Required
- All audit log endpoints require authentication
- Unauthenticated requests return 401 Unauthorized

### SR-2: Super-Admin Authorization
- Only users with `isSuperAdmin: true` can access audit logs
- Non-super-admin requests return 403 Forbidden
- This is enforced at the API level

### SR-3: Tamper-Proof Logs
- Audit logs are immutable (no UPDATE or DELETE operations)
- Use append-only architecture
- Include cryptographic hash of previous log entry for chain verification
- Store hash in `integrityHash` field

### SR-4: Sensitive Data Protection
- Mask sensitive data in log details (API keys, passwords, tokens)
- Show only last 4 characters of sensitive strings
- Never log full credentials or sensitive user data

### SR-5: Access Logging
- Log all access to audit logs themselves (meta-logging)
- Record who viewed which logs and when
- Prevent tampering with meta-logs

---

## API Endpoints

### GET /api/admin/audit-logs
List audit logs with filtering and pagination.

**Query Parameters**:
- `actor` (string): Filter by actor user ID or email
- `action` (string): Filter by action type
- `targetType` (string): Filter by target type
- `status` (string): Filter by status (success, failure, warning)
- `dateFrom` (string): ISO 8601 date string
- `dateTo` (string): ISO 8601 date string
- `search` (string): Search query
- `page` (number): Page number (default: 1)
- `pageSize` (number): Records per page (default: 50, max: 100)

**Response**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_abc123",
      "timestamp": "2025-12-17T10:30:45.123Z",
      "actorId": "user_xyz789",
      "actorName": "John Doe",
      "actorEmail": "john@example.com",
      "actorRole": "super_admin",
      "action": "update",
      "actionType": "update",
      "description": "Updated organization settings",
      "targetType": "organization",
      "targetId": "org_456",
      "targetName": "Acme Corp",
      "changes": {
        "before": { "plan": "starter" },
        "after": { "plan": "enterprise" }
      },
      "metadata": {
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "location": "San Francisco, CA"
      },
      "status": "success",
      "integrityHash": "sha256:abc123..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 1250,
    "totalPages": 25
  },
  "filters": {
    "actor": null,
    "action": null,
    "targetType": null,
    "status": null,
    "dateFrom": null,
    "dateTo": null,
    "search": null
  }
}
```

### GET /api/admin/audit-logs/:id
Get detailed information about a specific audit log entry.

**Response**:
```json
{
  "success": true,
  "log": {
    "id": "log_abc123",
    "timestamp": "2025-12-17T10:30:45.123Z",
    "actorId": "user_xyz789",
    "actorName": "John Doe",
    "actorEmail": "john@example.com",
    "actorRole": "super_admin",
    "action": "update",
    "actionType": "update",
    "description": "Updated organization settings",
    "targetType": "organization",
    "targetId": "org_456",
    "targetName": "Acme Corp",
    "changes": {
      "before": { "plan": "starter", "maxUsers": 5 },
      "after": { "plan": "enterprise", "maxUsers": 100 }
    },
    "metadata": {
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      "location": "San Francisco, CA",
      "sessionId": "sess_789",
      "requestId": "req_101112"
    },
    "status": "success",
    "errorMessage": null,
    "integrityHash": "sha256:abc123...",
    "previousLogHash": "sha256:xyz789...",
    "relatedLogs": [
      {
        "id": "log_abc122",
        "timestamp": "2025-12-17T10:25:30.000Z",
        "action": "access",
        "description": "Viewed organization details"
      }
    ]
  }
}
```

### POST /api/admin/audit-logs/export
Export audit logs to CSV or JSON.

**Request Body**:
```json
{
  "format": "csv",
  "filters": {
    "actor": null,
    "action": "update",
    "targetType": "organization",
    "status": "success",
    "dateFrom": "2025-12-01T00:00:00Z",
    "dateTo": "2025-12-17T23:59:59Z"
  }
}
```

**Response**:
- Content-Type: `text/csv` or `application/json`
- Content-Disposition: `attachment; filename="apex-audit-logs-2025-12-17-103045.csv"`
- Body: CSV or JSON file content

### POST /api/admin/audit-logs (Internal Use Only)
Create a new audit log entry. This endpoint is called internally by the audit logging middleware, not exposed to UI.

**Request Body**:
```json
{
  "actorId": "user_xyz789",
  "action": "update",
  "actionType": "update",
  "description": "Updated organization settings",
  "targetType": "organization",
  "targetId": "org_456",
  "targetName": "Acme Corp",
  "changes": {
    "before": { "plan": "starter" },
    "after": { "plan": "enterprise" }
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess_789",
    "requestId": "req_101112"
  },
  "status": "success"
}
```

**Response**:
```json
{
  "success": true,
  "logId": "log_abc123"
}
```

---

## Edge Cases

### EC-1: Large Export Requests
- **Scenario**: User attempts to export more than 10,000 logs
- **Handling**: Return error message suggesting narrower filters

### EC-2: Concurrent Log Creation
- **Scenario**: Multiple API calls create logs simultaneously
- **Handling**: Use database-level locking for integrity hash chain
- **Fallback**: If chain breaks, flag logs for manual verification

### EC-3: Missing Actor Information
- **Scenario**: System-triggered action with no user context
- **Handling**: Use "System" as actor name, null actor ID
- **Display**: Show "System" badge in UI

### EC-4: Failed Actions
- **Scenario**: Action fails but needs to be logged
- **Handling**: Set status to "failure", include error message and stack trace
- **Display**: Show error icon and message in UI

---

## Database Schema

### `system_audit_logs` Table

```typescript
export const systemAuditLogs = pgTable("system_audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),

  // Actor (who performed the action)
  actorId: text("actor_id").references(() => users.clerkUserId),
  actorName: text("actor_name"),
  actorEmail: text("actor_email"),
  actorRole: text("actor_role"), // super_admin, org_admin, user, system

  // Action details
  action: text("action").notNull(), // create, update, delete, access, security, system
  actionType: auditActionTypeEnum("action_type").notNull(),
  description: text("description").notNull(),

  // Target (what was affected)
  targetType: text("target_type"), // user, organization, brand, api_config, system_setting
  targetId: text("target_id"),
  targetName: text("target_name"),

  // Changes (for update actions)
  changes: jsonb("changes").$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
  }>(),

  // Request metadata
  metadata: jsonb("metadata").$type<{
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number; // milliseconds
  }>(),

  // Status
  status: auditStatusEnum("status").notNull().default("success"),
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),

  // Integrity chain
  integrityHash: text("integrity_hash"), // Hash of this log entry
  previousLogHash: text("previous_log_hash"), // Hash of previous log for chain verification

  // Timestamps
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### Enums

```typescript
export const auditActionTypeEnum = pgEnum("audit_action_type", [
  "create",
  "update",
  "delete",
  "access",
  "security",
  "system",
]);

export const auditStatusEnum = pgEnum("audit_status_type", [
  "success",
  "failure",
  "warning",
]);
```

---

## UI Components

### Main Audit Logs Page
**Route**: `/admin/audit-logs`

**Layout**:
- Header with title "System Audit Logs" and export button
- Filter panel with dropdowns and date pickers
- Search bar
- Audit logs table
- Pagination controls
- Real-time update indicator

### Audit Log Details Modal
**Trigger**: Click on log row

**Content**:
- Full log details with syntax-highlighted JSON
- Changes diff view
- Related logs section
- Copy button for log ID

---

## Implementation Notes

### Audit Logging Middleware
Create a reusable middleware function that can be called from any API route to log actions:

```typescript
import { createAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  // ... perform action ...

  await createAuditLog({
    actorId: userId,
    action: "create",
    actionType: "create",
    description: "Created new organization",
    targetType: "organization",
    targetId: newOrg.id,
    targetName: newOrg.name,
    metadata: {
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    status: "success",
  });

  return NextResponse.json({ success: true, organization: newOrg });
}
```

### Integrity Hash Chain
Generate hash using SHA-256:

```typescript
import crypto from "crypto";

function generateIntegrityHash(log: AuditLogData, previousHash: string): string {
  const data = JSON.stringify({
    ...log,
    previousLogHash: previousHash,
  });
  return crypto.createHash("sha256").update(data).digest("hex");
}
```

---

## Testing Strategy

### Unit Tests
- API routes (GET list, GET details, POST export)
- Audit logging middleware
- Integrity hash generation
- Filter and search logic

### E2E Tests
- View audit logs table
- Filter logs by various criteria
- Search logs
- View log details
- Export logs to CSV/JSON
- Real-time updates

---

## Success Criteria

- [ ] All functional requirements implemented
- [ ] All security requirements enforced
- [ ] API endpoints tested with 90%+ coverage
- [ ] UI components following Phase 3/4 patterns
- [ ] Integrity hash chain working correctly
- [ ] Export functionality tested with large datasets
- [ ] Real-time updates working without performance issues
- [ ] Documentation complete

---

**Next Steps**:
1. Create test specifications
2. Create database schema
3. Write RED phase tests
4. Implement GREEN phase (API routes)
5. Create UI components
6. Create audit logging middleware for existing API routes

---

**Protocol**: Doc-Driven TDD
**Author**: Claude Code Assistant
**Phase**: 5 - System Audit Logs
