# Apex Wiring Implementation Plan

## Overview
This document tracks the implementation of 68 incomplete items across the Apex codebase.

## Priority Levels
- **P0 (Critical)**: Core functionality, blocks other features
- **P1 (High)**: Important user-facing features
- **P2 (Medium)**: Enhances UX but not blocking
- **P3 (Low)**: Nice to have, polish items

---

## Phase 1: UI Component Stubs (3 items) - P0

### 1.1 Checkbox Component
- **File**: `src/components/ui/checkbox.tsx`
- **Status**: [ ] Not Started
- **Description**: Replace basic HTML checkbox with proper Radix UI Checkbox
- **Dependencies**: @radix-ui/react-checkbox

### 1.2 AlertDialog Component
- **File**: `src/components/ui/alert-dialog.tsx`
- **Status**: [ ] Not Started
- **Description**: Replace stub divs with proper Radix UI AlertDialog
- **Dependencies**: @radix-ui/react-alert-dialog

### 1.3 SuggestionPanel Component
- **File**: `src/components/optimization/suggestion-panel.tsx`
- **Status**: [ ] Not Started
- **Description**: Implement full suggestion panel with AI recommendations

---

## Phase 2: Notification System (1 item) - P0

### 2.1 Digest Service
- **File**: `src/lib/notifications/digest.ts`
- **Status**: [ ] Not Started
- **Description**: Implement full digest notification service
- **Features**:
  - Email digest aggregation
  - Configurable frequency
  - Summary generation
  - Delivery history tracking

---

## Phase 3: Gamification APIs (3 items) - P1

### 3.1 Challenges Endpoint
- **File**: `src/app/api/gamification/challenges/route.ts` (create)
- **Status**: [ ] Not Started
- **Description**: Create API endpoint for gamification challenges

### 3.2 Challenges Hook Update
- **File**: `src/hooks/useGamification.ts:567,602`
- **Status**: [ ] Not Started
- **Description**: Wire up challenges hook to new endpoint

### 3.3 Badge Display Endpoint
- **File**: `src/app/api/gamification/badges/route.ts` (create)
- **Status**: [ ] Not Started
- **Description**: Create API endpoint for badge display

---

## Phase 4: Empty Action Handlers (8 items) - P1

### 4.1 Competitor Comparison Click Handler
- **File**: `src/components/competitors/competitor-comparison.tsx:171`
- **Status**: [ ] Not Started

### 4.2 Developer Settings Click Handler
- **File**: `src/app/dashboard/settings/developer/page.tsx:555`
- **Status**: [ ] Not Started

### 4.3-4.6 Command Palette Actions
- **File**: `src/components/command-palette/command-palette.tsx`
- **Lines**: 150, 167, 176, 184
- **Status**: [ ] Not Started

### 4.7 Social OAuth Connection
- **File**: `src/app/api/social/route.ts:364`
- **Status**: [ ] Not Started

### 4.8 Team Member Creation
- **File**: `src/app/api/settings/team/route.ts:105`
- **Status**: [ ] Not Started

---

## Phase 5: Placeholder Data Returns (17 items) - P2

### 5.1 Analytics Export
- **File**: `src/hooks/useAnalytics.ts:433`
- **Status**: [ ] Not Started

### 5.2 Usage Dashboard Chart
- **File**: `src/components/billing/usage-dashboard.tsx:151`
- **Status**: [ ] Not Started

### 5.3 Discovery Logo
- **File**: `src/components/competitive/discovery-suggestion-item.tsx:134`
- **Status**: [ ] Not Started

### 5.4 GraphQL Recommendations
- **File**: `src/lib/graphql/schema.ts:1589`
- **Status**: [ ] Not Started

### 5.5 GraphQL AI Optimization
- **File**: `src/lib/graphql/schema.ts:1706`
- **Status**: [ ] Not Started

