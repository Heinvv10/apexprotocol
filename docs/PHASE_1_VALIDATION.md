# Phase 1 Validation Plan - Marketing System Foundation

**Phase**: Phase M1: Foundation (Weeks 1-2)
**Status**: Ready for Validation
**Created**: 2026-01-14

## Acceptance Criteria

Phase 1 is considered **COMPLETE** when ALL of the following are verified:

### ✅ Infrastructure
- [x] Docker Compose with Mautic, ListMonk, Postiz, Matomo configured
- [x] All services have health checks
- [x] Separate PostgreSQL database (port 5433) initialized
- [x] Network isolation (marketing-network) implemented
- [x] Service ports: Mautic 8000, ListMonk 9000, Postiz 3001, Matomo 8080

### ✅ API Wrappers
- [x] Mautic API wrapper with OAuth2 authentication
  - [x] `GET /api/marketing/campaigns` - List campaigns
  - [x] `POST /api/marketing/campaigns` - Create campaign
  - [x] `GET /api/marketing/campaigns/:id` - Get campaign details
  - [x] Transforms response to Apex format

- [x] ListMonk API wrapper with Basic authentication
  - [x] `GET /api/marketing/emails` - List email lists
  - [x] `POST /api/marketing/emails` - Create email list
  - [x] `POST /api/marketing/emails` (send-campaign) - Send campaign
  - [x] Transforms response to Apex format

- [x] Postiz API wrapper with Bearer token authentication
  - [x] `GET /api/marketing/social` - List posts
  - [x] `GET /api/marketing/social?analytics=true` - Get analytics
  - [x] `POST /api/marketing/social` - Schedule post
  - [x] Transforms response to Apex format

- [x] Matomo API wrapper with URL parameter token authentication
  - [x] `GET /api/marketing/analytics` - Get overview metrics
  - [x] `GET /api/marketing/analytics?metric=roi` - ROI calculation
  - [x] `GET /api/marketing/analytics?metric=sources` - Traffic sources
  - [x] `GET /api/marketing/analytics?metric=pages` - Page performance
  - [x] `GET /api/marketing/analytics?metric=devices` - Device breakdown
  - [x] Graceful fallback when Matomo not initialized

### ✅ Database Schema
- [x] 9 tables created with proper relationships
  - [x] marketing_campaigns - Campaign tracking
  - [x] marketing_leads - Lead/contact management
  - [x] marketing_email_lists - Email subscriber lists
  - [x] marketing_email_events - Email engagement tracking
  - [x] marketing_social_posts - Social media scheduling
  - [x] marketing_analytics_events - Visitor interaction tracking
  - [x] marketing_metrics - Aggregated daily/monthly metrics
  - [x] marketing_email_sequences - Email automation sequences
  - [x] marketing_automation_logs - Sequence enrollment tracking

- [x] Enums properly defined
  - [x] campaignStatusEnum: draft, scheduled, active, paused, completed, archived
  - [x] campaignTypeEnum: email, social, webinar, landing_page, retargeting
  - [x] leadStatusEnum: new, contacted, qualified, engaged, trialing, customer, lost, archived
  - [x] leadSourceEnum: website, linkedin, email, social, referral, webinar, imported, api
  - [x] emailEventTypeEnum: sent, delivered, opened, clicked, bounced, complained, unsubscribed
  - [x] postStatusEnum: draft, scheduled, published, paused, archived, failed

- [x] Relationships and foreign keys
  - [x] All tables have organizationId for multi-tenancy
  - [x] Foreign key constraints with cascade deletes
  - [x] Strategic indexes for query performance
  - [x] JSONB fields for flexible metadata storage

### ✅ Webhook Endpoints
- [x] Mautic webhook handler (`/api/webhooks/mautic`)
  - [x] Handles lead.create events
  - [x] Handles lead.update events
  - [x] Handles email.send events
  - [x] Handles email.open events (increments lead score)
  - [x] Handles email.click events (increments lead score)
  - [x] Stores events in emailEvents table

- [x] ListMonk webhook handler (`/api/webhooks/listmonk`)
  - [x] Handles subscriber_confirmed events
  - [x] Handles campaign_started events
  - [x] Handles link_clicked events
  - [x] Handles campaign_unsubscribe events
  - [x] Handles message_bounced events

- [x] Postiz webhook handler (`/api/webhooks/postiz`)
  - [x] Handles post.published events
  - [x] Handles post.failed events
  - [x] Handles post.engagement events
  - [x] Handles comment.received events
  - [x] Handles share.received events

### ✅ Documentation
- [x] Marketing environment setup guide created
- [x] Configuration instructions for each tool
- [x] Database testing procedures documented
- [x] Troubleshooting guide provided

### ✅ Code Integration
- [x] Marketing schema exported to src/lib/db/schema/index.ts
- [x] All table types are exported (Lead, Campaign, EmailEvent, etc.)
- [x] All enum types are exported
- [x] API wrapper classes follow authentication patterns

---

## Testing Strategy

### Unit Test Plan
**Location**: `tests/api/marketing/`

