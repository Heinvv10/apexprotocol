# 🧪 E2E Comprehensive Testing Skill - Apex Pre-Launch Validation

## Overview

This skill provides an **exhaustive end-to-end testing protocol** for Apex before going live. It validates **every feature, page, button, function, hook, API endpoint, database operation, and user interaction** as if it's the final pre-launch QA pass.

**Scope**: Complete application validation across frontend, backend, integrations, and user workflows.

**When to use**:
- Before any production deployment
- After major feature additions (Phases 4-8)
- After critical bug fixes
- Before staging/demo releases

---

## Test Categories

### 1. 🔐 AUTHENTICATION & ACCESS CONTROL

#### Tests to Run

```
✓ Sign-in flow (Clerk)
  - Navigate to /signin
  - Submit credentials
  - Redirect to /dashboard
  - Verify auth token in session

✓ Sign-up flow (Clerk)
  - Navigate to /signup
  - Complete form
  - Email verification
  - Redirect to onboarding

✓ Organization access
  - Create organization
  - Add member
  - Verify member can access org data only
  - Verify non-member cannot access

✓ Role-based access control
  - Owner: can delete org, manage users, access all features
  - Admin: can manage users, access admin panel
  - Member: can access assigned brands/projects
  - Viewer: read-only access

✓ Protected routes
  - Unauthenticated user → redirect to signin
  - User from different org → 403 Forbidden
  - Insufficient role → 403 Forbidden

✓ API authentication
  - No auth token → 401 Unauthorized
  - Invalid token → 401 Unauthorized
  - Valid token → 200 Success

✓ Session timeout
  - Wait 30+ minutes idle
  - Make API call
  - Verify redirect to signin or token refresh
```

**Tools**: Playwright, browser DevTools, Clerk dashboard

---

### 2. 📊 DASHBOARD & CORE FEATURES

#### Homepage Dashboard (`/dashboard`)

```
✓ Page loads without errors
  - No console errors
  - All sections render
  - Images load correctly
  - Theme applies (light/dark)

✓ GEO Score Display
  - Shows current unified score (0-100)
  - Shows grade (A/B/C/D)
  - Shows trend (up/down/stable)
  - Matches database value

✓ Quick Stats
  - Brands count
  - Active audits
  - Pending recommendations
  - Recent mentions count
  - Updates when data changes

✓ Navigation
  - Sidebar menu works
  - All links navigate correctly
  - Active state highlights current page
  - Mobile hamburger menu works

✓ Responsive Design
  - Desktop (1920px): All columns visible
  - Tablet (768px): 2-column layout
  - Mobile (375px): 1-column, stacked layout
  - No horizontal scrolling
```

---

### 3. 🏢 BRAND MANAGEMENT

#### Brand List (`/dashboard/brands`)

```
✓ Display brands
  - List shows all user's brands
  - Sort by name/date/score
  - Filter by active/inactive
  - Pagination works (20 per page)
  - No brands → shows empty state

✓ Brand cards
  - Show brand name, domain, logo
  - Show GEO score
  - Show last audit date
  - Click → navigate to brand details

✓ Search brands
  - Type in search box
  - Results filter in real-time
  - Clear search → shows all brands
  - Case-insensitive search works
```

#### Create Brand (`/dashboard/brands/new`)

```
✓ Form rendering
  - All fields visible: name, domain, industry, keywords, competitors
  - Logo upload field works
  - Logo preview shows selected image
  - Form not auto-submits

✓ Form validation
  - Brand name required → shows error if empty
  - Domain required → shows error if empty
  - Domain format validation (must be valid URL)
  - Keywords max length (2000 chars)
  - Submit disabled until required fields filled

✓ Form submission
  - Submit button shows loading state
  - API call made with form data
  - Success → shows toast notification
  - Success → redirect to brand details
  - Error → shows error message, form retained

✓ Database
  - Brand record created in database
  - Brand associated with user's organization
  - Logo URL stored in database
  - Active flag set to true by default
```

#### Brand Details (`/dashboard/brands/[id]`)

```
✓ Page loads
  - Brand name displays in header
  - Brand metrics show (score, audits, mentions)
  - All tabs visible: Overview, Audits, Mentions, Settings

✓ Brand Overview Tab
  - Shows brand summary
  - Shows recent mentions
  - Shows recent audits
  - Shows GEO score trend

✓ Brand Settings Tab
  - Show current brand settings
  - Edit button → opens edit form
  - Brand name editable
  - Domain editable
  - Logo editable
  - Save changes → success toast
  - Save changes → database updated
  - Discard changes → cancel form

✓ Edit Brand Functionality
  - Click "Edit" → form opens
  - Current values pre-filled
  - Make changes → click Save
  - Changes reflected immediately
  - Changes persisted to database

✓ Delete Brand (if available)
  - Show confirmation dialog
  - "Cancel" → closes dialog
  - "Delete" → removes brand
  - Redirect to brands list
  - Database record deleted
```

---

### 4. 🔍 AUDIT FEATURE

#### Audit Dashboard (`/dashboard/audit`)

```
✓ Page loads
  - List of all audits shows
  - Sort by date/score works
  - Filter by status (pending/in-progress/completed)
  - No audits → empty state

✓ Audit cards
  - Show domain
  - Show GEO score
  - Show completion percentage
  - Show last audit date
  - Click → navigate to audit results

✓ Start New Audit
  - Click "New Audit" button
  - Select brand dropdown shows available brands
  - Click "Start Audit" → audit begins
  - Shows in-progress state with spinner
  - Audit completes (simulated ~30s)
  - Results display automatically
```

#### Audit Results (`/dashboard/audit/results?id=[id]`)

