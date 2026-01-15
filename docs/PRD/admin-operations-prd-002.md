# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-002: CRM Module (Leads, Accounts, Pipeline)

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 1 (CRM Foundation) - 2-3 weeks
**Scope**: Lead management, account management, sales pipeline

---

## 1. EXECUTIVE SUMMARY

The CRM module enables sales and marketing teams to manage customer relationships, track leads through their lifecycle, and forecast revenue. It integrates with existing lead scoring and email event tracking to provide real-time engagement visibility.

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Sales team cannot track lead progression from first touch to close
- No visibility into which leads are most engaged
- Pipeline forecasting is manual and error-prone
- Interactions (emails, calls, meetings) are not centralized
- Account health and relationship status is unknown

### 2.2 Business Goals
1. Enable sales team to prioritize high-scoring leads
2. Visualize full customer lifecycle (Leads → MQL → SQL → Customer)
3. Automate lead qualification based on engagement
4. Centralize all customer interactions
5. Forecast revenue by month/quarter

### 2.3 Key Metrics
- Lead response time: <2 hours (currently unknown)
- Conversion rate by stage (currently unknown)
- Average deal size: $X (needs visibility)
- Sales cycle length: X days (needs tracking)
- Pipeline health: % of each stage (needs visualization)

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Sales Manager** | Monitor lead pipeline, conversion rates, team performance |
| **Sales Rep** | Work assigned leads, track interactions, forecast |
| **Marketing Manager** | Monitor lead quality by source, adjust campaigns |
| **Executive** | Pipeline health, revenue forecast, closed deals |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Lead list page with search, filter, sort
- Lead detail page with interaction history
- Account (company) management
- Contact management (individual people)
- Sales pipeline visualization (kanban or funnel)
- Lead scoring display (leadScore, mqlScore, sqlScore)
- Lead assignment and ownership
- Activity timeline (emails, calls, meetings)
- Bulk actions (score update, segment, export)
- Lead source tracking and attribution

### 4.2 Out of Scope
- Call tracking integration (Phase 2)
- Meeting note AI summarization (Phase 2)
- Advanced forecasting models (Phase 3)
- Custom fields (Phase 2)
- Lead scoring rule builder (Phase 2)

### 4.3 Constraints
- Real-time email event updates from webhooks
- Lead scoring must reflect latest email engagement
- Performance: Lead list must load <1s for 1000+ leads
- Mobile responsive required
- Must work within Clerk organization context

---

## 5. DETAILED REQUIREMENTS

### 5.1 Lead List Page

**Path**: `/admin/crm/leads`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > CRM > Leads                 │
│ Title: "Leads"                                   │
│ Actions: [+ Create Lead] [Export CSV] [Bulk...]  │
├─ Filters & Search ──────────────────────────────┤
│ Search: [____________________] (name, email)     │
│ Status: [All / New / MQL / SQL / ...]  ▼        │
│ Source: [All / Website / Email / ...]  ▼        │
│ Score Range: [Min] [Max]                        │
│ Date Range: [From] [To]                         │
│ [Clear Filters]                                  │
├─ Stats Bar ─────────────────────────────────────┤
│ Total: 1,234 | New: 45 | MQL: 123 | SQL: 89   │
├─ Lead Table ────────────────────────────────────┤
│ [✓] Name     | Email         | Score | Stage  │
│ ─────────────────────────────────────────────── │
│ [  ] John Doe | john@... | 75   | MQL   │
│ [  ] Jane Smith | jane@... | 92   | SQL   │
│ ... (paginated)                                  │
│                                                  │
│ Rows per page: [10 ▼] | Page 1 of 123          │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Search**: Real-time search across name, email, company
- **Filters**:
  - Status: New, MQL (Marketing Qualified Lead), SQL (Sales Qualified Lead), Proposal, Closed Won, Closed Lost
  - Source: Website, Email, Webinar, Referral, Inbound, Cold Outreach, Advertising
  - Score: Min/max range slider
  - Date: Created date range
- **Sort**: By name, email, score, status, date added (ascending/descending)
- **Bulk Actions**:
  - Change status for multiple leads
  - Add tag
  - Export to CSV
  - Delete
  - Send email

**Columns**:
| Column | Type | Sortable | Filterable | Actions |
|--------|------|----------|------------|---------|
| Name | Text | Yes | Search | Click → Detail |
| Email | Text | Yes | Search | Click to copy |
| Company | Text | Yes | Filter | Link to Account |
| Score | Number | Yes | Filter | Visual bar |
| Status | Badge | Yes | Filter | Click to change |
| Source | Text | Yes | Filter | Show campaigns |
| Email Opens | Number | Yes | - | Tooltip: recent |
| Last Activity | Date | Yes | - | Tooltip: event |

