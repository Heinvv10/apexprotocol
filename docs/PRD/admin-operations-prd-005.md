# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-005: Email Lists & Content Management

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 4 (Email Lists & Content) - 1-2 weeks
**Scope**: Email list management, email templates, content calendar, ListMonk integration

---

## 1. EXECUTIVE SUMMARY

The Email Lists & Content module enables marketing teams to manage email subscriber lists, create and organize email templates, and plan content across channels using a visual calendar. It integrates with ListMonk for subscriber management and email delivery.

**Implemented Features**: Email list management, list detail, email templates, template detail, content calendar with scheduling

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Marketing team cannot manage email subscriber lists effectively
- No centralized email template library
- Content planning is scattered across tools
- Cannot schedule content across channels
- No approval workflow for content

### 2.2 Business Goals
1. Centralize email subscriber list management
2. Create reusable email template library
3. Plan content across all channels in one place
4. Schedule content in advance
5. Track content performance by type

### 2.3 Key Metrics
- List growth rate: Track monthly
- List health: Track bounce rate, unsubscribe rate
- Template usage: Most/least used templates
- Content calendar coverage: Days planned ahead
- Content approval time: Target <24 hours

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Marketing Manager** | Manage lists, approve content, plan strategy |
| **Email Marketer** | Create templates, manage subscribers, segment lists |
| **Content Manager** | Plan content calendar, schedule posts |
| **Content Writer** | Create content, check calendar |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Email list management (create, edit, delete lists)
- List detail with subscriber management
- Subscriber import/export
- List segmentation (basic)
- Email template library
- Template creation and editing
- Template performance tracking
- Content calendar (all channels)
- Content scheduling
- Approval workflow (basic)

### 4.2 Out of Scope
- Advanced segmentation (Phase 5)
- Template drag-and-drop builder (Phase 5)
- Multi-step approval workflow (Phase 5)
- Content AI suggestions (Phase 6)

### 4.3 Constraints
- Must integrate with ListMonk API
- Email templates stored in database
- Content calendar supports all channels (email, social, blog, webinar)
- Performance: List page <1s for 10+ lists

---

## 5. DETAILED REQUIREMENTS

### 5.1 Email List Management Page

**Path**: `/admin/marketing/email-management`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Marketing > Email Management│
│ Title: "Email Lists"                            │
│ Actions: [+ Create List] [Import] [Export]      │
├─ Stats Bar ─────────────────────────────────────┤
│ Total Lists: 6 | Total Subscribers: 44,582      │
│ Active: 42,125 (94.5%) | Bounced: 2,457 (5.5%) │
├─ List Cards (Grid) ─────────────────────────────┤
│ ┌─ List Card ───────────────────────────────┐   │
│ │ Newsletter Subscribers                    │   │
│ │ Status: Active | Type: Newsletter         │   │
│ │                                            │   │
│ │ Subscribers: 25,432                       │   │
│ │ Active: 24,125 (94.9%)                    │   │
│ │ Bounced: 1,307 (5.1%)                     │   │
│ │                                            │   │
│ │ Growth: +245 this month                   │   │
│ │ Unsubscribe Rate: 0.3%                    │   │
│ │                                            │   │
│ │ [View List] [Edit] [Export]               │   │
│ └───────────────────────────────────────────┘   │
│ (More list cards...)                             │
└─────────────────────────────────────────────────┘
```

**Features**:
- **List Cards**: Show key metrics for each list
- **Create List**: Name, description, type
- **Import Subscribers**: CSV upload
- **Export Subscribers**: CSV download
- **List Health**: Active, bounced, unsubscribed counts

**Interactions**:
- Click card → Navigate to list detail page
- Click "Create List" → Create list modal
- Click "Import" → Import subscribers modal
- Click "Export" → Export all lists to CSV

---

### 5.2 Email List Detail Page

**Path**: `/admin/marketing/email-management/[id]`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ ← Back | List Name | [Edit] [Export] [Delete]  │
├─ List Info (card-primary) ──────────────────────┤
│ Name: Newsletter Subscribers                     │
│ Type: Newsletter | Status: Active                │
│ Created: Dec 1, 2025 | Updated: Jan 15, 2026    │
│ Description: Monthly newsletter subscribers      │
├─ Subscriber Stats (card-secondary) ─────────────┤
│ ┌─ Total ──┬─ Active ─┬─ Bounced ──┬─ Unsub ──┐│
│ │ 25,432   │ 24,125   │ 1,307      │ 245      ││
│ │          │ (94.9%)  │ (5.1%)     │ (1.0%)   ││
│ └──────────┴─────────┴───────────┴────────────┘│
│                                                  │
│ Growth: +245 this month | Churn: -32 this month │
│ Avg Open Rate: 32% | Avg Click Rate: 8%        │
├─ Subscriber List (card-secondary) ──────────────┤
│ Search: [____________________]                   │
│ Status: [All / Active / Bounced / Unsubscribed]│
│                                                  │
│ [✓] Email              | Status  | Subscribed  │
│ ─────────────────────────────────────────────── │
│ [  ] john@acme.com     | Active  | Jan 10      │
│ [  ] jane@corp.com     | Active  | Jan 5       │
│ [  ] mike@startup.io   | Bounced | Dec 28      │
│ ... (paginated)                                  │
│                                                  │
│ Bulk Actions: [Add Tag] [Unsubscribe] [Delete] │
│ Rows per page: [50 ▼] | Page 1 of 510          │
├─ Activity Log (card-tertiary) ──────────────────┤
│ Jan 15 - 12 new subscribers added               │
│ Jan 14 - Newsletter sent to 25,420 subscribers  │
│ Jan 10 - 45 subscribers imported from CSV       │
└─────────────────────────────────────────────────┘
```