```
✓ Results page loads
  - No 404 error
  - Audit details show
  - All result cards render

✓ Overall Score Card
  - Shows unified score (GEO)
  - Shows grade (A/B/C/D)
  - Shows last updated date
  - Color coding matches grade

✓ Category Scores Grid
  - Shows all 5 categories: GEO, SEO, AEO, SMO, PPO
  - Each shows score 0-100
  - Color gradient shows performance level
  - Click category → shows detailed breakdown

✓ Issues by Severity
  - Critical issues highlighted in red
  - High issues in orange
  - Medium issues in yellow
  - Low issues in gray
  - Count of issues per severity
  - Filter by severity works

✓ Phase 4: Performance Deep Dive
  - Loads performance metrics
  - Shows Core Web Vitals (LCP, FID, CLS)
  - Shows page load time
  - Shows optimization opportunities
  - No console errors

✓ Phase 5: AI Readiness Analysis
  - Shows AI readiness score
  - Shows platform breakdown (ChatGPT, Claude, etc.)
  - Shows optimization recommendations
  - Lists missing schema types
  - No console errors

✓ Phase 6: SEO Content Analysis
  - Shows content quality metrics
  - Lists top pages by word count
  - Shows keyword opportunities
  - Shows indexation status
  - Lists backlink summary
  - All cards render without errors

✓ Phase 7: Competitive Analysis
  - Shows competitor comparison
  - Displays gap analysis vs industry average
  - Shows competitive positioning
  - Calculates percentile rank
  - Shows tier classification (leader/competitive/lagging)
  - No console errors

✓ Phase 8: Improvement Roadmap
  - "Start Improvement Roadmap" button visible
  - Click button → navigate to roadmap page
  - Roadmap page loads successfully
  - URL includes audit ID and mode parameter

✓ Export functionality
  - Click Export button
  - Shows export options: PDF, JSON, CSV
  - Select PDF → downloads PDF file
  - PDF contains audit data
  - JSON file downloads
  - CSV file downloads

✓ Share functionality
  - Click Share button
  - URL copied to clipboard
  - Toast shows "Link copied!"
  - Copied URL can be shared
  - Link opens same audit for other users
```

#### Improvement Roadmap (`/dashboard/audit/roadmap?id=[id]&mode=[mode]`)

```
✓ Roadmap page loads
  - Header shows title
  - Back button returns to audit
  - All phases visible (Phase 1, 2, 3)

✓ Phase 1: Quick Wins (1-2 weeks)
  - Show +12 expected points
  - Show 3 milestones:
    - Add FAQ Schema Markup
    - Optimize Meta Descriptions
    - Enable AI Platform Indexing
  - Each milestone expandable
  - Milestones show estimated days

✓ Phase 2: Month 1 Focus (2-4 weeks)
  - Show +18 expected points
  - Show 3 milestones:
    - Create Pillar Content Strategy
    - Build Backlink Profile
    - Social Media Content Calendar
  - Difficulty indicators (easy/medium/hard)

✓ Phase 3: Ongoing (Continuous)
  - Show +8 expected points
  - Show 3 milestones:
    - Monthly Content Updates
    - AI Platform Monitoring
    - Performance Monitoring & Testing
  - Categorized by dimension (GEO/SEO/AEO/SMO/PPO)

✓ Milestone expansion
  - Click milestone → expands to show action items
  - Each action item shows description
  - Checkboxes for marking complete
  - Effort estimates (low/medium/high)
  - Days to complete estimate

✓ Progress tracking
  - Shows current vs target score
  - Shows total impact across roadmap
  - Shows estimated timeline (weeks)
  - Progress bar updates as milestones complete

✓ Timeline visualization
  - Shows projected scores for each phase
  - Shows phase-by-phase impact
  - Shows percentile rank progression
  - Achievement milestones visible

✓ CTA and actions
  - Share button works
  - Export button works
  - More options menu functional
```

---

### 5. 💬 MONITOR/MENTIONS FEATURE

#### Monitor Dashboard (`/dashboard/monitor`)

```
✓ Page loads
  - Shows brand mention summary
  - Shows platform breakdown
  - Shows recent mentions list
  - No console errors

✓ Mention cards
  - Show platform (ChatGPT, Claude, etc.)
  - Show query/mention text
  - Show sentiment (positive/neutral/negative)
  - Show date/timestamp
  - Show position (ranked 1, 2, 3, etc.)

✓ Platform filtering
  - Click platform filter
  - Mentions filter by selected platform
  - Multiple platforms selectable
  - Clear filters button works

✓ Sentiment filtering
  - Filter by positive/neutral/negative
  - Multiple sentiments selectable
  - "All" option available

✓ Mention details
  - Click mention → details modal opens
  - Shows full response text from AI model
  - Shows competitors mentioned
  - Shows positioning relative to competitors
  - Close modal → returns to list
```

---

### 6. ✍️ CREATE/CONTENT FEATURE

#### Content Creation (`/dashboard/create/new`)

```
✓ Create form loads
  - Select brand dropdown
  - Content type selector (blog/whitepaper/guide/case-study)
  - Topic/title input field
  - Target audience field
  - Keywords input
  - Form validation works

✓ Form submission
  - Fill all required fields
  - Click "Generate Brief" button
  - Shows loading state
  - API call made to generation service
  - Brief displays in right panel
  - No errors in console

✓ Brief generation
  - Shows generated outline
  - Shows key talking points
  - Shows target SEO keywords
  - Shows content structure
  - Edit button allows manual edit

✓ Content generation
  - Click "Generate Content" button
  - Shows loading state (~30s)
  - Generated content displays
  - Content includes markdown formatting
  - Include title, headings, paragraphs
  - Include call-to-action
  - No console errors

✓ Edit generated content
  - Click in content area
  - Text editable directly
  - Changes saved to draft
  - Can discard changes
  - Can save draft
  - Toast shows save confirmation

✓ Publish content
  - Click "Publish" button
  - Show scheduling options
  - Publish immediately or schedule
  - Click "Publish" → content published
  - Redirect to published content page
  - Toast shows success
  - Database record created with status='published'

✓ Content library
  - Navigate to `/dashboard/create/library`
  - List all created content
  - Show draft/published status
  - Filter by status
  - Sort by date/title
  - Click content → view details
```

