# VEA Group - Complete Data Collection Plan

**Goal:** Collect ALL data for VEA Group end-to-end setup
**Timeline:** ~4-6 hours of active work
**Approach:** Mix of automation, web scraping, manual research, and AI testing

---

## PHASE 1: Automated Data Collection (30 minutes)

### What Can Be Scraped Automatically

#### 1.1 Enhanced Company Data
- [x] Company description (already done)
- [x] Value propositions (already done)
- [x] Social media links (already done)
- [ ] Contact information (phone, email, address)
- [ ] Company size/employee count (if available)
- [ ] Founded date
- [ ] Service areas/industries

**Script:** `scripts/scrape-vea-enhanced.ts`

#### 1.2 Competitor Website Analysis
For each competitor (Naspers, MTN Group, Vodacom, Telkom):
- [ ] Company description
- [ ] Social media profiles
- [ ] Content page counts (approximate)
- [ ] Blog/news sections (if exist)
- [ ] Contact information
- [ ] Service offerings

**Script:** `scripts/scrape-competitors.ts`

#### 1.3 Social Media Public Data
For VEA Group social profiles:
- [ ] Facebook - follower count, page info
- [ ] Twitter - follower count, tweet count, bio
- [ ] Instagram - follower count, post count
- [ ] LinkedIn - follower count, company size, updates count

**Script:** `scripts/scrape-social-metrics.ts`
**Note:** May hit rate limits, some data requires auth

---

## PHASE 2: Manual Research - Leadership Profiles (2-3 hours)

### For Each of 6 Team Members

**Team Members:**
1. Marno Nel (Managing Director)
2. Regardt Scheepers (Operational Director)
3. Thoko Tshabalala (Director: Business Development)
4. Hein Biekart (Director: Construction)
5. Lethuwane Johannes Mogola (Director: Logistics, Telecoms)
6. Ashmini Narotam (Director: Legal)

**Research Checklist per Person (20-30 min each):**
- [ ] LinkedIn profile URL
- [ ] LinkedIn follower count
- [ ] LinkedIn bio/summary
- [ ] Twitter/X profile (if exists)
- [ ] Twitter follower count
- [ ] Professional background/bio
- [ ] Years of experience
- [ ] Education (if public)
- [ ] Previous companies
- [ ] Specializations

**Approach:**
1. Google: "[Name] VEA Group LinkedIn"
2. Check LinkedIn profile (manual viewing)
3. Google: "[Name] Twitter" or "[Name] X.com"
4. Document findings in spreadsheet
5. Create import script

**Output:** `data/vea-leadership-research.json`

---

## PHASE 3: AI Platform Testing (1-2 hours)

### Test Queries Across 6 Platforms

**Platforms:**
1. ChatGPT (chat.openai.com)
2. Claude (claude.ai)
3. Gemini (gemini.google.com)
4. Perplexity (perplexity.ai)
5. Grok (x.com/i/grok)
6. DeepSeek (chat.deepseek.com)

### Query Categories

#### Brand Queries (10 queries x 6 platforms = 60 tests)
1. "What is VEA Group?"
2. "Tell me about VEA Group South Africa"
3. "Who are the top technology investment companies in South Africa?"
4. "Compare VEA Group with Naspers"
5. "What does VEA Group specialize in?"
6. "VEA Group telecommunications investments"
7. "South African tech investment firms"
8. "VEA Group company information"
9. "Investment companies in South Africa technology sector"
10. "Tell me about diversified investment companies in South Africa"

#### People Queries (6 people x 3 queries x 6 platforms = 108 tests)
For each executive:
1. "Who is [Name]?"
2. "What does [Name] do at VEA Group?"
3. "[Name] VEA Group background"

### Data Collection Template
For each query response, record:
- **Platform:** (chatgpt/claude/gemini/perplexity/grok/deepseek)
- **Query:** Exact question asked
- **Response:** Full AI response (first 500 chars)
- **Position:** Where VEA appears (1-5, or not mentioned)
- **Mentioned:** Yes/No
- **Sentiment:** Positive/Neutral/Negative
- **Citation URL:** If provided
- **People Mentioned:** Any VEA executives mentioned
- **Competitors Mentioned:** Any competitors mentioned