**Interactions**:
- Click row → Open lead detail modal/page
- Click name → Lead detail page
- Click company → Account detail page
- Hover score → Tooltip showing (leadScore, mqlScore, sqlScore breakdown)
- Right-click row → Context menu (edit, delete, assign, export)

---

### 5.2 Lead Detail Page

**Path**: `/admin/crm/leads/[id]`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ ← Back | Lead Name | [Edit] [Delete]            │
├─ Main Content (Two Columns) ────────────────────┤
│
│ Left Column (70%):                              │
│ ┌─ Lead Info (card-primary) ──────────────────┐ │
│ │ Name: John Doe                               │ │
│ │ Email: john@acme.com                         │ │
│ │ Phone: (555) 123-4567                        │ │
│ │ Company: ACME Corp                           │ │
│ │ Job Title: VP Marketing                      │ │
│ │ Status: [SQL ▼] (dropdown to change)        │ │
│ │ Source: Website                              │ │
│ │ Date Added: 2026-01-10                       │ │
│ │ Owner: [Sarah Johnson ▼]                     │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Scoring Breakdown (card-secondary) ────────┐ │
│ │ Lead Score: 75/100 ████████░░ (engagement) │ │
│ │ MQL Score: 68/100 ███████░░░ (qualification) │ │
│ │ SQL Score: 85/100 ██████████ (readiness)   │ │
│ │                                              │ │
│ │ Last Updated: 2026-01-15 14:32               │ │
│ │ Scoring Basis:                               │ │
│ │   • Email opens: +15pts                      │ │
│ │   • Email clicks: +25pts                     │ │
│ │   • Page visits: +10pts                      │ │
│ │   • Time since contact: -5pts/day            │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Activity Timeline (card-secondary) ────────┐ │
│ │ 2026-01-15 14:32 - Email Opened (Brief.pdf)│ │
│ │ 2026-01-15 10:15 - Email Clicked (Details) │ │
│ │ 2026-01-14 09:00 - Email Sent (Proposal)   │ │
│ │ 2026-01-10 15:42 - Lead Created (Website)   │ │
│ │                                              │ │
│ │ [Load More...]                               │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Communications (card-secondary) ───────────┐ │
│ │ ┌─ Log Call ──────────────────────────────┐ │ │
│ │ │ [Sent Email] [Schedule Call] [Note...]  │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ Recent Emails:                               │ │
│ │ • Proposal sent (Jan 14)                    │ │
│ │ • Follow-up (Jan 10)                        │ │
│ │ • Welcome (Jan 10)                          │ │
│ └────────────────────────────────────────────┘ │
│
│ Right Column (30%):                             │
│ ┌─ Related Account (card-tertiary) ──────────┐ │
│ │ ACME Corp                                    │ │
│ │ Industry: Technology                         │ │
│ │ Size: 500-1000 employees                    │ │
│ │ Website: acme.com                            │ │
│ │ [View Account] [See Other Contacts]         │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Related Contacts (card-tertiary) ────────┐ │
│ │ Sarah Johnson (Procurement)                │ │
│ │ Mike Chen (Technical Director)              │ │
│ │ [View All Contacts]                         │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Opportunities (card-tertiary) ────────────┐ │
│ │ Proposal: ACME Q1 Marketing ($50k)         │ │
│ │ Status: Awaiting Approval                   │ │
│ │ Expected Close: 2026-03-31                 │ │
│ │ [View Opportunity]                          │ │
│ └────────────────────────────────────────────┘ │
│
└─────────────────────────────────────────────────┘
```

**Edit Mode** (Modal or inline):
```
┌─ Edit Lead Dialog ──────────────────────┐
│ Lead Information                         │
│ Name: [________________]                │
│ Email: [________________]               │
│ Phone: [________________]               │
│ Company: [________search________]▼      │
│ Job Title: [________________]           │
│ Status: [SQL ▼]                        │
│ Owner: [Sarah Johnson ▼]               │
│                                         │
│ Lead Properties:                        │
│ Budget: [__________]                   │
│ Timeline: [Q1 2026 ▼]                  │
│ Decision Making: [Primary ▼]           │
│ Use Case: [_______________]            │
│                                         │
│ [Save] [Cancel] [Delete]               │
└─────────────────────────────────────────┘
```

**Features**:
- **Lead Info**: Editable name, email, phone, company, job title, status, owner
- **Score Breakdown**: Visual display of three scores with components
- **Activity Timeline**: Chronological log of all interactions (emails, opens, clicks, meetings, notes)
- **Communications**: Quick actions (send email, schedule call, add note)
- **Related Data**: Account, other contacts, opportunities

---

### 5.3 Account (Company) Management

**Path**: `/admin/crm/accounts`

**Features**:
- Account list with search, filter, sort
- Account detail page showing:
  - Company info (name, website, industry, size, location)
  - Related contacts (all people at this company)
  - Related opportunities (active deals)
  - Related leads (anyone from this company)
  - Account health score
  - Total engagement metrics
  - Custom fields
- Ability to create, edit, delete accounts
- Merge duplicate accounts

**Minimum viable for Phase 1**:
- Account list page (searchable, sortable)
- Account detail page
- Link leads to accounts

---

### 5.4 Sales Pipeline

**Path**: `/admin/crm/pipeline`

**View Options**:
1. **Kanban Board**:
```
┌───────────┬────────────┬──────────┬────────────┬───────────┐
│ New       │ MQL        │ SQL      │ Proposal   │ Closed Won│
│ (45 leads)│ (123 leads)│(89 leads)│(34 leads)  │ (156 won) │
├───────────┼────────────┼──────────┼────────────┼───────────┤
│ ┌────────┐│ ┌────────┐ │┌────────┐│┌────────┐  │┌────────┐ │
│ │ John   │││ │ Jane   │ ││ Mike   │││ Acme   │  ││ OpenAI │ │
│ │ Doe    │││ │ Smith  │ ││ Chen   │││ Corp   │  ││ Deal   │ │
│ │ Score: ││ │ Score: │ ││ Score: │││ Deal   │  ││ $250k  │ │
│ │ 45     │││ │ 68     │ ││ 85     │││ $50k   │  ││Closed: │ │
│ └────────┘│ └────────┘ │└────────┘││ Jan 31 │  ││ Yes    │ │
│ [+ Lead] │ [+ Lead]   │[+ Lead]  │└────────┘  │└────────┘ │
└───────────┴────────────┴──────────┴────────────┴───────────┘
```

2. **Funnel View**:
```
┌─────────────────────────────────────────┐
│ Pipeline Funnel                         │
│                                         │
│ New              ████████ 45 (100%)    │
│                                         │
│ MQL              █████░░░ 123 (275%)   │
│ Conversion: 73%                         │
│                                         │
│ SQL              ██░░░░░░ 89 (197%)    │
│ Conversion: 33%                         │
│                                         │
│ Proposal         ░░░░░░░░ 34 (76%)     │
│ Conversion: 62%                         │
│                                         │
│ Closed Won       █░░░░░░░ 156 (349%)   │
│ Win Rate: 82%                           │
│                                         │
└─────────────────────────────────────────┘
```

3. **Pipeline Value View**:
```
Total Pipeline Value: $1,234,567
By Stage:
  New: $45k (3.6%)
  MQL: $234k (18.9%)
  SQL: $456k (36.9%)
  Proposal: $250k (20.2%)
  Closed Won: $250k (20.2%)