---

### 7. ⚔️ COMPETITIVE ANALYSIS

#### Competitive Dashboard (`/dashboard/competitive`)

```
✓ Page loads
  - Competitor list shows
  - Add competitor button visible
  - Empty state if no competitors

✓ Add competitor
  - Click "Add Competitor" button
  - Enter competitor domain
  - Click "Add" → competitor added
  - Competitor appears in list
  - Database record created

✓ Competitor cards
  - Show competitor domain
  - Show GEO score
  - Show competitive status (leader/competitive/lagging)
  - Click → navigate to competitor detail page

✓ Competitive positioning
  - Show your brand position (#1 of 5, etc.)
  - Show percentile rank
  - Show tier (Top 20%, Competitive, Lagging)
  - Show trend (up/down/stable)
```

#### Competitor Detail Page (`/dashboard/competitive/[name]`)

```
✓ Page loads
  - Competitor name in header
  - Comparison with your brand
  - Head-to-head metrics

✓ Competitor comparison
  - Shows unified scores for you vs competitor
  - Shows 5-score breakdown (GEO/SEO/AEO/SMO/PPO)
  - Shows where you win/lose
  - Shows score differences in points

✓ Gap analysis
  - Shows gaps in each dimension
  - Shows industry average
  - Shows top competitor score
  - Identifies your strongest area
  - Identifies your biggest gap

✓ Positioning card
  - Shows your market position
  - Shows percentile rank
  - Shows competitive status
  - Shows next steps for improvement
  - "Start Improvement Roadmap" CTA button works
```

#### Roadmap from Competitive

```
✓ Mode parameter works
  - Click "Start Improvement Roadmap" from competitor page
  - Roadmap opens with mode=beat_competitor
  - Competitor name shown in roadmap title
  - Milestones specific to beating that competitor
  - Back button returns to competitor page
```

---

### 8. 📱 RESPONSIVE DESIGN

#### Test on Multiple Devices

```
✓ Desktop (1920x1080)
  - All elements visible
  - No horizontal scrolling
  - Multi-column layouts visible
  - Sidebar always visible

✓ Laptop (1366x768)
  - All elements visible
  - Navigation works
  - Forms usable

✓ Tablet (768x1024)
  - Responsive menu visible
  - 2-column layout
  - Touch interactions work
  - No elements cut off

✓ Mobile (375x812)
  - Hamburger menu works
  - Full-width single column
  - Touch targets adequate (44x44px minimum)
  - Text readable without zoom
  - Forms scrollable
  - No horizontal scrolling

✓ Responsive breakpoints
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px
  - Each breakpoint tested
```

---

### 9. 🎨 THEME & STYLING

#### Light Mode

```
✓ Light theme applies
  - Background: white
  - Text: dark gray/black
  - Cards: light gray (subtle borders)
  - Primary accent: cyan (#00E5CC)
  - Buttons: cyan background, dark text
  - All text readable
  - Good contrast ratio (WCAG AA minimum)
```

#### Dark Mode

```
✓ Dark theme applies
  - Background: deep navy (#0a0f1a)
  - Cards: dark navy (#141930)
  - Text: light gray/white
  - Primary accent: cyan (#00E5CC)
  - All text readable
  - No eye strain
  - Buttons visible

✓ Theme toggle
  - Click theme toggle button
  - Theme changes immediately
  - Theme persists on page reload
  - LocalStorage updated with theme preference

✓ Design system compliance
  - Card hierarchy: card-primary, card-secondary, card-tertiary
  - Color usage: max 3-4 accent colors per view
  - Spacing: consistent 4px grid
  - Shadows: glassmorphism only on modals
  - Typography: consistent font weights
```

---

### 10. 🔌 API ENDPOINTS

#### Admin Endpoints

```
✓ GET /api/admin/dashboard/stats
  - Returns dashboard statistics
  - Response status: 200
  - Response includes: brands, audits, mentions, recommendations
  - No authentication → 401
  - Invalid auth → 401
  - Non-admin → 403

✓ GET /api/admin/dashboard/activity
  - Returns activity feed
  - Returns recent actions
  - Paginated results
  - No console errors

✓ POST /api/admin/organizations
  - Create new organization
  - Returns 201 Created
  - Response includes org_id
  - org_id is UUID
  - org_slug is unique and URL-safe
  - org_name required
  - Database record created

✓ POST /api/admin/api-keys
  - Create new API key
  - Returns 201 Created
  - Key is cryptographically secure
  - Key stored in database
  - Organization-scoped
  - Non-admin → 403

✓ DELETE /api/admin/api-keys/[id]
  - Delete API key
  - Returns 200 Success or 204 No Content
  - Key removed from database
  - API calls with deleted key fail
  - Non-owner → 403

✓ POST /api/admin/api-keys/[id]/rotate
  - Rotate API key
  - Returns new key
  - Old key invalidated
  - Database updated
```

#### Brand Endpoints

```
✓ GET /api/brands
  - Returns user's brands
  - Returns array of brand objects
  - Includes: id, name, domain, score, logo_url
  - Organization-scoped (no cross-org data leak)
  - No auth → 401
  - Returns 200

✓ POST /api/brands
  - Create brand
  - Returns 201 Created
  - Brand data: name, domain, industry, keywords
  - Organization-scoped
  - Database record created
  - Active status set to true

✓ GET /api/brands/[id]
  - Get brand details
  - Returns full brand object
  - Includes related data: audits, mentions
  - Only org member can access
  - Returns 200

✓ PUT /api/brands/[id]
  - Update brand
  - Returns 200
  - Fields updatable: name, domain, industry, keywords
  - Logo URL updated if new image uploaded
  - Database updated
  - Only org member can update

✓ DELETE /api/brands/[id]
  - Delete brand
  - Returns 200 or 204
  - Brand removed from database
  - Related mentions/audits handled (cascade or soft delete)
  - Only owner can delete
  - Non-owner → 403
```

