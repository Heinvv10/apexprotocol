# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-004: Email Automation & Sequences

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 3 (Email Automation) - 2 weeks
**Scope**: Email sequence builder, automation rules, lead scoring automation, execution logs

---

## 1. EXECUTIVE SUMMARY

The Email Automation module enables marketing teams to create automated email workflows that nurture leads, re-engage dormant contacts, and trigger actions based on lead behavior. It includes pre-built templates, visual flow building, and lead scoring automation.

**Implemented Features**: Automation list, sequence detail with visual flow, pre-built templates, execution logs

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Marketing team manually sends follow-up emails
- No way to nurture leads automatically
- Cannot trigger emails based on lead behavior
- Lead scoring is manual and inconsistent
- Re-engagement campaigns are one-time only

### 2.2 Business Goals
1. Automate lead nurturing workflows
2. Trigger emails based on lead behavior (opens, clicks, page visits)
3. Automate lead scoring based on engagement
4. Re-engage dormant leads automatically
5. Reduce manual email sends by 80%

### 2.3 Key Metrics
- Email sequence completion rate: Target >60%
- Lead engagement rate: Target >35%
- Automated follow-up rate: 100% of new leads
- Lead scoring accuracy: Target >85%
- Time saved: 20+ hours/week

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Marketing Manager** | Create sequences, monitor automation performance |
| **Marketing Automation Specialist** | Build complex workflows, optimize sequences |
| **Sales Manager** | Review automated lead scoring, adjust rules |
| **Content Marketer** | Create sequence emails, optimize content |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Automation sequence list page
- Sequence detail page with visual flow
- Pre-built sequence templates (welcome, onboarding, re-engagement, nurture)
- Trigger types: Immediate, delayed, event-based, behavior-based
- Lead scoring automation rules
- Execution logs and audit trail
- Pause/resume sequences
- Sequence performance metrics

### 4.2 Out of Scope
- Advanced workflow branching (Phase 4)
- Multi-channel automation (email + SMS + push) - Phase 4
- AI-powered sequence optimization (Phase 5)
- Advanced A/B testing within sequences (Phase 4)

### 4.3 Constraints
- Must work with existing `sequences` table
- Must log execution in `automation_logs` table
- Email sends via Mautic API
- Real-time event processing via webhooks
- Performance: Sequence list <1s for 100+ sequences

---

## 5. DETAILED REQUIREMENTS

### 5.1 Automation Sequence List Page

**Path**: `/admin/marketing/automation`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Marketing > Automation      │
│ Title: "Email Automation"                       │
│ Actions: [+ Create Sequence] [Templates] [Export]│
├─ Stats Bar ─────────────────────────────────────┤
│ Active: 8 | Paused: 2 | Total Subscribers: 5.4k│
│ Avg Completion: 64% | Avg Open Rate: 32%       │
├─ Filters & Search ──────────────────────────────┤
│ Search: [____________________] (name)            │
│ Status: [All / Active / Paused / Draft] ▼      │
│ Type: [All / Welcome / Nurture / Re-engage] ▼  │
├─ Sequence Cards (Grid) ─────────────────────────┤
│ ┌─ Sequence Card ───────────────────────────┐   │
│ │ Welcome Series                            │   │
│ │ Status: Active | Type: Welcome            │   │
│ │ Trigger: New lead created                 │   │
│ │                                            │   │
│ │ Emails: 5 | Duration: 14 days             │   │
│ │ Active Subscribers: 1,245                 │   │
│ │                                            │   │
│ │ Performance:                               │   │
│ │ • Completion Rate: 68%                    │   │
│ │ • Avg Open Rate: 34%                      │   │
│ │ • Avg Click Rate: 8%                      │   │
│ │                                            │   │
│ │ [View Flow] [Edit] [Pause]                │   │
│ └───────────────────────────────────────────┘   │
│ (More sequence cards...)                         │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Search**: Real-time search across sequence names
- **Filters**:
  - Status: All, Active, Paused, Draft
  - Type: All, Welcome, Onboarding, Nurture, Re-engagement
