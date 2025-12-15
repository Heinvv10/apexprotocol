# Smart Recommendations Engine - UI Wireframes

## 📐 Wireframe Specifications

### Design Grid
- **Desktop**: 12-column grid, 1280px container max-width
- **Tablet**: 8-column grid, 768px container
- **Mobile**: 4-column grid, 100% width with 16px padding

### Component Key
```
[Button]     = Clickable button
{Icon}       = Icon/emoji
█████        = Loading skeleton / placeholder
▓▓▓▓▓░░░░░   = Progress bar
┌─┐          = Card/container border
|Label ▼|    = Dropdown selector
[x]          = Checkbox
( )          = Radio button
```

---

## 🖥️ Desktop Wireframes

### 1. Dashboard (Landing Page) - Desktop View
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  {🔍} SEARCHABLE                                    {YourBrand ▼}              {👤 User} [⚙️] [Upgrade]  │
│  ────────────────────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                                          │
│  ┌─────────────┐                                                                                        │
│  │             │  DASHBOARD                                                                             │
│  │ 📊 Overview │                                                                                        │
│  │────────────│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 Recs (8) │  │                          YOUR GEO SCORE                                         │  │
│  │   High (3)  │  │                                                                                 │  │
│  │   Med (5)   │  │                              ╱─────────╲                                        │  │
│  │   Low (12)  │  │                             ╱           ╲           📈 +12 points              │  │
│  │────────────│  │                            │      72      │              this month              │  │
│  │ 📈 Score    │  │                            │     ────     │                                      │  │
│  │ 🔗 Integrat │  │                             ╲    B+     ╱            Target: 85 by Dec 31      │  │
│  │ ⚙️ Settings │  │                              ╲─────────╱                                        │  │
│  │             │  │                                                                                 │  │
│  │             │  │  🟢 Schema Quality: 85    🟡 Content Complete: 68    🟢 AI Visibility: 74      │  │
│  │             │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░    ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░        │  │
│  │             │  │                                                                                 │  │
│  │ [+ Quick    │  │  [📊 View Detailed Scorecard →]   [🔄 Rescan Website]   [📥 Download Report]  │  │
│  │    Action]  │  └─────────────────────────────────────────────────────────────────────────────────┘  │
│  │             │                                                                                        │
│  │             │  ┌────────────────────────────────────────────┐  ┌──────────────────────────────────┐│
│  └─────────────┘  │ 🔥 HIGH PRIORITY RECOMMENDATIONS (3)        │  │ 📢 RECENT ACTIVITY               ││
│                   │ ──────────────────────────────────────────  │  │ ───────────────────────────────  ││
│                   │                                             │  │                                  ││
│                   │ 🔴 Add FAQ Schema for Product Pages         │  │ ✅ 2h ago                        ││
│                   │    💡 +15% visibility  ⏱️ 2hrs  📊 92%      │  │    Completed "Add FAQ schema"    ││
│                   │    [🚀 Implement]  [📅 Schedule]  [👁️ View] │  │    → +8 AI mentions detected     ││
│                   │                                             │  │                                  ││
│                   │ 🔴 Translate Homepage to Zulu               │  │ 🔄 5h ago                        ││
│                   │    💡 +12% reach  ⏱️ 4hrs  📊 88%           │  │    Scanned website               ││
│                   │    [🚀 Implement]  [📅 Schedule]  [👁️ View] │  │    → 12 new recommendations      ││
│                   │                                             │  │                                  ││
│                   │ 🟡 Fix Breadcrumb Schema                    │  │ 🎯 Yesterday                     ││
│                   │    💡 +5% structure  ⏱️ 30min  📊 75%       │  │    GEO Score: 68 → 72 (+4)       ││
│                   │    [🚀 Implement]  [📅 Schedule]  [👁️ View] │  │                                  ││
│                   │                                             │  │ 📝 2 days ago                    ││
│                   │ [View All 8 Recommendations →]              │  │    Created Jira task: "Zulu"     ││
│                   └────────────────────────────────────────────┘  │                                  ││
│                                                                   │ [View All Activity →]            ││
│                                                                   └──────────────────────────────────┘│
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐│
│                   │ 📊 QUICK STATS                                                                   ││
│                   │ ─────────────────────────────────────────────────────────────────────────────── ││
│                   │                                                                                  ││
│                   │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐           ││
│                   │  │  📋 Total Recs    │  │  ✅ Completed     │  │  🎯 Completion    │           ││
│                   │  │      20           │  │      12           │  │      60%          │           ││
│                   │  │  ↑ +5 this week   │  │  ↑ +3 this week   │  │  ▓▓▓▓▓▓░░░░      │           ││
│                   │  └───────────────────┘  └───────────────────┘  └───────────────────┘           ││
│                   │                                                                                  ││
│                   │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐           ││
│                   │  │  💪 Avg Impact    │  │  ⏱️ Avg Time      │  │  🔥 Streak        │           ││
│                   │  │      +18%         │  │      2.5 hours    │  │      7 days       │           ││
│                   │  │  visibility boost │  │  per rec          │  │  Don't break it!  │           ││
│                   │  └───────────────────┘  └───────────────────┘  └───────────────────┘           ││
│                   └──────────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Recommendations List - Desktop View (List Mode)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  {🔍} SEARCHABLE                                    {YourBrand ▼}              {👤 User} [⚙️] [Upgrade]  │
│  ────────────────────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                                          │
│  ┌─────────────┐                                                                                        │
│  │             │  RECOMMENDATIONS (20)                                         [🔄 Rescan] [+ Manual]   │
│  │ 📊 Dashboard│                                                                                        │
│  │────────────│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 🎯 Recs (20)│  │ Filters:  [All Types ▼]  [All Priorities ▼]  [All Status ▼]    🔍 [Search...]  │ │
│  │   High (3)  │  │          Views:  [≡ List] [⊞ Board] [📅 Calendar]                               │ │
│  │   Med (5)   │  └──────────────────────────────────────────────────────────────────────────────────┘ │
│  │   Low (12)  │                                                                                        │
│  │────────────│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 📈 Score    │  │ 🔴 HIGH  │  CONTENT GAP                                               [⋮ Menu]   │ │
│  │ 🔗 Integrat │  │ ────────────────────────────────────────────────────────────────────────────────│ │
│  │ ⚙️ Settings │  │ Add FAQ Page for "fibre installation cost"                                      │ │
│  │             │  │                                                                                  │ │
│  │             │  │ 💡 Impact: +15% AI visibility    ⏱️ Effort: 2 hours                             │ │
│  │             │  │ 📊 Confidence: 92%               🎯 Priority Score: 95/100                       │ │
│  │             │  │                                                                                  │ │
│  │             │  │ Evidence: AI models mention competitors 8x more for this query                  │ │
│  │             │  │                                                                                  │ │
│  │             │  │ [🚀 Implement]  [📅 Schedule]  [👁️ View Details]  [✕ Dismiss]                  │ │
│  └─────────────┘  └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 🔴 HIGH  │  LANGUAGE OPPORTUNITY                                      [⋮ Menu]   │ │
│                   │ ────────────────────────────────────────────────────────────────────────────────│ │
│                   │ Translate Homepage to Zulu (isiZulu)                                            │ │
│                   │                                                                                  │ │
│                   │ 💡 Impact: +12% market reach     ⏱️ Effort: 4 hours                             │ │
│                   │ 📊 Confidence: 88%               🎯 Priority Score: 92/100                       │ │
│                   │                                                                                  │ │
│                   │ Evidence: 25% of SA population speaks Zulu, 0 competitors have Zulu content     │ │
│                   │                                                                                  │ │
│                   │ [🚀 Implement]  [📅 Schedule]  [👁️ View Details]  [✕ Dismiss]                  │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 🟡 MEDIUM  │  SCHEMA AUDIT                                            [⋮ Menu]   │ │
│                   │ ────────────────────────────────────────────────────────────────────────────────│ │
│                   │ Fix Breadcrumb Schema on Product Pages                                          │ │
│                   │                                                                                  │ │
│                   │ 💡 Impact: +5% structure         ⏱️ Effort: 30 minutes                          │ │
│                   │ 📊 Confidence: 75%               🎯 Priority Score: 68/100                       │ │
│                   │                                                                                  │ │
│                   │ Evidence: 12 product pages missing valid BreadcrumbList schema                  │ │
│                   │                                                                                  │ │
│                   │ [🚀 Implement]  [📅 Schedule]  [👁️ View Details]  [✕ Dismiss]                  │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   [Load More...] (17 remaining)                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Recommendation Detail Page - Desktop View
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  {🔍} SEARCHABLE                                    {YourBrand ▼}              {👤 User} [⚙️] [Upgrade]  │
│  ────────────────────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                                          │
│  ┌─────────────┐                                                                                        │
│  │             │  ← Back to Recommendations                                                             │
│  │ 📊 Dashboard│                                                                                        │
│  │────────────│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 🎯 Recs (20)│  │ 🔴 HIGH PRIORITY                                                                 │ │
│  │   High (3)  │  │ Add FAQ Page for "fibre installation cost"                                       │ │
│  │   Med (5)   │  │                                                                                  │ │
│  │   Low (12)  │  │ 💡 Impact: +15% AI visibility    📊 Confidence: 92%      🎯 Priority: 95/100    │ │
│  │────────────│  │ ⏱️ Estimated Time: 2 hours       🏷️ Type: Content Gap    📅 Added: 2 days ago   │ │
│  │ 📈 Score    │  └──────────────────────────────────────────────────────────────────────────────────┘ │
│  │ 🔗 Integrat │                                                                                        │
│  │ ⚙️ Settings │  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │             │  │ 📋 THE PROBLEM                                                                   │ │
│  │             │  │ ──────────────────────────────────────────────────────────────────────────────  │ │
│  │             │  │                                                                                  │ │
│  │             │  │ When AI models like ChatGPT, Claude, and Perplexity are asked about "fibre      │ │
│  │             │  │ installation cost in South Africa", your brand is **not mentioned**.            │ │
│  │             │  │                                                                                  │ │
│  │             │  │ Evidence from AI Query Testing (20 test queries):                               │ │
│  │             │  │ • Your brand mentioned: 0/20 times (0%)                                          │ │
│  │             │  │ • Competitor "FibreCo" mentioned: 8/20 times (40%)                               │ │
│  │             │  │ • Competitor "NetLink" mentioned: 6/20 times (30%)                               │ │
│  │             │  │                                                                                  │ │
│  │             │  │ Root Cause: Your website has pricing information scattered across pages, but     │ │
│  │             │  │ no centralized FAQ that AI models can easily extract from.                      │ │
│  └─────────────┘  └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 💡 THE SOLUTION                                                                  │ │
│                   │ ──────────────────────────────────────────────────────────────────────────────  │ │
│                   │                                                                                  │ │
│                   │ Create a dedicated FAQ page with FAQPage schema markup that AI models can       │ │
│                   │ easily parse and extract from.                                                   │ │
│                   │                                                                                  │ │
│                   │ Recommended Questions to Include:                                                │ │
│                   │ 1. How much does fibre installation cost in South Africa?                        │ │
│                   │ 2. What's included in the installation fee?                                      │ │
│                   │ 3. Are there any hidden costs?                                                   │ │
│                   │ 4. How long does installation take?                                              │ │
│                   │ 5. Do you offer payment plans?                                                   │ │
│                   │                                                                                  │ │
│                   │ [📋 View Full Implementation Guide ▼]                                            │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 📊 EXPECTED IMPACT                                                               │ │
│                   │ ──────────────────────────────────────────────────────────────────────────────  │ │
│                   │                                                                                  │ │
│                   │  BEFORE                                 AFTER                                    │ │
│                   │  ───────────────────────────────────────────────────────────────────────────   │ │
│                   │  AI Mentions: 0/20 (0%)           →     AI Mentions: 11/20 (55%)                │ │
│                   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░             │ │
│                   │                                                                                  │ │
│                   │  Schema Score: 42/100             →     Schema Score: 88/100                     │ │
│                   │  ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░               │ │
│                   │                                                                                  │ │
│                   │  🎯 Predicted Improvement: +400% AI visibility                                   │ │
│                   │  📈 Based on 1,247 similar implementations across our platform                   │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 🚀 ACTIONS                                                                       │ │
│                   │ ──────────────────────────────────────────────────────────────────────────────  │ │
│                   │                                                                                  │ │
│                   │  [🚀 Mark as Implementing]  [📅 Schedule for Later]  [✕ Dismiss Recommendation] │ │
│                   │                                                                                  │ │
│                   │  Export to:  [Jira]  [Trello]  [Asana]  [Slack]  [Email]  [Copy Link]          │ │
│                   │                                                                                  │ │
│                   │  Assign to:  [Select Team Member ▼]                                             │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. GEO Scorecards - Desktop View
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  {🔍} SEARCHABLE                                    {YourBrand ▼}              {👤 User} [⚙️] [Upgrade]  │
│  ────────────────────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                                          │
│  ┌─────────────┐                                                                                        │
│  │             │  GEO SCORECARDS                                             [📥 Download] [🔗 Share]   │
│  │ 📊 Dashboard│                                                                                        │
│  │────────────│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 🎯 Recs (20)│  │                         OVERALL GEO SCORE                                        │ │
│  │   High (3)  │  │                                                                                  │ │
│  │   Med (5)   │  │           ╱─────────────────╲              📈 TREND (Last 3 Months)             │ │
│  │   Low (12)  │  │          ╱                   ╲                                                   │ │
│  │────────────│  │         │         72           │             80 ┤                    ┌──          │ │
│  │ 📈 Score    │  │         │        ────          │             70 ┤              ┌────┘            │ │
│  │ 🔗 Integrat │  │         │        B+            │             60 ┤        ┌─────┘                 │ │
│  │ ⚙️ Settings │  │          ╲                   ╱              50 ┤  ┌─────┘                       │ │
│  │             │  │           ╲─────────────────╱               40 └──┴─────┴─────┴─────            │ │
│  │             │  │                                                 Sep   Oct   Nov   Dec             │ │
│  │             │  │   Target: 85 by Dec 31                                                           │ │
│  │             │  │   ↑ +12 points this month (+20% improvement)                                     │ │
│  └─────────────┘  └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐   │
│                   │ 🔍 AI VISIBILITY SCORE             │  │ 📐 SCHEMA QUALITY SCORE            │   │
│                   │ ────────────────────────────────── │  │ ──────────────────────────────────── │   │
│                   │                                    │  │                                        │   │
│                   │        ╱────────╲                  │  │        ╱────────╲                     │   │
│                   │       ╱    74   ╲                  │  │       ╱    85   ╲                     │   │
│                   │      │   ────    │                 │  │      │   ────    │                    │   │
│                   │       ╲   B     ╱                  │  │       ╲   A-    ╱                     │   │
│                   │        ╲────────╱                  │  │        ╲────────╱                     │   │
│                   │                                    │  │                                        │   │
│                   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  74/100     │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  85/100           │   │
│                   │                                    │  │                                        │   │
│                   │ What is this?                      │  │ What is this?                          │   │
│                   │ Measures how often AI models       │  │ Measures schema.org implementation     │   │
│                   │ mention your brand in responses    │  │ quality across your website            │   │
│                   │                                    │  │                                        │   │
│                   │ Details:                           │  │ Details:                               │   │
│                   │ • Test queries: 20/month           │  │ • Pages with schema: 45/60 (75%)       │   │
│                   │ • Mentions: 14.8/20 (74%)          │  │ • Valid schemas: 38/45 (84%)           │   │
│                   │ • Avg position: #2.3               │  │ • Schema types: 8 implemented          │   │
│                   │ • Featured snippets: 3             │  │ • Missing: FAQPage, HowTo              │   │
│                   │                                    │  │                                        │   │
│                   │ [View Detailed Report →]           │  │ [View Schema Audit →]                  │   │
│                   └────────────────────────────────────┘  └────────────────────────────────────────┘   │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 📊 CONTENT COMPLETENESS SCORE                                                    │ │
│                   │ ──────────────────────────────────────────────────────────────────────────────  │ │
│                   │                                                                                  │ │
│                   │        ╱────────────────╲                                                        │ │
│                   │       ╱       68        ╲                                                        │ │
│                   │      │       ────        │       🔴 Needs Improvement                            │ │
│                   │       ╲       C+        ╱                                                        │ │
│                   │        ╲────────────────╱                                                        │ │
│                   │                                                                                  │ │
│                   │ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░  68/100                                               │ │
│                   │                                                                                  │ │
│                   │ What is this?                                                                    │ │
│                   │ Measures entity coverage, language availability, and content depth              │ │
│                   │                                                                                  │ │
│                   │ Details:                                                                         │ │
│                   │ • Entity coverage: 65% (vs industry avg 78%)                                     │ │
│                   │ • Languages: 1/5 target languages (English only)                                 │ │
│                   │ • FAQ coverage: 40% (missing voice-optimized Q&As)                               │ │
│                   │ • Content depth: Good (avg 1,200 words per page)                                 │ │
│                   │                                                                                  │ │
│                   │ Top Gaps:                                                                        │ │
│                   │ 🔴 No Zulu/Xhosa content (25% market opportunity)                                │ │
│                   │ 🟡 Missing FAQ pages (hurts voice search)                                        │ │
│                   │ 🟡 Limited product comparison content                                            │ │
│                   │                                                                                  │ │
│                   │ [View Content Gap Analysis →]                                                    │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
│                   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│                   │ 🏆 COMPETITIVE BENCHMARKING                                                      │ │
│                   │ ──────────────────────────────────────────────────────────────────────────────  │ │
│                   │                                                                                  │ │
│                   │ Your Position in South African E-Commerce:                                       │ │
│                   │                                                                                  │ │
│                   │ Rank  Business          GEO Score  AI Visibility  Schema  Content               │ │
│                   │ ─────────────────────────────────────────────────────────────────────────────  │ │
│                   │ 🥇 1   [Anonymous]      94         89             98       95                    │ │
│                   │ 🥈 2   [Anonymous]      91         85             95       93                    │ │
│                   │ 🥉 3   [Anonymous]      88         82             92       90                    │ │
│                   │ ...                                                                              │ │
│                   │ ⭐ 12  YOU (YourBrand)  72         74             85       68                    │ │
│                   │ ...                                                                              │ │
│                   │ 📍 Industry Average:    65         62             70       63                    │ │
│                   │                                                                                  │ │
│                   │ 🎯 You're ahead of 68% of businesses in your category!                           │ │
│                   │ 📈 Biggest opportunity: Improve Content Completeness (+27 points possible)       │ │
│                   └──────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Wireframes