#### Audit Endpoints

```
✓ POST /api/audit/scan
  - Trigger new audit
  - Returns 200 or 202 Accepted (async)
  - Returns job_id for polling
  - Required params: brand_id or domain
  - Creates audit record in database
  - Audit status: pending/in_progress/completed

✓ GET /api/audit/results/[id]
  - Get audit results
  - Returns full audit with breakdown
  - Includes: score, issues, recommendations
  - Organization-scoped
  - Returns 200
  - Not found → 404

✓ GET /api/audit/recommendations
  - Get recommendations from audit
  - Returns array of recommendation objects
  - Includes: title, description, impact, effort
  - Filtered by audit_id or brand_id
  - Sorted by priority

✓ POST /api/audit/recommendations/[id]/dismiss
  - Dismiss recommendation
  - Returns 200
  - Status updated: dismissed
  - Database updated
  - Recommendation still visible but marked dismissed

✓ POST /api/audit/recommendations/[id]/implement
  - Mark recommendation as implemented
  - Returns 200
  - Status updated: in_progress → completed
  - Database updated
```

#### Monitor Endpoints

```
✓ GET /api/monitor/mentions
  - Get brand mentions
  - Returns array of mentions
  - Includes: platform, query, sentiment, position, date
  - Organization-scoped
  - Filterable by platform/sentiment
  - Paginated

✓ POST /api/monitor/test-platform
  - Manual test of AI platform query
  - Required params: brand, platform, query
  - Returns: mention found, position, response text
  - Creates mention record if found
  - Database updated

✓ GET /api/monitor/analytics
  - Get mention analytics
  - Returns aggregated data
  - Includes: platforms breakdown, sentiment distribution, trends
  - Date range filterable
  - Returns 200
```

#### Content Endpoints

```
✓ POST /api/create/brief
  - Generate content brief
  - Required params: brand, topic, audience
  - Returns: outline, key points, keywords
  - Calls Claude API internally
  - Returns 200
  - API error → returns 500 with error message

✓ POST /api/create/generate
  - Generate full content
  - Required params: brand, brief, keywords
  - Returns: generated HTML/markdown content
  - Calls Claude API internally
  - Returns 200

✓ GET /api/create/library
  - Get user's content library
  - Returns array of content objects
  - Filterable by status (draft/published)
  - Includes: title, type, status, created_date, word_count
  - Paginated

✓ POST /api/create/publish
  - Publish content
  - Required params: content_id
  - Optional params: publish_date (for scheduling)
  - Returns: published_url
  - Database status updated: published
  - Returns 200
```

#### Competitive Endpoints

```
✓ GET /api/competitive/analysis
  - Get competitive analysis
  - Returns: your scores, competitors, gaps, positioning
  - Calculates percentile rank
  - Returns 200

✓ POST /api/competitive/add
  - Add competitor
  - Required params: domain
  - Returns 201 Created
  - Scrapes competitor data
  - Database record created

✓ DELETE /api/competitive/[id]
  - Remove competitor
  - Returns 200 or 204
  - Database record deleted
  - Related analysis cleared
```

#### Error Responses

```
✓ 400 Bad Request
  - Missing required fields → 400 with error message
  - Invalid field format → 400 with validation errors
  - Response format: { success: false, error: "..." }

✓ 401 Unauthorized
  - No auth token → 401
  - Invalid token → 401
  - Response format: { success: false, error: "Unauthorized" }

✓ 403 Forbidden
  - Insufficient permissions → 403
  - Cross-org access → 403
  - Response format: { success: false, error: "Forbidden" }

✓ 404 Not Found
  - Resource not found → 404
  - Returns: { success: false, error: "Not found" }

✓ 500 Internal Server Error
  - Database error → 500
  - API service error → 500
  - Includes error message (dev mode shows stack trace)
```

---

### 11. 🗄️ DATABASE OPERATIONS

#### Brand Records

```
✓ Create brand
  - INSERT INTO brands (name, domain, organization_id, ...)
  - All fields populated
  - UUID generated for id
  - created_at set to NOW()
  - Record readable immediately

✓ Read brand
  - SELECT * FROM brands WHERE id = ?
  - Returns complete record
  - Logo URL correct
  - Scores match audit results

✓ Update brand
  - UPDATE brands SET name = ? WHERE id = ?
  - Fields updatable: name, domain, industry, keywords, logo_url
  - updated_at timestamp changes
  - Changes immediately reflected in API

✓ Delete brand
  - DELETE FROM brands WHERE id = ?
  - Record removed
  - Not found in subsequent queries
  - Consider cascade or orphaned records
```

#### Audit Records

```
✓ Create audit
  - INSERT INTO audits (brand_id, domain, status, ...)
  - Status: pending
  - created_at/started_at set
  - Returned to frontend with job_id

✓ Update audit status
  - UPDATE audits SET status = 'in_progress' WHERE id = ?
  - UPDATE audits SET status = 'completed', completed_at = NOW() WHERE id = ?
  - Scores and breakdown populated when completed

✓ Query audit results
  - SELECT * FROM audits WHERE id = ?
  - Returns all score breakdowns
  - Issues array populated
  - Timestamps correct

✓ Cascade delete
  - DELETE brand → should cascade delete related audits
  - Or mark audits as orphaned?
  - Verify behavior
```

#### Mention Records