**Output:** `data/ai-platform-testing.json`
**Script to import:** `scripts/import-ai-mentions.ts`

---

## PHASE 4: Competitor Deep Analysis (1-2 hours)

### For Each Competitor (4 total)

**Competitors:**
1. Naspers (naspers.com)
2. MTN Group (mtn.com)
3. Vodacom (vodacom.co.za)
4. Telkom (telkom.co.za)

### Research Checklist per Competitor (15-30 min each)

#### Website Analysis
- [ ] Homepage scrape (description, tagline)
- [ ] About page content
- [ ] Service pages count
- [ ] Blog posts count
- [ ] News/press releases count
- [ ] Contact information

#### Social Media
- [ ] Facebook followers
- [ ] Twitter followers
- [ ] LinkedIn followers
- [ ] Instagram followers
- [ ] Total social reach

#### AI Platform Mentions
- [ ] Test same 10 queries for each competitor
- [ ] Record positions, sentiment
- [ ] Compare with VEA Group results

#### Technical/SEO
- [ ] Structured data types (schema.org markup)
- [ ] Meta descriptions
- [ ] Page load speed (approximate)

**Output:** `data/competitor-analysis.json`
**Script to import:** `scripts/import-competitor-data.ts`

---

## PHASE 5: Social Media Metrics (30 minutes)

### VEA Group Social Metrics

#### Facebook
URL: https://www.facebook.com/pg/VEA-Group-446262695861388
- [ ] Follower count
- [ ] Post frequency (posts per month)
- [ ] Engagement rate (avg likes/comments per post)
- [ ] Recent post topics

#### Twitter/X
URL: https://twitter.com/GroupVea
- [ ] Follower count
- [ ] Following count
- [ ] Tweet count
- [ ] Engagement rate
- [ ] Recent tweet topics

#### Instagram
URL: https://www.instagram.com/veagroup1
- [ ] Follower count
- [ ] Following count
- [ ] Post count
- [ ] Engagement rate
- [ ] Recent post themes

#### LinkedIn
URL: https://www.linkedin.com/company/11809859
- [ ] Follower count
- [ ] Employee count on LinkedIn
- [ ] Post frequency
- [ ] Recent update topics

**Output:** `data/vea-social-metrics.json`
**Script to import:** `scripts/import-social-metrics.ts`

---

## PHASE 6: Data Import Scripts (1 hour)

### Scripts to Create

#### 6.1 Import Leadership Research
**File:** `scripts/import-leadership-research.ts`
**Input:** `data/vea-leadership-research.json`
**Action:** Update `brand_people` table with LinkedIn/Twitter URLs, bios, followers

#### 6.2 Import AI Platform Mentions
**File:** `scripts/import-ai-mentions.ts`
**Input:** `data/ai-platform-testing.json`
**Action:**
- Insert into `brand_mentions` (VEA mentions)
- Insert into `people_ai_mentions` (executive mentions)
- Insert into `competitor_mentions` (competitor mentions)

#### 6.3 Import Competitor Analysis
**File:** `scripts/import-competitor-data.ts`
**Input:** `data/competitor-analysis.json`
**Action:**
- Insert into `competitor_snapshots` (full competitor profiles)
- Calculate GEO scores based on collected data

#### 6.4 Calculate Share of Voice
**File:** `scripts/calculate-share-of-voice.ts`
**Input:** All mention data from database
**Action:**
- Aggregate brand mentions by platform
- Compare with competitor mentions
- Calculate SOV percentages
- Insert into `share_of_voice` table

#### 6.5 Import Social Metrics
**File:** `scripts/import-social-metrics.ts`
**Input:** `data/vea-social-metrics.json`
**Action:** Update `brands` table with social follower counts

---

## PHASE 7: Monitoring Setup (30 minutes)

### Ongoing Tracking Systems

#### 7.1 AI Platform Monitoring Job
**File:** `scripts/monitor-ai-platforms.ts`
**Schedule:** Daily cron job
**Action:**
- Run predefined queries across platforms
- Record new mentions
- Track position changes
- Update sentiment trends

#### 7.2 Social Media Tracking
**File:** `scripts/track-social-metrics.ts`
**Schedule:** Weekly
**Action:**
- Update follower counts
- Track engagement rates
- Monitor post frequency

