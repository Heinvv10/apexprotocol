# Phase 3: Users Management - Test Specification

## Test Mapping (Requirements → Tests)

### Unit Tests: API Routes (`src/app/api/admin/users/route.test.ts`)

#### GET /api/admin/users

**FR-1: User Listing**
```typescript
describe('GET /api/admin/users - User Listing', () => {
  // AC-1.1: Show user table with required columns
  it('should return users with all required fields', async () => {
    // Expected fields: id, name, email, organizationId, organizationName,
    // organizationSlug, role, isSuperAdmin, isActive, createdAt
  });

  // AC-1.2: Pagination (20 per page default)
  it('should return 20 users by default', async () => {});

  // AC-1.3: Show total user count
  it('should return total user count in pagination', async () => {});

  // AC-1.4: Include organization data
  it('should include organization name and slug for each user', async () => {});

  // AC-1.5: Show user role
  it('should include role field for each user', async () => {});
});
```

**FR-2: Search Users**
```typescript
describe('GET /api/admin/users - Search', () => {
  // AC-2.1: Search filters results
  it('should filter users by search term in name', async () => {});
  it('should filter users by search term in email', async () => {});
  it('should filter users by search term in organization name', async () => {});

  // AC-2.2: Case-insensitive search
  it('should perform case-insensitive search', async () => {});

  // AC-2.3: Partial string matching
  it('should match partial strings in search', async () => {});

  // AC-2.4: Empty search shows all
  it('should return all users when search is empty', async () => {});
});
```

**FR-3: Filter Users**
```typescript
describe('GET /api/admin/users - Filters', () => {
  // AC-3.1: Filter by organization
  it('should filter users by organizationId', async () => {});

  // AC-3.2: Filter by role
  it('should filter users by role = super-admin', async () => {});
  it('should filter users by role = org:admin', async () => {});
  it('should filter users by role = org:member', async () => {});

  // AC-3.3: Filter by status
  it('should filter active users', async () => {});
  it('should filter suspended users', async () => {});

  // AC-3.4: Combined filters
  it('should apply multiple filters together', async () => {});
});
```

**FR-7: Pagination**
```typescript
describe('GET /api/admin/users - Pagination', () => {
  // AC-7.1, AC-7.2, AC-7.3: Pagination metadata
  it('should return correct pagination metadata', async () => {});

  it('should respect custom page parameter', async () => {});
  it('should respect custom limit parameter', async () => {});
  it('should calculate totalPages correctly', async () => {});
});
```

**Security Requirements**
```typescript
describe('GET /api/admin/users - Security', () => {
  // SR-1: Authentication required
  it('should return 401 when not authenticated', async () => {});

  // SR-2: Super-admin authorization required
  it('should return 403 when not super-admin', async () => {});

  // SR-1: Dev mode bypass
  it('should allow access with DEV_SUPER_ADMIN=true in dev mode', async () => {});
});
```

**Edge Cases**
```typescript
describe('GET /api/admin/users - Edge Cases', () => {
  // EC-1: Empty states
  it('should return empty array when no users exist', async () => {});
  it('should return empty array when search has no matches', async () => {});

  // EC-3: Deleted organization
  it('should handle users from deleted organizations', async () => {});
});
```

#### PATCH /api/admin/users

**FR-5: Suspend/Activate Users**
```typescript
describe('PATCH /api/admin/users - Suspend/Activate', () => {
  // AC-5.3, AC-5.4: Update isActive status
  it('should suspend active user (set isActive=false)', async () => {});
  it('should activate suspended user (set isActive=true)', async () => {});

  // AC-5.5: Verify database update
  it('should persist isActive status to database', async () => {});
});
```

**FR-6: Grant/Revoke Super Admin**
```typescript
describe('PATCH /api/admin/users - Super Admin', () => {
  // AC-6.3, AC-6.4: Grant super-admin
  it('should grant super-admin status', async () => {});
  it('should set superAdminGrantedAt timestamp', async () => {});
  it('should set superAdminGrantedBy to current user', async () => {});

  // AC-6.3, AC-6.4: Revoke super-admin
  it('should revoke super-admin status', async () => {});
  it('should clear superAdminGrantedAt when revoking', async () => {});

  // AC-6.5: Cannot revoke own super-admin
  it('should return 403 when trying to revoke own super-admin status', async () => {});
});
```

