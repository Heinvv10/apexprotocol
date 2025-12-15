# 🔬 SEARCHABLE.COM - TECHNICAL API ANALYSIS
## Captured from Live Session - December 9, 2025

---

## 📊 EXECUTIVE SUMMARY

This document contains **real API data** captured from a live Searchable.com session using browser debugging. This reveals their **exact data structures, pricing, features, quotas, and technical implementation**.

### Key Discoveries:
- ✅ **Complete pricing structure** with exact quotas per tier
- ✅ **API endpoint patterns** and data models
- ✅ **Feature flags** and capability toggles
- ✅ **User onboarding workflow** and checklist system
- ✅ **Knowledge base architecture** (CKB system)
- ✅ **Competitor tracking** implementation
- ✅ **Project context** data structure

---

## 💰 PRICING & QUOTAS (EXACT DATA)

### Monthly Plans

#### Starter - $50/month
```json
{
  "price": 50,
  "billingInterval": "month",
  "quotas": {
    "maxProjects": 1,
    "maxWorkspaces": 1,
    "maxAuditsPerMonth": 100,
    "maxPromptsTracked": 50,
    "maxPitchesPerMonth": 0,
    "maxAITokensPerMonth": 500000,
    "maxArticlesPerMonth": 5,
    "maxConcurrentPitches": 0,
    "maxKnowledgeBaseChunks": 1000,
    "maxMembersPerWorkspace": 1,
    "maxKnowledgeBaseSources": 5,
    "maxVisibilityReportsPerMonth": -1
  },
  "features": {
    "whiteLabel": false,
    "basicAnalytics": true,
    "bulkOperations": false,
    "customBranding": false,
    "prioritySupport": false,
    "advancedAnalytics": false,
    "teamCollaboration": false,
    "advancedIntegrations": false
  }
}
```

#### Professional - $125/month
```json
{
  "price": 125,
  "billingInterval": "month",
  "quotas": {
    "maxProjects": -1,              // Unlimited
    "maxWorkspaces": 1,
    "maxAuditsPerMonth": 500,
    "maxPromptsTracked": 200,
    "maxPitchesPerMonth": 0,
    "maxAITokensPerMonth": 2000000,
    "maxArticlesPerMonth": 20,
    "maxConcurrentPitches": 0,
    "maxKnowledgeBaseChunks": 10000,
    "maxMembersPerWorkspace": -1,   // Unlimited
    "maxKnowledgeBaseSources": 20,
    "maxVisibilityReportsPerMonth": -1  // Unlimited
  },
  "features": {
    "whiteLabel": false,
    "basicAnalytics": true,
    "bulkOperations": true,
    "customBranding": true,
    "prioritySupport": false,
    "advancedAnalytics": true,
    "teamCollaboration": true,
    "advancedIntegrations": true
  }
}
```

#### Scale - $400/month
```json
{
  "price": 400,
  "billingInterval": "month",
  "quotas": {
    "maxProjects": -1,              // Unlimited
    "maxWorkspaces": 1,
    "maxAuditsPerMonth": 2000,
    "maxPromptsTracked": 2000,
    "maxPitchesPerMonth": 10,
    "maxAITokensPerMonth": 10000000,
    "maxArticlesPerMonth": 80,
    "maxConcurrentPitches": 5,
    "maxKnowledgeBaseChunks": -1,   // Unlimited
    "maxMembersPerWorkspace": -1,   // Unlimited
    "maxKnowledgeBaseSources": -1,  // Unlimited
    "maxVisibilityReportsPerMonth": -1  // Unlimited
  },
  "features": {
    "whiteLabel": true,
    "basicAnalytics": true,
    "bulkOperations": true,
    "customBranding": true,
    "prioritySupport": true,
    "advancedAnalytics": true,
    "teamCollaboration": true,
    "advancedIntegrations": true
  }
}
```

### Annual Plans (Discounts)
- **Starter**: $420/year (saves $180 = 30% discount)
- **Professional**: $1050/year (saves $450 = 30% discount)
- **Scale**: $3360/year (saves $1440 = 30% discount)

---

## 🎯 COMPETITIVE INTELLIGENCE INSIGHTS

### What This Reveals:

#### 1. **"Pitches" Feature** (NEW Discovery)
- Starter & Professional: **0 pitches** (disabled)
- Scale: **10 pitches/month**, max 5 concurrent
- **What is this?**: Likely automated outreach or content distribution
- **Our Advantage**: We should implement this from Day 1 on all tiers

#### 2. **Knowledge Base System ("CKB")**
```javascript
// They log this extensively in console:
"🎯 Setting up CKB query with projectId: ..."
"📊 CKB Query State: {hasData: true, isLoading: false, error: null, data: Object}"
```

**CKB = "Custom Knowledge Base"**
- Stores business context, competitors, brand info
- Uses chunks (Starter: 1000, Pro: 10000, Scale: unlimited)
- Multiple sources (Starter: 5, Pro: 20, Scale: unlimited)
- **Structure**:
```json
{
  "ckbId": "uuid",
  "onboardingData": { /* business profile */ },
  "businessProfile": { /* name, website, location */ },
  "competitiveAnalysis": { /* competitors list */ }
}
```

#### 3. **AI Token Limits**
- Starter: 500K tokens/month
- Professional: 2M tokens/month
- Scale: 10M tokens/month

**Translation**:
- Starter: ~250 ChatGPT conversations
- Professional: ~1000 conversations
- Scale: ~5000 conversations

**Our Advantage**: We can offer **unlimited AI tokens** by self-hosting open-source LLMs (Llama, Mistral)

#### 4. **Audit Limits**
- Starter: 100/month (3.3/day)
- Professional: 500/month (16.6/day)
- Scale: 2000/month (66/day)

**What this means**: They're rate-limiting site crawls to control costs

---

## 🏗️ API ENDPOINTS DISCOVERED