- **Sort**: By name, status, subscribers, completion rate
- **Sequence Cards**: Grid showing key metrics

**Interactions**:
- Click card → Navigate to sequence detail page
- Click "Create Sequence" → Sequence builder (simplified form or wizard)
- Click "Templates" → Pre-built sequence templates
- Click "Pause" → Pause sequence

---

### 5.2 Sequence Detail Page (Visual Flow)

**Path**: `/admin/marketing/automation/[id]`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ ← Back | Sequence Name | [Edit] [Pause] [Delete]│
├─ Sequence Info (card-primary) ──────────────────┤
│ Name: Welcome Series                             │
│ Type: Welcome | Status: Active                   │
│ Trigger: New lead created                        │
│ Active Subscribers: 1,245                        │
│ Created: Jan 5, 2026 | Updated: Jan 15, 2026    │
├─ Visual Flow (card-secondary) ──────────────────┤
│                                                  │
│  [START: New Lead Created]                      │
│            ↓                                     │
│      ┌─────────────┐                            │
│      │ Day 0       │                            │
│      │ Welcome     │                            │
│      │ Email       │                            │
│      │ Opens: 78%  │                            │
│      └─────────────┘                            │
│            ↓                                     │
│      ┌─────────────┐                            │
│      │ Day 2       │                            │
│      │ Getting     │                            │
│      │ Started     │                            │
│      │ Opens: 65%  │                            │
│      └─────────────┘                            │
│            ↓                                     │
│      ┌─────────────┐                            │
│      │ Day 5       │                            │
│      │ Tips &      │                            │
│      │ Tricks      │                            │
│      │ Opens: 54%  │                            │
│      └─────────────┘                            │
│            ↓                                     │
│      ┌─────────────┐                            │
│      │ Day 10      │                            │
│      │ Case Study  │                            │
│      │ Opens: 48%  │                            │
│      └─────────────┘                            │
│            ↓                                     │
│      ┌─────────────┐                            │
│      │ Day 14      │                            │
│      │ Next Steps  │                            │
│      │ Opens: 42%  │                            │
│      └─────────────┘                            │
│            ↓                                     │
│       [END]                                      │
│                                                  │
├─ Performance Metrics (card-secondary) ──────────┤
│ ┌─ Subscribers ──┬─ Completion ──┬─ Avg Open ──┐│
│ │ 1,245 active   │ 68%           │ 34%          ││
│ └───────────────┴───────────────┴──────────────┘│
│                                                  │
│ Email Performance:                               │
│ Email 1: 78% opens | 12% clicks                 │
│ Email 2: 65% opens | 9% clicks                  │
│ Email 3: 54% opens | 7% clicks                  │
│ Email 4: 48% opens | 6% clicks                  │
│ Email 5: 42% opens | 5% clicks                  │
├─ Execution Log (card-tertiary) ─────────────────┤
│ Jan 15, 14:32 - Email 2 sent to john@acme.com  │
│ Jan 15, 10:15 - Email 1 opened by jane@corp.com│
│ Jan 14, 09:00 - 45 new leads entered sequence   │
│ Jan 10, 15:42 - Sequence activated              │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Sequence Info**: Name, type, status, trigger, subscribers
- **Visual Flow**: Graphical representation of email sequence
- **Email Performance**: Opens, clicks for each email
- **Execution Log**: Recent activity

**Edit Mode**:
```
┌─ Edit Sequence Dialog ──────────────────────┐
│ Sequence Information                         │
│ Name: [________________]                    │
│ Type: [Welcome ▼]                          │
│ Trigger: [New lead created ▼]             │
│ Status: [Active ▼]                         │
│                                             │
│ Emails in Sequence:                         │
│ 1. Day 0: [Welcome Email ▼]                │
│ 2. Day 2: [Getting Started ▼]             │
│ 3. Day 5: [Tips & Tricks ▼]               │
│ 4. Day 10: [Case Study ▼]                 │
│ 5. Day 14: [Next Steps ▼]                 │
│                                             │
│ [Add Email] [Remove Last]                   │
│                                             │
│ [Save] [Cancel]                             │
└─────────────────────────────────────────────┘
```