**Security & Validation**
```typescript
describe('PATCH /api/admin/users - Security & Validation', () => {
  // 401: Authentication
  it('should return 401 when not authenticated', async () => {});

  // 403: Authorization
  it('should return 403 when not super-admin', async () => {});

  // 400: Validation
  it('should return 400 when userId is missing', async () => {});
  it('should return 400 when updates object is missing', async () => {});

  // 404: Not found
  it('should return 404 when user does not exist', async () => {});

  // SR-3: Self-protection
  it('should prevent user from revoking own super-admin status', async () => {});
});
```

### E2E Tests: UI Workflow (`tests/admin-users.spec.ts`)

**FR-1 & FR-7: Page Load & Display**
```typescript
describe('Admin Users Page', () => {
  it('should display users table on page load', async () => {
    // Navigate to /admin/users
    // Verify table renders
    // Verify columns: Name, Email, Organization, Role, Status, Created, Actions
  });

  it('should show total user count badge', async () => {});

  it('should display pagination controls', async () => {});
});
```

**FR-2: Search**
```typescript
describe('Admin Users - Search', () => {
  it('should filter users by search term', async () => {
    // Type in search input
    // Verify filtered results appear
  });

  it('should show "No users found" when search has no matches', async () => {});
});
```

**FR-3: Filters**
```typescript
describe('Admin Users - Filters', () => {
  it('should filter by organization', async () => {
    // Select organization from dropdown
    // Verify filtered results
  });

  it('should filter by role', async () => {});

  it('should filter by status', async () => {});

  it('should apply multiple filters together', async () => {});
});
```

**FR-4: View Details Modal**
```typescript
describe('Admin Users - View Details', () => {
  it('should open user details modal on "View Details" click', async () => {
    // Click action menu
    // Click "View Details"
    // Verify modal opens with user data
  });

  it('should close modal on close button click', async () => {});

  it('should close modal on outside click', async () => {});
});
```

**FR-5: Suspend/Activate**
```typescript
describe('Admin Users - Suspend/Activate', () => {
  it('should suspend active user', async () => {
    // Open action menu
    // Click "Suspend"
    // Verify status changes to "Inactive"
  });

  it('should activate suspended user', async () => {
    // Open action menu
    // Click "Activate"
    // Verify status changes to "Active"
  });
});
```

**FR-6: Grant/Revoke Super Admin**
```typescript
describe('Admin Users - Super Admin', () => {
  it('should grant super-admin status', async () => {
    // Open action menu
    // Click "Grant Super Admin"
    // Verify super-admin badge appears
  });

  it('should revoke super-admin status', async () => {
    // Open action menu
    // Click "Revoke Super Admin"
    // Verify super-admin badge removed
  });
});
```

**FR-7: Pagination**
```typescript
describe('Admin Users - Pagination', () => {
  it('should navigate to next page', async () => {
    // Click "Next" button
    // Verify new users loaded
    // Verify page number updated
  });

  it('should navigate to previous page', async () => {});

  it('should disable Previous on page 1', async () => {});

  it('should disable Next on last page', async () => {});
});
```

## Test Data Requirements

### Seed Data for Tests
```typescript
// Minimum test data needed:
const testUsers = [
  { name: 'John Doe', email: 'john@acme.com', org: 'Acme', role: 'org:admin', active: true, superAdmin: false },
  { name: 'Jane Smith', email: 'jane@acme.com', org: 'Acme', role: 'org:member', active: true, superAdmin: false },
  { name: 'Bob Admin', email: 'bob@example.com', org: 'Example', role: 'super-admin', active: true, superAdmin: true },
  { name: 'Suspended User', email: 'suspended@test.com', org: 'Test', role: 'org:member', active: false, superAdmin: false },
  // Total: 25+ users for pagination testing
];
```

## Coverage Goals

- **API Routes:** >95% line coverage
- **UI Components:** >90% line coverage
- **E2E Tests:** 100% critical path coverage

## Test Execution Order

1. **Unit Tests** (API routes) - Run first, must all pass
2. **Integration Tests** (Database queries) - Run second
3. **E2E Tests** (UI workflow) - Run last, requires running app

## Commands

```bash
# Run unit tests with coverage
npm test src/app/api/admin/users/route.test.ts -- --coverage

# Run e2e tests
npx playwright test tests/admin-users.spec.ts

# Run all tests
npm test && npm run test:e2e
```