Forecast (Current Month): $89k
Forecast (Next Quarter): $350k
```

---

### 5.5 Lead Scoring Display

**Lead Scoring System** (existing in database):
```
leadScore (0-100)
  - Email engagement (opens, clicks)
  - Page visits
  - Time since contact
  - Recency decay

mqlScore (0-100)
  - Marketing Qualified Lead indicators
  - Multiple touches, company size fit
  - Budget indicators

sqlScore (0-100)
  - Sales Qualified Lead indicators
  - Timeline alignment
  - Decision maker signals
```

**Display Requirements**:
- Show all three scores in lead list (compact bars)
- Detailed breakdown on lead detail page
- Show what contributed to each score
- Show scoring history (trending over time)
- Ability to manually adjust scores for testing

---

## 6. API REQUIREMENTS

### 6.1 Lead APIs

**GET `/api/admin/crm/leads`**
```typescript
Query Parameters:
  - search?: string (name, email, company)
  - status?: string
  - source?: string
  - scoreMin?: number
  - scoreMax?: number
  - dateFrom?: ISO8601
  - dateTo?: ISO8601
  - page?: number (default: 1)
  - limit?: number (default: 50)
  - sort?: "name" | "score" | "date" | "activity"
  - order?: "asc" | "desc"

Response: {
  data: Array<{
    id: string
    name: string
    email: string
    company: string
    score: number
    mqlScore: number
    sqlScore: number
    status: string
    source: string
    lastActivity: ISO8601
    emailOpenCount: number
    owner: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

**GET `/api/admin/crm/leads/[id]`**
```typescript
Response: {
  lead: {
    id: string
    name: string
    email: string
    phone?: string
    company: string
    jobTitle?: string
    status: string
    source: string
    dateAdded: ISO8601
    ownerId: string
    ownerName: string
    leadScore: number
    mqlScore: number
    sqlScore: number
    scoringBasis: Array<{ label: string; points: number }>
  }
  account?: {
    id: string
    name: string
    website: string
    industry: string
    employees: number
  }
  activities: Array<{
    id: string
    type: "email_sent" | "email_opened" | "email_clicked" | "call" | "meeting" | "note"
    title: string
    description?: string
    timestamp: ISO8601
    metadata?: object
  }>
  opportunities?: Array<{
    id: string
    title: string
    stage: string
    value: number
  }>
}
```

**POST/PUT `/api/admin/crm/leads`** (Create/Update)
**DELETE `/api/admin/crm/leads/[id]`** (Delete)
**POST `/api/admin/crm/leads/[id]/assign`** (Assign to owner)
**POST `/api/admin/crm/leads/bulk-action`** (Bulk operations)

### 6.2 Account APIs

**GET `/api/admin/crm/accounts`** (List with pagination)
**GET `/api/admin/crm/accounts/[id]`** (Detail)
**POST/PUT `/api/admin/crm/accounts`** (Create/Update)
**GET `/api/admin/crm/accounts/[id]/leads`** (Related leads)
**GET `/api/admin/crm/accounts/[id]/contacts`** (Related contacts)

### 6.3 Pipeline APIs

**GET `/api/admin/crm/pipeline`** (All leads grouped by status)
**GET `/api/admin/crm/pipeline/funnel`** (Conversion metrics)
**GET `/api/admin/crm/pipeline/forecast`** (Revenue forecast)

---

## 7. DATABASE SCHEMA

**Existing Tables** (no changes needed):
- `leads` - Lead data with scoring
- `email_events` - Email engagement tracking
- Relationships already support everything

**New Database Columns Needed** (extend leads table):
- `ownerId` - FK to users table (sales rep assignment)
- `accountId` - FK to accounts table (if accounts table exists)
- `lastActivityAt` - Denormalized timestamp for sorting

---

## 8. SECURITY & COMPLIANCE

- All lead data protected by org context (Clerk)
- Audit log: Track all lead view/edit/delete actions
- Email addresses not exposed in list view to non-admins
- Phone numbers encrypted in database
- GDPR: Allow lead deletion with compliance

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests
- Lead filtering logic
- Score calculation
- Sorting functions
- Date formatting

### 9.2 Integration Tests
- Lead list API returns correct data
- Filters work (status, source, date, score)
- Sorting works
- Pagination works
- Lead detail loads related data
- Account lookup works

### 9.3 E2E Tests (Playwright)
- Navigate to lead list
- Search for lead
- Filter by status
- Click lead to see detail
- Edit lead info
- Assign lead to owner
- View activity timeline
- Click account to navigate to account detail

---

## 10. ACCEPTANCE CRITERIA

**Lead List Page**:
- [ ] Loads in <1s for 1000+ leads
- [ ] Search works across name, email, company
- [ ] All filters functional (status, source, score, date)
- [ ] Sort working on all columns
- [ ] Pagination works (10, 25, 50 per page)
- [ ] Bulk actions work (status change, export)
- [ ] Responsive on mobile
- [ ] No 404 errors
- [ ] Data matches database

**Lead Detail Page**:
- [ ] All lead info displays correctly
- [ ] Scoring breakdown shows correct scores
- [ ] Activity timeline populated with real events
- [ ] Can edit lead info inline or modal
- [ ] Related account displays (if set)
- [ ] Can assign to owner
- [ ] Can delete lead (with confirmation)
- [ ] Responsive design works

**Pipeline View**:
- [ ] Kanban board shows leads in correct stages
- [ ] Funnel view shows conversion percentages
- [ ] Can drag leads between stages (kanban)
- [ ] Clicking lead opens detail
- [ ] Metrics accurate

---

## 11. TIMELINE & DEPENDENCIES

**Duration**: 2-3 weeks (Phase 1)

**Dependencies**:
- Admin layout and navigation (PRD-001)
- Database with leads table (✓ exists)
- Email events webhook (✓ exists)
- User/owner assignment via Clerk (need to implement)

**Blockers**: None

---

## 12. OPEN QUESTIONS

1. **Accounts Table**: Does it exist or need to be created? (Recommendation: Create simple accounts table in Phase 1)
2. **Lead Ownership**: How are leads assigned to sales reps? (Recommendation: ownerId field + Clerk user lookup)
3. **Bulk Export**: Should export include scoring details or just basic info? (Recommendation: Include scores for sales forecasting)
4. **Scoring Manual Override**: Can reps manually adjust scores? (Recommendation: Yes, with audit logging)

---

**Next PRD**: PRD-ADMIN-003 (Marketing Campaigns - Phase 2)
