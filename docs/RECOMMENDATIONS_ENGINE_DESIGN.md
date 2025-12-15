# Smart Recommendations Engine - Logic & Workflow Design

**Version:** 1.0
**Date:** December 8, 2025
**Purpose:** Design document for recommendation generation logic and workflows (NO CODE)

---

## 🎯 Design Goals

1. **Transform raw data into actionable tasks** - Not just "here's what's wrong" but "here's exactly what to do"
2. **Prioritize intelligently** - Show highest-impact, lowest-effort recommendations first
3. **Automate task creation** - Sync directly to Jira/Trello/Asana without manual copying
4. **Learn from feedback** - Improve recommendations based on what users actually complete
5. **Multi-language first** - African languages (Swahili, Zulu, Yoruba) as core feature, not afterthought

---

## 📊 Core Algorithm: Recommendation Generation Flow

### **High-Level Process**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATA COLLECTION                                          │
│    ├─ Crawl brand's website (sitemap or manual URLs)       │
│    ├─ Query AI models (ChatGPT, Claude, Perplexity, etc.)  │
│    ├─ Analyze competitor websites                          │
│    └─ Fetch analytics data (if integrated)                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ENTITY EXTRACTION                                        │
│    ├─ From website: Products, services, features, facts    │
│    ├─ From AI responses: What AI "knows" about brand       │
│    ├─ From schemas: Existing structured data               │
│    └─ From content: Readability, voice-friendliness        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GAP ANALYSIS                                             │
│    ├─ Content Gaps: AI knows X, website doesn't mention X  │
│    ├─ Schema Gaps: Page type requires Y schema, missing Y  │
│    ├─ Language Gaps: Content exists in English, not Swahili│
│    └─ Voice Gaps: Content not conversational/Q&A format    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. RECOMMENDATION GENERATION                                │
│    ├─ Match gaps to templates                              │
│    ├─ Generate specific action items                       │
│    ├─ Create code snippets (for schemas)                   │
│    └─ Add context (URLs, AI models affected, etc.)         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PRIORITY CALCULATION                                     │
│    ├─ Impact score (how much does this help?)              │
│    ├─ Effort score (how hard is this to do?)               │
│    ├─ Urgency score (how important is this now?)           │
│    └─ Confidence score (how sure are we this helps?)       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PRESENTATION & ACTION                                    │
│    ├─ Sort by priority score (highest first)               │
│    ├─ Group by type and language                           │
│    ├─ Display with action buttons                          │
│    └─ Enable sync to PM tools (Jira, Trello, etc.)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧮 Priority Calculation Algorithm

### **Goal:** Rank recommendations so users tackle highest-value items first

### **Formula:**

```
Priority Score = (Impact × 0.4) + (Effort × 0.3) + (Urgency × 0.2) + (Confidence × 0.1)

Where all scores are 0-100
```

### **Impact Score Logic:**

```
START with base score = 50

IF recommendation type = "CONTENT_GAP":
    ADD 30 points

IF recommendation type = "SCHEMA_MISSING":
    ADD 25 points

IF recommendation type = "LANGUAGE_OPPORTUNITY":
    ADD 20 points

IF estimated search volume exists:
    ADD (search_volume / 100) capped at 20 points

IF competitors DON'T have this:
    ADD 15 points (low-hanging fruit)

IF affects 3+ AI models:
    ADD 20 points

RETURN min(Impact, 100)
```

### **Effort Score Logic (INVERSE - lower effort = higher score):**

```
START with base effort = 50

IF recommendation type = "SCHEMA_MISSING":
    Effort = 20 (just copy/paste code)

IF recommendation type = "CONTENT_GAP":
    IF word_count < 500:
        Effort = 40 (short content)
    ELSE:
        Effort = 60 (long content)

IF recommendation type = "LANGUAGE_OPPORTUNITY":
    IF auto_translation_available:
        Effort = 50
    ELSE:
        Effort = 70 (manual translation)

IF recommendation type = "VOICE_OPTIMIZATION":
    Effort = 50 (rewrite existing content)

IF requires_developer = TRUE:
    Effort = 80 (technical work)

RETURN Effort
```