#### 7.3 Competitor Monitoring
**File:** `scripts/monitor-competitors.ts`
**Schedule:** Weekly
**Action:**
- Re-scrape competitor websites
- Update AI platform mentions
- Track competitive changes

---

## EXECUTION ROADMAP

### Immediate (Today)
1. ✅ Phase 1.1: Enhanced company data scraping
2. ✅ Phase 1.2: Competitor website scraping
3. ⏳ Phase 5: Social media metrics collection (manual viewing)

### Short-term (Next 1-2 days)
4. ⏳ Phase 2: LinkedIn research for 6 executives (manual)
5. ⏳ Phase 3: AI platform testing (manual queries)
6. ⏳ Phase 4: Competitor deep analysis

### Data Import (After research complete)
7. Create all import scripts (Phase 6)
8. Run imports to populate database
9. Verify data in dashboards

### Ongoing (Setup for future)
10. Configure monitoring jobs (Phase 7)
11. Set up automated tracking
12. Weekly data refresh

---

## DATA QUALITY LEVELS

### LEVEL 1: Verified Real Data ✅
- Website scraping results
- Public social profile URLs
- Company information from official sources
- Team member names from official website

### LEVEL 2: Manually Researched Data ⏳
- LinkedIn profiles (requires manual search)
- Social follower counts (requires manual viewing)
- Executive bios (from LinkedIn/web search)

### LEVEL 3: Time-Based Collection 📊
- AI platform mentions (requires actual queries)
- Competitor metrics (requires analysis)
- Share of voice (requires mention data)

### LEVEL 4: Ongoing Monitoring 🔄
- Trending data (requires continuous tracking)
- Historical comparisons (requires time)
- Engagement rates (requires period analysis)

---

## TOOLS & REQUIREMENTS

### Automated Scraping
- ✅ BOSS Ghost MCP (browser automation)
- ✅ WebFetch tool (HTTP requests)
- ⚠️ Rate limiting considerations
- ⚠️ Authentication for some platforms

### Manual Research
- LinkedIn account (for viewing profiles)
- Access to all 6 AI platforms
- Spreadsheet for data collection
- 4-6 hours of focused research time

### Scripts & Database
- ✅ TypeScript + Drizzle ORM
- ✅ Neon PostgreSQL database
- ✅ dotenv for configuration
- New: JSON data import utilities

---

## COST ESTIMATE

### Time Investment
- Automated scraping: 30-60 minutes
- Manual research: 4-6 hours
- Script creation: 1-2 hours
- Data import/validation: 1 hour
- **Total: 6-10 hours**

### Monetary Cost
- AI platform access: $0 (free tiers)
- LinkedIn: $0 (free account)
- Social media: $0 (public viewing)
- **Total: $0**

### Ongoing Maintenance
- Weekly monitoring: 30-60 minutes
- Monthly deep analysis: 2-3 hours

---

## SUCCESS METRICS

### Database Completeness
- ✅ Brand: 100% (already done)
- ⏳ Leadership: 50% → Target: 90% (add bios, social profiles)
- ⏳ AI Mentions: 0% → Target: 100% (60+ real mentions)
- ⏳ Competitors: 25% → Target: 90% (full snapshots)
- ⏳ Social Metrics: 50% → Target: 100% (follower counts)
- ⏳ Share of Voice: 0% → Target: 100% (calculated from mentions)

### Dashboard Readiness
- Monitor: 0% → 100% (needs AI mentions)
- Competitive: 0% → 100% (needs competitor data)
- People: 60% → 100% (needs social profiles + AI mentions)
- Social: 50% → 100% (needs follower counts)
- Engine Room: 30% → 100% (needs all metrics)

---

## NEXT IMMEDIATE STEPS

**I will now start with automated collection:**

1. Create `scripts/scrape-vea-enhanced.ts` - Get additional company data
2. Create `scripts/scrape-competitors.ts` - Scrape 4 competitor websites
3. Create `scripts/scrape-social-metrics.ts` - Attempt to get follower counts
4. Run all three scripts
5. Then pause for your input on manual research approach

**After automation complete, you decide:**
- Do manual research yourself (I provide templates/checklists)
- Have me guide step-by-step through manual research
- Split work (you do LinkedIn, I handle AI platform testing via automation)

---

**Ready to start Phase 1 automated scraping?**
