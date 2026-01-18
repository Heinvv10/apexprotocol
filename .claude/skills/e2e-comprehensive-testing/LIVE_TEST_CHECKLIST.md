# ✅ Apex Live Testing Checklist

**Project**: Apex GEO/AEO Platform
**Date**: [INSERT DATE]
**Tester**: [INSERT NAME]
**Browser**: [INSERT BROWSER & VERSION]
**Device**: [INSERT DEVICE]
**Environment**: [DEV / STAGING / PRODUCTION]
**Build**: [INSERT COMMIT HASH or VERSION]

---

## Pre-Test Setup

- [ ] Fresh database (reset or staging copy)
- [ ] All env variables configured
- [ ] API services responding (Claude, OpenAI)
- [ ] Clerk auth functional
- [ ] Redis/Upstash available
- [ ] Database migrations applied
- [ ] Development server running
- [ ] Browser DevTools open (F12)
- [ ] Console tab active
- [ ] Network tab recording
- [ ] Clear all browser cache/cookies (or private window)

---

## 1️⃣ AUTHENTICATION & ACCESS CONTROL (15 min)

### Sign-In Flow
- [ ] Navigate to `/signin`
- [ ] Email field visible and focusable
- [ ] Password field visible
- [ ] "Remember me" checkbox optional
- [ ] "Sign in" button present
- [ ] Enter valid Clerk credentials
- [ ] Click "Sign in"
- [ ] Loading state shows
- [ ] Redirects to `/dashboard`
- [ ] Auth token visible in session/localStorage
- [ ] No console errors ✓

### Sign-Up Flow
- [ ] Navigate to `/signup`
- [ ] Email field required
- [ ] Password field required (strength indicator if available)
- [ ] Password confirmation field
- [ ] "Create account" button
- [ ] Click "Create account" with valid data
- [ ] Email verification email received
- [ ] Verify email link works
- [ ] Account created successfully
- [ ] Auto sign-in after verification
- [ ] No console errors ✓

### Organization Access Control
- [ ] Create new organization
- [ ] User is org owner
- [ ] Owner can access all features
- [ ] Owner can add members
- [ ] Add member with viewer role
- [ ] Logout and sign in as member
- [ ] Member can view org data
- [ ] Member cannot delete org
- [ ] Member cannot manage users
- [ ] Logout and sign in as owner
- [ ] Remove member
- [ ] Logout and verify removed member cannot access org
- [ ] No data leak between orgs ✓

### Role-Based Access Control
- [ ] Owner role: full access
- [ ] Admin role: can manage users, cannot delete org
- [ ] Member role: can access resources, cannot manage settings
- [ ] Viewer role: read-only access, no create/edit/delete
- [ ] Insufficient role → shows 403 message
- [ ] Can verify roles in Clerk dashboard
- [ ] No console errors ✓

### Protected Routes
- [ ] Open `/dashboard` without signing in → redirects to `/signin`
- [ ] Open `/admin` without signing in → redirects to `/signin`
- [ ] Try to access other org's `/brands/[id]` → 403 Forbidden
- [ ] API call without auth token → 401 Unauthorized
- [ ] API call with invalid token → 401 Unauthorized
- [ ] API call with valid token → 200 Success
- [ ] No console errors ✓

### Session Management
- [ ] Sign in and navigate around
- [ ] Close tab and reopen → still signed in
- [ ] Clear cookies → redirects to signin (if session expired)
- [ ] Long idle time (simulate 30+ min) → session expires on next API call
- [ ] After expiration, redirect to signin
- [ ] Sign in again successfully
- [ ] No console errors ✓

---

## 2️⃣ DASHBOARD & CORE UI (20 min)

### Homepage Load
- [ ] Navigate to `/dashboard`
- [ ] Page loads in < 2 seconds
- [ ] All major sections visible (no layout shift)
- [ ] No broken images
- [ ] Logo visible and clickable
- [ ] Sidebar visible (desktop) or hamburger menu visible (mobile)
- [ ] Console: 0 errors ✓
- [ ] Console: 0 warnings ✓

### GEO Score Display
- [ ] GEO score shows (0-100)
- [ ] Grade shows (A/B/C/D)
- [ ] Score matches database value
- [ ] Trend indicator (↑↓) shows
- [ ] Last updated timestamp visible

### Key Metrics
- [ ] Total brands count displays
- [ ] Active audits count displays
- [ ] Pending recommendations count displays
- [ ] Recent mentions count displays
- [ ] Click metric → navigates to detail page

### Navigation & Menus
- [ ] Sidebar menu items visible:
  - [ ] Monitor
  - [ ] Create
  - [ ] Audit
  - [ ] Competitive
  - [ ] Brands
- [ ] Each menu item clickable
- [ ] Active page highlighted
- [ ] Mobile hamburger menu works
- [ ] Mobile menu toggle on/off works
- [ ] Mobile menu closes when clicking link

### Responsive Design
- [ ] **Desktop (1920px)**
  - [ ] 3-4 column layout
  - [ ] Sidebar always visible
  - [ ] No horizontal scrolling
  - [ ] All content visible

- [ ] **Laptop (1366px)**
  - [ ] 2-3 column layout
  - [ ] Sidebar visible
  - [ ] All content fits without scroll

- [ ] **Tablet (768px)**
  - [ ] 2-column layout
  - [ ] Sidebar collapsible
  - [ ] Touch interactions work
  - [ ] Buttons 44x44px minimum