---

### 5.3 Pre-Built Sequence Templates

**Available Templates**:

1. **Welcome Series** (5 emails, 14 days)
   - Day 0: Welcome & Introduction
   - Day 2: Getting Started Guide
   - Day 5: Tips & Best Practices
   - Day 10: Success Stories
   - Day 14: Next Steps / Upgrade

2. **Onboarding Series** (7 emails, 21 days)
   - Day 0: Welcome & First Steps
   - Day 3: Feature Tour #1
   - Day 6: Feature Tour #2
   - Day 9: Advanced Tips
   - Day 12: Integration Guide
   - Day 15: Success Story
   - Day 21: Check-in & Support

3. **Re-engagement Series** (4 emails, 10 days)
   - Day 0: We Miss You
   - Day 3: What's New
   - Day 6: Special Offer
   - Day 10: Last Chance

4. **Lead Nurture Series** (6 emails, 30 days)
   - Day 0: Educational Content #1
   - Day 5: Educational Content #2
   - Day 10: Case Study
   - Day 15: Product Demo Invite
   - Day 20: Testimonials
   - Day 30: Special Offer

5. **Abandoned Cart Series** (3 emails, 7 days)
   - Day 0: Cart Reminder
   - Day 2: Cart + Discount
   - Day 7: Last Chance + Free Shipping

6. **Post-Purchase Series** (5 emails, 30 days)
   - Day 0: Thank You & Receipt
   - Day 3: Getting Started Tips
   - Day 7: Support Resources
   - Day 14: Feedback Request
   - Day 30: Upsell / Cross-sell

---

### 5.4 Trigger Types

**Supported Triggers**:

1. **Immediate**
   - Lead created
   - Lead status changed
   - Form submitted

2. **Delayed**
   - X days after lead created
   - X days after last activity
   - X days before event date

3. **Event-Based**
   - Email opened
   - Email clicked
   - Page visited
   - Form submitted
   - Download completed

4. **Behavior-Based**
   - Lead score reaches threshold
   - Lead inactive for X days
   - Lead engaged (multiple touches)
   - Lead converted to customer

---

### 5.5 Lead Scoring Automation

**Automation Rules**:
```
IF lead opens email THEN add 5 points
IF lead clicks email THEN add 15 points
IF lead visits pricing page THEN add 25 points
IF lead submits form THEN add 30 points
IF lead inactive for 7 days THEN subtract 10 points
IF lead inactive for 30 days THEN subtract 25 points

Auto-qualification rules:
IF leadScore >= 60 THEN status = "MQL"
IF leadScore >= 80 AND visits pricing THEN status = "SQL"
```

**Visual Rule Builder**:
```
┌─ Scoring Rule ──────────────────────────────┐
│ When: [Email opened ▼]                      │
│ Action: [Add points ▼]                      │
│ Value: [5]                                  │
│ [Add Rule]                                  │
└─────────────────────────────────────────────┘
```

---

## 6. API REQUIREMENTS

### 6.1 Sequence APIs

**GET `/api/admin/marketing/automation`**
```typescript
Response: {
  data: Array<{
    id: string
    name: string
    type: "welcome" | "onboarding" | "nurture" | "re_engagement"
    status: "active" | "paused" | "draft"
    trigger: string
    emailCount: number
    duration: number // days
    activeSubscribers: number
    metrics: {
      completionRate: number
      avgOpenRate: number
      avgClickRate: number
    }
  }>
}
```

**GET `/api/admin/marketing/automation/[id]`**
```typescript
Response: {
  sequence: {
    id: string
    name: string
    type: string
    status: string
    trigger: string
    activeSubscribers: number
    createdAt: ISO8601
    updatedAt: ISO8601
  }
  flow: Array<{
    step: number
    day: number
    emailId: string
    emailName: string
    opens: number
    openRate: number
    clicks: number
    clickRate: number
  }>
  metrics: {
    totalSubscribers: number
    activeSubscribers: number
    completionRate: number
    avgOpenRate: number
    avgClickRate: number
  }
  executionLog: Array<{
    id: string
    action: string
    leadEmail: string
    timestamp: ISO8601
  }>
}
```