### **Urgency Score Logic:**

```
START with base urgency = 50

IF competitor recently added this:
    ADD 30 points (catch up fast!)

IF brand's AI visibility is declining:
    ADD 20 points

IF seasonal relevance = HIGH:
    ADD 20 points (e.g., holiday shopping season)

IF high impact + low effort (quick win):
    ADD 15 points

RETURN min(Urgency, 100)
```

### **Confidence Score Logic:**

```
START with base confidence = 70

IF data_source = "direct_measurement":
    Confidence = 90 (we measured it ourselves)

IF data_source = "ai_inference":
    Confidence = 60 (AI suggested it)

IF sample_size > 1000:
    ADD 10 points (lots of data)

IF similar recommendations succeeded before:
    ADD 15 points (proven track record)

RETURN min(Confidence, 100)
```

---

## 🔍 Content Gap Analysis - Detailed Logic

### **Purpose:** Find what AI models mention about your brand that isn't on your website

### **Step-by-Step Process:**

```
STEP 1: Crawl Brand Website
├─ Start at homepage
├─ Follow internal links (max depth: 3 levels)
├─ Extract text content from each page
├─ Store: URL, title, content, word count
└─ Build inventory of what exists

STEP 2: Extract Entities from Website
├─ Use NLP (GPT-4) to identify:
│  ├─ Products mentioned
│  ├─ Services offered
│  ├─ Key people (founders, team)
│  ├─ Locations (offices, stores)
│  └─ Facts (founding year, certifications, awards)
└─ Store entities with confidence scores

STEP 3: Query AI Models About Brand
├─ Generate prompts:
│  ├─ "What products does [Brand] sell?"
│  ├─ "Tell me about [Brand] company"
│  ├─ "What are [Brand]'s key features?"
│  └─ "Where can I buy [Brand] products?"
├─ Query each AI model (ChatGPT, Claude, Perplexity, Gemini)
├─ Store responses with metadata:
│  ├─ Which AI model
│  ├─ Whether brand was mentioned
│  ├─ Position of mention (1st, 2nd, 3rd, etc.)
│  └─ Sentiment (positive, neutral, negative)
└─ Save to database

STEP 4: Extract Entities from AI Responses
├─ Parse AI responses for:
│  ├─ Products AI thinks brand sells
│  ├─ Services AI thinks brand offers
│  ├─ Facts AI states about brand
│  └─ Competitors AI mentions instead
└─ Tag with source (which AI, which query)

STEP 5: Compare Website vs AI Knowledge
FOR EACH entity found in AI responses:
    IF entity NOT found on website:
        ├─ Calculate confidence (how many AI models mentioned it)
        ├─ Identify source (which URLs AI cited, if any)
        ├─ Determine impact (is this a core product/service?)
        └─ CREATE recommendation to add this entity

    ELSE IF entity found but buried/unclear:
        └─ CREATE recommendation to make it more prominent

STEP 6: Generate Specific Recommendations
FOR EACH gap:
    ├─ Title: "Add [entity] information to your website"
    ├─ Description: "AI models mention [entity] but it's not on your site"
    ├─ Action Items:
    │  1. Research and document [entity]
    │  2. Create or update page about [entity]
    │  3. Add structured data for [entity]
    ├─ Affected AI Models: [list of which AIs mentioned it]
    ├─ Suggested Page: Where to add this content
    └─ Expected Impact: "Improves visibility in [X] AI models"

STEP 7: Rank by Priority
├─ Sort recommendations by priority score
├─ Group by category (products, services, facts)
└─ Return top 50 recommendations
```

### **Example Flow:**