- [ ] **Mobile (375px)**
  - [ ] 1-column layout
  - [ ] Hamburger menu
  - [ ] Full-width cards
  - [ ] No horizontal scroll
  - [ ] Text readable (no zoom needed)

### Theme Toggle
- [ ] Light theme button visible
- [ ] Dark theme button visible
- [ ] Click light theme → colors change to light
- [ ] Click dark theme → colors change to dark
- [ ] Text readable in both themes
- [ ] Charts visible in both themes
- [ ] Theme persists on reload
- [ ] Theme saved to localStorage

### Visual Design System
- [ ] Background color correct
- [ ] Card colors correct (primary/secondary/tertiary)
- [ ] Primary accent (cyan) used consistently
- [ ] Spacing consistent (4px grid)
- [ ] Shadows appropriate (only on modals)
- [ ] Typography: headers bold, body regular
- [ ] Button styles consistent
- [ ] Form fields consistent
- [ ] No color clashing or accessibility issues

---

## 3️⃣ BRAND MANAGEMENT (20 min)

### Brand List Page (`/dashboard/brands`)
- [ ] Page loads
- [ ] List shows all user's brands
- [ ] Each brand card shows:
  - [ ] Brand name
  - [ ] Brand domain
  - [ ] Logo (if available)
  - [ ] GEO score
  - [ ] Last audit date
- [ ] Click brand card → navigate to brand details
- [ ] No brands → empty state with "Add Brand" button
- [ ] Empty state has icon and message
- [ ] Sort by name works
- [ ] Sort by date works
- [ ] Sort by score works
- [ ] Filter by active/inactive works
- [ ] Pagination works (20 per page)
- [ ] Search brands works (real-time filter)
- [ ] Search case-insensitive
- [ ] No console errors ✓

### Create Brand Form (`/dashboard/brands/new`)
- [ ] Navigate to "Add Brand" or `/dashboard/brands/new`
- [ ] Form visible with fields:
  - [ ] Brand Name (required)
  - [ ] Domain (required)
  - [ ] Industry (dropdown)
  - [ ] Keywords (textarea)
  - [ ] Logo upload
  - [ ] Competitors (if available)
- [ ] All fields have labels
- [ ] All fields have placeholder text
- [ ] Logo upload button works
- [ ] Logo preview shows after selection
- [ ] Remove logo button works
- [ ] Form validation:
  - [ ] Brand name required → shows error if empty
  - [ ] Domain required → shows error if empty
  - [ ] Domain format validation (e.g., must include .com)
  - [ ] Keywords max length enforced
  - [ ] Submit button disabled until required fields filled
- [ ] Submit button shows "Creating..." loading state
- [ ] API call made with form data
- [ ] Success → toast notification shows "Brand created successfully"
- [ ] Success → redirect to brand details page
- [ ] Error → toast shows error message
- [ ] Error → form remains with data (not cleared)
- [ ] Database check: new brand record created
- [ ] Database check: active = true by default
- [ ] No console errors ✓

### Brand Details Page (`/dashboard/brands/[id]`)
- [ ] Page loads
- [ ] Brand name in header
- [ ] Brand metrics show (score, audits, mentions)
- [ ] Tabs visible: Overview, Audits, Mentions, Settings
- [ ] Click each tab → content updates
- [ ] **Overview Tab**:
  - [ ] Brand summary
  - [ ] Recent audits list
  - [ ] Recent mentions list
  - [ ] GEO score trend chart
- [ ] **Audits Tab**:
  - [ ] List of all audits for brand
  - [ ] Click audit → navigate to results
- [ ] **Mentions Tab**:
  - [ ] List of all mentions for brand
  - [ ] Filter by platform
  - [ ] Click mention → show details
- [ ] **Settings Tab**:
  - [ ] Edit button visible
  - [ ] Click Edit → form opens in edit mode
  - [ ] Form pre-filled with current values
  - [ ] Change brand name → click Save
  - [ ] Toast shows success
  - [ ] Database updated
  - [ ] Page refreshes with new name
  - [ ] Cancel button discards changes
- [ ] Back button returns to brands list
- [ ] No console errors ✓

### Edit Brand
- [ ] Click Edit on brand details
- [ ] Form opens with current values pre-filled
- [ ] Change name field
- [ ] Change domain field
- [ ] Change industry field
- [ ] Upload new logo
- [ ] Click Save
- [ ] Loading state shows
- [ ] Success toast appears
- [ ] Page updates with new values
- [ ] Database check: updated_at timestamp changes
- [ ] New values persist on page reload
- [ ] No console errors ✓

### Delete Brand (if available)
- [ ] Navigate to brand details
- [ ] Find Delete button (usually in Settings tab)
- [ ] Click Delete
- [ ] Confirmation dialog shows:
  - [ ] Warning message
  - [ ] "Cancel" button
  - [ ] "Delete" button
- [ ] Click Cancel → dialog closes, brand not deleted
- [ ] Click Delete again
- [ ] Brand removed from database
- [ ] Redirect to brands list
- [ ] Deleted brand no longer in list
- [ ] No console errors ✓

---

## 4️⃣ AUDIT FEATURE (45 min)

### Audit List (`/dashboard/audit`)
- [ ] Page loads
- [ ] List shows all audits
- [ ] Sort by date works
- [ ] Sort by score works
- [ ] Filter by status works (pending/in-progress/completed)
- [ ] Each audit card shows:
  - [ ] Domain
  - [ ] Overall GEO score
  - [ ] Status
  - [ ] Completion percentage
  - [ ] Last audit date
- [ ] Click audit → navigate to results
- [ ] No audits → empty state with "Start Audit" button
- [ ] "Start Audit" button visible
- [ ] No console errors ✓