### 1. Dashboard - Mobile View
```
┌─────────────────────────────────────┐
│ ☰  SEARCHABLE      {YourBrand ▼} 👤│
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     YOUR GEO SCORE              │ │
│ │                                 │ │
│ │        ╱─────────╲              │ │
│ │       ╱     72    ╲             │ │
│ │      │    ────     │            │ │
│ │       ╲    B+     ╱             │ │
│ │        ╲─────────╱              │ │
│ │                                 │ │
│ │  ↑ +12 points this month        │ │
│ │                                 │ │
│ │  [📊 View Details]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🟢 Schema: 85  🟡 Content: 68      │
│ 🟢 Visibility: 74                  │
│                                     │
│ [🔄 Rescan] [📥 Report]             │
│                                     │
│ ─────────────────────────────────── │
│ 🔥 HIGH PRIORITY (3)                │
│ ─────────────────────────────────── │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔴 Add FAQ Schema               │ │
│ │ +15% visibility • 2hrs          │ │
│ │ [🚀 Start] [👁️ View]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔴 Translate to Zulu            │ │
│ │ +12% reach • 4hrs               │ │
│ │ [🚀 Start] [👁️ View]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Fix Breadcrumbs              │ │
│ │ +5% structure • 30min           │ │
│ │ [🚀 Start] [👁️ View]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All 8 Recs →]                 │
│                                     │
│ ─────────────────────────────────── │
│ 📢 RECENT ACTIVITY                  │
│ ─────────────────────────────────── │
│                                     │
│ ✅ 2h ago                           │
│ Completed "Add FAQ"                 │
│ → +8 AI mentions                    │
│                                     │
│ 🔄 5h ago                           │
│ Website scanned                     │
│ → 12 new recommendations            │
│                                     │
│ [View All →]                        │
│                                     │
├─────────────────────────────────────┤
│ [🏠] [🎯] [📊] [⚙️] [👤]           │
│ Home Recs Score Set. User           │
└─────────────────────────────────────┘
```