```
✓ Create mention (from API query)
  - INSERT INTO brandMentions (brand_id, platform, query, ...)
  - Platform: chatgpt, claude, gemini, perplexity, grok, deepseek, copilot
  - Sentiment: positive, neutral, negative
  - Position: 1, 2, 3, etc.
  - timestamp: NOW()

✓ Bulk insert mentions (from scraping)
  - INSERT INTO brandMentions (...) VALUES (...)
  - Multiple rows in single transaction
  - All records created successfully
  - No duplicates

✓ Query mentions by platform
  - SELECT * FROM brandMentions WHERE platform = ? AND brand_id = ?
  - Returns all mentions for that platform
  - Sorted by timestamp DESC
```

#### Recommendation Records

```
✓ Create recommendation (auto-generated from audit)
  - INSERT INTO recommendations (domain_id, type, priority, ...)
  - Type: content_gap, schema_audit, language, voice_search, technical
  - Priority: critical, high, medium, low
  - Status: pending
  - Evidence JSONB populated

✓ Update recommendation status
  - UPDATE recommendations SET status = 'in_progress' WHERE id = ?
  - UPDATE recommendations SET status = 'completed' WHERE id = ?
  - UPDATE recommendations SET status = 'dismissed' WHERE id = ?
  - Timestamps updated

✓ Query recommendations by priority
  - SELECT * FROM recommendations WHERE domain_id = ? ORDER BY priority_score DESC
  - Returns highest priority first
  - Paging works
```

#### Transaction Integrity

```
✓ Atomic transactions
  - Create audit + create recommendations in same transaction
  - Both succeed or both fail
  - No partial updates

✓ Foreign key constraints
  - Cannot create audit without valid brand_id
  - Cannot create mention without valid brand_id
  - Cascade/restrict verified
```

---

### 12. 🪝 REACT HOOKS

#### useAudit()

```
✓ Hook initialization
  - Call useAudit(auditId)
  - Returns: { data, isLoading, error }

✓ Loading state
  - Initially isLoading = true
  - Shows skeleton/spinner on page
  - data = null

✓ Success state
  - After API returns
  - isLoading = false
  - data = audit object with all fields
  - error = null
  - Renders full audit results

✓ Error state
  - API fails (404, 500, etc.)
  - isLoading = false
  - error = error object
  - data = null
  - Shows error message
  - Shows retry button

✓ Refetch capability
  - Call refetch() function
  - Shows loading state
  - Fetches fresh data
  - Updates UI

✓ Dependency handling
  - Change auditId parameter
  - Hook refetches automatically
  - Cleans up previous request
```

#### useContent()

```
✓ Initialize hook
  - Call useContent({ brand_id, filters })
  - Returns: { content, isLoading, error, createContent, updateContent, deleteContent }

✓ List content
  - content array populated
  - Filter by status (draft/published)
  - Sort by date/title
  - Pagination handled

✓ Create content
  - Call createContent({ title, brief, content })
  - Shows loading state
  - API call made
  - Returns new content object
  - content array updated
  - UI reflects new content

✓ Update content
  - Call updateContent(id, { title, content })
  - API call made
  - content array updated
  - UI reflects changes

✓ Delete content
  - Call deleteContent(id)
  - Shows confirmation
  - API call made
  - content array updated
  - Deleted item removed from UI
```

#### useCompetitorComparison()

```
✓ Hook initialization
  - Call useCompetitorComparison(audit)
  - Returns competitor data object

✓ Data structure
  - yourBrand object with 5 scores
  - competitors array with competitor objects
  - industryBenchmark object
  - gaps array with dimension analysis
  - positioning object with rank/percentile/status

✓ Calculations
  - Unified score calculated correctly
  - Percentile rank accurate
  - Gap percentages accurate
  - Competitive status classification (leader/competitive/lagging)

✓ Re-calculation
  - Update audit data → hook recalculates
  - New scores reflected immediately
  - Percentile rank updates
  - Competitive status changes if needed
```

#### useRoadmapGenerator()

```
✓ Hook initialization
  - Call useRoadmapGenerator(audit, mode, targetCompetitor)
  - mode: "leader" or "beat_competitor"
  - Returns: roadmap object or null

✓ Roadmap structure
  - 3 phases (Quick Wins, Month 1, Ongoing)
  - 11 milestones total (3-4 per phase)
  - 25+ action items across milestones
  - Score impacts calculated

✓ Mode: leader
  - Title: "Path to Industry Leadership"
  - targetCompetitor: null
  - Target score: 88
  - Milestones generic (not competitor-specific)

✓ Mode: beat_competitor
  - Title: "Beat [CompetitorName]"
  - targetCompetitor: set to competitor name
  - Target score: competitor_score + 5
  - Milestones mention specific competitor

✓ Timeline calculation
  - estimatedWeeks calculated correctly
  - Phase durations accurate
  - Milestone days realistic

✓ Score projection
  - Each phase shows expected impact
  - Total impact = sum of all phases
  - Projected score calculated
```

---

### 13. 🏪 STATE STORES (Zustand)

#### useBrandStore

```
✓ Initial state
  - brands: []
  - selectedBrand: null
  - meta: { total: 0, limit: 20, plan: "free", canAddMore: true }

✓ setItems action
  - Call setBrands(brandArray)
  - brands state updated
  - localStorage updated with key "apex-brand-state"
  - Subscribers notified

✓ addBrand action
  - Call addBrand(newBrand)
  - New brand added to brands array
  - localStorage updated
  - UI reflects new brand

✓ updateBrand action
  - Call updateBrand(id, updates)
  - Brand updated in array
  - localStorage updated

✓ removeBrand action
  - Call removeBrand(id)
  - Brand removed from array
  - If selected brand removed, clear selection
  - localStorage updated

✓ Persistence
  - Reload page
  - Store data restored from localStorage
  - brands array intact
  - selected brand preserved

✓ Plan limits
  - canAddMore = false when at plan limit
  - Add button disabled
  - Show upgrade prompt
```

#### useAuthStore

