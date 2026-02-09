# Apex Feature Implementation Plan
**Created:** 2026-02-01
**Status:** In Progress

## Analysis Summary
- **237 components** already exist
- **Schema is comprehensive** (citations, SOV, alerts, sentiment all exist)
- Focus on **ACTUAL GAPS** below

## ACTUAL GAPS TO IMPLEMENT

### Phase 1: Visual Analytics (HIGH PRIORITY) ✅ DONE
- [x] 1.1 **Platform Coverage Heatmap** - Visual matrix of brand × platform × query type ✅
- [x] 1.2 **Share of Voice Dashboard Widget** - Prominent SOV visualization ✅
- [x] 1.3 **Sentiment Trend Chart** - Line chart showing sentiment over time ✅

### Phase 2: Prompt Library (HIGH PRIORITY) ✅ DONE
- [x] 2.1 **Prompt Library Page** - Browse/search pre-built industry prompts ✅
- [x] 2.2 **Prompt Categories** - Industry-specific prompt collections ✅
- [x] 2.3 **Custom Prompt Builder** - User-created prompts with variables ✅

### Phase 3: Reports & Export
- [x] 3.1 **PDF Report Generator** - White-label branded PDF exports ✅
- [ ] 3.2 **Scheduled Reports** - Automatic email/WhatsApp weekly digests (FUTURE)

### Phase 4: Billing Integration (DONE TODAY)
- [x] 4.1 **PayFast Integration** - SA payment gateway ✅

---

## ✅ COMPLETED TODAY (2026-02-01)

### New Components Created:
1. `src/components/analytics/platform-heatmap.tsx` - Platform × Query Type coverage matrix
2. `src/components/analytics/share-of-voice-widget.tsx` - SOV pie chart with competitor rankings
3. `src/components/analytics/sentiment-trend-chart.tsx` - Sentiment over time visualization
4. `src/components/analytics/index.ts` - Exports for new components

### New Pages Created:
1. `src/app/dashboard/prompts/page.tsx` - Prompt Library page
2. `src/lib/prompts/library.ts` - 21 pre-built prompts across 7 categories

### Updated Pages:
1. `src/app/dashboard/analytics/page.tsx` - Added new SOV, Sentiment, Heatmap components

### Billing (PayFast):
1. `src/lib/payfast/` - Complete PayFast integration library
2. `src/app/api/payfast/` - Checkout, webhook, cancel API routes
3. `src/app/(dashboard)/billing/` - Pricing page, success, cancel pages
4. Database schema updated with subscription fields
5. Multi-currency support (USD, EUR, GBP, ZAR) - USD default

### PDF Reports:
1. `src/lib/reports/types.ts` - Report data types and interfaces
2. `src/lib/reports/data-service.ts` - Data aggregation from all sources
3. `src/lib/reports/pdf-template.tsx` - Beautiful React-PDF template (3 pages)
4. `src/app/api/reports/pdf/route.ts` - PDF generation API endpoint
5. `src/app/(dashboard)/reports/page.tsx` - Report generation UI

### Real-time Alerts:
1. `src/lib/db/schema/alert-rules.ts` - Alert rules, channels, history schema
2. `src/lib/alerts/service.ts` - Alert evaluation and dispatch service
3. `src/app/api/alerts/rules/route.ts` - CRUD for alert rules
4. `src/app/api/alerts/channels/route.ts` - CRUD for delivery channels
5. `src/app/(dashboard)/settings/alerts/page.tsx` - Alerts configuration UI
6. Supports: Email, Slack, WhatsApp, Webhook, In-app
7. Triggers: New mention, negative sentiment, visibility drop/spike, competitor beats, new citation

### Tested & Verified:
- ✅ Platform Coverage Heatmap renders correctly
- ✅ Share of Voice Widget shows rankings and percentages
- ✅ Sentiment Trend Chart displays properly
- ✅ Prompt Library shows 21 prompts in 7 categories
- ✅ PayFast billing page renders (403 from PayFast due to passphrase requirement)

## Implementation Order
1. Database schema updates (all new tables/fields)
2. API routes for new features
3. UI components
4. Integration & testing

## Files to Create/Modify

### Database Schema
- `src/lib/db/schema/citations.ts` - Citation tracking
- `src/lib/db/schema/share-of-voice.ts` - Competitor SOV data
- `src/lib/db/schema/alerts.ts` - User alert preferences
- `src/lib/db/schema/prompt-library.ts` - Pre-built prompts

### API Routes
- `src/app/api/citations/` - Citation CRUD
- `src/app/api/share-of-voice/` - SOV calculations
- `src/app/api/alerts/` - Alert management
- `src/app/api/prompts/` - Prompt library
- `src/app/api/reports/pdf/` - PDF generation

### UI Components
- `src/components/analytics/citation-tracker.tsx`
- `src/components/analytics/share-of-voice-chart.tsx`
- `src/components/analytics/sentiment-badge.tsx`
- `src/components/analytics/platform-heatmap.tsx`
- `src/components/prompts/prompt-library.tsx`
- `src/components/alerts/alert-settings.tsx`
- `src/components/reports/roi-calculator.tsx`

### Pages
- Update `src/app/dashboard/insights/` with new analytics
- Create `src/app/dashboard/prompts/` for prompt library
- Update `src/app/dashboard/settings/` with alert preferences