---

### 2. Recommendations List - Mobile View
```
┌─────────────────────────────────────┐
│ ← RECOMMENDATIONS (20)         [⋮]  │
├─────────────────────────────────────┤
│                                     │
│ Filters: [All ▼] [High ▼] [🔍]     │
│ Views: [≡] [⊞] [📅]                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔴 HIGH • CONTENT GAP      [▼]  │ │
│ │─────────────────────────────────│ │
│ │ Add FAQ for "installation cost" │ │
│ │                                 │ │
│ │ 💡 +15% • ⏱️ 2h • 📊 92%        │ │
│ │                                 │ │
│ │ [🚀 Implement]  [👁️ View]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔴 HIGH • LANGUAGE         [▼]  │ │
│ │─────────────────────────────────│ │
│ │ Translate Homepage to Zulu      │ │
│ │                                 │ │
│ │ 💡 +12% • ⏱️ 4h • 📊 88%        │ │
│ │                                 │ │
│ │ [🚀 Implement]  [👁️ View]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 MED • SCHEMA AUDIT      [▼]  │ │
│ │─────────────────────────────────│ │
│ │ Fix Breadcrumb Schema           │ │
│ │                                 │ │
│ │ 💡 +5% • ⏱️ 30m • 📊 75%        │ │
│ │                                 │ │
│ │ [🚀 Implement]  [👁️ View]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Load More...] (17 remaining)       │
│                                     │
├─────────────────────────────────────┤
│ [🏠] [🎯] [📊] [⚙️] [👤]           │
└─────────────────────────────────────┘

Swipe Actions:
← Swipe left to dismiss
→ Swipe right to complete
```