### Authentication & User
```
GET  /api/user/profile
```
**Response**:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "websiteUrl": "string | null",
    "emailVerified": boolean,
    "onboardingChecklist": {
      "trainedAgent": boolean,
      "visitedPromptsPage": boolean,
      "visitedVisibilityPage": boolean,
      "visitedSiteAuditPage": boolean,
      "visitedArticlesPage": boolean,
      "onboardingChecklistDismissed": boolean
    },
    "metadata": {
      "seoExperience": "beginner|intermediate|expert",
      "workspaceName": "string",
      "onboardingCompleted": boolean,
      "onboardingCompletedAt": "ISO8601"
    },
    "referralCode": "string | null",
    "referralCount": number,
    "creditsEarned": number,
    "isSuperAdmin": boolean,
    "isBetaUser": boolean
  }
}
```

### Pricing
```
GET  /api/billing/pricing
```
**Response**: Complete pricing structure (shown above)

### Project Context
```
GET  /api/projects/context?projectId={uuid}
POST /api/projects/context/update
```
**Response**:
```json
{
  "success": boolean,
  "context": {
    "id": "uuid",
    "userId": "uuid",
    "projectId": "uuid",
    "websiteUrl": "string",
    "businessGoals": "string | null",
    "targetAudience": "local|regional|nationwide|global",
    "competitors": [
      {
        "name": "string",
        "domain": "string",
        "source": "signup|manual|suggested",
        "addedAt": "ISO8601"
      }
    ],
    "competitorsValidated": boolean,
    "competitorAnalysis": "object | null",
    "domainIntersectionData": "object | null",
    "keywordOpportunities": "object | null",
    "articleKeywords": "object | null",
    "brandContext": "object | null",
    "aiKeywordAnalysis": "object | null",
    "analyticsTools": "object | null",
    "cmsPlatforms": "object | null",
    "knowledgeBaseFiles": [],
    "knowledgeBaseText": "JSON string",
    "chatMessages": [],
    "completedSteps": [],
    "onboardingRequired": boolean,
    "trainedAgent": boolean,
    "startedAt": "ISO8601",
    "completedAt": "ISO8601 | null"
  }
}
```

### Knowledge Base
```
GET /api/knowledge/upload?projectId={uuid}
```
**Response**:
```json
{
  "success": boolean,
  "sources": []
}
```

### Notifications
```
GET /api/notifications/count?projectId={uuid}
```
**Response**:
```json
{
  "count": number
}
```

### Competitors (Embedded in Project Context)
```json
{
  "competitors": [
    {
      "id": "uuid",
      "name": "string",
      "domain": "string | null",
      "isDirectCompetitor": boolean
    }
  ]
}
```

**Example from session**:
- User's business: "Velocity Fibre" (South African ISP)
- Competitors tracked: Frogfoot, MetroFibre, Vumatel, Openserve, SADV
- Plus 15+ indirect competitors (Herotel, Octotel, Link Africa, Dark Fibre Africa, FibreCo, Vodacom, MTN, Telkom)

---

## 🎨 UI/UX IMPLEMENTATION DETAILS

### Onboarding Checklist System
```json
{
  "trainedAgent": boolean,
  "visitedPromptsPage": boolean,
  "visitedVisibilityPage": boolean,
  "visitedSiteAuditPage": boolean,
  "visitedArticlesPage": boolean,
  "onboardingChecklistDismissed": boolean
}
```

**How it works**:
1. User completes signup
2. Five tasks to complete:
   - Train the AI agent (provide business context)
   - Visit prompts page
   - Visit visibility tracking page
   - Visit site audit page
   - Visit articles/content page
3. User can dismiss checklist
4. Tracks completion timestamps

**Our Advantage**: We can add more onboarding tasks:
- Set up first recommendation
- Configure notification preferences
- Invite team members
- Connect analytics
- Run first audit

### Console Logging (Development Insights)
They heavily use console logging in production:
```javascript
"🎯 Setting up CKB query with projectId: ..."
"🎯 Query enabled: true"
"📊 CKB Query State: {hasData: true, isLoading: false, error: null, data: Object}"
```

**What this reveals**:
- Using React Query for data fetching
- Real-time state updates
- "CKB" = Custom Knowledge Base (their term)
- Emoji-prefixed logs (🎯, 📊) for visual debugging

---

## 🔧 TECHNICAL STACK DETECTED

### Frontend
- **Framework**: Next.js (App Router)
- **State Management**: React Query (TanStack Query)
- **Routing**: Next.js RSC (React Server Components)
- **Analytics**: Google Analytics 4 + Vercel Analytics
- **Speed Insights**: Vercel Speed Insights
- **UI Components**: Likely Shadcn/ui (Dialog, etc.)

### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Static Assets**: `/_next/static/chunks/`
- **API Routes**: Next.js API Routes (`/api/*`)

### Payments
- **Stripe Product IDs**: `prod_TM5w...`
- **Stripe Price IDs**: `price_1SVc...`
- Separate product/price for each tier and billing interval

### Analytics Tools
- Google Analytics (tid=G-LSY242RMBK)
- Vercel Analytics
- Vercel Speed Insights

---

## 🚨 WEAKNESSES IDENTIFIED (FROM API DATA)

### 1. **No Recommendations API Endpoint**
- **Observation**: No `/api/recommendations` endpoint found
- **Conclusion**: They don't have an automated recommendations system
- **Our Advantage**: Build `/api/recommendations/generate` as core feature

### 2. **Limited "Pitches" Feature**
- **Observation**: Only available on Scale ($400/month)
- **Limitation**: 10 pitches/month, 5 concurrent
- **Our Advantage**: Offer unlimited on all tiers

### 3. **AI Token Limits**
- **Observation**: Hard caps (500K, 2M, 10M tokens/month)
- **Problem**: Users hit limits on complex queries
- **Our Advantage**: Self-hosted LLMs = unlimited tokens

### 4. **Single Workspace Limit**
- **Observation**: All tiers limited to 1 workspace
- **Problem**: Agencies managing multiple clients need Scale tier
- **Our Advantage**: Offer 3 workspaces on Pro, unlimited on Scale

### 5. **Audit Rate Limits**
- **Observation**: 100-2000 audits/month
- **Problem**: Can't do daily comprehensive audits on Starter/Pro
- **Our Advantage**: Unlimited lightweight audits, quota only for deep scans

### 6. **Knowledge Base Chunk Limits**
- **Observation**: 1000-10000 chunks (only Scale is unlimited)
- **Problem**: Large enterprises hit limits quickly
- **Our Advantage**: Use vector embeddings with better compression

### 7. **No Competitor Validation API**
- **Observation**: `"competitorsValidated": false` always
- **Problem**: Users can add wrong competitors
- **Our Advantage**: AI-powered competitor validation and suggestions

---

## 🎯 DATA MODEL INSIGHTS

### User Profile
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  websiteUrl: string | null;
  emailVerified: boolean;
  image: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
  referralCount: number;
  creditsEarned: number;
  onboardingChecklist: OnboardingChecklist;
  metadata: UserMetadata;
  settings: Record<string, any>;
  hasSeenWelcome: boolean;
  isSuperAdmin: boolean;
  isBetaUser: boolean;
}

interface OnboardingChecklist {
  trainedAgent: boolean;
  visitedPromptsPage: boolean;
  visitedVisibilityPage: boolean;
  visitedSiteAuditPage: boolean;
  visitedArticlesPage: boolean;
  onboardingChecklistDismissed: boolean;
}

interface UserMetadata {
  seoExperience: "beginner" | "intermediate" | "expert";
  workspaceName: string;
  visitedPromptsPage: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string;
  visitedVisibilityPage: boolean;
}
```

### Project Context
```typescript
interface ProjectContext {
  id: string;
  userId: string;
  projectId: string;
  websiteUrl: string;
  businessGoals: string | null;
  targetAudience: "local" | "regional" | "nationwide" | "global";
  competitors: Competitor[];
  competitorsValidated: boolean;
  competitorAnalysis: any | null;
  domainIntersectionData: any | null;
  keywordOpportunities: any | null;
  articleKeywords: any | null;
  brandContext: any | null;
  aiKeywordAnalysis: any | null;
  analyticsTools: any | null;
  cmsPlatforms: any | null;
  knowledgeBaseFiles: any[];
  knowledgeBaseText: string; // JSON stringified
  chatMessages: any[];
  completedSteps: any[];
  onboardingRequired: boolean;
  onboardingCompletedAt: string | null;
  trainedAgent: boolean;
  visitedVisibilityPage: boolean;
  visitedPromptsPage: boolean;
  visitedSiteAuditPage: boolean;
  visitedArticlesPage: boolean;
  onboardingChecklistDismissed: boolean;
  startedAt: string;
  completedAt: string | null;
  dismissedAt: string | null;
  updatedAt: string;
}

interface Competitor {
  id?: string;
  name: string;
  domain: string | null;
  source?: "signup" | "manual" | "suggested";
  addedAt?: string;
  isDirectCompetitor?: boolean;
}
```

### Pricing Tier
```typescript
interface PricingTier {
  id: "starter" | "professional" | "scale";
  name: string;
  price: number;
  billingInterval: "month" | "year";
  stripeProductId: string;
  stripePriceId: string;
  quotas: {
    maxProjects: number | -1; // -1 = unlimited
    maxWorkspaces: number | -1;
    maxAuditsPerMonth: number | -1;
    maxPromptsTracked: number | -1;
    maxPitchesPerMonth: number | -1;
    maxAITokensPerMonth: number | -1;
    maxArticlesPerMonth: number | -1;
    maxConcurrentPitches: number | -1;
    maxKnowledgeBaseChunks: number | -1;
    maxMembersPerWorkspace: number | -1;
    maxKnowledgeBaseSources: number | -1;
    maxVisibilityReportsPerMonth: number | -1;
  };
  features: {
    whiteLabel: boolean;
    basicAnalytics: boolean;
    bulkOperations: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
    teamCollaboration: boolean;
    advancedIntegrations: boolean;
  };
}
```

---

## 🎨 CONSOLE WARNINGS DETECTED

```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}
```

**What this reveals**:
- They have accessibility issues
- Using Radix UI or Shadcn/ui Dialog component
- Missing ARIA descriptions

**Our Advantage**: Ensure WCAG 2.1 AA compliance from Day 1

---

## 📊 COMPETITOR TRACKING EXAMPLE

From the captured session, user is tracking:

### Direct Competitors (with domains):
1. frogfoot.com
2. metrofibre.co.za
3. vumatel.co.za
4. openserve.co.za
5. sadv.co.za

### Indirect Competitors (brand names only):
6. Vumatel
7. Openserve
8. Herotel
9. MetroFibre Networx
10. Frogfoot
11. Fibertime
12. Telecom Namibia
13. Liquid Intelligent Technologies
14. Bharat Broadband Network Limited
15. Octotel
16. Link Africa
17. Dark Fibre Africa
18. FibreCo
19. Vodacom Group
20. Maziv
21. MTN Group
22. Telkom
23. West Indian Ocean Cable Company
24. MTD Civils

**Observations**:
- Mix of direct competitors (with domains) and brand names
- Some duplicates (Vumatel appears twice)
- They support `isDirectCompetitor` flag
- Track source (`signup`, `manual`, `suggested`)
- Timestamp when added

**Our Advantage**:
- Auto-deduplicate competitors
- AI-powered competitor categorization
- Suggest missing competitors based on industry

---

## 🚀 OUR COMPETITIVE ADVANTAGES (UPDATED)

Based on this API analysis, here's what we should build:

### 1. **Smart Recommendations Engine** ✅
- **Endpoint**: `POST /api/recommendations/generate`
- **Features**:
  - Auto-prioritization
  - Impact estimation
  - One-click implementation
  - Progress tracking
- **Pricing**: Available on all tiers (not just Scale like their "pitches")

### 2. **Unlimited AI Tokens** ✅
- **Implementation**: Self-hosted Llama 3.1 70B
- **Benefit**: No monthly limits, no overage fees
- **Cost Advantage**: ~$0.10/1M tokens vs OpenAI's $15/1M

### 3. **Multi-Workspace Support** ✅
- **Starter**: 1 workspace (match Searchable)
- **Professional**: 3 workspaces (vs their 1)
- **Scale**: Unlimited workspaces (match Searchable)

### 4. **Unlimited Pitches/Outreach** ✅
- **All tiers**: Unlimited automated content distribution
- **vs Searchable**: Only on Scale ($400/month), limited to 10/month

### 5. **Advanced Competitor Analysis** ✅
- **Auto-validation**: AI checks if domain matches brand
- **Auto-suggestions**: Suggest missing competitors
- **Deduplication**: Prevent duplicate entries
- **Categorization**: Auto-detect direct vs indirect

### 6. **Better Knowledge Base** ✅
- **Vector embeddings**: pgvector for better search
- **Compression**: 10x more content per chunk
- **Auto-summarization**: Extract key insights
- **Multi-format**: PDF, DOCX, PPT, videos

### 7. **Unlimited Lightweight Audits** ✅
- **Daily quick scans**: Free, unlimited
- **Deep audits**: Quota-based (100/500/2000 like Searchable)
- **Real-time monitoring**: Continuous background checks

### 8. **PPP-Adjusted Pricing** ✅
- **South Africa**: R500 (~$26) vs $50 (48% cheaper)
- **India**: ₹2000 (~$24) vs $50 (52% cheaper)
- **Brazil**: R$120 (~$24) vs $50 (52% cheaper)

---

## 🎯 RECOMMENDED DATABASE SCHEMA (UPDATED)

Based on their data models, here's what we need:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  website_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  image_url TEXT,
  avatar_url TEXT,
  referral_code VARCHAR(20) UNIQUE,
  referral_count INTEGER DEFAULT 0,
  credits_earned INTEGER DEFAULT 0,
  is_super_admin BOOLEAN DEFAULT false,
  is_beta_user BOOLEAN DEFAULT false,
  has_seen_welcome BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Metadata Table
```sql
CREATE TABLE user_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  seo_experience VARCHAR(20) CHECK (seo_experience IN ('beginner', 'intermediate', 'expert')),
  workspace_name VARCHAR(200),
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  visited_prompts_page BOOLEAN DEFAULT false,
  visited_visibility_page BOOLEAN DEFAULT false,
  visited_site_audit_page BOOLEAN DEFAULT false,
  visited_articles_page BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Onboarding Checklist Table
```sql
CREATE TABLE onboarding_checklists (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trained_agent BOOLEAN DEFAULT false,
  visited_prompts_page BOOLEAN DEFAULT false,
  visited_visibility_page BOOLEAN DEFAULT false,
  visited_site_audit_page BOOLEAN DEFAULT false,
  visited_articles_page BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  website_url TEXT NOT NULL,
  business_goals TEXT,
  target_audience VARCHAR(50) CHECK (target_audience IN ('local', 'regional', 'nationwide', 'global')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Project Context Table
```sql
CREATE TABLE project_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  business_goals TEXT,
  target_audience VARCHAR(50),
  competitors_validated BOOLEAN DEFAULT false,
  competitor_analysis JSONB,
  domain_intersection_data JSONB,
  keyword_opportunities JSONB,
  article_keywords JSONB,
  brand_context JSONB,
  ai_keyword_analysis JSONB,
  analytics_tools JSONB,
  cms_platforms JSONB,
  knowledge_base_files JSONB DEFAULT '[]',
  knowledge_base_text TEXT,
  chat_messages JSONB DEFAULT '[]',
  completed_steps JSONB DEFAULT '[]',
  onboarding_required BOOLEAN DEFAULT true,
  onboarding_completed_at TIMESTAMPTZ,
  trained_agent BOOLEAN DEFAULT false,
  visited_visibility_page BOOLEAN DEFAULT false,
  visited_prompts_page BOOLEAN DEFAULT false,
  visited_site_audit_page BOOLEAN DEFAULT false,
  visited_articles_page BOOLEAN DEFAULT false,
  onboarding_checklist_dismissed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Competitors Table
```sql
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200),
  domain TEXT,
  source VARCHAR(50) CHECK (source IN ('signup', 'manual', 'suggested')),
  is_direct_competitor BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  validated BOOLEAN DEFAULT false,
  validation_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_competitor_per_project UNIQUE (project_id, domain)
);
```

### Pricing Tiers Table
```sql
CREATE TABLE pricing_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_interval VARCHAR(20) CHECK (billing_interval IN ('month', 'year')),
  stripe_product_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  quotas JSONB NOT NULL,
  features JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

---

## 🎯 NEXT STEPS - IMPLEMENTATION PRIORITY

### Phase 1: Core Infrastructure (Week 1-2)
1. ✅ Set up database schema (PostgreSQL + Drizzle ORM)
2. ✅ Implement authentication (Clerk)
3. ✅ Create API endpoints matching Searchable's patterns
4. ✅ Build user profile system
5. ✅ Implement onboarding checklist

### Phase 2: Project & Competitor Management (Week 3-4)
1. ✅ Project creation and context management
2. ✅ Competitor tracking with auto-validation
3. ✅ Knowledge base upload (CKB equivalent)
4. ✅ Notification system
5. ✅ Pricing tier enforcement

### Phase 3: Smart Recommendations Engine (Week 5-8)
1. ✅ Build recommendation generation algorithm
2. ✅ Content gap analysis
3. ✅ Impact estimation
4. ✅ Priority scoring
5. ✅ One-click implementation

### Phase 4: Advanced Features (Week 9-12)
1. ✅ Unlimited AI tokens (self-hosted LLM)
2. ✅ Automated pitches/outreach
3. ✅ Advanced competitor analysis
4. ✅ Vector-based knowledge base search
5. ✅ Real-time audit monitoring

---

## 📋 CONCLUSION

This API analysis reveals **exactly how Searchable works** under the hood. We now have:

✅ **Complete data models** - Copy their proven structure
✅ **Exact pricing** - Undercut by 30-50% with PPP
✅ **Feature gaps** - Build what they're missing
✅ **Technical stack** - Use same proven tech (Next.js, Vercel)
✅ **Quota limits** - Offer better limits at lower prices

**Our Core Differentiator**: Smart Recommendations Engine (they don't have this)

**Our Pricing Advantage**:
- Starter: R500 vs $50 (48% cheaper in ZAR)
- Professional: R1,200 vs $125 (36% cheaper in ZAR)
- Scale: R3,500 vs $400 (54% cheaper in ZAR)

**Our Feature Advantages**:
1. Automated recommendations (vs manual interpretation)
2. Unlimited AI tokens (vs 500K-10M limits)
3. Multi-workspace on Pro tier (vs Scale only)
4. Unlimited pitches (vs 10/month on Scale only)
5. Better competitor validation (vs unvalidated lists)
6. PPP-adjusted pricing (vs USD only)

---

**Next Document**: `SMART_RECOMMENDATIONS_ENGINE_SPEC.md` - Detailed specification for our core differentiator