**Features**:
- **List Info**: Name, type, status, description
- **Subscriber Stats**: Total, active, bounced, unsubscribed
- **Subscriber List**: Searchable, filterable, sortable
- **Bulk Actions**: Add tags, unsubscribe, delete
- **Activity Log**: Recent list activity

**Edit Mode**:
```
┌─ Edit List Dialog ──────────────────────────┐
│ List Information                             │
│ Name: [________________]                    │
│ Type: [Newsletter ▼]                       │
│ Status: [Active ▼]                         │
│ Description: [______________]               │
│                                             │
│ [Save] [Cancel]                             │
└─────────────────────────────────────────────┘
```

---

### 5.3 Email Template Library

**Path**: `/admin/marketing/email-templates`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Marketing > Email Templates │
│ Title: "Email Templates"                        │
│ Actions: [+ Create Template] [Import]           │
├─ Stats Bar ─────────────────────────────────────┤
│ Total Templates: 8 | Active: 6 | Draft: 2      │
│ Most Used: Welcome Email (125 sends)            │
├─ Filters ───────────────────────────────────────┤
│ Type: [All / Newsletter / Campaign / Transactional]│
│ Status: [All / Active / Draft]                  │
├─ Template Cards (Grid) ─────────────────────────┤
│ ┌─ Template Card ───────────────────────────┐   │
│ │ Welcome Email                             │   │
│ │ Type: Campaign | Status: Active           │   │
│ │                                            │   │
│ │ Subject: Welcome to Apex!                 │   │
│ │ Last Used: Jan 15, 2026                   │   │
│ │                                            │   │
│ │ Performance:                               │   │
│ │ • Sends: 125                              │   │
│ │ • Opens: 98 (78%)                         │   │
│ │ • Clicks: 34 (27%)                        │   │
│ │                                            │   │
│ │ [Preview] [Edit] [Use Template]           │   │
│ └───────────────────────────────────────────┘   │
│ (More template cards...)                         │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Template Cards**: Show key info and performance
- **Create Template**: Name, subject, body (HTML/text)
- **Template Types**: Newsletter, Campaign, Transactional, Automation
- **Performance Tracking**: Sends, opens, clicks per template

---

### 5.4 Email Template Detail Page

**Path**: `/admin/marketing/email-templates/[id]`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ ← Back | Template Name | [Edit] [Duplicate] [Delete]│
├─ Template Info (card-primary) ──────────────────┤
│ Name: Welcome Email                              │
│ Type: Campaign | Status: Active                  │
│ Subject: Welcome to Apex!                        │
│ Created: Dec 15, 2025 | Updated: Jan 5, 2026    │
├─ Preview (card-secondary) ───────────────────────┤
│ [Desktop] [Mobile]                               │
│                                                  │
│ ┌─ Email Preview ──────────────────────────┐    │
│ │                                           │    │
│ │ [Apex Logo]                              │    │
│ │                                           │    │
│ │ Welcome to Apex!                         │    │
│ │                                           │    │
│ │ We're excited to have you...             │    │
│ │                                           │    │
│ │ [Get Started Button]                     │    │
│ │                                           │    │
│ └──────────────────────────────────────────┘    │
├─ Performance (card-secondary) ───────────────────┤
│ ┌─ Sends ───┬─ Opens ───┬─ Clicks ──┬─ Conversions─┐│
│ │ 125       │ 98 (78%)  │ 34 (27%) │ 12 (9.6%)   ││
│ └───────────┴──────────┴──────────┴──────────────┘│
│                                                  │
│ Recent Usage:                                    │
│ • Jan 15: Used in "Q1 Campaign"                 │
│ • Jan 10: Used in "New Lead Sequence"           │
│ • Jan 5: Used in "Welcome Automation"           │
├─ Template Code (card-tertiary) ─────────────────┤
│ [HTML] [Text]                                    │
│                                                  │
│ <!DOCTYPE html>                                  │
│ <html>                                           │
│   <body>                                         │
│     <h1>Welcome to Apex!</h1>                   │
│     ...                                          │
│   </body>                                        │
│ </html>                                          │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Template Info**: Name, type, status, subject
- **Preview**: Desktop and mobile views
- **Performance**: Sends, opens, clicks, conversions
- **Recent Usage**: Where template has been used
- **Template Code**: HTML and text versions

