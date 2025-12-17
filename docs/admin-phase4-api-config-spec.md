# Phase 4: API Configuration Management - Requirements Specification

## Overview
Super-admins need to configure API keys and settings for external AI services (Anthropic Claude, OpenAI GPT-4, Google Gemini, Perplexity, etc.) that power the Apex platform's GEO/AEO features.

## User Stories

**As a super-admin**, I want to:
- View all configured API integrations in one place
- Add new API keys for AI services
- Update existing API keys and settings
- Test API connections before saving
- Enable/disable specific integrations
- View usage limits and quotas
- See last verified timestamps
- Securely manage sensitive credentials

## Feature Requirements

### FR-1: API Integrations List
Display all available API integrations with their configuration status.

**Acceptance Criteria:**
- AC-1.1: Show table with columns: Service Name, Provider, Status, Last Verified, Actions
- AC-1.2: Display status badge (Configured, Not Configured, Error)
- AC-1.3: Show total count of integrations (e.g., "5 Integrations")
- AC-1.4: Group by provider category (AI Models, Search APIs, Analytics)
- AC-1.5: Each row shows service logo/icon

### FR-2: Configure API Integration
Allow super-admins to add or update API credentials.

**Acceptance Criteria:**
- AC-2.1: Click "Configure" opens configuration modal
- AC-2.2: Modal shows service name and description
- AC-2.3: Input fields for API key (masked), endpoint URL (optional), and additional settings
- AC-2.4: "Test Connection" button validates credentials
- AC-2.5: Save button persists configuration
- AC-2.6: Show validation errors inline
- AC-2.7: API keys are encrypted before storage

### FR-3: Test API Connection
Validate API credentials before saving.

**Acceptance Criteria:**
- AC-3.1: "Test Connection" button makes actual API call
- AC-3.2: Show loading spinner during test
- AC-3.3: Display success message with API response details
- AC-3.4: Display error message if connection fails
- AC-3.5: Test results include response time and quota info (if available)

### FR-4: Enable/Disable Integration
Toggle integration on/off without deleting credentials.

**Acceptance Criteria:**
- AC-4.1: Toggle switch in each row
- AC-4.2: Disabled integrations show "Disabled" status badge
- AC-4.3: Disabled integrations don't count toward usage
- AC-4.4: Toggle change updates immediately
- AC-4.5: Confirmation dialog for disabling critical services

### FR-5: View Integration Details
Display detailed information about each integration.

**Acceptance Criteria:**
- AC-5.1: Click "View Details" opens details modal
- AC-5.2: Show full configuration (API key partially masked)
- AC-5.3: Display usage statistics (requests this month, quota remaining)
- AC-5.4: Show last verified timestamp
- AC-5.5: Display error logs if connection failed
- AC-5.6: Show rate limit information

### FR-6: Delete Integration
Remove API configuration.

**Acceptance Criteria:**
- AC-6.1: "Delete" action in dropdown menu
- AC-6.2: Confirmation dialog with service name
- AC-6.3: Warning if integration is currently in use
- AC-6.4: Successfully deleted integrations removed from list
- AC-6.5: Audit log records deletion with timestamp and admin user

### FR-7: Search and Filter
Find specific integrations quickly.

**Acceptance Criteria:**
- AC-7.1: Search input filters by service name or provider
- AC-7.2: Filter dropdown by status (All, Configured, Not Configured, Disabled, Error)
- AC-7.3: Filter by category (All, AI Models, Search APIs, Analytics)
- AC-7.4: Search is case-insensitive
- AC-7.5: Filters can be combined

## API Endpoints

### GET /api/admin/api-config
List all API integrations with their configuration status.

**Query Parameters:**
- `search` (string, optional): Search by service name or provider
- `status` (string, optional): Filter by status (configured|not_configured|disabled|error)
- `category` (string, optional): Filter by category (ai_models|search_apis|analytics)

**Response:**
```json
{
  "success": true,
  "integrations": [
    {
      "id": "string",
      "serviceName": "Claude API",
      "provider": "Anthropic",
      "category": "ai_models",
      "status": "configured|not_configured|disabled|error",
      "isEnabled": true,
      "hasCredentials": true,
      "lastVerified": "2025-01-15T10:30:00Z",
      "lastError": "string|null",
      "usageThisMonth": 1250,
      "quotaRemaining": 8750,
      "rateLimit": "10000/day",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "categories": ["ai_models", "search_apis", "analytics"]
}
```

### GET /api/admin/api-config/:id
Get detailed configuration for a specific integration.

**Response:**
```json
{
  "success": true,
  "integration": {
    "id": "string",
    "serviceName": "Claude API",
    "provider": "Anthropic",
    "description": "Anthropic's Claude AI for content generation",
    "category": "ai_models",
    "status": "configured",
    "isEnabled": true,
    "config": {
      "apiKey": "sk-ant-****-****-****",
      "endpoint": "https://api.anthropic.com/v1",
      "model": "claude-3-5-sonnet-20241022",
      "maxTokens": 4096
    },
    "lastVerified": "2025-01-15T10:30:00Z",
    "lastError": null,
    "usageStats": {
      "requestsThisMonth": 1250,
      "quotaRemaining": 8750,
      "rateLimit": "10000/day",
      "averageResponseTime": "2.3s"
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "createdBy": "user_123",
    "updatedBy": "user_123"
  }
}
```