```
✓ Initial state
  - userId: null
  - orgId: null
  - orgRole: null
  - user: null

✓ setUser action
  - Call setUser(userData)
  - All user fields updated
  - userId set
  - Persisted in localStorage or session

✓ setOrganization action
  - Call setOrganization(orgData)
  - orgId, orgRole, orgSlug set
  - Persisted

✓ logout action
  - Call logout()
  - All fields cleared
  - localStorage/session cleared
  - Redirect to signin
```

#### useUIStore

```
✓ Initial state
  - theme: "dark" (or from localStorage)
  - sidebarCollapsed: false
  - openModals: {}

✓ toggleTheme action
  - Call toggleTheme()
  - theme: "dark" → "light" or vice versa
  - localStorage updated
  - CSS classes updated on document
  - UI theme changes immediately

✓ setSidebarCollapsed action
  - Call setSidebarCollapsed(true/false)
  - sidebarCollapsed state updated
  - localStorage updated
  - Sidebar appearance changes

✓ openModal action
  - Call openModal("modalName")
  - openModals["modalName"] = true
  - Modal renders/visible
  - Backdrop visible

✓ closeModal action
  - Call closeModal("modalName")
  - openModals["modalName"] = false
  - Modal hidden
  - Backdrop removed
```

---

### 14. 🧩 COMPONENT RENDERING

#### Core Components

```
✓ GeoScoreTrend
  - Renders without errors
  - Shows chart with data points
  - Shows trend line (up/down/flat)
  - Y-axis: 0-100 score
  - X-axis: dates
  - Hover tooltip shows exact score and date

✓ PrioritizedRecommendations
  - Shows list of recommendations
  - Sorted by priority (critical → low)
  - Each recommendation: title, description, impact
  - Click recommendation → details
  - Dismiss button works
  - Implement button marks complete

✓ DomainMetrics
  - Shows key metrics in cards
  - Values update when data changes
  - No layout shift
  - Responsive on mobile

✓ RecentActivity
  - Shows activity feed in chronological order
  - Shows user avatar, action, timestamp
  - Infinite scroll or pagination works
  - No console errors

✓ Empty States
  - No brands → "No brands found" message
  - No audits → "No audits found" message
  - No mentions → "No mentions found" message
  - Empty state has icon, message, and CTA button
```

#### Audit Components

```
✓ PerformanceDeepDive
  - Renders without errors
  - Shows Core Web Vitals (LCP, FID, CLS)
  - Shows page speed metrics
  - Shows optimization opportunities
  - No console errors

✓ AIReadinessDeepDive
  - Shows AI readiness score
  - Shows platform breakdown
  - Lists missing schema types
  - Shows optimization tips
  - No console errors

✓ SEOContentAnalysisDeepDive
  - Shows content quality metrics
  - Lists pages with word count and readability
  - Shows keyword opportunities
  - Shows indexation status
  - Lists backlink summary
  - No console errors

✓ CompetitorComparisonDeepDive
  - Shows competitor comparison card
  - Shows gap analysis card
  - Shows positioning card
  - All cards render without errors
  - Data consistent across cards

✓ RoadmapPhaseCard
  - Phase expands/collapses on click
  - Shows phase title, description, duration
  - Shows milestones list when expanded
  - Progress bar shows completion percentage
  - No console errors

✓ MilestoneCard
  - Milestone expands to show action items
  - Shows difficulty, duration, category
  - Checkboxes for action items functional
  - Completed items show strikethrough
  - Progress bar updates
  - No console errors

✓ ProgressTimeline
  - Shows score progression across phases
  - Shows current, projected, and target scores
  - Phase progression visible
  - Timeline connects phases
  - No console errors
```

---

### 15. 🔍 ERROR HANDLING & EDGE CASES

#### API Error Handling

```
✓ Network errors
  - No internet → shows error message
  - Timeout → shows timeout message
  - Shows retry button
  - Retry attempts work

✓ Validation errors
  - Form submission with invalid data
  - Shows field-level error messages
  - Form values retained
  - User can fix and resubmit

✓ Not found errors (404)
  - Navigate to non-existent brand
  - Shows "Not found" message
  - Link back to dashboard visible
  - No console errors

✓ Unauthorized errors (401)
  - Expired session
  - Shows "Please sign in" message
  - Redirect to signin page
  - Auth flow works after re-signin

✓ Forbidden errors (403)
  - Attempt cross-org access
  - Shows "Access denied" message
  - No data leaked
  - Redirect to allowed resource
```

#### Form Edge Cases

```
✓ Very long inputs
  - Brand name with 500 characters
  - Textarea with 10,000 characters
  - Form handles without breaking
  - Database stores full content
  - Truncation if needed in display

✓ Special characters
  - Brand name with emoji 🚀
  - Form accepts emoji
  - Database stores correctly
  - Displays correctly on retrieval

✓ SQL injection prevention
  - Form field: "; DROP TABLE brands; --"
  - Treated as literal string
  - Not executed as SQL
  - Stored safely

✓ XSS prevention
  - Form field: "<script>alert('XSS')</script>"
  - Treated as literal string
  - Not executed as JavaScript
  - Escaped in HTML output
  - No alert appears

✓ Duplicate prevention
  - Add brand with same domain twice
  - Second attempt rejected
  - Error message shown
  - Form values retained
```

#### Performance Edge Cases

```
✓ Large data sets
  - 1000+ brands
  - List still responsive
  - Pagination works
  - Search still fast

✓ Slow API responses
  - API takes 10+ seconds
  - Loading state persists
  - User can cancel request
  - No UI freezes

✓ Concurrent requests
  - User clicks audit twice quickly
  - Second click ignored or queued
  - Only one audit started
  - No duplicate records
```

---

### 16. 🎯 END-TO-END WORKFLOWS

#### Complete Workflow 1: Setup & Monitor