### Start New Audit
- [ ] Click "Start Audit" button
- [ ] Modal/form appears
- [ ] Brand dropdown shows available brands
- [ ] Select a brand
- [ ] Click "Start Audit"
- [ ] Loading spinner shows
- [ ] Audit created in database
- [ ] Status: "pending" or "in_progress"
- [ ] UI updates to show new audit in list
- [ ] Polling begins (checks status every 5 seconds)
- [ ] Progress bar updates
- [ ] After ~30 seconds, audit completes
- [ ] Status changes to "completed"
- [ ] Results page auto-loads OR "View Results" button appears
- [ ] No console errors ✓

### Audit Results Page (`/dashboard/audit/results?id=[id]`)
- [ ] Page loads without 404 error
- [ ] Header shows:
  - [ ] Domain name
  - [ ] Scan date/time
  - [ ] Back button
  - [ ] Share button
  - [ ] Export button
- [ ] **Overall Score Card**:
  - [ ] Shows unified GEO score (0-100)
  - [ ] Shows grade (A/B/C/D)
  - [ ] Color matches grade (green/yellow/orange/red)
  - [ ] Shows last updated date
- [ ] **Issue Summary Card**:
  - [ ] Shows total issues count
  - [ ] Shows critical/high/medium/low breakdown
  - [ ] Click to filter by severity
- [ ] **Quick Wins Section**:
  - [ ] Shows 3-5 high-impact, low-effort recommendations
  - [ ] Each with action button
  - [ ] No console errors
- [ ] **Category Scores Grid**:
  - [ ] Shows 5 scores: GEO, SEO, AEO, SMO, PPO
  - [ ] Each shows 0-100 score
  - [ ] Color gradient: red (bad) → green (good)
  - [ ] Click category → shows breakdown
- [ ] **Issues by Severity**:
  - [ ] Lists all issues grouped by severity
  - [ ] Critical items highlighted in red
  - [ ] Each issue shows: title, description, impact
  - [ ] Click issue → shows details
- [ ] No console errors ✓

### Phase 4: Performance Deep Dive
- [ ] Section visible below main issues
- [ ] Shows heading "Performance Deep Dive"
- [ ] Displays Core Web Vitals:
  - [ ] LCP (Largest Contentful Paint) score
  - [ ] FID (First Input Delay) or INP score
  - [ ] CLS (Cumulative Layout Shift) score
- [ ] Shows page load time
- [ ] Shows optimization opportunities
- [ ] Lists slow pages
- [ ] Performance tips provided
- [ ] No console errors ✓

### Phase 5: AI Readiness Expansion
- [ ] Section visible
- [ ] Shows heading "AI Readiness Analysis"
- [ ] Displays AI readiness score (0-100)
- [ ] Shows platform breakdown:
  - [ ] ChatGPT readiness
  - [ ] Claude readiness
  - [ ] Gemini readiness
  - [ ] Perplexity readiness
  - [ ] Other platforms
- [ ] Shows optimization suggestions
- [ ] Lists missing schema types
- [ ] Recommendations specific to AI platforms
- [ ] No console errors ✓

### Phase 6: SEO Content Analysis
- [ ] Section visible
- [ ] Shows heading "SEO Content Analysis"
- [ ] **Content Analysis Card**:
  - [ ] Shows average word count
  - [ ] Shows readability score
  - [ ] Lists pages with metrics
  - [ ] No console errors
- [ ] **Keyword Opportunities Card**:
  - [ ] Lists LSI, semantic, related keywords
  - [ ] Shows current vs target mentions
  - [ ] Impact scoring (high/medium/low)
  - [ ] Implementation tips
- [ ] **Indexation Status Card**:
  - [ ] Shows indexation rate (%)
  - [ ] Lists reasons for non-indexation
  - [ ] Specific fix recommendations
- [ ] **Backlink Summary Card**:
  - [ ] Shows estimated backlinks
  - [ ] Lists top 5 referring domains
  - [ ] Shows domain authority scores
  - [ ] Link building recommendations
- [ ] No console errors ✓

### Phase 7: Competitive Analysis
- [ ] Section visible
- [ ] Shows heading "Competitive Analysis"
- [ ] **Competitor Comparison Card**:
  - [ ] Shows your unified score
  - [ ] Shows industry average
  - [ ] Shows score difference
  - [ ] Shows 5-score breakdown (GEO/SEO/AEO/SMO/PPO)
  - [ ] Lists top 5 competitors
  - [ ] Shows their scores and ranks
  - [ ] Trend indicators (up/down/stable)
- [ ] **Gap Analysis Card**:
  - [ ] Shows your strongest dimension
  - [ ] Shows biggest gap
  - [ ] Lists all dimensions with gaps
  - [ ] Shows vs industry average
  - [ ] Shows vs top competitor
  - [ ] Gap closure strategy provided