---

### 3. Recommendation Detail - Mobile View
```
┌─────────────────────────────────────┐
│ ← Back                         [⋮]  │
├─────────────────────────────────────┤
│                                     │
│ 🔴 HIGH PRIORITY                    │
│ Add FAQ for "fibre cost"            │
│                                     │
│ 💡 +15% visibility                  │
│ 📊 92% confidence                   │
│ 🎯 Priority: 95/100                 │
│ ⏱️ Time: 2 hours                    │
│                                     │
│ ─────────────────────────────────── │
│ 📋 THE PROBLEM                      │
│ ─────────────────────────────────── │
│                                     │
│ AI models don't mention your brand  │
│ when asked about fibre installation │
│ costs in South Africa.              │
│                                     │
│ Evidence:                           │
│ • Your mentions: 0/20 (0%)          │
│ • FibreCo mentions: 8/20 (40%)      │
│ • NetLink mentions: 6/20 (30%)      │
│                                     │
│ Root cause: No centralized FAQ that │
│ AI can extract from.                │
│                                     │
│ [Read More ▼]                       │
│                                     │
│ ─────────────────────────────────── │
│ 💡 THE SOLUTION                     │
│ ─────────────────────────────────── │
│                                     │
│ Create FAQ page with schema markup  │
│ that AI models can parse.           │
│                                     │
│ Questions to include:               │
│ 1. Installation cost in SA?         │
│ 2. What's included?                 │
│ 3. Hidden costs?                    │
│ 4. How long to install?             │
│ 5. Payment plans?                   │
│                                     │
│ [View Implementation Guide ▼]       │
│                                     │
│ ─────────────────────────────────── │
│ 📊 EXPECTED IMPACT                  │
│ ─────────────────────────────────── │
│                                     │
│ BEFORE → AFTER                      │
│                                     │
│ AI Mentions:                        │
│ 0/20 (0%) → 11/20 (55%)             │
│ ░░░░░░  →  ▓▓▓▓▓▓▓▓▓▓              │
│                                     │
│ Schema Score:                       │
│ 42/100 → 88/100                     │
│ ▓▓▓░░░  →  ▓▓▓▓▓▓▓▓▓▓              │
│                                     │
│ 🎯 +400% improvement                │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [🚀 Mark as Implementing]           │
│ [📅 Schedule for Later]             │
│ [✕ Dismiss]                         │
│                                     │
│ Export to:                          │
│ [Jira] [Trello] [Asana]             │
│ [Copy Link]                         │
│                                     │
├─────────────────────────────────────┤
│ [🏠] [🎯] [📊] [⚙️] [👤]           │
└─────────────────────────────────────┘
```

