# Smart Recommendations Engine - Implementation Roadmap

## Tech Stack Decision Matrix

### Frontend Stack (Next.js 14+ App Router)
```
Core Framework: Next.js 14+ with App Router
├─ React 18 (UI components)
├─ TypeScript (type safety)
├─ TailwindCSS (styling)
└─ Shadcn/ui (component library)

State Management:
├─ React Server Components (default)
├─ Zustand (client state when needed)
└─ React Query (server state caching)

Authentication:
└─ Clerk (already integrated in project)
```

### Backend Stack
```
API Layer: Next.js API Routes (App Router)
├─ Server Actions (mutations)
├─ Route Handlers (REST endpoints)
└─ Middleware (auth, rate limiting)

Database:
├─ Neon PostgreSQL (primary data store)
├─ Drizzle ORM (type-safe queries)
└─ Vector Extension (semantic search)

Caching & Jobs:
├─ Redis (session cache, rate limiting)
├─ BullMQ (background jobs)
└─ Upstash Redis (if serverless)

Search & Analytics:
├─ PostgreSQL Full-Text Search (initial)
├─ Typesense (future: advanced search)
└─ PostHog (analytics, optional)
```

### AI & NLP Services
```
LLM Providers:
├─ OpenAI GPT-4 (entity extraction, gap analysis)
├─ Anthropic Claude (content analysis, recommendations)
└─ Local LLM (future: cost optimization)

Vector Embeddings:
├─ OpenAI text-embedding-3-small (fast, cheap)
└─ Supabase Vector Store (PostgreSQL extension)

Web Scraping:
├─ Playwright (website crawling)
├─ Cheerio (HTML parsing)
└─ Readability.js (content extraction)
```

### DevOps & Deployment
```
Hosting: Vercel (Next.js optimized)
├─ Edge Functions (geo-routing)
├─ ISR (Incremental Static Regeneration)
└─ CDN (automatic)

CI/CD:
├─ GitHub Actions (testing, deployment)
├─ Vercel Preview Deployments
└─ Automated testing (Vitest, Playwright)

Monitoring:
├─ Vercel Analytics (performance)
├─ Sentry (error tracking)
└─ Uptime monitoring (Checkly)
```

---

## Phase 1: Foundation (Months 0-3) - South African Pilot

### Month 1: Core Infrastructure
**Goal**: Set up database, authentication, and basic recommendation engine

**Week 1-2: Database Schema**
- [ ] Design and implement Drizzle schema for:
  - Brands table (company profiles)
  - Websites table (website URLs, crawl status)
  - Content inventory table (scraped pages, entities)
  - Recommendations table (generated suggestions)
  - User actions table (completed/dismissed recommendations)
  - Task integrations table (Jira/Trello connections)
- [ ] Set up migrations pipeline
- [ ] Configure Neon PostgreSQL connection
- [ ] Add vector extension for semantic search

**Week 3: Authentication & User Management**
- [ ] Leverage existing Clerk integration
- [ ] Create user roles (Admin, Brand Manager, Viewer)
- [ ] Implement brand-user associations
- [ ] Build organization/workspace model

**Week 4: Background Job System**
- [ ] Set up BullMQ with Redis
- [ ] Create job queues:
  - Website crawling queue
  - Content analysis queue
  - Recommendation generation queue
  - Task sync queue
- [ ] Build retry logic and error handling
- [ ] Add job monitoring dashboard

### Month 2: Recommendation Engine Core
**Goal**: Build the 4 core recommendation algorithms

**Week 1: Website Crawler**
- [ ] Playwright-based crawler with:
  - Depth-limited traversal (max 3 levels)
  - Robots.txt respect
  - Rate limiting (avoid overload)
  - Content extraction (title, meta, text)
  - Schema.org detection
- [ ] Store crawled content in content_inventory table
- [ ] Build crawl status tracking UI

**Week 2: Entity Extraction & Gap Analysis**
- [ ] OpenAI GPT-4 integration for entity extraction:
  - Products mentioned
  - Services offered
  - Facts (awards, certifications, history)
  - Key people
- [ ] Query AI models (ChatGPT, Claude, Perplexity) for brand knowledge
- [ ] Implement gap detection algorithm:
  - Compare website entities vs AI knowledge
  - Score gaps by search volume potential
  - Generate content recommendations
- [ ] Build content gap visualization UI

