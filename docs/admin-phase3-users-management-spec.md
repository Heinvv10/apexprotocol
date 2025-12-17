# Phase 3: Users Management - Requirements Specification

## Overview
Super-admin interface to manage all users across all organizations in the Apex platform.

## Feature Requirements

### FR-1: User Listing
**Description:** Display paginated list of all users across all organizations
**Acceptance Criteria:**
- AC-1.1: Show user table with columns: Name, Email, Organization, Role, Status, Created Date
- AC-1.2: Display 20 users per page by default
- AC-1.3: Show total user count badge
- AC-1.4: Include organization name and slug for each user
- AC-1.5: Show user role (org:admin, org:member, or super-admin)

### FR-2: Search Users
**Description:** Search users by name, email, or organization
**Acceptance Criteria:**
- AC-2.1: Search input filters results in real-time
- AC-2.2: Search is case-insensitive
- AC-2.3: Search matches partial strings in name, email, or organization name
- AC-2.4: Empty search shows all users

### FR-3: Filter Users
**Description:** Filter users by organization, role, and status
**Acceptance Criteria:**
- AC-3.1: Filter by organization (dropdown with all orgs)
- AC-3.2: Filter by role (All, Super Admin, Org Admin, Member)
- AC-3.3: Filter by status (All, Active, Suspended)
- AC-3.4: Filters work in combination
- AC-3.5: Filter state persists during pagination

### FR-4: View User Details
**Description:** View detailed information about a specific user
**Acceptance Criteria:**
- AC-4.1: Display modal with full user details
- AC-4.2: Show: Name, Email, Clerk User ID, Organization, Role, Status
- AC-4.3: Show: Created Date, Last Login, Super Admin status
- AC-4.4: Show: Super Admin granted date and granted by (if applicable)
- AC-4.5: Modal has close button and can be dismissed by clicking outside

### FR-5: Suspend/Activate Users
**Description:** Toggle user active status
**Acceptance Criteria:**
- AC-5.1: Action menu shows "Suspend" for active users
- AC-5.2: Action menu shows "Activate" for suspended users
- AC-5.3: Status updates immediately in UI after action
- AC-5.4: Database field `isActive` is updated
- AC-5.5: Suspended users cannot access the platform

### FR-6: Grant/Revoke Super Admin
**Description:** Manage super-admin privileges for users
**Acceptance Criteria:**
- AC-6.1: Action menu shows "Grant Super Admin" for non-super-admin users
- AC-6.2: Action menu shows "Revoke Super Admin" for super-admin users
- AC-6.3: Status updates immediately in UI
- AC-6.4: Database fields updated: `isSuperAdmin`, `superAdminGrantedAt`, `superAdminGrantedBy`
- AC-6.5: Cannot revoke own super-admin status (safety check)
- AC-6.6: Super-admin badge visible in user table for super-admins

### FR-7: Pagination
**Description:** Navigate through user pages
**Acceptance Criteria:**
- AC-7.1: Show "Previous" and "Next" buttons
- AC-7.2: Display current page number and total pages
- AC-7.3: Display "Showing X to Y of Z users"
- AC-7.4: Previous button disabled on page 1
- AC-7.5: Next button disabled on last page

## API Endpoints

### GET /api/admin/users
**Purpose:** List/search/filter users with pagination
**Query Parameters:**
- `search` (optional): Search term for name/email/org
- `organizationId` (optional): Filter by organization ID
- `role` (optional): Filter by role (super-admin, org:admin, org:member)
- `status` (optional): Filter by status (active, suspended)
- `page` (default: 1): Page number
- `limit` (default: 20): Results per page

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-uuid",
      "clerkUserId": "clerk-user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "organizationId": "org-uuid",
      "organizationName": "Acme Corp",
      "organizationSlug": "acme-corp",
      "role": "org:admin",
      "isSuperAdmin": false,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLoginAt": "2025-01-15T12:00:00Z",
      "superAdminGrantedAt": null,
      "superAdminGrantedBy": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Responses:**
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not super-admin)
- 500: Server error

### PATCH /api/admin/users
**Purpose:** Update user settings (suspend/activate, grant/revoke super-admin)
**Request Body:**
```json
{
  "userId": "user-uuid",
  "updates": {
    "isActive": false,
    // OR
    "isSuperAdmin": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "isActive": false,
    // ... full user object
  }
}
```

**Error Responses:**
- 400: Bad request (missing userId or invalid updates)
- 401: Unauthorized
- 403: Forbidden (not super-admin, or trying to revoke own super-admin)
- 404: User not found
- 500: Server error

## Security Requirements

### SR-1: Authentication
- All endpoints require valid Clerk authentication
- Dev mode bypass: `DEV_SUPER_ADMIN=true` for development

### SR-2: Authorization
- Only super-admins can access these endpoints
- Check via `isSuperAdmin()` function

### SR-3: Self-Protection
- Users cannot revoke their own super-admin status
- Validation check in PATCH endpoint

## Performance Requirements

### PR-1: Query Performance
- User list query must complete in <500ms
- Pagination must use OFFSET/LIMIT efficiently
- Include database indexes on: `organizationId`, `isActive`, `isSuperAdmin`

### PR-2: UI Responsiveness
- Search input debounced (300ms)
- Filter changes update immediately
- Pagination maintains scroll position

## Edge Cases

### EC-1: Empty States
- No users: Show "No users found" message
- No search results: Show "No users match your search"
- All users filtered out: Show "No users match selected filters"

### EC-2: Single User
- If only 1 user (super-admin themselves), show in table
- Cannot suspend or revoke own super-admin

### EC-3: Organization Deletion
- Users from deleted orgs show "Deleted Organization"
- Filter dropdown excludes deleted organizations

## Test Coverage Requirements

- **Unit Tests:** >95% coverage for API routes
- **Integration Tests:** Database queries with test data
- **E2E Tests:** Full user management workflow
- **Security Tests:** Auth and authorization checks
- **Edge Case Tests:** All EC-1, EC-2, EC-3 scenarios

## UI Components

### Page: `/admin/users`
- Location: `src/app/admin/users/page.tsx`
- Client-side React component
- Uses same admin layout as organizations page

### API Routes:
- `src/app/api/admin/users/route.ts` (GET, PATCH)

### Shared Components:
- Reuse admin layout sidebar
- Reuse action menu pattern from organizations
- Reuse modal pattern from organizations