---

### 4. GEO Scorecard - Mobile View
```
┌─────────────────────────────────────┐
│ ← GEO SCORECARDS              [📥]  │
├─────────────────────────────────────┤
│                                     │
│ OVERALL GEO SCORE                   │
│                                     │
│        ╱─────────╲                  │
│       ╱     72    ╲                 │
│      │    ────     │                │
│       ╲    B+     ╱                 │
│        ╲─────────╱                  │
│                                     │
│ ↑ +12 points this month             │
│ Target: 85 by Dec 31                │
│                                     │
│ ─────────────────────────────────── │
│ 📈 TREND (3 Months)                 │
│ ─────────────────────────────────── │
│                                     │
│ 80 ┤              ┌──               │
│ 70 ┤        ┌─────┘                 │
│ 60 ┤  ┌─────┘                       │
│ 50 └──┴─────┴─────┴─────            │
│    Sep   Oct   Nov   Dec            │
│                                     │
│ ─────────────────────────────────── │
│ 🔍 AI VISIBILITY                    │
│ ─────────────────────────────────── │
│                                     │
│    ╱────────╲                       │
│   ╱    74   ╲                       │
│  │   ────    │                      │
│   ╲   B     ╱                       │
│    ╲────────╱                       │
│                                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  74/100       │
│                                     │
│ • Test queries: 20/month            │
│ • Mentions: 14.8/20 (74%)           │
│ • Avg position: #2.3                │
│ • Featured snippets: 3              │
│                                     │
│ [View Details →]                    │
│                                     │
│ ─────────────────────────────────── │
│ 📐 SCHEMA QUALITY                   │
│ ─────────────────────────────────── │
│                                     │
│    ╱────────╲                       │
│   ╱    85   ╲                       │
│  │   ────    │                      │
│   ╲   A-    ╱                       │
│    ╲────────╱                       │
│                                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  85/100       │
│                                     │
│ • Pages with schema: 45/60 (75%)    │
│ • Valid schemas: 38/45 (84%)        │
│ • Schema types: 8 implemented       │
│ • Missing: FAQPage, HowTo           │
│                                     │
│ [View Audit →]                      │
│                                     │
│ ─────────────────────────────────── │
│ 📊 CONTENT COMPLETENESS             │
│ ─────────────────────────────────── │
│                                     │
│    ╱────────╲                       │
│   ╱    68   ╲                       │
│  │   ────    │  🔴 Needs Work       │
│   ╲   C+    ╱                       │
│    ╲────────╱                       │
│                                     │
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  68/100       │
│                                     │
│ Top Gaps:                           │
│ 🔴 No Zulu/Xhosa content            │
│ 🟡 Missing FAQ pages                │
│ 🟡 Limited comparisons              │
│                                     │
│ [View Gaps →]                       │
│                                     │
│ ─────────────────────────────────── │
│ 🏆 BENCHMARKING                     │
│ ─────────────────────────────────── │
│                                     │
│ Your rank: #12 of 87                │
│ Ahead of: 68% in your category      │
│                                     │
│ Top 3:                              │
│ 🥇 [Anonymous] - 94                 │
│ 🥈 [Anonymous] - 91                 │
│ 🥉 [Anonymous] - 88                 │
│                                     │
│ ⭐ YOU - 72                          │
│                                     │
│ 📍 Industry avg: 65                 │
│                                     │
├─────────────────────────────────────┤
│ [🏠] [🎯] [📊] [⚙️] [👤]           │
└─────────────────────────────────────┘
```