**Week 3: Schema Audit Engine**
- [ ] Schema.org validation logic:
  - Detect existing schema types
  - Validate required properties
  - Check for LocalBusiness, FAQPage, BreadcrumbList
- [ ] African business schema templates:
  - South Africa business types
  - Contact info (WhatsApp integration)
  - Local payment methods
- [ ] Generate schema implementation recommendations

**Week 4: Language & Voice Optimization**
- [ ] Language opportunity finder:
  - Detect current website languages
  - Map markets to language opportunities (Zulu, Xhosa, Afrikaans for SA)
  - Calculate translation priority scores
- [ ] Voice optimization analyzer:
  - Readability scoring (Flesch-Kincaid)
  - Question-answer extraction
  - Conversational tone analysis
- [ ] Build recommendations with code snippets

### Month 3: User Experience & Pilot Launch
**Goal**: Build UI for recommendations and launch with 5-10 South African businesses

**Week 1: Recommendations Dashboard**
- [ ] Build main recommendations page:
  - List view with priority badges
  - Filter by type (Content Gap, Schema, Language, Voice)
  - Sort by priority/status
  - Quick actions (Accept, Dismiss, Edit)
- [ ] Individual recommendation detail view:
  - Full explanation with evidence
  - Before/after examples
  - Step-by-step implementation guide
  - Copy-paste code snippets

**Week 2: Task Management Integration**
- [ ] OAuth integrations for:
  - Jira (via Atlassian OAuth)
  - Trello (via Trello API)
  - Asana (via Asana OAuth)
- [ ] Bidirectional sync:
  - Push recommendations as tasks
  - Pull task status updates
  - Handle conflicts (platform vs external tool)
- [ ] Webhook receivers for real-time updates

**Week 3: Action Tracking & Analytics**
- [ ] Implementation tracking:
  - Mark recommendations as "In Progress"
  - Verify completion (website re-scan)
  - Track time to completion
- [ ] Impact dashboard:
  - Before/after AI query results
  - Schema validation improvements
  - Language coverage expansion
- [ ] Generate GEO scorecards (see Phase 2)

**Week 4: Pilot Launch Preparation**
- [ ] Recruit 5-10 South African businesses:
  - E-commerce (Takealot-like)
  - Professional services (law, accounting)
  - Restaurants/hospitality
  - SaaS/tech companies
- [ ] Onboarding flow:
  - Add brand profile
  - Enter website URL
  - Initiate first crawl
  - Review initial recommendations
- [ ] Set up feedback collection:
  - Helpfulness ratings (1-5 stars)
  - "This worked" / "This didn't work"
  - Free-text feedback
- [ ] Launch pilot and gather data

---

## Phase 2: Enhanced Engine (Months 3-9)

### Months 4-5: GEO Scorecards & Performance Tracking
**Goal**: Build comprehensive performance measurement

**GEO Scorecard Components**:
- [ ] AI Visibility Score (0-100):
  - Query 20 brand-relevant questions to ChatGPT, Claude, Perplexity
  - Check if brand appears in answers
  - Calculate mention percentage
  - Track position (1st, 2nd, 3rd mention)
- [ ] Schema Quality Score (0-100):
  - Validate schema.org completeness
  - Check for best-practice implementations
  - Measure coverage across pages
- [ ] Content Completeness Score (0-100):
  - Entity coverage vs competitors
  - Language availability (1 language = 50, 3+ = 100)
  - FAQ/voice optimization coverage
- [ ] Overall GEO Score:
  - Weighted average of above scores
  - Compare to industry benchmarks
  - Show improvement trends over time

**Automated Tracking**:
- [ ] Weekly AI query sweeps (background job)
- [ ] Monthly full website re-scans
- [ ] Competitor benchmarking (track 3-5 competitors per brand)
- [ ] Email reports with scorecard summaries

### Months 6-7: AI-Ready Templates & Automation
**Goal**: Make recommendations easier to implement

**Template Library**:
- [ ] Schema.org templates:
  - LocalBusiness (SA-specific fields)
  - FAQPage (voice-optimized)
  - BreadcrumbList
  - Product (e-commerce)
  - Article (blog posts)
- [ ] Content templates:
  - FAQ page structure
  - About Us page (entity-rich)
  - Service pages (local optimization)
- [ ] Multi-language templates:
  - Zulu/Xhosa/Afrikaans translations
  - Language switcher components
  - hreflang tag generators