```
Website has: "We sell coffee makers"
AI response: "They sell coffee makers, grinders, and filters"

GAP DETECTED:
- "grinders" mentioned by AI but not on website
- "filters" mentioned by AI but not on website

RECOMMENDATIONS GENERATED:
1. "Add coffee grinder products to your website"
   Priority: 85/100 (AI mentioned it, competitor has it)

2. "Add coffee filter products to your website"
   Priority: 75/100 (AI mentioned it, lower search volume)
```

---

## 🏗️ Schema Audit - Detailed Logic

### **Purpose:** Find pages missing structured data that AI models need

### **Step-by-Step Process:**

```
STEP 1: Discover Pages
├─ Fetch sitemap.xml (if exists)
├─ OR crawl from homepage (max 100 pages)
└─ Store URLs to analyze

STEP 2: For Each Page, Detect Page Type
├─ Check URL path:
│  ├─ /product/ → Product page
│  ├─ /blog/ → Blog post
│  ├─ /faq → FAQ page
│  ├─ /about → About page
│  └─ Other patterns
├─ Check content structure:
│  ├─ Has price + "Add to Cart" → Product page
│  ├─ Has questions + answers → FAQ page
│  ├─ Has article structure → Blog post
└─ Return detected page type

STEP 3: Extract Existing Schemas
├─ Find all <script type="application/ld+json"> tags
├─ Parse JSON content
├─ Extract @type from each schema
├─ Store: [Organization, Product, FAQPage, etc.]
└─ Validate schema syntax (is JSON valid?)

STEP 4: Determine Required Schemas
BASED ON page type:

IF page_type = "product":
    Required schemas = [Product, Offer, Brand]

IF page_type = "blog":
    Required schemas = [Article, Person (author)]

IF page_type = "faq":
    Required schemas = [FAQPage]

IF page_type = "about":
    Required schemas = [Organization]

IF page_type = "homepage":
    Required schemas = [Organization, WebSite]

STEP 5: Find Missing Schemas
FOR EACH required schema:
    IF schema NOT in existing_schemas:
        ├─ Mark as MISSING
        ├─ Determine priority:
        │  ├─ Product/FAQPage = HIGH (critical for AI)
        │  ├─ Article = MEDIUM
        │  └─ Others = LOW
        └─ Generate code snippet for this schema

STEP 6: Generate Recommendations
FOR EACH missing schema:
    ├─ Title: "Add [SchemaType] schema to [page]"
    ├─ Description: Why this schema matters for AI
    ├─ Action Items:
    │  1. Copy the schema code below
    │  2. Add to <head> of [page_url]
    │  3. Test with Google Rich Results Test
    ├─ Code Snippet: Pre-filled schema code
    ├─ Priority: HIGH (schemas are low effort, high impact)
    └─ Affected URLs: [page_url]

STEP 7: Validate Schema Quality
IF schema exists BUT is incomplete:
    ├─ Check required fields (e.g., Product needs "name", "offers")
    ├─ Flag missing required fields
    └─ CREATE recommendation to complete schema
```

### **Schema Priority Rules:**

```
HIGH Priority (90-100):
- Product schema on product pages
- FAQPage schema on FAQ pages
- Organization schema on homepage

MEDIUM Priority (60-89):
- Article schema on blog posts
- LocalBusiness schema on location pages

LOW Priority (30-59):
- BreadcrumbList schema
- WebPage schema
- SiteNavigationElement schema
```

---

## 🌍 Language Opportunity Finder - Detailed Logic

### **Purpose:** Identify which content should be translated to which languages

### **Step-by-Step Process:**

