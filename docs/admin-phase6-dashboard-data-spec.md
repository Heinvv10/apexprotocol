# Phase 6: Admin Dashboard Data Integration - Specification

**Date**: 2025-12-17
**Status**: IN PROGRESS
**Protocol**: Doc-Driven TDD (RED → GREEN → REFACTOR)
**Previous Phase**: Phase 5 - System Audit Logs (COMPLETE)

---

## Overview

Phase 6 connects the admin dashboard to real data from the database, replacing all hardcoded mock values with live statistics, system health metrics, and recent activity from audit logs.

---

## Functional Requirements

### FR-1: Dashboard Statistics API
**Endpoint**: `GET /api/admin/dashboard/stats`

Returns aggregated statistics for the admin dashboard:

```typescript
interface DashboardStats {
  totalOrganizations: number;
  organizationsThisMonth: number;
  totalUsers: number;
  usersThisWeek: number;
  activeSessions: number;  // Users active in last 15 minutes
  apiRequests24h: number;
  apiRequestsChange: number;  // Percentage change vs previous 24h
}
```

**Acceptance Criteria**:
- AC-1.1: Returns total count of organizations from database
- AC-1.2: Returns count of organizations created in current month
- AC-1.3: Returns total count of users from database
- AC-1.4: Returns count of users created in current week
- AC-1.5: Returns count of active sessions (users with activity in last 15 min)
- AC-1.6: Returns API request count from last 24 hours
- AC-1.7: Calculates percentage change vs previous 24h period
- AC-1.8: Requires super-admin authentication
- AC-1.9: Returns 401 if not authenticated
- AC-1.10: Returns 403 if not super-admin

---

### FR-2: System Health API
**Endpoint**: `GET /api/admin/dashboard/health`

Returns system health status for all services:

```typescript
interface SystemHealth {
  apiServer: {
    status: "healthy" | "warning" | "critical";
    uptime: string;  // e.g., "99.9%"
    responseTime: number;  // ms
  };
  database: {
    status: "healthy" | "warning" | "critical";
    latency: number;  // ms
    connectionPool: {
      active: number;
      idle: number;
      max: number;
    };
  };
  redis: {
    status: "healthy" | "warning" | "critical";
    connected: boolean;
    memoryUsage: string;
  };
  jobQueue: {
    status: "healthy" | "warning" | "critical";
    pending: number;
    failed: number;
    completed24h: number;
  };
  aiServices: {
    status: "healthy" | "warning" | "critical";
    configuredCount: number;
    activeCount: number;
    errorCount: number;
  };
}
```

**Acceptance Criteria**:
- AC-2.1: Checks database connectivity and measures latency
- AC-2.2: Checks Redis connectivity if configured
- AC-2.3: Returns job queue statistics from BullMQ if configured
- AC-2.4: Returns AI service status from api_integrations table
- AC-2.5: Returns "warning" status if latency > 100ms
- AC-2.6: Returns "critical" status if service unreachable
- AC-2.7: Requires super-admin authentication

---

### FR-3: Resource Usage API
**Endpoint**: `GET /api/admin/dashboard/resources`

Returns resource utilization metrics:

```typescript
interface ResourceUsage {
  database: {
    sizeBytes: number;
    sizeFormatted: string;  // e.g., "2.4 GB"
    maxSizeBytes: number;
    maxSizeFormatted: string;
    usagePercent: number;
  };
  storage: {
    usedBytes: number;
    usedFormatted: string;
    maxBytes: number;
    maxFormatted: string;
    usagePercent: number;
  };
  apiUsage: {
    requestsToday: number;
    requestsLimit: number;
    usagePercent: number;
  };
}
```

**Acceptance Criteria**:
- AC-3.1: Returns database size from PostgreSQL
- AC-3.2: Calculates storage usage from file uploads table
- AC-3.3: Returns API usage statistics
- AC-3.4: Formats bytes to human-readable strings
- AC-3.5: Calculates usage percentages
- AC-3.6: Requires super-admin authentication

---

### FR-4: Recent Activity API
**Endpoint**: `GET /api/admin/dashboard/activity`

Returns recent admin activity from audit logs:

```typescript
interface RecentActivity {
  activities: Array<{
    id: string;
    action: string;
    actionType: string;
    actorName: string;
    actorEmail: string;
    targetType: string;
    targetName: string;
    description: string;
    timestamp: string;
    relativeTime: string;  // e.g., "5 minutes ago"
  }>;
}
```

**Query Parameters**:
- `limit`: Number of activities to return (default: 10, max: 50)

**Acceptance Criteria**:
- AC-4.1: Returns recent activities from system_audit_logs table
- AC-4.2: Orders by timestamp descending (most recent first)
- AC-4.3: Includes actor name and email
- AC-4.4: Includes target type and name
- AC-4.5: Calculates relative time (e.g., "5 minutes ago")
- AC-4.6: Respects limit parameter
- AC-4.7: Requires super-admin authentication

---

### FR-5: Dashboard UI Integration
**File**: `src/app/admin/page.tsx`

Update the admin dashboard to fetch and display real data:

**Acceptance Criteria**:
- AC-5.1: Fetches statistics on page load
- AC-5.2: Displays loading states while fetching
- AC-5.3: Handles error states gracefully
- AC-5.4: Auto-refreshes data every 30 seconds
- AC-5.5: Manual refresh button triggers immediate fetch
- AC-5.6: Displays real organization count
- AC-5.7: Displays real user count
- AC-5.8: Displays system health indicators
- AC-5.9: Displays recent audit log activities
- AC-5.10: Quick action buttons link to correct routes

---

## Non-Functional Requirements

### NFR-1: Performance
- Dashboard API responses < 500ms
- Parallel fetching of all dashboard data
- Client-side caching with 30-second TTL

### NFR-2: Security
- All endpoints require super-admin authentication
- No sensitive data exposed in responses
- Rate limiting: 60 requests/minute per user

### NFR-3: Error Handling
- Graceful degradation if individual services unavailable
- Partial data returned if some metrics fail
- Clear error messages for troubleshooting

---

## Database Queries

### Stats Query
```sql
-- Total organizations
SELECT COUNT(*) FROM organizations;

-- Organizations this month
SELECT COUNT(*) FROM organizations
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Total users
SELECT COUNT(*) FROM users;

-- Users this week
SELECT COUNT(*) FROM users
WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE);
```

### Database Size Query
```sql
SELECT pg_database_size(current_database()) as size_bytes;
```

### Recent Activity Query
```sql
SELECT * FROM system_audit_logs
ORDER BY timestamp DESC
LIMIT $1;
```

---

## API Routes Structure

```
src/app/api/admin/dashboard/
├── stats/
│   └── route.ts          # GET - Dashboard statistics
├── health/
│   └── route.ts          # GET - System health
├── resources/
│   └── route.ts          # GET - Resource usage
└── activity/
    └── route.ts          # GET - Recent activity
```

---

## Test Cases

### Unit Tests (RED Phase)

#### Stats API Tests
- UT-1: Returns 401 if not authenticated
- UT-2: Returns 403 if not super-admin
- UT-3: Returns correct organization count
- UT-4: Returns correct user count
- UT-5: Returns organizations created this month
- UT-6: Returns users created this week
- UT-7: Calculates API request change percentage

#### Health API Tests
- UT-8: Returns database health status
- UT-9: Returns "warning" when latency > 100ms
- UT-10: Returns "critical" when database unreachable
- UT-11: Returns AI services status from api_integrations
- UT-12: Handles Redis not configured gracefully

#### Resources API Tests
- UT-13: Returns database size in bytes and formatted
- UT-14: Calculates usage percentages correctly
- UT-15: Formats bytes to human-readable strings

#### Activity API Tests
- UT-16: Returns recent audit logs
- UT-17: Respects limit parameter
- UT-18: Orders by timestamp descending
- UT-19: Calculates relative time correctly
- UT-20: Includes actor and target information

---

## Implementation Order

1. **Create API routes** (stats, health, resources, activity)
2. **Write unit tests** (RED phase)
3. **Implement route handlers** (GREEN phase)
4. **Update dashboard UI** to consume APIs
5. **Add loading/error states**
6. **Test end-to-end**

---

## Dependencies

- Phase 5 System Audit Logs (for activity feed)
- Phase 2 Organizations (for org count)
- Phase 3 Users (for user count)
- Phase 4 API Config (for AI services status)

---

**Protocol**: Doc-Driven TDD
**Author**: Claude Code Assistant