```
1. Sign in to Apex
2. Create new brand (example.com)
3. Navigate to Monitor
4. See brand mentions appear
5. Filter by platform (ChatGPT)
6. View top mention details
7. Check sentiment distribution
8. Export mention data

✓ All steps complete without errors
✓ Data accurate throughout
✓ UI responsive at each step
✓ No console errors
```

#### Complete Workflow 2: Audit & Roadmap

```
1. Sign in
2. Navigate to Audit
3. Select brand
4. Start new audit
5. Wait for audit to complete (~30s)
6. View audit results (GEO score, etc.)
7. Review Phase 6: SEO Content Analysis
8. Review Phase 7: Competitive Analysis
9. Click "Start Improvement Roadmap"
10. View Phase 1: Quick Wins
11. Expand first milestone
12. Check action items
13. Return to audit
14. Share audit results

✓ Each step works correctly
✓ Roadmap loads from correct audit ID
✓ Back navigation works
✓ Share generates valid URL
```

#### Complete Workflow 3: Content Creation

```
1. Sign in
2. Navigate to Create
3. Click New Content
4. Select brand
5. Choose content type (blog)
6. Enter topic
7. Click Generate Brief
8. Review brief
9. Click Generate Content
10. Review generated content
11. Edit content directly
12. Save draft
13. Click Publish
14. Choose publish date (immediately)
15. Publish confirmed
16. Navigate to Content Library
17. View published content
18. Click content → view details

✓ Each step completes successfully
✓ API calls successful
✓ Content created in database
✓ Library shows published content
```

#### Complete Workflow 4: Competitive Analysis

```
1. Sign in
2. Navigate to Competitive Analysis
3. Add competitor (competitor.com)
4. View competitor scores
5. Click competitor card
6. View head-to-head comparison
7. Review gap analysis
8. See competitive positioning
9. Click "Start Improvement Roadmap"
10. Roadmap opens with beat_competitor mode
11. Title shows "Beat [Competitor]"
12. Milestones specific to competitor
13. Review projected score growth
14. Return to competitive analysis
15. Remove competitor
16. List updates

✓ Each step completes successfully
✓ Competitor data accurate
✓ Roadmap mode correct
✓ Removal works
```

---

### 17. 📊 VISUAL REGRESSION

#### Screenshot Tests

```
✓ Dashboard homepage
  - Screenshot current state
  - Compare to baseline
  - No unintended style changes
  - Layout intact

✓ Audit results page
  - All sections render as expected
  - Charts display correctly
  - Text readable
  - Colors match design system

✓ Competitive analysis
  - Cards aligned properly
  - Progress bars correct width
  - Percentile rank displayed
  - No overlapping elements

✓ Roadmap page
  - Phase cards proper width
  - Milestones properly nested
  - Timeline vertical alignment
  - Action items indented

✓ Mobile layouts
  - Single column layout
  - No horizontal scroll
  - Touch targets adequate
  - Text readable
```

---

### 18. 🌐 BROWSER & DEVICE COMPATIBILITY

#### Browsers

```
✓ Chrome/Edge (latest 2 versions)
  - All features work
  - No console errors
  - Performance good

✓ Firefox (latest 2 versions)
  - All features work
  - No console errors

✓ Safari (latest 2 versions)
  - All features work
  - Touch interactions work
  - CSS prefixes applied

✓ Mobile Safari (iOS)
  - Touch interactions work
  - Forms usable
  - No horizontal scroll
```

#### Devices

```
✓ iPhone 12
  - 390x844px
  - Touch works
  - Forms usable
  - Text readable

✓ iPad Pro
  - 1024x1366px
  - 2-column layout
  - Sidebar visible
  - All features work

✓ Android phones
  - Samsung Galaxy S21 (1440x3200px)
  - Touch works
  - Forms usable

✓ Desktop
  - 1920x1080
  - All features visible
  - Multi-column layouts work
```

---

### 19. 🔒 SECURITY

#### Input Validation

```
✓ SQL injection prevention
  - Parameterized queries used
  - No raw SQL construction
  - Drizzle ORM escaping verified

✓ XSS prevention
  - All user input escaped in output
  - React.ReactNode typed properly
  - dangerouslySetInnerHTML not used
  - Sanitize HTML if needed

✓ CSRF protection
  - All POST/PUT/DELETE require CSRF token
  - Token verified server-side
  - Tokens rotated appropriately

✓ Authentication bypass
  - JWT token validation on all protected routes
  - Session timeout tested
  - Token expiration respected
```

#### Data Privacy

```
✓ Cross-org data leak prevention
  - Query filters by organization_id
  - User cannot access other org brands
  - User cannot access other org audits
  - User cannot access other org mentions

✓ API key security
  - API keys never logged in console
  - API keys never shown in responses after creation
  - API keys rotated regularly
  - Old keys invalidated

✓ Data encryption
  - Database connection: SSL/TLS required
  - Sensitive data: encrypted at rest
  - API keys: hashed or encrypted
  - Passwords: handled by Clerk

✓ Audit logging
  - Admin actions logged
  - User actions can be logged
  - Logs immutable
  - Logs retained for compliance
```

---

### 20. 🎵 CONSOLE & ERROR MONITORING

#### Console Checks

```
✓ No console errors
  - Browser DevTools → Console
  - No error messages
  - No red X icons
  - Run all workflows

✓ No console warnings
  - Deprecated API warnings
  - React strict mode warnings
  - Performance warnings

✓ No console.log spam
  - Development logs removed in prod build
  - Debug mode toggle works
  - Performance unaffected

✓ Network tab
  - No failed requests (all 200/201/204)
  - No CORS errors
  - API responses valid JSON
  - Response times acceptable (<2s)
  - No hanging requests
```

#### Error Monitoring Setup