```
STEP 1: Identify Target Markets
├─ From user input: ["south_africa", "kenya", "nigeria"]
└─ Map markets to languages:
    south_africa → [English, Zulu, Xhosa, Afrikaans]
    kenya → [English, Swahili]
    nigeria → [English, Yoruba, Igbo, Hausa]

STEP 2: Analyze Existing Content
├─ Get all pages from content inventory
├─ Group by language: {en: [url1, url2], sw: [url3], ...}
└─ Calculate coverage per language

STEP 3: Find High-Value English Content
Filter content WHERE:
    ├─ Language = English
    ├─ Page views > 100/month (or other threshold)
    ├─ Content type IN [product, service, blog, faq]
    └─ Word count > 300 (substantial content)

STEP 4: Check for Translations
FOR EACH high-value English page:
    FOR EACH target_language:
        IF no translation exists:
            ├─ Calculate potential traffic:
            │  estimated_traffic = current_views × language_adoption_rate
            │  Example: 1000 views × 0.3 (30% Swahili speakers) = 300 potential
            │
            ├─ Check competition:
            │  IF few competitors have this language:
            │      competition = LOW (opportunity!)
            │
            └─ Calculate priority:
                priority = (potential_traffic × 0.6) + (competition_factor × 0.4)

STEP 5: Get Local Keywords
FOR EACH language opportunity:
    ├─ Translate main keywords to target language
    ├─ Fetch local search volume (if available)
    ├─ Identify local variations:
    │  Example: "coffee" → Swahili "kahawa"
    └─ Generate sample titles in target language

STEP 6: Generate Recommendations
FOR EACH translation opportunity:
    ├─ Title: "Create [Language] version of [page]"
    ├─ Description: "This page gets [X] views but is only in English.
    │               Creating a [Language] version can capture [Y] additional visitors."
    ├─ Action Items:
    │  1. Translate content to [Language]
    │  2. Review for cultural appropriateness
    │  3. Publish with hreflang tags
    ├─ Keywords: [local keywords in target language]
    ├─ Sample Titles: [3-5 title suggestions in target language]
    ├─ Estimated Search Volume: [monthly searches]
    └─ Competition Level: LOW/MEDIUM/HIGH
```

### **Language Priority Algorithm:**

```
Priority = (Current Traffic × Language Adoption %) + Competition Bonus

Where:
- Current Traffic = monthly page views
- Language Adoption % = % of target market that speaks this language
- Competition Bonus:
  ├─ +30 if no competitors have this language
  ├─ +15 if few competitors (1-2)
  └─ +0 if many competitors (3+)

Example:
Page: "How to brew coffee" (1,000 views/month)
Target: Swahili in Kenya
Adoption: 70% of Kenyans speak Swahili
Competition: 0 competitors have Swahili coffee content

Priority = (1000 × 0.7) + 30 = 700 + 30 = 730
Normalized to 0-100: min(730 / 10, 100) = 73/100
```

---

## 🎤 Voice Optimization - Detailed Logic

### **Purpose:** Make content voice-assistant friendly (conversational, Q&A format)

### **Step-by-Step Process:**