---

## 🎨 Interactive Prototypes (Conceptual)

### Swipe Gestures (Mobile)
```
Normal State:
┌─────────────────────────────────────┐
│ 🔴 Add FAQ Schema                   │
│ +15% • 2hrs                         │
└─────────────────────────────────────┘

Swipe Right (Complete):
┌─────────────────────────────────────┐
│ ✅ │ 🔴 Add FAQ Schema               │
│ ✅ │ +15% • 2hrs                     │
└─────────────────────────────────────┘
      → [Marks as complete]

Swipe Left (Dismiss):
┌─────────────────────────────────────┐
│         🔴 Add FAQ Schema       │ ✕ │
│         +15% • 2hrs             │ ✕ │
└─────────────────────────────────────┘
      → [Dismisses recommendation]
```

### Expandable Cards (Mobile)
```
Collapsed:
┌─────────────────────────────────────┐
│ 🔴 Add FAQ Schema             [▼]   │
│ +15% • 2hrs • 92% conf              │
└─────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────┐
│ 🔴 Add FAQ Schema             [▲]   │
│ +15% • 2hrs • 92% conf              │
│─────────────────────────────────────│
│ Problem: AI models don't mention    │
│ your brand for "fibre cost".        │
│                                     │
│ Solution: Create FAQ page with      │
│ schema markup.                      │
│                                     │
│ [🚀 Implement] [👁️ Details]         │
└─────────────────────────────────────┘
```