### 5.6 Gap Analyzer Data
- **File**: `src/lib/competitive/gap-analyzer.ts:414`
- **Status**: [ ] Not Started

### 5.7 Leaderboard Data
- **File**: `src/lib/gamification/index.ts:728`
- **Status**: [ ] Not Started

### 5.8-5.9 OAuth Sync Service Counts
- **File**: `src/lib/oauth/sync-service.ts:448,470`
- **Status**: [ ] Not Started

### 5.10-5.12 Analytics Dashboard Placeholders
- **File**: `src/app/api/analytics/dashboard/route.ts`
- **Lines**: 124, 159, 167
- **Status**: [ ] Not Started

### 5.13-5.14 Portfolio Scores
- **Files**: `src/app/api/portfolios/[id]/route.ts:307`, `src/app/api/portfolios/route.ts:315`
- **Status**: [ ] Not Started

### 5.15 Reports Scores
- **File**: `src/app/api/reports/route.ts:289`
- **Status**: [ ] Not Started

### 5.16 Citation ROI Calculation
- **File**: `src/app/api/citation-roi/route.ts:217`
- **Status**: [ ] Not Started

### 5.17 Competitive Comparison GEO Score
- **File**: `src/app/api/competitive/comparison/route.ts:231`
- **Status**: [ ] Not Started

---

## Phase 6: TODO Comments (7 items) - P2

### 6.1 PNG Export Functionality
- **File**: `src/lib/reports/charts/geo-visibility-chart.tsx:21`
- **Status**: [ ] Not Started

### 6.2 Role-Based Access Control
- **File**: `src/app/api/admin/universal-api-keys/route.ts:35`
- **Status**: [ ] Not Started

### 6.3 Manual Add Location
- **File**: `src/components/locations/locations-section.tsx:385`
- **Status**: [ ] Not Started

### 6.4 Keyword/Topic Score Retrieval
- **File**: `src/app/api/predictions/opportunities/route.ts:135`
- **Status**: [ ] Not Started

### 6.5-6.7 Component TODOs (covered in Phase 1)

---

## Phase 7: API Integrations (8 items) - P1

### 7.1 Grok (X.AI) API
- **File**: `src/lib/services/ai-platform-query.ts:572`
- **Status**: [ ] Not Started
- **Notes**: Requires X.AI API access

### 7.2 Microsoft Copilot API
- **File**: `src/lib/services/ai-platform-query.ts:591`
- **Status**: [ ] Not Started
- **Notes**: Requires Microsoft API access

### 7.3 WordPress Publishing
- **File**: `src/app/api/webhooks/publish/route.ts:142`
- **Status**: [ ] Not Started

### 7.4 Medium Publishing
- **File**: `src/app/api/webhooks/publish/route.ts:156`
- **Status**: [ ] Not Started

### 7.5 LinkedIn People Extraction
- **File**: `src/lib/services/linkedin-scraper.ts`
- **Status**: [ ] Not Started
- **Notes**: Requires LinkedIn API or third-party service

### 7.6 Profile Enrichment APIs
- **File**: `src/lib/people/social-tracker.ts:145`
- **Status**: [ ] Not Started

### 7.7 Content Generator Method
- **File**: `src/lib/ai/content-generator.ts:63`
- **Status**: [ ] Not Started

### 7.8 Compliance Check
- **File**: `src/lib/compliance/index.ts:797`
- **Status**: [ ] Not Started

---

## Phase 8: Mock/Stub Services (5 items) - P2

### 8.1 Sentry Implementation
- **File**: `src/lib/monitoring/sentry.ts`
- **Status**: [ ] Not Started
- **Notes**: Replace with real Sentry SDK integration

### 8.2-8.4 Already covered in other phases

### 8.5 Leaderboard Position
- **File**: `src/lib/gamification/index.ts:726`
- **Status**: [ ] Not Started

---

## Phase 9: Database Relations (2 items) - P1