```
STEP 1: Analyze Readability
FOR EACH page:
    ├─ Calculate Flesch Reading Ease:
    │  Formula: 206.835 - (1.015 × words_per_sentence) - (84.6 × syllables_per_word)
    │  Score: 0-100 (higher = easier to read)
    │
    ├─ Identify long sentences (>20 words)
    ├─ Count complex words (3+ syllables)
    └─ Flag if readability < 60 (difficult)

STEP 2: Analyze Tone
├─ Count conversational markers:
│  ├─ "you" / "your" (2nd person)
│  ├─ "I" / "we" / "us" (1st person)
│  ├─ Questions ("?")
│  └─ Conversational phrases ("here's", "let's")
│
├─ Count formal markers:
│  ├─ "therefore", "furthermore", "however"
│  ├─ Passive voice usage
│  └─ Jargon/technical terms
│
└─ Calculate conversational ratio:
    ratio = conversational_count / (conversational_count + formal_count)
    IF ratio < 0.3: TOO FORMAL

STEP 3: Detect Implicit Questions
├─ Scan for question patterns:
│  ├─ "What is [topic]"
│  ├─ "How to [action]"
│  ├─ "Why [statement]"
│  ├─ "When [event]"
│  └─ "Where [location]"
│
├─ Check if answers are explicit:
│  IF pattern found BUT no Q&A format:
│      FLAG as improvement opportunity
│
└─ Generate Q&A format suggestion

STEP 4: Calculate Voice Optimization Score
Score = (Readability × 0.4) + (Conversational Tone × 0.3) + (Q&A Coverage × 0.3)

Where:
- Readability = Flesch score
- Conversational Tone = ratio × 100
- Q&A Coverage = (explicit Q&As / implicit questions) × 100

STEP 5: Generate Recommendations
IF voice_score < 60:
    ├─ Title: "Improve voice-friendliness of [page]"
    ├─ Description: "Readability score: [X]/100 - too complex for voice"
    ├─ Action Items:
    │  1. Break long sentences (max 15-20 words)
    │  2. Convert to Q&A format
    │  3. Use "you" instead of "the user"
    │  4. Add FAQ section
    ├─ Example Rewrite: [show before/after]
    └─ Expected Impact: "Improves voice search visibility"

IF has implicit questions BUT no Q&A format:
    ├─ Title: "Add FAQ section to [page]"
    ├─ Detected Questions: [list of questions found in content]
    ├─ Suggested Format:
    │  Q: [question]
    │  A: [extract answer from existing content]
    └─ Priority: HIGH (easy to implement)
```

### **Example Voice Optimization:**

```
BEFORE (Score: 45/100):
"Our advanced algorithmic methodology facilitates the optimization
of coffee bean roasting parameters to achieve superior flavor profiles
through precise temperature control mechanisms."

ISSUES DETECTED:
- Avg sentence length: 25 words (too long)
- Formal tone (no "you", passive voice)
- No Q&A format
- Jargon heavy

RECOMMENDATION:
"Simplify to conversational Q&A format"

AFTER (Score: 85/100):
"Q: How do you roast your coffee beans?
A: We use precise temperature control to bring out the best flavors.
Our roasting process is carefully monitored to ensure every batch
tastes great."

IMPROVEMENTS:
- Shorter sentences (avg 12 words)
- Q&A format (voice-friendly)
- Conversational ("you", "we")
- Simpler language
```

---

## 🔄 Recommendation Lifecycle State Machine

### **States:**

```
PENDING → User hasn't started yet
    ↓
IN_PROGRESS → User is working on it
    ↓
COMPLETED → User marked as done
    │
    └─ (Feedback requested)

OR

PENDING → User dismisses it
    ↓
DISMISSED → Removed from active list
```

### **State Transitions:**

```
FROM "PENDING":
├─ Action: "Start Task" → TO "IN_PROGRESS"
├─ Action: "Dismiss" → TO "DISMISSED"
└─ Action: "Sync to Jira" → TO "IN_PROGRESS" (auto-starts)

FROM "IN_PROGRESS":
├─ Action: "Mark Complete" → TO "COMPLETED"
├─ Action: "Dismiss" → TO "DISMISSED"
└─ Auto: "Task updated in Jira" → Update progress

FROM "COMPLETED":
├─ Action: "Reopen" → TO "IN_PROGRESS"
└─ Auto: "Feedback submitted" → Stay "COMPLETED", record feedback

FROM "DISMISSED":
└─ Action: "Undo Dismiss" → TO "PENDING"
```

---

## 🔌 Task Sync Workflow (Jira/Trello/Asana)

### **User Flow:**