**One-Click Implementation** (where possible):
- [ ] Copy-paste code blocks
- [ ] WordPress plugin (auto-apply schema)
- [ ] Shopify app (e-commerce focus)
- [ ] API for headless CMS integration

### Months 8-9: Continuous Learning & Refinement
**Goal**: Improve recommendation quality based on feedback

**Machine Learning Pipeline**:
- [ ] Track recommendation outcomes:
  - Implemented → Did it improve AI visibility? (re-query)
  - Dismissed → Why? (user feedback)
  - Ignored → Deprioritize similar recs
- [ ] Adjust priority algorithm:
  - Increase weight for high-success rec types
  - Decrease weight for frequently dismissed recs
  - Personalize per industry (e-commerce vs services)
- [ ] Confidence score calibration:
  - Compare predicted impact to actual impact
  - Adjust confidence calculations

**Pilot Program Expansion**:
- [ ] Expand from 5-10 businesses to 50-100
- [ ] Add more African countries:
  - Kenya (Swahili focus)
  - Nigeria (Yoruba, Igbo, Hausa)
  - Ghana, Uganda, Tanzania
- [ ] Industry-specific customizations
- [ ] Enterprise tier (multi-brand management)

---

## Phase 3: Full AI-Driven Suite (Months 9-18)

### Months 10-12: Advanced AI Features
**Goal**: Automate more of the optimization process

**Auto-Content Generation**:
- [ ] FAQ auto-generator:
  - Extract common questions from AI chat logs
  - Generate answers using GPT-4
  - Format as voice-optimized content
- [ ] Translation automation:
  - Auto-translate top priority pages
  - Human review workflow
  - Publish to multi-language site
- [ ] Schema auto-injection:
  - Detect page type
  - Generate appropriate schema
  - Provide installation instructions

**Competitive Intelligence**:
- [ ] Competitor content gap analysis:
  - "Your competitor has content on X, you don't"
  - "You rank higher than competitors for Y"
- [ ] Industry trend detection:
  - Monitor emerging topics in AI responses
  - Alert when new content opportunities appear

### Months 13-15: Regulatory Compliance & African Focus
**Goal**: Add region-specific compliance features

**POPIA Compliance (South Africa)**:
- [ ] Privacy policy templates
- [ ] Cookie consent integration
- [ ] Data processing documentation
- [ ] PAIA request handling

**GDPR Support** (for EU visitors):
- [ ] GDPR-compliant schema templates
- [ ] Right to erasure workflows

**African Business Features**:
- [ ] Mobile-first optimization checks
  - Mobile page speed scoring
  - WhatsApp integration validation
  - Data-light page recommendations
- [ ] Local payment schema:
  - EFT, SnapScan, Yoco support
  - Mobile money (M-Pesa for Kenya)
- [ ] Offline-first considerations:
  - PWA recommendations
  - Low-bandwidth optimizations

### Months 16-18: Enterprise & Scale
**Goal**: Support large organizations and scale infrastructure

**Enterprise Features**:
- [ ] Multi-brand management dashboard
- [ ] Team collaboration:
  - Assign recommendations to team members
  - Approval workflows
  - Comment threads
- [ ] API for custom integrations
- [ ] White-label options
- [ ] SSO (SAML, Azure AD)

**Infrastructure Scaling**:
- [ ] Migrate to dedicated Redis cluster
- [ ] Implement database read replicas
- [ ] Add CDN for global performance
- [ ] Optimize AI API costs:
  - Cache entity extractions
  - Batch processing
  - Use cheaper models where possible