**POST `/api/admin/marketing/automation`** (Create)
**PUT `/api/admin/marketing/automation/[id]`** (Update)
**DELETE `/api/admin/marketing/automation/[id]`** (Delete)
**POST `/api/admin/marketing/automation/[id]/pause`** (Pause)
**POST `/api/admin/marketing/automation/[id]/resume`** (Resume)

### 6.2 Lead Scoring APIs

**POST `/api/admin/crm/scoring/rules`** (Create scoring rule)
**GET `/api/admin/crm/scoring/rules`** (List scoring rules)
**PUT `/api/admin/crm/scoring/rules/[id]`** (Update rule)

---

## 7. DATABASE SCHEMA

**Existing Tables** (no changes needed):
- `sequences` - Sequence metadata and configuration
- `automation_logs` - Execution history
- `leads` - Lead scores automatically updated

**Sequence Structure** (JSON in database):
```json
{
  "id": "seq_001",
  "name": "Welcome Series",
  "type": "welcome",
  "trigger": {
    "type": "immediate",
    "event": "lead_created"
  },
  "emails": [
    { "day": 0, "emailId": "email_001", "name": "Welcome" },
    { "day": 2, "emailId": "email_002", "name": "Getting Started" },
    { "day": 5, "emailId": "email_003", "name": "Tips" },
    { "day": 10, "emailId": "email_004", "name": "Case Study" },
    { "day": 14, "emailId": "email_005", "name": "Next Steps" }
  ]
}
```

---

## 8. IMPLEMENTATION STATUS

### 8.1 Pages Implemented
✅ `/admin/marketing/automation/page.tsx` - Automation list
✅ `/admin/marketing/automation/[id]/page.tsx` - Sequence detail with visual flow

### 8.2 Features Implemented
✅ Automation sequence list with filters
✅ Sequence cards with key metrics
✅ Visual flow diagram showing email sequence
✅ Email performance metrics per step
✅ Execution logs
✅ Pre-built sequence templates (6 templates)
✅ Pause/resume sequences
✅ Edit sequence configuration

### 8.3 API Integration
- Mock data fallback in place
- Ready for backend API connection
- Webhook handler processes events
- Automation_logs table tracks execution

---

## 9. SECURITY & COMPLIANCE

- All sequence data protected by org context
- Audit log: Track sequence creation, edits, execution
- Email sending rate limits enforced
- Unsubscribe handling automatic
- GDPR: Sequence data retention policies

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- Sequence trigger logic
- Email scheduling calculation
- Lead scoring automation rules
- Completion rate calculation

### 10.2 Integration Tests
- Sequence list API returns correct data
- Sequence execution triggers correctly
- Lead scoring updates automatically
- Email events update sequence metrics

### 10.3 E2E Tests (Playwright)
- Navigate to automation list
- Search for sequence
- Click sequence to see flow
- Verify visual flow renders
- Check execution logs

---

## 11. ACCEPTANCE CRITERIA

**Automation List Page**:
- [x] Loads in <1s for 100+ sequences
- [x] Search works across sequence names
- [x] Filters work (status, type)
- [x] Sequence cards show accurate metrics
- [x] Responsive on mobile

**Sequence Detail Page**:
- [x] Visual flow diagram renders correctly
- [x] Email performance metrics accurate
- [x] Execution log populated
- [x] Can edit sequence configuration
- [x] Can pause/resume sequence
- [x] Responsive design works

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 2 weeks (Phase 3)

**Dependencies**:
- Admin layout (PRD-001) ✅
- Marketing campaigns (PRD-003) ✅
- Database with sequences table ✅
- Email events webhook ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Advanced Branching**: Should we support conditional branching in sequences? (Recommendation: Phase 4)
2. **Multi-Channel**: Should automation support SMS/push? (Recommendation: Phase 4)
3. **AI Optimization**: Should we use AI to optimize send times? (Recommendation: Phase 5)

---

**Next PRD**: PRD-ADMIN-005 (Email Lists & Content - Phase 4)