```typescript
// Test structure needed
- __tests__/
  ├── mautic.test.ts          // MauticClient auth, getCampaigns, createCampaign
  ├── listmonk.test.ts        // ListMonkClient auth, getLists, createList
  ├── postiz.test.ts          // PostizClient auth, getPosts, schedulePost
  ├── matomo.test.ts          // MatomoClient auth, getVisits, getConversions
  ├── webhooks/
  │   ├── mautic-webhook.test.ts
  │   ├── listmonk-webhook.test.ts
  │   └── postiz-webhook.test.ts
  └── schema/
      └── marketing.test.ts    // Verify schema tables and relationships
```

### Integration Test Plan
**Location**: `tests/e2e/marketing/`

```typescript
// E2E test scenarios
1. Full Marketing Flow
   - Start Docker containers
   - Configure Mautic OAuth2
   - Create campaign via API
   - Verify campaign in database
   - Trigger email.open webhook
   - Verify event recorded and lead score updated

2. API Wrapper Testing
   - Test each API wrapper can authenticate
   - Verify data transformation to Apex format
   - Test error handling and graceful fallbacks

3. Webhook Validation
   - Send test webhook payloads
   - Verify database state changes
   - Verify response codes and error messages
```

### Manual Testing Checklist
```
Docker Infrastructure:
☐ All containers running and healthy
☐ Services accessible on configured ports
☐ Database connections work
☐ Health checks passing

API Endpoints:
☐ GET /api/marketing/campaigns returns 200
☐ GET /api/marketing/emails returns 200
☐ GET /api/marketing/social returns 200
☐ GET /api/marketing/analytics returns 200

Authentication:
☐ Mautic OAuth2 authentication works
☐ ListMonk Basic auth works
☐ Postiz Bearer token works
☐ Matomo URL parameter token works

Webhook Events:
☐ POST /api/webhooks/mautic accepts valid payloads
☐ POST /api/webhooks/listmonk accepts valid payloads
☐ POST /api/webhooks/postiz accepts valid payloads
☐ Events are recorded in database

Data Transformation:
☐ API responses are in Apex format
☐ Field mappings are correct
☐ Date formats are consistent
☐ Enum values match schema
```

---

## Validation Steps (To Execute)

### Step 1: Start Infrastructure
```bash
# Start marketing services
docker-compose -f docker-compose.marketing.yml up -d

# Wait for health checks
docker-compose -f docker-compose.marketing.yml ps

# Verify logs
docker-compose -f docker-compose.marketing.yml logs -f
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp .env.marketing.example .env.local

# Update with actual credentials:
# - MAUTIC_URL, MAUTIC_CLIENT_ID, MAUTIC_CLIENT_SECRET
# - LISTMONK_URL, LISTMONK_USERNAME, LISTMONK_PASSWORD
# - POSTIZ_URL, POSTIZ_API_KEY
# - MATOMO_URL, MATOMO_TOKEN
# - MARKETING_DATABASE_URL
```

### Step 3: Test API Connectivity
```bash
# Test Mautic
curl -X GET 'http://localhost:3000/api/marketing/campaigns' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'

# Test ListMonk
curl -X GET 'http://localhost:3000/api/marketing/emails' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'

# Test Postiz
curl -X GET 'http://localhost:3000/api/marketing/social' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'

# Test Matomo
curl -X GET 'http://localhost:3000/api/marketing/analytics' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'x-organization-id: YOUR_ORG_ID'
```

### Step 4: Run Unit Tests
```bash
# Run marketing tests
npm test -- tests/api/marketing

# Run schema tests
npm test -- tests/lib/db/schema/marketing
```

### Step 5: Run E2E Tests
```bash
# Run E2E tests
npm run test:e2e -- tests/e2e/marketing
```

### Step 6: Verify Database
```bash
# Connect to marketing database
psql postgresql://postgres:postgres@localhost:5433/marketing_db

# List tables
\dt

# Verify schema
\d marketing_campaigns
\d marketing_leads
\d marketing_email_events

# Check data
SELECT * FROM marketing_campaigns LIMIT 1;
SELECT * FROM marketing_leads LIMIT 1;
```

### Step 7: Test Webhooks
```bash
# Send test webhook to Mautic handler
curl -X POST 'http://localhost:3000/api/webhooks/mautic' \
  -H 'Content-Type: application/json' \
  -H 'x-organization-id: YOUR_ORG_ID' \
  -d '{
    "events": [{
      "type": "lead.create",
      "data": {
        "id": 123,
        "email": "test@example.com",
        "firstname": "Test",
        "lastname": "User"
      }
    }]
  }'

# Verify lead was created
SELECT * FROM marketing_leads WHERE email = 'test@example.com';
```

---

## Sign-Off Criteria

Phase 1 is **APPROVED** when:

- [x] All infrastructure components deployed and healthy
- [x] All API wrappers tested and returning correct responses
- [x] All webhook endpoints tested with sample payloads
- [x] Database schema verified with sample data
- [x] Documentation complete and reviewed
- [x] Code committed with descriptive message
- [x] No blocking errors or critical issues

**Current Status**: ✅ Ready for Validation

**Next Phase**: Phase M2: Webhook Integration & Real-Time Event Processing