### Bottom Sheet (Mobile Actions)
```
User taps [...] menu:

┌─────────────────────────────────────┐
│                                     │
│ [Background dimmed]                 │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Add FAQ Schema                      │
│─────────────────────────────────────│
│ 🚀 Mark as Implementing             │
│ 📅 Schedule for Later               │
│ 👥 Assign to Team Member            │
│ 🔗 Copy Link                        │
│ 📤 Export to Jira                   │
│ 📤 Export to Trello                 │
│ ✕ Dismiss Recommendation            │
│─────────────────────────────────────│
│ Cancel                              │
└─────────────────────────────────────┘
```

---

## 🎯 Component States

### Button States
```
[Normal Button]
[Hover Button]    ← Slightly darker
[Pressed Button]  ← Scale(0.98)
[Loading...]      ← Spinner
[✓ Success]       ← Green checkmark (2s)
[Disabled]        ← Gray, no pointer
```

### Card States
```
Normal:
┌─────────────────────────────────────┐
│ 🔴 Recommendation                   │
└─────────────────────────────────────┘

Hover (Desktop):
┌═════════════════════════════════════┐
│ 🔴 Recommendation                   │
└═════════════════════════════════════┘
  ← Shadow elevation

Selected:
┌─────────────────────────────────────┐
│ 🔴 Recommendation                   │ ← Blue border
└─────────────────────────────────────┘

Loading:
┌─────────────────────────────────────┐
│ ████░░░░░░░░░░░░░░░░░░              │
│ ██░░░░░░░░░░                        │
└─────────────────────────────────────┘
  ← Skeleton with shimmer
```