### POST /api/admin/api-config
Create new API integration configuration.

**Request Body:**
```json
{
  "serviceName": "Claude API",
  "provider": "Anthropic",
  "category": "ai_models",
  "config": {
    "apiKey": "sk-ant-api03-...",
    "endpoint": "https://api.anthropic.com/v1",
    "model": "claude-3-5-sonnet-20241022",
    "maxTokens": 4096
  }
}
```

**Response:**
```json
{
  "success": true,
  "integration": { /* full integration object */ }
}
```

### PATCH /api/admin/api-config/:id
Update existing API integration configuration.

**Request Body:**
```json
{
  "config": {
    "apiKey": "sk-ant-api03-...",
    "endpoint": "https://api.anthropic.com/v1",
    "model": "claude-3-5-sonnet-20241022",
    "maxTokens": 4096
  },
  "isEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "integration": { /* full integration object */ }
}
```

### POST /api/admin/api-config/:id/test
Test API connection with current or provided credentials.

**Request Body:**
```json
{
  "config": {
    "apiKey": "sk-ant-api03-...",
    "endpoint": "https://api.anthropic.com/v1"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "responseTime": "1.2s",
    "apiVersion": "2023-06-01",
    "quotaRemaining": 8750,
    "rateLimit": "10000/day"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Authentication failed: Invalid API key",
  "details": {
    "statusCode": 401,
    "responseTime": "0.5s"
  }
}
```

### DELETE /api/admin/api-config/:id
Delete API integration configuration.

**Response:**
```json
{
  "success": true,
  "message": "Integration deleted successfully"
}
```

## Security Requirements

### SR-1: Authentication Required
All API endpoints require authentication via Clerk.

### SR-2: Super-Admin Authorization
Only users with `isSuperAdmin: true` can access API configuration endpoints.

### SR-3: Credential Encryption
- API keys must be encrypted at rest using AES-256
- API keys must be masked in UI (show only last 4 characters)
- API keys transmitted over HTTPS only

### SR-4: Audit Logging
All configuration changes must be logged with:
- Timestamp
- Admin user ID
- Action performed (create, update, delete, test)
- Integration affected

### SR-5: Rate Limiting
Test connection endpoint limited to 10 requests per minute per user to prevent abuse.

## Database Schema

### Table: `api_integrations`
```sql
CREATE TABLE api_integrations (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL, -- 'ai_models', 'search_apis', 'analytics'
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  status TEXT NOT NULL, -- 'configured', 'not_configured', 'disabled', 'error'
  config JSONB NOT NULL, -- Encrypted configuration object
  last_verified TIMESTAMP,
  last_error TEXT,
  usage_this_month INTEGER DEFAULT 0,
  quota_remaining INTEGER,
  rate_limit TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT REFERENCES users(clerk_user_id),
  updated_by TEXT REFERENCES users(clerk_user_id)
);

CREATE INDEX idx_api_integrations_status ON api_integrations(status);
CREATE INDEX idx_api_integrations_category ON api_integrations(category);
CREATE INDEX idx_api_integrations_enabled ON api_integrations(is_enabled);
```

## Edge Cases

### EC-1: Empty State
When no integrations are configured:
- Show empty state message: "No API integrations configured"
- Display "Add Integration" button prominently
- Show list of available integrations to configure

### EC-2: Connection Test Timeout
If test connection takes longer than 30 seconds:
- Show timeout error
- Allow retry
- Don't save configuration

### EC-3: Invalid Credentials
If API key is invalid:
- Show clear error message from provider
- Highlight API key field
- Don't save configuration

### EC-4: Service Unavailable
If external service is down:
- Show service unavailable message
- Allow save anyway with warning
- Mark integration as "error" status

## UI/UX Requirements

### Layout
- Full-width page with admin sidebar
- Header with page title and total count
- Search and filter bar below header
- Table with integrations
- Action buttons per row

### Components
- Integration status badge (color-coded)
- Masked API key display (e.g., "sk-ant-****-****-1234")
- Test connection button with loading state
- Configuration modal with form
- Details modal with tabs (Config, Usage, Logs)
- Delete confirmation dialog

### Responsive Design
- Mobile: Stack table rows as cards
- Tablet: Horizontal scroll for table
- Desktop: Full table layout

## Success Metrics
- Time to configure new integration < 2 minutes
- Zero exposed API keys in logs or UI
- 100% of integrations tested before saving
- All configuration changes audited

---

**Status**: Draft
**Created**: 2025-01-17
**Phase**: 4 - API Configuration Management
**Dependencies**: Phase 3 (Users Management) completed