```
✓ Error tracking enabled
  - Sentry or similar configured
  - Unhandled errors captured
  - Stack traces available
  - Errors in dev and prod
  - Email alerts configured (if needed)

✓ Error boundaries
  - React error boundary catches UI errors
  - Error page displays
  - User can navigate away
  - Error logged to monitoring service
```

---

## Test Execution Checklist

Use this checklist when running comprehensive E2E tests:

### Phase 0: Pre-Test Setup
- [ ] Fresh database state (or reset)
- [ ] Environment variables validated
- [ ] API services available (Claude, OpenAI, etc.)
- [ ] External integrations responding (Clerk, Upstash, Neon)
- [ ] Browser DevTools open and console visible
- [ ] Network tab recording

### Phase 1: Auth & Access (30 min)
- [ ] Sign-in flow
- [ ] Sign-up flow
- [ ] Role-based access control
- [ ] Protected routes
- [ ] API authentication
- [ ] Session timeout

### Phase 2: Dashboard & Core UI (30 min)
- [ ] Homepage loads
- [ ] All sections render
- [ ] Navigation works
- [ ] Responsive design
- [ ] Theme toggle
- [ ] No console errors

### Phase 3: Brand Management (30 min)
- [ ] List brands
- [ ] Create brand
- [ ] Brand details
- [ ] Edit brand
- [ ] Delete brand
- [ ] All CRUD operations

### Phase 4: Audit Feature (45 min)
- [ ] Start audit
- [ ] View results
- [ ] Phase 4: Performance
- [ ] Phase 5: AI Readiness
- [ ] Phase 6: SEO Content
- [ ] Phase 7: Competitor
- [ ] Phase 8: Roadmap
- [ ] Export results
- [ ] Share results

### Phase 5: Monitor Feature (30 min)
- [ ] List mentions
- [ ] Filter by platform
- [ ] Filter by sentiment
- [ ] View mention details
- [ ] Test platform query
- [ ] Analytics display

### Phase 6: Create Feature (30 min)
- [ ] Create form
- [ ] Generate brief
- [ ] Generate content
- [ ] Edit content
- [ ] Save draft
- [ ] Publish content
- [ ] Content library

### Phase 7: Competitive (30 min)
- [ ] Add competitor
- [ ] View comparison
- [ ] View gap analysis
- [ ] View positioning
- [ ] Start roadmap (beat competitor mode)
- [ ] Remove competitor

### Phase 8: Roadmap (20 min)
- [ ] Roadmap page loads
- [ ] All phases visible
- [ ] Milestone expansion
- [ ] Action item display
- [ ] Timeline visualization
- [ ] CTA buttons work

### Phase 9: API Testing (45 min)
- [ ] All endpoints tested
- [ ] Auth verification
- [ ] Error responses
- [ ] Response formats
- [ ] Performance acceptable

### Phase 10: Database (30 min)
- [ ] All CRUD operations
- [ ] Relationships verified
- [ ] Cascades work
- [ ] Transactions atomic
- [ ] Data integrity

### Phase 11: Hooks & State (30 min)
- [ ] useAudit hook
- [ ] useContent hook
- [ ] useCompetitorComparison hook
- [ ] useRoadmapGenerator hook
- [ ] Zustand stores
- [ ] Persistence

### Phase 12: Components (30 min)
- [ ] All components render
- [ ] No console errors
- [ ] Interactions work
- [ ] Empty states
- [ ] Error states
- [ ] Loading states

### Phase 13: Security (20 min)
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protected
- [ ] Cross-org data leak prevented
- [ ] API keys secure

### Phase 14: Performance & UX (20 min)
- [ ] Page load times
- [ ] API response times
- [ ] Chart rendering
- [ ] Large data sets
- [ ] Mobile performance

### Phase 15: Browser Compatibility (20 min)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Edge

### Phase 16: Complete Workflows (45 min)
- [ ] Setup & Monitor workflow
- [ ] Audit & Roadmap workflow
- [ ] Content Creation workflow
- [ ] Competitive Analysis workflow

### Phase 17: Final Checks (15 min)
- [ ] No console errors
- [ ] No network failures
- [ ] All alerts working
- [ ] Notifications functional
- [ ] Error boundaries engaged (if errors occur)
- [ ] Monitoring/logging active

---

## Test Report Template

```
# Apex Pre-Launch E2E Test Report

Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]
Browser: [BROWSER & VERSION]
Device: [DEVICE]

## Summary
- Total Tests: 200+
- Tests Passed: [NUMBER]
- Tests Failed: [NUMBER]
- Tests Skipped: [NUMBER]
- Success Rate: [PERCENTAGE]%

## Critical Issues Found
- [ISSUE 1]
- [ISSUE 2]

## Major Issues Found
- [ISSUE 1]
- [ISSUE 2]

## Minor Issues Found
- [ISSUE 1]

## Recommendations
- [RECOMMENDATION 1]
- [RECOMMENDATION 2]

## Approval
- [ ] Ready for production
- [ ] Ready for staging
- [ ] Needs more testing

Signed: ________________  Date: ________
```

---

## Quick Commands

```bash
# Run full test suite
npm run test:e2e

# Run specific test file
npm run test:e2e -- audit.spec.ts

# Run with headed browser (watch changes)
npm run test:e2e -- --headed --ui

# Run single test
npm run test:e2e -- -g "should create brand"

# Generate test report
npm run test:e2e -- --reporter=html

# Check console for errors
npm run lint:console-errors
```

---

## Integration with CI/CD

- Run E2E tests on every PR to main
- Run full test suite before staging deployment
- Run before production deployment
- Fail deployment if any critical tests fail
- Generate HTML report for each test run
- Archive test results for compliance

---

**Last Updated**: 2026-01-19
**Version**: 1.0.0
**Status**: Production Ready

This comprehensive testing skill ensures Apex is bulletproof before launch. Use it for every pre-release validation cycle.