```
USER CLICKS "Sync to Jira" on recommendation

↓

SYSTEM validates integration exists
├─ IF no Jira integration:
│  └─ Prompt: "Connect Jira account first"
└─ IF integration exists: PROCEED

↓

TRANSFORM recommendation → Jira task format
├─ Recommendation Title → Jira Summary
├─ Recommendation Description → Jira Description
├─ Action Items → Jira Checklist (subtasks)
├─ Code Snippet → Jira Comment (code block)
├─ Priority Score → Jira Priority (High/Medium/Low mapping)
└─ Due Date (if set) → Jira Due Date

↓

CREATE Jira issue via API
├─ POST /rest/api/3/issue
├─ Body: {project, issuetype, summary, description, ...}
└─ Receive: {id: "PROJ-123", key: "PROJ-123", self: "url"}

↓

STORE integration mapping
├─ recommendation_id → jira_issue_id
├─ external_task_url → "https://company.atlassian.net/browse/PROJ-123"
└─ sync_status = "synced"

↓

SETUP bidirectional sync
├─ Register webhook in Jira for status updates
├─ When Jira task status changes → Update our recommendation status
└─ When our recommendation updated → Update Jira task

↓

SHOW success to user
├─ Display Jira issue link (clickable)
├─ Show sync status: "✓ Synced to Jira"
└─ Enable "View in Jira" button
```

### **Bidirectional Sync Logic:**

```
JIRA → OUR PLATFORM:
When Jira webhook fires (task status changed):
    ├─ Parse webhook payload
    ├─ Find recommendation by external_task_id
    ├─ Map Jira status → Our status:
    │  ├─ "To Do" → "pending"
    │  ├─ "In Progress" → "in_progress"
    │  ├─ "Done" → "completed"
    │  └─ Other → Keep current status
    └─ Update recommendation status in database

OUR PLATFORM → JIRA:
When recommendation status changes:
    ├─ Find task_integration record
    ├─ Map our status → Jira status:
    │  ├─ "pending" → "To Do"
    │  ├─ "in_progress" → "In Progress"
    │  ├─ "completed" → "Done"
    │  └─ "dismissed" → (no change, just add comment)
    ├─ Call Jira API: PUT /rest/api/3/issue/{id}/transitions
    └─ Update last_synced_at timestamp
```

---

## 📈 Continuous Improvement Loop

### **Learning from User Behavior:**

```
WHEN user completes recommendation:
    ├─ Record completion time
    ├─ Request feedback:
    │  ├─ Was this helpful? (Yes/No)
    │  ├─ How difficult was this? (1-5 scale)
    │  └─ What was the actual impact? (1-5 scale)
    └─ Store feedback

↓

ANALYZE feedback patterns:
    ├─ IF recommendation type has low completion rate:
    │  └─ REDUCE priority for future similar recommendations
    │
    ├─ IF users rate difficulty higher than estimated:
    │  └─ INCREASE effort score for similar recommendations
    │
    └─ IF users report low impact:
       └─ DECREASE impact score for similar recommendations

↓

UPDATE recommendation templates:
    ├─ Adjust default scores based on historical data
    ├─ Refine action items based on what users actually do
    └─ Improve descriptions based on what resonates

↓

PERSONALIZE future recommendations:
    ├─ Learn user's skill level (complete complex tasks → show more advanced)
    ├─ Learn preferred effort level (dismiss high-effort → show quick wins)
    └─ Learn content preferences (complete language tasks → show more language)
```

---

## 🎯 Success Metrics (How We Know It's Working)

### **Recommendation Quality:**

```
Completion Rate = Completed / (Completed + Dismissed)
Target: >40%

Average Helpfulness Rating (1-5)
Target: >4.0

Average Accuracy (did it actually help?)
Target: >80% users say "yes"
```

### **Prioritization Accuracy:**

```
Are high-priority recommendations completed more often?
Expected: Top 20% priority → 60%+ completion rate
Expected: Bottom 20% priority → 20% completion rate

IF no correlation: Priority algorithm needs adjustment
```

### **Impact Validation:**

```
After recommendation completed:
    ├─ Check AI visibility 7 days later
    ├─ Did brand mentions increase?
    ├─ Did citation position improve?
    └─ IF yes: Recommendation worked! (reinforce similar)
       IF no: Recommendation didn't work (deprioritize similar)
```

---

**END OF DESIGN DOCUMENT**

Next steps: Use this design to guide actual implementation when ready.