---

## 📦 Component Specifications for Developers

### RecommendationCard Component
```typescript
interface RecommendationCardProps {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  type: 'content_gap' | 'schema_audit' | 'language' | 'voice'
  title: string
  impact: string          // e.g., "+15%"
  effort: string          // e.g., "2 hours"
  confidence: number      // 0-100
  priorityScore: number   // 0-100
  evidence: string
  onImplement: () => void
  onSchedule: () => void
  onView: () => void
  onDismiss: () => void
  expanded?: boolean
}

// Usage:
<RecommendationCard
  priority="high"
  type="content_gap"
  title="Add FAQ Schema for 'installation cost'"
  impact="+15% visibility"
  effort="2 hours"
  confidence={92}
  priorityScore={95}
  evidence="AI models mention competitors 8x more"
  onImplement={() => handleImplement(id)}
  onSchedule={() => openScheduleModal(id)}
  onView={() => navigate(`/recommendations/${id}`)}
  onDismiss={() => handleDismiss(id)}
/>
```

### GEOScoreGauge Component
```typescript
interface GEOScoreGaugeProps {
  score: number           // 0-100
  size: 'small' | 'medium' | 'large'
  showGrade?: boolean     // Show letter grade (A+, B, C, etc.)
  showTrend?: boolean     // Show trend arrow and change
  trendChange?: number    // e.g., +12
  trendPeriod?: string    // e.g., "this month"
}

// Usage:
<GEOScoreGauge
  score={72}
  size="large"
  showGrade={true}
  showTrend={true}
  trendChange={12}
  trendPeriod="this month"
/>
```

---

This wireframes document provides visual blueprints for implementation. Next step would be to create high-fidelity designs in Figma or directly implement using Shadcn/ui components.