- [ ] **Competitive Positioning Card**:
  - [ ] Shows overall rank (#N of total)
  - [ ] Shows percentile rank (0-100th)
  - [ ] Shows tier (Top 20% / Competitive / Lagging)
  - [ ] Shows competitive status with icon
  - [ ] Next steps recommendations
  - [ ] Growth opportunity message
  - [ ] "Start Improvement Roadmap" CTA button visible ✓
- [ ] No console errors ✓

### Phase 8: Improvement Roadmap CTA
- [ ] "Start Improvement Roadmap" button visible in Competitive Positioning
- [ ] Click button → navigate to `/dashboard/audit/roadmap?id=[id]&mode=leader`
- [ ] Roadmap page loads successfully
- [ ] No console errors ✓

### Improvement Roadmap Page
- [ ] Page loads
- [ ] Header shows:
  - [ ] "Path to Industry Leadership" (or "Beat [Competitor]")
  - [ ] Back button to audit
  - [ ] Share button
  - [ ] Export button
- [ ] **Roadmap Overview**:
  - [ ] Shows current score
  - [ ] Shows target score
  - [ ] Shows total impact (+X points)
  - [ ] Shows estimated timeline (weeks)
- [ ] **Progress Timeline**:
  - [ ] Shows phase progression
  - [ ] Shows projected score per phase
  - [ ] Shows percentile rank progression
  - [ ] Timeline visualization correct
- [ ] **Phase 1: Quick Wins (1-2 weeks)**:
  - [ ] Shows +12 expected points
  - [ ] Lists 3 milestones:
    - [ ] Add FAQ Schema Markup
    - [ ] Optimize Meta Descriptions
    - [ ] Enable AI Platform Indexing
  - [ ] Each expandable to show action items
  - [ ] Estimated days shown
- [ ] **Phase 2: Month 1 Focus (2-4 weeks)**:
  - [ ] Shows +18 expected points
  - [ ] Lists 3 milestones with action items
  - [ ] Difficulty indicators (easy/medium/hard)
- [ ] **Phase 3: Ongoing (Continuous)**:
  - [ ] Shows +8 expected points
  - [ ] Lists 3 milestones
  - [ ] Ongoing nature clear
- [ ] **Milestone Expansion**:
  - [ ] Click milestone → expands
  - [ ] Shows action items with checkboxes
  - [ ] Shows descriptions
  - [ ] Shows effort and duration
- [ ] **Quick Start Guide**:
  - [ ] Step-by-step instructions
  - [ ] Prioritization guidance
- [ ] **Expected Outcomes**:
  - [ ] Phase 1 benefits
  - [ ] Phase 2 benefits
  - [ ] Phase 3 benefits
- [ ] No console errors ✓

### Export Audit Results
- [ ] On audit results page
- [ ] Click Export button
- [ ] Dropdown shows 3 options:
  - [ ] Export as PDF
  - [ ] Export as JSON
  - [ ] Export as CSV
- [ ] Click PDF → file downloads
- [ ] PDF file name is `audit-[domain]-[date].pdf`
- [ ] PDF opens in viewer
- [ ] PDF contains all audit data
- [ ] Click JSON → file downloads as `audit-[id].json`
- [ ] JSON is valid JSON format (can parse)
- [ ] Click CSV → file downloads as `audit-[id].csv`
- [ ] CSV can open in Excel
- [ ] No console errors ✓

### Share Audit Results
- [ ] On audit results page
- [ ] Click Share button
- [ ] URL copied to clipboard (check browser notification)
- [ ] Toast shows "Link copied to clipboard"
- [ ] Open new tab
- [ ] Paste URL and navigate
- [ ] Same audit loads for other user
- [ ] No console errors ✓

---

## 5️⃣ MONITOR/MENTIONS (20 min)

### Monitor Dashboard (`/dashboard/monitor`)
- [ ] Page loads
- [ ] Shows brand mention summary:
  - [ ] Total mentions this week
  - [ ] Average position (rank)
  - [ ] Sentiment breakdown (positive/neutral/negative)
- [ ] Platform breakdown visible:
  - [ ] ChatGPT mentions count
  - [ ] Claude mentions count
  - [ ] Gemini mentions count
  - [ ] Perplexity mentions count
  - [ ] Other platforms
- [ ] Recent mentions list shows:
  - [ ] Platform
  - [ ] Query
  - [ ] Sentiment (with icon)
  - [ ] Position (ranked #)
  - [ ] Date/time
- [ ] Click mention card → details modal opens
- [ ] Modal shows:
  - [ ] Full response text from AI
  - [ ] Competitors mentioned
  - [ ] Position relative to competitors
  - [ ] Close button
- [ ] Filter by platform works
- [ ] Filter by sentiment works
- [ ] Multiple filters selectable simultaneously
- [ ] "All" option to clear filters
- [ ] No console errors ✓

### Manual Platform Test
- [ ] If available, manual test feature exists
- [ ] Click "Test Platform Query"
- [ ] Enter brand name
- [ ] Select platform (ChatGPT, Claude, etc.)
- [ ] Enter query
- [ ] Click "Test"
- [ ] Loading spinner
- [ ] Results show if mentioned
- [ ] Position and sentiment displayed
- [ ] Option to add to tracked mentions
- [ ] No console errors ✓

---

## 6️⃣ CREATE/CONTENT (30 min)

### Content Creation Form (`/dashboard/create/new`)
- [ ] Navigate to Create → New Content
- [ ] Form visible with fields:
  - [ ] Brand dropdown (select brand)
  - [ ] Content type dropdown (blog/whitepaper/guide/case-study)
  - [ ] Topic/Title input
  - [ ] Target Audience input
  - [ ] Keywords textarea
- [ ] All required fields marked
- [ ] Placeholder text helpful
- [ ] Select brand → shows available brands
- [ ] Select content type → options appear
- [ ] Enter topic: "Best practices for AI visibility"
- [ ] Enter audience: "Marketing directors"
- [ ] Enter keywords: "AI, visibility, marketing"
- [ ] Click "Generate Brief" button
- [ ] Loading state shows "Generating brief..."
- [ ] API call made
- [ ] Brief displays in right panel:
  - [ ] Outline with headers
  - [ ] Key talking points
  - [ ] Target keywords
  - [ ] Content structure
  - [ ] SEO recommendations
- [ ] Edit button allows editing brief
- [ ] No console errors ✓

### Content Generation
- [ ] Brief displayed
- [ ] Click "Generate Content" button
- [ ] Loading state shows "Generating content..."
- [ ] API call made (may take 30 seconds)
- [ ] Generated content displays:
  - [ ] Title
  - [ ] Markdown formatted
  - [ ] Multiple sections with headings
  - [ ] Body paragraphs
  - [ ] Lists where applicable
  - [ ] Call-to-action
  - [ ] Professional writing
- [ ] Content editable directly
- [ ] Edit content → changes saved to draft
- [ ] Character count shown
  - [ ] Typically 2000-3000 words
- [ ] No console errors ✓

### Save & Publish
- [ ] On generated content
- [ ] Click "Save Draft" button
- [ ] Toast shows "Saved successfully"
- [ ] Content stored in database
- [ ] Status: "draft"
- [ ] Click "Publish" button
- [ ] Scheduling options appear:
  - [ ] Publish immediately
  - [ ] Schedule for later (date picker)
- [ ] Select "Publish immediately"
- [ ] Click "Publish" button
- [ ] Loading state
- [ ] Success toast "Content published"
- [ ] Redirect to content details page
- [ ] Database check: status = "published"
- [ ] published_at timestamp set
- [ ] No console errors ✓

### Content Library (`/dashboard/create/library`)
- [ ] Navigate to Create → Content Library
- [ ] List shows all created content
- [ ] Each item shows:
  - [ ] Title
  - [ ] Status (draft/published)
  - [ ] Created date
  - [ ] Word count
  - [ ] Click to view details
- [ ] Filter by status works
- [ ] Sort by date/title works
- [ ] Click published content → opens details page
- [ ] Details page shows:
  - [ ] Full content
  - [ ] Edit button
  - [ ] Delete button
  - [ ] Publish status
  - [ ] Created/published dates
- [ ] No console errors ✓

---

## 7️⃣ COMPETITIVE ANALYSIS (25 min)

### Competitive Dashboard (`/dashboard/competitive`)
- [ ] Page loads
- [ ] List of competitors shows
- [ ] "Add Competitor" button visible
- [ ] No competitors → empty state
- [ ] Click "Add Competitor"
- [ ] Modal/form appears
- [ ] Enter competitor domain (e.g., competitor.com)
- [ ] Click "Add"
- [ ] Loading state
- [ ] Competitor added to list
- [ ] Database check: competitor record created
- [ ] Competitor appears with:
  - [ ] Domain
  - [ ] GEO score
  - [ ] Status indicator
  - [ ] Click to view details
- [ ] No console errors ✓

### Competitor Detail Page
- [ ] Click competitor card
- [ ] Navigate to competitor details page
- [ ] Page shows:
  - [ ] Competitor domain in header
  - [ ] Comparison with your brand
- [ ] **Competitor Comparison**:
  - [ ] Your unified score vs competitor
  - [ ] 5-score breakdown (GEO/SEO/AEO/SMO/PPO)
  - [ ] Visual indicators (you ahead/behind)
- [ ] **Gap Analysis**:
  - [ ] Shows gaps in each dimension
  - [ ] Shows industry average
  - [ ] Shows top competitor
  - [ ] Your strongest dimension highlighted
  - [ ] Biggest gap highlighted
  - [ ] Gap closure recommendations
- [ ] **Competitive Positioning Card**:
  - [ ] Your rank (#X of total)
  - [ ] Percentile rank (0-100th)
  - [ ] Competitive tiers (Top 20% / Competitive / Lagging)
  - [ ] Your tier highlighted
  - [ ] Status icon (trophy/sword/chart)
  - [ ] Next steps recommendations
  - [ ] "Start Improvement Roadmap" CTA button
- [ ] No console errors ✓

### Roadmap from Competitive
- [ ] Click "Start Improvement Roadmap" on competitor page
- [ ] Roadmap page opens
- [ ] URL has `mode=beat_competitor`
- [ ] Title shows "Beat [CompetitorName]"
- [ ] Description mentions beating competitor
- [ ] Roadmap timeline shows:
  - [ ] Current score (your score)
  - [ ] Target score (competitor's score + margin)
  - [ ] Total impact needed
  - [ ] Estimated timeline
- [ ] Back button returns to competitor page
- [ ] No console errors ✓

### Remove Competitor
- [ ] On competitor page
- [ ] Find "Remove Competitor" button (if available)
- [ ] Click button
- [ ] Confirmation dialog shows
- [ ] Click "Cancel" → dialog closes
- [ ] Click "Remove" → competitor deleted
- [ ] Redirect to competitive dashboard
- [ ] Competitor no longer in list
- [ ] Database check: competitor record deleted
- [ ] No console errors ✓

---

## 8️⃣ RESPONSIVE DESIGN VERIFICATION (15 min)

### Desktop (1920x1080)
- [ ] All elements visible
- [ ] No horizontal scrolling
- [ ] Sidebar visible
- [ ] Multi-column layouts
- [ ] Charts render properly
- [ ] Tables readable

### Laptop (1366x768)
- [ ] All elements visible
- [ ] Navigation works
- [ ] Forms usable
- [ ] No unwanted scrolling

### Tablet (768x1024)
- [ ] 2-column layout
- [ ] Touch interactions (tap, scroll)
- [ ] Hamburger menu works
- [ ] Buttons large enough (44x44px)
- [ ] Forms scrollable and usable
- [ ] No elements cut off

### Mobile (375x812) - iPhone
- [ ] 1-column layout
- [ ] Full-width cards
- [ ] Hamburger menu visible
- [ ] Menu toggle works (open/close)
- [ ] Forms scrollable
- [ ] Buttons tap-able (no pixel-perfect clicking)
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Back button visible
- [ ] Navigation obvious

### Tablet Landscape (1024x768)
- [ ] 2-column layout appropriate
- [ ] No strange overflow
- [ ] Sidebar visible or menu works

### Mobile Landscape (812x375)
- [ ] 1-column or appropriate layout
- [ ] Forms still usable
- [ ] No unintended layout break

---

## 9️⃣ THEME & STYLING (10 min)

### Light Theme
- [ ] Background white/light gray
- [ ] Text dark gray/black
- [ ] Cards light with subtle border
- [ ] Primary accent (cyan) visible
- [ ] Buttons cyan background
- [ ] All text readable
- [ ] Good contrast (WCAG AA minimum)
- [ ] Images visible
- [ ] Charts readable

### Dark Theme
- [ ] Background deep navy (#0a0f1a)
- [ ] Cards dark navy (#141930)
- [ ] Text light gray/white
- [ ] Primary accent (cyan) bright
- [ ] Buttons cyan background, white text
- [ ] All text readable
- [ ] No eye strain
- [ ] Images visible
- [ ] Charts readable

### Theme Toggle
- [ ] Toggle button visible (sun/moon icon)
- [ ] Click light → theme changes immediately
- [ ] Click dark → theme changes immediately
- [ ] Theme persists on page reload
- [ ] localStorage updated: `theme=dark` or `theme=light`
- [ ] All pages use consistent theme

### Design System Compliance
- [ ] Card hierarchy used: primary/secondary/tertiary
- [ ] Max 3-4 accent colors per view
- [ ] Spacing consistent (4px grid)
- [ ] Shadows only on modals (glassmorphism)
- [ ] Typography: headers bold, body regular
- [ ] Button styles consistent
- [ ] Form fields consistent
- [ ] No color clashing
- [ ] Accessibility: color not only distinguisher

---

## 🔟 API ENDPOINT TESTS (30 min)

### Brand Endpoints
- [ ] `GET /api/brands` → returns 200, array of brands
- [ ] `POST /api/brands` → creates brand, returns 201
- [ ] `GET /api/brands/[id]` → returns brand details
- [ ] `PUT /api/brands/[id]` → updates brand, returns 200
- [ ] `DELETE /api/brands/[id]` → deletes brand, returns 200/204
- [ ] No auth → returns 401
- [ ] Invalid org → returns 403

### Audit Endpoints
- [ ] `POST /api/audit/scan` → starts audit, returns job_id
- [ ] `GET /api/audit/results/[id]` → returns audit results
- [ ] Results include scores, issues, recommendations
- [ ] `GET /api/audit/recommendations` → returns array
- [ ] `POST /api/audit/recommendations/[id]/dismiss` → updates status
- [ ] `POST /api/audit/recommendations/[id]/implement` → marks complete
- [ ] No auth → returns 401
- [ ] Not found → returns 404

### Monitor Endpoints
- [ ] `GET /api/monitor/mentions` → returns array of mentions
- [ ] Filter by platform works
- [ ] Filter by sentiment works
- [ ] Pagination works
- [ ] Returns 200 with data
- [ ] `POST /api/monitor/test-platform` → tests query, returns results
- [ ] No auth → returns 401

### Content Endpoints
- [ ] `POST /api/create/brief` → generates brief, returns outline
- [ ] `POST /api/create/generate` → generates content, returns HTML/markdown
- [ ] `GET /api/create/library` → returns content list
- [ ] `POST /api/create/publish` → publishes content, returns 200
- [ ] No auth → returns 401

### Competitive Endpoints
- [ ] `GET /api/competitive/analysis` → returns analysis data
- [ ] `POST /api/competitive/add` → adds competitor
- [ ] `DELETE /api/competitive/[id]` → removes competitor
- [ ] No auth → returns 401
- [ ] No console errors ✓

### Error Responses
- [ ] 400 Bad Request → shows validation errors
- [ ] 401 Unauthorized → shows auth error
- [ ] 403 Forbidden → shows permission error
- [ ] 404 Not Found → shows not found error
- [ ] 500 Server Error → shows error message
- [ ] All errors have helpful messages

---

## 1️⃣1️⃣ DATABASE OPERATIONS (20 min)

### Brand CRUD
- [ ] Insert: brand record created with all fields
- [ ] Read: query returns correct data
- [ ] Update: changes persisted
- [ ] Delete: record removed
- [ ] Verify active status, timestamps, IDs

### Audit CRUD
- [ ] Insert: audit record with pending status
- [ ] Update: status → completed, scores added
- [ ] Read: all audit data retrieved
- [ ] Verify relationships: brand_id correct
- [ ] Verify scores populated

### Mention Records
- [ ] Insert: mention created with platform, sentiment
- [ ] Query by platform: correct filtering
- [ ] Query by sentiment: correct filtering
- [ ] Bulk insert: multiple records created atomically
- [ ] Verify timestamps

### Recommendation Records
- [ ] Insert: created from audit
- [ ] Update: status changes (pending → in_progress → completed)
- [ ] Verify priority sorting
- [ ] Verify evidence JSONB populated

### Data Integrity
- [ ] Foreign key constraints enforced
- [ ] Cannot create mention without valid brand_id
- [ ] Cascade deletes work (delete brand → deletes mentions)
- [ ] No orphaned records
- [ ] Transactions are atomic

---

## 1️⃣2️⃣ REACT HOOKS (15 min)

### useAudit Hook
- [ ] Call `useAudit(auditId)` → returns { data, isLoading, error }
- [ ] Initially: isLoading=true, data=null
- [ ] After fetch: isLoading=false, data=auditObject
- [ ] Error case: data=null, error=errorObject
- [ ] Refetch available
- [ ] Change auditId → refetch automatic
- [ ] No memory leaks

### useContent Hook
- [ ] Call `useContent({ brand_id, filters })`
- [ ] Returns: { content, isLoading, error, createContent, updateContent, deleteContent }
- [ ] createContent() → adds to array
- [ ] updateContent() → modifies array
- [ ] deleteContent() → removes from array
- [ ] Filters work correctly
- [ ] Pagination works

### useCompetitorComparison Hook
- [ ] Call `useCompetitorComparison(audit)`
- [ ] Returns competitor data object
- [ ] Calculations correct (scores, percentile, status)
- [ ] Update audit → hook recalculates
- [ ] Values reflect immediately

### useRoadmapGenerator Hook
- [ ] Call `useRoadmapGenerator(audit, mode, competitor)`
- [ ] Returns roadmap object
- [ ] 3 phases with milestones
- [ ] Mode: "leader" → generic milestones
- [ ] Mode: "beat_competitor" → competitor-specific
- [ ] Score impacts calculated
- [ ] Timeline reasonable

---

## 1️⃣3️⃣ STATE MANAGEMENT (10 min)

### useBrandStore
- [ ] State: brands[], selectedBrand, meta
- [ ] Actions: setBrands, addBrand, updateBrand, removeBrand
- [ ] Persist to localStorage "apex-brand-state"
- [ ] Reload page → data restored
- [ ] Plan limits enforced
- [ ] canAddMore reflects accurately

### useAuthStore
- [ ] State: userId, orgId, orgRole, user
- [ ] Actions: setUser, setOrganization, logout
- [ ] Logout clears all state
- [ ] New session sets values correctly

### useUIStore
- [ ] State: theme, sidebarCollapsed, openModals
- [ ] toggleTheme works
- [ ] setSidebarCollapsed works
- [ ] openModal/closeModal works
- [ ] localStorage persists theme

---

## 1️⃣4️⃣ COMPONENTS (20 min)

### Core Components Render
- [ ] GeoScoreTrend renders
- [ ] PrioritizedRecommendations renders
- [ ] DomainMetrics renders
- [ ] RecentActivity renders
- [ ] Charts display correctly
- [ ] Hover tooltips work
- [ ] Empty states show when no data
- [ ] No console errors ✓

### Audit Components
- [ ] PerformanceDeepDive renders
- [ ] AIReadinessDeepDive renders
- [ ] SEOContentAnalysisDeepDive renders
- [ ] CompetitorComparisonDeepDive renders
- [ ] All cards display data
- [ ] Charts visible
- [ ] No console errors ✓

### Roadmap Components
- [ ] RoadmapPhaseCard expands/collapses
- [ ] MilestoneCard expands
- [ ] Action items show with checkboxes
- [ ] ProgressTimeline visualizes correctly
- [ ] No console errors ✓

---

## 1️⃣5️⃣ ERROR HANDLING (15 min)

### Form Validation
- [ ] Submit empty required field → error message
- [ ] Invalid email → error message
- [ ] Form values retained after error
- [ ] Can fix and resubmit successfully

### Network Errors
- [ ] Simulate offline (DevTools Network throttle)
- [ ] Error message shows
- [ ] Retry button visible
- [ ] Retry works when back online

### Not Found (404)
- [ ] Navigate to `/dashboard/brands/invalid-id`
- [ ] Shows "Not found" message
- [ ] Back to dashboard button visible

### Unauthorized (401)
- [ ] Expired session → redirect to signin
- [ ] Invalid token → 401 message
- [ ] Sign in again → access restored

### Forbidden (403)
- [ ] Try to access other org's brand
- [ ] Shows "Access denied"
- [ ] No data leaked
- [ ] Redirect to home or allowed resource

---

## 1️⃣6️⃣ SECURITY (15 min)

### SQL Injection Prevention
- [ ] Try form field: `"; DROP TABLE brands; --`
- [ ] Treated as literal string
- [ ] Not executed as SQL
- [ ] No database harm

### XSS Prevention
- [ ] Try form field: `<script>alert('XSS')</script>`
- [ ] Treated as literal string
- [ ] Not executed as JavaScript
- [ ] No alert appears
- [ ] Stored safely

### Cross-Site Request Forgery (CSRF)
- [ ] All POST/PUT/DELETE have CSRF token
- [ ] Token validated server-side
- [ ] External form cannot submit to API

### Cross-Org Data Leak
- [ ] Query by organization_id
- [ ] User cannot see other orgs
- [ ] API filters by user's org
- [ ] No data leakage

### API Keys Security
- [ ] Create API key
- [ ] Key not shown in logs
- [ ] Key not visible after creation
- [ ] Rotate key works
- [ ] Old key invalidated

---

## 1️⃣7️⃣ CONSOLE & NETWORK (20 min)

### Console Checks
- [ ] Open DevTools (F12)
- [ ] Console tab active
- [ ] Navigate all pages
- [ ] 0 red error messages ✓
- [ ] 0 deprecation warnings ✓
- [ ] No console.log spam
- [ ] No React strict mode warnings
- [ ] No performance warnings

### Network Tab Checks
- [ ] All API calls return 200/201 ✓
- [ ] No CORS errors
- [ ] No hanging requests
- [ ] No failed image loads
- [ ] API response times < 2s
- [ ] No 404s for resources
- [ ] No 500 errors

### Performance Metrics
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Total Blocking Time (TBT) < 300ms

---

## 1️⃣8️⃣ COMPLETE USER WORKFLOWS (45 min)

### Workflow 1: Setup & Monitor
- [ ] Sign in
- [ ] Create brand (example.com)
- [ ] Verify brand created in list
- [ ] Navigate to Monitor
- [ ] See mentions for brand
- [ ] Filter by ChatGPT
- [ ] View mention details
- [ ] Check sentiment distribution
- [ ] Export mention data
- [ ] Share mention link
- [ ] All steps: no errors ✓

### Workflow 2: Audit & Roadmap
- [ ] Sign in
- [ ] Navigate to Audit
- [ ] Select brand
- [ ] Start audit
- [ ] Wait for completion
- [ ] View results (all phases visible)
- [ ] Review Performance (Phase 4)
- [ ] Review AI Readiness (Phase 5)
- [ ] Review SEO Content (Phase 6)
- [ ] Review Competitive (Phase 7)
- [ ] Click roadmap CTA
- [ ] View roadmap phases
- [ ] Expand milestones
- [ ] All steps: no errors ✓

### Workflow 3: Content Creation
- [ ] Sign in
- [ ] Create content
- [ ] Fill brief form
- [ ] Generate brief
- [ ] Review brief
- [ ] Generate content
- [ ] Review generated content
- [ ] Edit content
- [ ] Save draft
- [ ] Publish immediately
- [ ] View in content library
- [ ] All steps: no errors ✓

### Workflow 4: Competitive Analysis
- [ ] Sign in
- [ ] Navigate to Competitive
- [ ] Add competitor
- [ ] View comparison
- [ ] Review gap analysis
- [ ] View positioning
- [ ] Click roadmap CTA (beat competitor mode)
- [ ] Verify title shows competitor name
- [ ] Return to competitive page
- [ ] Remove competitor
- [ ] All steps: no errors ✓

---

## 1️⃣9️⃣ BROWSER COMPATIBILITY (15 min)

- [ ] Chrome (latest version)
  - [ ] All features work
  - [ ] 0 console errors
  - [ ] Performance good

- [ ] Firefox (latest version)
  - [ ] All features work
  - [ ] 0 console errors

- [ ] Safari (latest version)
  - [ ] All features work
  - [ ] CSS rendering correct

- [ ] Mobile Safari (iOS)
  - [ ] Touch interactions work
  - [ ] Forms usable
  - [ ] No horizontal scroll

- [ ] Mobile Chrome (Android)
  - [ ] Touch interactions work
  - [ ] Forms usable
  - [ ] Performance acceptable

---

## 2️⃣0️⃣ FINAL VERIFICATION (10 min)

### Pre-Production Sign-Off
- [ ] All test categories passed: ✓
- [ ] No critical issues found: ✓
- [ ] No data corruption: ✓
- [ ] No security vulnerabilities: ✓
- [ ] Performance acceptable: ✓
- [ ] Mobile responsive: ✓
- [ ] Browser compatible: ✓
- [ ] All workflows complete: ✓
- [ ] Database integrity verified: ✓
- [ ] API endpoints functional: ✓
- [ ] Error handling verified: ✓
- [ ] Console clean: ✓
- [ ] Ready for production: ✓

---

## 📋 TEST SUMMARY

| Category | Status | Notes |
|----------|--------|-------|
| Auth & Access Control | ✓/✗ | |
| Dashboard & UI | ✓/✗ | |
| Brand Management | ✓/✗ | |
| Audit Feature | ✓/✗ | |
| Monitor Mentions | ✓/✗ | |
| Create Content | ✓/✗ | |
| Competitive Analysis | ✓/✗ | |
| Responsive Design | ✓/✗ | |
| Theme & Styling | ✓/✗ | |
| API Endpoints | ✓/✗ | |
| Database Operations | ✓/✗ | |
| React Hooks | ✓/✗ | |
| State Management | ✓/✗ | |
| Components | ✓/✗ | |
| Error Handling | ✓/✗ | |
| Security | ✓/✗ | |
| Console & Network | ✓/✗ | |
| User Workflows | ✓/✗ | |
| Browser Compatibility | ✓/✗ | |
| Final Verification | ✓/✗ | |

---

## 🎯 APPROVAL SIGNATURE

**Tester**: ___________________________
**Date**: ___________________________
**Time**: ___________________________
**Environment**: ___________________________
**Build Commit**: ___________________________

**Status**:
- [ ] ✅ APPROVED FOR PRODUCTION
- [ ] ⚠️ APPROVED FOR STAGING (Minor issues noted below)
- [ ] ❌ NOT APPROVED (Blockers identified)

**Critical Issues Found**:
```
[List any blockers]
```

**Major Issues Found**:
```
[List major issues]
```

**Minor Issues Found**:
```
[List minor issues]
```

**Recommendations**:
```
[List recommendations]
```

**Manager Approval**: ___________________________
**Date**: ___________________________

---

**Test Duration**: _____ hours
**Next Test Date**: _____________________________
**Notes**:

---

*Generated for Apex Pre-Launch Validation*
*Use this checklist for every production deployment*
*Last Updated: 2026-01-19*