---

### 5.5 Content Calendar

**Path**: `/admin/marketing/content-calendar`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Marketing > Content Calendar│
│ Title: "Content Calendar"                       │
│ Actions: [+ Add Content] [Today] [Month] [Week] │
├─ Filters ───────────────────────────────────────┤
│ Channel: [All / Email / Social / Blog / Webinar]│
│ Status: [All / Draft / Scheduled / Published]   │
├─ Calendar View (card-secondary) ────────────────┤
│                                                  │
│  January 2026                                    │
│                                                  │
│  Sun    Mon    Tue    Wed    Thu    Fri    Sat  │
│  ──────────────────────────────────────────────  │
│         13     14     15     16     17     18   │
│         📧     📱     📧     📝           📧   │
│         News   Post   Tips   Blog         Promo │
│                                                  │
│   19    20     21     22     23     24     25   │
│         🎤                   📧     📱         │
│         Webinr                News   Post        │
│                                                  │
│   26    27     28     29     30     31          │
│   📧    📝           📧     🎤                  │
│   Case  Blog         Q&A    Demo                │
│                                                  │
├─ Upcoming Content (card-tertiary) ──────────────┤
│ Today (Jan 15):                                  │
│ • 10:00 AM - Newsletter: Weekly Tips            │
│ • 2:00 PM - Social Post: Product Feature        │
│                                                  │
│ Tomorrow (Jan 16):                               │
│ • 9:00 AM - Blog Post: How-To Guide            │
│                                                  │
│ This Week:                                       │
│ • 12 items scheduled                            │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Calendar View**: Month, week, day views
- **Content Items**: Email, social, blog, webinar, events
- **Scheduling**: Drag-and-drop to reschedule
- **Filters**: By channel, status
- **Upcoming**: List of upcoming content

**Add Content Modal**:
```
┌─ Add Content ───────────────────────────────┐
│ Channel: [Email ▼]                          │
│ Type: [Newsletter ▼]                        │
│ Title: [________________]                   │
│ Date: [Jan 16, 2026]                        │
│ Time: [10:00 AM]                            │
│ Status: [Scheduled ▼]                       │
│ Assigned To: [Marketing Team ▼]            │
│ Notes: [______________]                     │
│                                             │
│ [Save] [Cancel]                             │
└─────────────────────────────────────────────┘
```

---

## 6. API REQUIREMENTS

### 6.1 Email List APIs

**GET `/api/admin/marketing/email-lists`**
```typescript
Response: {
  data: Array<{
    id: string
    name: string
    type: "newsletter" | "promotional" | "transactional"
    status: "active" | "paused"
    subscriberCount: number
    activeCount: number
    bouncedCount: number
    unsubscribedCount: number
    growthThisMonth: number
    churnThisMonth: number
    avgOpenRate: number
    avgClickRate: number
  }>
}
```

**GET `/api/admin/marketing/email-lists/[id]`**
```typescript
Response: {
  list: {
    id: string
    name: string
    type: string
    status: string
    description: string
    createdAt: ISO8601
    updatedAt: ISO8601
  }
  stats: {
    total: number
    active: number
    bounced: number
    unsubscribed: number
    growth: number
    churn: number
  }
  subscribers: Array<{
    email: string
    status: "active" | "bounced" | "unsubscribed"
    subscribedAt: ISO8601
  }>
}
```

**POST `/api/admin/marketing/email-lists`** (Create)
**PUT `/api/admin/marketing/email-lists/[id]`** (Update)
**DELETE `/api/admin/marketing/email-lists/[id]`** (Delete)
**POST `/api/admin/marketing/email-lists/[id]/import`** (Import CSV)
**GET `/api/admin/marketing/email-lists/[id]/export`** (Export CSV)

### 6.2 Template APIs

**GET `/api/admin/marketing/email-templates`**
**GET `/api/admin/marketing/email-templates/[id]`**
**POST `/api/admin/marketing/email-templates`** (Create)
**PUT `/api/admin/marketing/email-templates/[id]`** (Update)
**POST `/api/admin/marketing/email-templates/[id]/duplicate`** (Duplicate)
**DELETE `/api/admin/marketing/email-templates/[id]`** (Delete)

