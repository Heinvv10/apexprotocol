# Phase 4: API Configuration Management - Test Specification

## Test Mapping (Requirements → Tests)

### Unit Tests: API Routes (`src/app/api/admin/api-config/route.test.ts`)

#### GET /api/admin/api-config

**FR-1: Integrations List**
```typescript
describe('GET /api/admin/api-config - Integrations List', () => {
  // AC-1.1: Show table with required columns
  it('should return integrations with all required fields', async () => {
    // Expected fields: id, serviceName, provider, category, status,
    // isEnabled, lastVerified, usageThisMonth, quotaRemaining
  });

  // AC-1.3: Show total count
  it('should return all integrations', async () => {});

  // AC-1.4: Group by category
  it('should return categories list', async () => {});
});
```

**FR-7: Search and Filter**
```typescript
describe('GET /api/admin/api-config - Search and Filter', () => {
  // AC-7.1: Search by service name or provider
  it('should filter integrations by search term in service name', async () => {});
  it('should filter integrations by search term in provider', async () => {});

  // AC-7.2: Filter by status
  it('should filter integrations by status = configured', async () => {});
  it('should filter integrations by status = not_configured', async () => {});
  it('should filter integrations by status = disabled', async () => {});
  it('should filter integrations by status = error', async () => {});

  // AC-7.3: Filter by category
  it('should filter integrations by category', async () => {});

  // AC-7.4: Case-insensitive search
  it('should perform case-insensitive search', async () => {});

  // AC-7.5: Combined filters
  it('should apply multiple filters together', async () => {});
});
```

**Security Requirements**
```typescript
describe('GET /api/admin/api-config - Security', () => {
  // SR-1: Authentication required
  it('should return 401 when not authenticated', async () => {});

  // SR-2: Super-admin authorization required
  it('should return 403 when not super-admin', async () => {});

  // SR-1: Dev mode bypass
  it('should allow access with DEV_SUPER_ADMIN=true in dev mode', async () => {});
});
```

#### GET /api/admin/api-config/:id

**FR-5: View Integration Details**
```typescript
describe('GET /api/admin/api-config/:id - Integration Details', () => {
  // AC-5.1, AC-5.2: Full configuration with masked key
  it('should return integration with full details', async () => {});
  it('should mask API key except last 4 characters', async () => {});

  // AC-5.3: Usage statistics
  it('should include usage statistics', async () => {});

  // AC-5.4: Last verified timestamp
  it('should include lastVerified timestamp', async () => {});

  // AC-5.5: Error logs
  it('should include lastError if present', async () => {});

  // AC-5.6: Rate limit info
  it('should include rateLimit information', async () => {});

  // 404: Not found
  it('should return 404 when integration does not exist', async () => {});
});
```

#### POST /api/admin/api-config

**FR-2: Configure API Integration**
```typescript
describe('POST /api/admin/api-config - Create Integration', () => {
  // AC-2.7: API keys encrypted
  it('should encrypt API key before storage', async () => {});

  it('should create new integration with valid data', async () => {});
  it('should set status to configured', async () => {});
  it('should set createdBy to current user', async () => {});

  // Validation
  it('should return 400 when serviceName is missing', async () => {});
  it('should return 400 when provider is missing', async () => {});
  it('should return 400 when category is missing', async () => {});
  it('should return 400 when config is missing', async () => {});
  it('should return 400 when apiKey is missing in config', async () => {});
});
```

#### PATCH /api/admin/api-config/:id

**FR-2: Update Integration & FR-4: Enable/Disable**
```typescript
describe('PATCH /api/admin/api-config/:id - Update Integration', () => {
  it('should update integration config', async () => {});
  it('should encrypt new API key', async () => {});
  it('should update isEnabled flag', async () => {});
  it('should set updatedBy to current user', async () => {});
  it('should update updatedAt timestamp', async () => {});

  // AC-4.2: Disabled status
  it('should set status to disabled when isEnabled = false', async () => {});

  // 404: Not found
  it('should return 404 when integration does not exist', async () => {});
});
```

#### POST /api/admin/api-config/:id/test

**FR-3: Test API Connection**
```typescript
describe('POST /api/admin/api-config/:id/test - Test Connection', () => {
  // AC-3.3: Success response
  it('should return success with connection details', async () => {});
  it('should include responseTime in details', async () => {});

  // AC-3.4: Error response
  it('should return error when API key is invalid', async () => {});
  it('should return error when service is unavailable', async () => {});

  // EC-2: Connection timeout
  it('should return timeout error after 30 seconds', async () => {});

  // SR-5: Rate limiting
  it('should rate limit to 10 requests per minute', async () => {});

  // 404: Not found
  it('should return 404 when integration does not exist', async () => {});
});
```

#### DELETE /api/admin/api-config/:id

**FR-6: Delete Integration**
```typescript
describe('DELETE /api/admin/api-config/:id - Delete Integration', () => {
  // AC-6.4: Successfully deleted
  it('should delete integration', async () => {});

  // SR-4: Audit logging
  it('should create audit log entry', async () => {});

  // 404: Not found
  it('should return 404 when integration does not exist', async () => {});
});
```