### 9.1 Organization Users Relation
- **File**: `src/lib/db/schema/organizations.ts:96`
- **Status**: [ ] Not Started

### 9.2 Organization Brands Relation
- **File**: `src/lib/db/schema/organizations.ts:97`
- **Status**: [ ] Not Started

---

## Phase 10: Platform Implementations (4 items) - P2

### 10.1 Mastodon OAuth
- **Status**: [ ] Not Started
- **Notes**: Schema defined, needs OAuth provider implementation

### 10.2-10.4 Covered in Phase 7

---

## Phase 11: Chart/Export Functionality (3 items) - P2

### 11.1 PNG Export (covered in 6.1)

### 11.2 PDF Chart Rendering
- **File**: `src/lib/export/pdf.ts:453`
- **Status**: [ ] Not Started

### 11.3 XLSX Export
- **File**: `src/app/api/export/route.ts:114`
- **Status**: [ ] Not Started

---

## Phase 12: Social Features (4 items) - P2

### 12.1 Platform Metrics Comparison
- **File**: `src/components/social/platform-metrics-card.tsx:93`
- **Status**: [ ] Not Started

### 12.2-12.4 Covered in other phases

---

## Phase 13: Settings/Admin (3 items) - P3

### 13.1 Settings Other Sections
- **File**: `src/app/dashboard/settings/settings-client.tsx:632`
- **Status**: [ ] Not Started

### 13.2 Organization Details Modal
- **File**: `src/app/admin/organizations/page.tsx:316`
- **Status**: [ ] Not Started

### 13.3 Remove PlaceholderSection
- **File**: `src/components/settings/settings-sections.tsx:768`
- **Status**: [ ] Not Started

---

## Implementation Order

### Batch 1: Core UI (Items 1-3)
1. Checkbox component
2. AlertDialog component
3. SuggestionPanel component

### Batch 2: Core Services (Items 4-7)
4. Digest service
5. Gamification challenges endpoint
6. Gamification badges endpoint
7. Gamification hooks wiring

### Batch 3: Action Handlers (Items 8-15)
8-15. Empty action handlers

### Batch 4: Database (Items 16-17)
16. Organization users relation
17. Organization brands relation

### Batch 5: Placeholder Data (Items 18-34)
18-34. Replace placeholder returns with real data

### Batch 6: API Integrations (Items 35-42)
35-42. External API integrations

### Batch 7: Export/Charts (Items 43-45)
43-45. Export functionality

### Batch 8: Social Features (Items 46-49)
46-49. Social platform features

### Batch 9: Admin/Settings (Items 50-52)
50-52. Admin and settings features

### Batch 10: Platform Implementations (Items 53-56)
53-56. Platform-specific implementations

### Batch 11: TODO Items (Items 57-63)
57-63. Remaining TODO items

### Batch 12: Mock Services (Items 64-68)
64-68. Replace mock services with real implementations

---

## Progress Tracking

| Phase | Items | Completed | Remaining |
|-------|-------|-----------|-----------|
| 1. UI Components | 3 | 0 | 3 |
| 2. Notification System | 1 | 0 | 1 |
| 3. Gamification APIs | 3 | 0 | 3 |
| 4. Action Handlers | 8 | 0 | 8 |
| 5. Placeholder Data | 17 | 0 | 17 |
| 6. TODO Comments | 7 | 0 | 7 |
| 7. API Integrations | 8 | 0 | 8 |
| 8. Mock Services | 5 | 0 | 5 |
| 9. Database Relations | 2 | 0 | 2 |
| 10. Platforms | 4 | 0 | 4 |
| 11. Charts/Export | 3 | 0 | 3 |
| 12. Social Features | 4 | 0 | 4 |
| 13. Settings/Admin | 3 | 0 | 3 |
| **TOTAL** | **68** | **0** | **68** |

---

## Notes

- Some items overlap across categories
- External API integrations may require API keys/credentials
- Database migrations may be needed for schema changes
- Testing should accompany each implementation