- [ ] Load testing and performance optimization

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (Next.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Recommendations│  │  GEO         │  │  Task        │     │
│  │ Dashboard    │  │  Scorecards  │  │  Integrations│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ (Server Actions / API Routes)
┌────────────────────────▼────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Recommendation Engine                              │    │
│  │  ├─ Content Gap Analyzer                            │    │
│  │  ├─ Schema Auditor                                  │    │
│  │  ├─ Language Opportunity Finder                     │    │
│  │  └─ Voice Optimization Analyzer                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Background Jobs (BullMQ)                           │    │
│  │  ├─ Website Crawler (Playwright)                    │    │
│  │  ├─ AI Query Processor (GPT-4, Claude)              │    │
│  │  ├─ Priority Calculator                             │    │
│  │  └─ Task Sync Worker (Jira/Trello/Asana)            │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  Vector DB   │      │
│  │  (Neon)      │  │  (Upstash)   │  │  (pgvector)  │      │
│  │              │  │              │  │              │      │
│  │ • Brands     │  │ • Job Queue  │  │ • Embeddings │      │
│  │ • Websites   │  │ • Cache      │  │ • Semantic   │      │
│  │ • Content    │  │ • Sessions   │  │   Search     │      │
│  │ • Recs       │  │ • Rate Limit │  └──────────────┘      │
│  └──────────────┘  └──────────────┘                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│               EXTERNAL INTEGRATIONS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  OpenAI      │  │  Anthropic   │  │  Task Mgmt   │      │
│  │  (GPT-4)     │  │  (Claude)    │  │  (Jira/etc)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Development Phases Summary

| Phase | Timeline | Key Deliverables | Success Metrics |
|-------|----------|------------------|-----------------|
| **Phase 1: Foundation** | Months 0-3 | Database schema, crawler, 4 core algorithms, pilot launch | 5-10 SA businesses onboarded, >50 recommendations generated |
| **Phase 2: Enhanced Engine** | Months 3-9 | GEO scorecards, templates, learning pipeline | 50-100 businesses, 70%+ recommendation completion rate |
| **Phase 3: Full Suite** | Months 9-18 | Auto-content, compliance, enterprise features | Multi-country presence, enterprise clients, profitability |

---

## Resource Requirements

### Development Team (Phase 1)
- **1x Full-Stack Developer** (Next.js, TypeScript, PostgreSQL)
- **1x AI/ML Engineer** (OpenAI integration, NLP)
- **0.5x DevOps** (Vercel, Redis setup, monitoring)
- **0.5x Designer** (UI/UX for dashboard)

### Development Team (Phase 2-3)
- Add **1x Backend Engineer** (scaling, optimization)
- Add **1x Frontend Engineer** (enterprise UI features)
- Add **0.5x Data Scientist** (ML pipeline, recommendations)

### Infrastructure Costs (Estimated)
**Phase 1 (Pilot)**:
- Vercel Pro: $20/month
- Neon PostgreSQL: $19/month (Pro tier)
- Upstash Redis: $10/month (Pay-as-you-go)
- OpenAI API: ~$200/month (10 businesses × ~$20/business/month)
- **Total: ~$250/month**

**Phase 2 (100 businesses)**:
- Vercel: $20/month (still sufficient)
- Neon: $69/month (Scale tier)
- Upstash: $50/month (higher volume)
- OpenAI API: ~$2,000/month (100 businesses × ~$20/business)
- **Total: ~$2,150/month**

**Phase 3 (Enterprise)**:
- Custom pricing based on scale
- Potential cost optimizations (local LLMs, caching)

---

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API costs exceed budget | HIGH | Implement aggressive caching, use GPT-3.5-turbo where possible, set per-brand monthly quotas |
| Website crawling gets blocked | MEDIUM | Respect robots.txt, add delays, rotate user agents, offer manual upload option |
| AI recommendations low quality | HIGH | Human review loop in Phase 1, collect feedback, continuously refine algorithms |
| Scalability issues | MEDIUM | Start with managed services (Neon, Vercel), plan migration to dedicated infrastructure in Phase 3 |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low pilot adoption | HIGH | Offer free pilot period, provide white-glove onboarding, show quick wins |
| Competitors copy features | MEDIUM | Focus on African market specialization, build network effects through integrations |
| Regulatory changes (POPIA) | LOW | Build compliance from day one, stay updated on regulations |

---

## Next Steps After Roadmap Approval

1. **Set up development environment**:
   - Clone repository
   - Configure Neon PostgreSQL connection
   - Set up Upstash Redis account
   - Get OpenAI API keys

2. **Start with database schema** (Week 1 priority):
   - Design Drizzle schema files
   - Create migrations
   - Seed with test data

3. **Build MVP crawler** (Week 2 priority):
   - Playwright setup
   - Basic website traversal
   - Content extraction
   - Store in database

4. **Integrate first AI algorithm** (Week 3 priority):
   - Content Gap Analysis
   - OpenAI entity extraction
   - Generate first recommendations

This roadmap provides a clear path from design to implementation while maintaining focus on the South African pilot and gradual expansion across Africa.