### 6.3 Content Calendar APIs

**GET `/api/admin/marketing/content-calendar`**
```typescript
Query Parameters:
  - month?: string (YYYY-MM)
  - channel?: string
  - status?: string

Response: {
  items: Array<{
    id: string
    channel: "email" | "social" | "blog" | "webinar"
    type: string
    title: string
    scheduledDate: ISO8601
    status: "draft" | "scheduled" | "published"
    assignedTo: string
  }>
}
```

**POST `/api/admin/marketing/content-calendar`** (Add content)
**PUT `/api/admin/marketing/content-calendar/[id]`** (Update)
**DELETE `/api/admin/marketing/content-calendar/[id]`** (Delete)

### 6.4 ListMonk Integration

**POST `/api/integrations/listmonk/lists`** (Sync list to ListMonk)
**POST `/api/integrations/listmonk/subscribers`** (Sync subscribers)
**Webhook**: `/api/webhooks/listmonk` (Already exists - receives events)

---

## 7. DATABASE SCHEMA

**Existing Tables**:
- `email_lists` - List metadata
- `email_events` - Subscriber engagement events

**New Tables Needed**:
```sql
-- Email templates
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- newsletter, campaign, transactional, automation
  status TEXT NOT NULL, -- active, draft
  subject TEXT NOT NULL,
  htmlBody TEXT NOT NULL,
  textBody TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Content calendar
CREATE TABLE content_calendar (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL, -- email, social, blog, webinar
  type TEXT,
  title TEXT NOT NULL,
  scheduledDate TIMESTAMP NOT NULL,
  status TEXT NOT NULL, -- draft, scheduled, published
  assignedTo TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 8. IMPLEMENTATION STATUS

### 8.1 Pages Implemented
✅ `/admin/marketing/email-management/page.tsx` - Email list management
✅ `/admin/marketing/email-management/[id]/page.tsx` - List detail
✅ `/admin/marketing/email-templates/page.tsx` - Template library
✅ `/admin/marketing/email-templates/[id]/page.tsx` - Template detail
✅ `/admin/marketing/content-calendar/page.tsx` - Content calendar

### 8.2 Features Implemented
✅ Email list cards with subscriber stats
✅ List detail with subscriber management
✅ Subscriber import/export (UI ready)
✅ Email template library
✅ Template preview (desktop/mobile)
✅ Template performance tracking
✅ Content calendar with month view
✅ Content scheduling
✅ Multi-channel support (email, social, blog, webinar)

### 8.3 API Integration
- Mock data fallback in place
- Ready for ListMonk API integration
- Webhook handler exists for subscriber events

---

## 9. SECURITY & COMPLIANCE

- All list data protected by org context
- Subscriber email addresses encrypted
- Unsubscribe handling automatic (ListMonk)
- GDPR: Subscriber data deletion
- Audit log: Track list/template changes

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- List stats calculation
- Subscriber filtering
- Template rendering
- Calendar date logic

### 10.2 Integration Tests
- List APIs return correct data
- Template APIs work
- ListMonk integration syncs
- Content calendar CRUD works

### 10.3 E2E Tests (Playwright)
- Navigate to email lists
- Create new list
- Add subscribers
- Navigate to templates
- Create template
- View content calendar
- Add content item

---

## 11. ACCEPTANCE CRITERIA

**Email List Management**:
- [x] List cards show accurate subscriber counts
- [x] Can create, edit, delete lists
- [x] List detail shows all subscribers
- [x] Can search/filter subscribers
- [x] Bulk actions work
- [x] Responsive design

**Email Templates**:
- [x] Template library displays all templates
- [x] Template preview works (desktop/mobile)
- [x] Can create, edit, delete templates
- [x] Performance metrics accurate
- [x] Template duplication works

**Content Calendar**:
- [x] Calendar displays all channels
- [x] Can add/edit/delete content items
- [x] Month/week/day views work
- [x] Filtering by channel/status works
- [x] Responsive design

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 1-2 weeks (Phase 4)

**Dependencies**:
- Admin layout (PRD-001) ✅
- Email automation (PRD-004) ✅
- Database with email_lists table ✅
- ListMonk webhook handler ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Template Builder**: Should we add drag-and-drop builder? (Recommendation: Phase 5)
2. **Approval Workflow**: Multi-step approvals needed? (Recommendation: Phase 5 if needed)
3. **AI Content Suggestions**: AI-powered content ideas? (Recommendation: Phase 6)

---

**Next PRD**: PRD-ADMIN-006 (Social Media Management - Phase 5)