### E2E Tests: UI Workflow (`e2e/admin-api-config.spec.ts`)

**FR-1: Page Load & Display**
```typescript
describe('Admin API Config Page', () => {
  it('should display integrations table on page load', async () => {
    // Navigate to /admin/api-config
    // Verify table renders
    // Verify columns: Service Name, Provider, Status, Last Verified, Actions
  });

  it('should show total integrations count badge', async () => {});

  it('should display status badges with correct colors', async () => {});
});
```

**FR-7: Search and Filter**
```typescript
describe('Admin API Config - Search and Filter', () => {
  it('should filter integrations by search term', async () => {
    // Type in search input
    // Verify filtered results appear
  });

  it('should filter by status', async () => {
    // Select status from dropdown
    // Verify filtered results
  });

  it('should filter by category', async () => {
    // Select category from dropdown
    // Verify filtered results
  });

  it('should apply multiple filters together', async () => {});
});
```

**FR-2: Configure Integration**
```typescript
describe('Admin API Config - Configure', () => {
  it('should open configuration modal on Configure click', async () => {
    // Click "Configure" button
    // Verify modal opens with service name
  });

  it('should save new configuration', async () => {
    // Fill in API key and settings
    // Click "Save"
    // Verify success message
    // Verify integration status updated
  });

  it('should show validation errors', async () => {
    // Submit form with missing fields
    // Verify error messages displayed
  });

  it('should mask API key in display', async () => {
    // After saving, verify key is masked (e.g., "sk-****-1234")
  });
});
```

**FR-3: Test Connection**
```typescript
describe('Admin API Config - Test Connection', () => {
  it('should test connection with valid credentials', async () => {
    // Open configuration modal
    // Enter valid API key
    // Click "Test Connection"
    // Verify success message with details
  });

  it('should show error for invalid credentials', async () => {
    // Enter invalid API key
    // Click "Test Connection"
    // Verify error message displayed
  });

  it('should show loading spinner during test', async () => {
    // Click "Test Connection"
    // Verify spinner appears
  });
});
```

**FR-4: Enable/Disable Integration**
```typescript
describe('Admin API Config - Enable/Disable', () => {
  it('should disable integration', async () => {
    // Toggle switch to off
    // Verify status changes to "Disabled"
  });

  it('should enable integration', async () => {
    // Toggle switch to on
    // Verify status changes to previous status
  });

  it('should show confirmation for critical services', async () => {
    // Toggle critical service off
    // Verify confirmation dialog appears
  });
});
```

**FR-5: View Details**
```typescript
describe('Admin API Config - View Details', () => {
  it('should open details modal', async () => {
    // Click "View Details"
    // Verify modal opens with full configuration
  });

  it('should display usage statistics', async () => {
    // Verify usage stats visible
  });

  it('should show masked API key', async () => {
    // Verify key is partially masked
  });

  it('should close modal on close button click', async () => {});
});
```

**FR-6: Delete Integration**
```typescript
describe('Admin API Config - Delete', () => {
  it('should delete integration with confirmation', async () => {
    // Click "Delete" in action menu
    // Confirm deletion in dialog
    // Verify integration removed from list
  });

  it('should show warning if integration is in use', async () => {
    // Click "Delete" on active integration
    // Verify warning message in dialog
  });

  it('should cancel deletion', async () => {
    // Click "Delete"
    // Click "Cancel" in dialog
    // Verify integration still in list
  });
});
```

## Test Data Requirements

### Seed Data for Tests
```typescript
const testIntegrations = [
  {
    serviceName: 'Claude API',
    provider: 'Anthropic',
    category: 'ai_models',
    status: 'configured',
    isEnabled: true,
    config: {
      apiKey: 'sk-ant-api03-test-key-1234',
      endpoint: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022'
    }
  },
  {
    serviceName: 'GPT-4 API',
    provider: 'OpenAI',
    category: 'ai_models',
    status: 'configured',
    isEnabled: true,
    config: {
      apiKey: 'sk-proj-test-key-5678',
      endpoint: 'https://api.openai.com/v1'
    }
  },
  {
    serviceName: 'Gemini API',
    provider: 'Google',
    category: 'ai_models',
    status: 'not_configured',
    isEnabled: false
  },
  {
    serviceName: 'Perplexity API',
    provider: 'Perplexity',
    category: 'search_apis',
    status: 'error',
    isEnabled: true,
    lastError: 'Authentication failed: Invalid API key'
  }
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
npm test src/app/api/admin/api-config/route.test.ts -- --coverage

# Run e2e tests
npx playwright test e2e/admin-api-config.spec.ts

# Run all tests
npm test && npm run test:e2e
```

---

**Status**: Draft
**Created**: 2025-01-17
**Phase**: 4 - API Configuration Management
**TDD Protocol**: RED → GREEN → REFACTOR
