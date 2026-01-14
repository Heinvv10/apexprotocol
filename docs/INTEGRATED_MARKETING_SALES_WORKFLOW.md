# Apex: Integrated Marketing & Sales Workflow Platform
## Complete Go-To-Market Strategy with Open-Source Tech Stack

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Production-Ready Implementation Plan

---

## EXECUTIVE SUMMARY

This document outlines a complete, integrated marketing and sales workflow system for Apex that:

1. **Automates the entire customer journey** from awareness → conversion → advocacy
2. **Uses open-source tools** to minimize costs while maintaining enterprise functionality
3. **Integrates with the Apex admin dashboard** for seamless marketing operations
4. **Focuses on LinkedIn, Instagram, Facebook** with multi-platform coordination
5. **Includes video automation, email sequences, lead scoring, and analytics**
6. **Incorporates AI-powered content generation** for scale and personalization

**Expected ROI:** 3-5x revenue increase through improved lead quality and conversion rates

---

## PART 1: RECOMMENDED TECHNOLOGY STACK FOR APEX

### Primary Stack: Content-First Marketing (Recommended for Apex)

```
┌─────────────────────────────────────────────────────────────┐
│              APEX MARKETING & SALES WORKFLOW STACK           │
└─────────────────────────────────────────────────────────────┘

TIER 1: CORE MARKETING INFRASTRUCTURE
├── CRM & Lead Management: Mautic (Open Source)
├── Email Automation: ListMonk + Mautic Integration
├── Forms & Landing Pages: HeyForm + Webstudio
└── Video Generation: FFmpeg + OpenSora (AI-powered)

TIER 2: SOCIAL MEDIA & CONTENT
├── Content Scheduling: Postiz (Multi-platform AI scheduler)
├── Social Analytics: Mixpost (LinkedIn, Instagram, Facebook)
├── Content Repurposing: Custom integration (Repurpose.io API)
└── Video Editing: OpenShot (Open Source)

TIER 3: ANALYTICS & TRACKING
├── Website Analytics: Matomo (Google Analytics alternative)
├── Conversion Funnel: PostHog (Product analytics + funnels)
├── Attribution: Custom tracking layer (UTM + pixel-based)
└── Real-time Dashboards: Data aggregation engine

TIER 4: ADMIN DASHBOARD INTEGRATION
├── Marketing Metrics Dashboard (Apex admin)
├── Lead Pipeline Visualization
├── Campaign Performance Real-time Tracking
├── AI Content Generation Interface
└── Social Media Publishing Hub

TIER 5: AI & AUTOMATION
├── Content Generation: Claude API (integrated)
├── Lead Scoring: ML engine (built-in)
├── Video Generation: OpenSora + FFmpeg
└── Email Subject Line Optimization: Claude API
```

### Cost Breakdown (Self-Hosted)

| Component | Tool | Monthly Cost | Annual | Notes |
|-----------|------|--------------|--------|-------|
| **CRM** | Mautic | $150 | $1,800 | VPS hosting + domain |
| **Email** | ListMonk | $50 | $600 | Light VPS requirements |
| **Landing Pages** | Webstudio | $100 | $1,200 | Headless CMS deployment |
| **Social Scheduler** | Postiz | $75 | $900 | Docker container |
| **Analytics** | Matomo | $100 | $1,200 | PHP/MySQL server |
| **Video** | FFmpeg + OpenSora | $200 | $2,400 | GPU compute for AI models |
| **Infrastructure** | VPS (Linode/DO) | $400-600 | $4,800-7,200 | Central server |
| **Monitoring** | Sentry + New Relic | $100 | $1,200 | Error tracking |
| **Total** | | **$1,175-1,375** | **$14,100-16,500** | Full enterprise stack |

**vs. SaaS Alternative:** HubSpot + Salesforce + Klaviyo + Hootsuite = $3,500-5,000/month

**Savings: 65-72% cost reduction**

---

## PART 2: INTEGRATED MARKETING WORKFLOW ARCHITECTURE

### The Complete Customer Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│               APEX MARKETING FUNNEL (TOFU → BOFU)               │
└─────────────────────────────────────────────────────────────────┘

STAGE 1: AWARENESS (TOFU - Top of Funnel)
═════════════════════════════════════════════════════════════════
Goal: Get brand in front of target audience (SMBs, agencies, e-commerce)
Duration: Ongoing
Channels: LinkedIn, TikTok, Instagram, YouTube, Organic

Tactics:
├── LinkedIn Posts (3x/week)
│   ├── Educational threads: "Why AI can't find your brand" (tension hook)
│   ├── Industry trends: AI search engine updates
│   ├── Case studies: Brand visibility wins (without naming)
│   └── Personal stories: Our founder's AI visibility journey
│
├── TikTok/Reels/Shorts (Daily)
│   ├── 15-30 sec: Quick facts about ChatGPT vs Claude vs Gemini
│   ├── 20 sec: "Your brand disappeared from AI search..." (curiosity)
│   ├── Educational: How AI search engines work (animated)
│   └── Behind-the-scenes: Apex team building product
│
├── YouTube (Weekly)
│   ├── Long-form: "Complete Guide to AI Search Engines"
│   ├── Tutorials: "How to Audit Your AI Visibility"
│   ├── Case studies: Brand visibility success stories
│   └── Educational series: "AI Visibility Fundamentals"
│
├── Blog/SEO Content (2x/week)
│   ├── Pillar: "The Complete Guide to GEO (Generative Engine Optimization)"
│   ├── Long-form guides: "How to Get Featured in ChatGPT Responses"
│   └── Industry reports: "2026 AI Search Visibility Report"
│
└── Organic/Viral
    ├── Trend-jacking: Comment on AI news with Apex insights
    ├── Employee advocacy: Staff sharing personal perspectives
    └── Community engagement: Answer questions in relevant groups

MEASUREMENT:
├── LinkedIn: Impressions, engagement rate, profile visits
├── TikTok/Reels: Views, average watch time, share rate
├── YouTube: Views, watch time, CTR on description links
├── Blog: Organic traffic, time on page, scroll depth
└── Aggregate: Brand awareness lift (survey-based or intent data)


STAGE 2: CONSIDERATION (MOFU - Middle of Funnel)
═════════════════════════════════════════════════════════════════
Goal: Educate prospects about Apex capabilities and ROI
Duration: 2-4 weeks
Channels: Email, Webinars, Product Tours, Comparison Content

Tactics:
├── Email Sequences (Automated via Mautic)
│   ├── Welcome sequence (Day 0-7)
│   │   ├── Day 0: Welcome + intro video (Loom 3 min)
│   │   ├── Day 2: "Here's why you're losing AI visibility" (educational)
│   │   ├── Day 4: Case study: Coffee retailer +2,700% AI traffic
│   │   ├── Day 5: Feature spotlight: Smart Recommendations Engine
│   │   ├── Day 6: "Quick audit: See your AI visibility score" (CTA)
│   │   └── Day 7: Social proof + testimonial video
│   │
│   ├── Nurture sequence (Week 2-8, triggered by behavior)
│   │   ├── Viewed pricing? → ROI calculator email
│   │   ├── Downloaded whitepaper? → Webinar invitation
│   │   ├── Opened 3+ emails? → 1-on-1 demo offer
│   │   ├── Haven't opened? → FOMO sequence (limited offer)
│   │   └── Site visit from target company? → Personalized outreach
│   │
│   └── Re-engagement (inactive > 30 days)
│       ├── "We miss you" message
│       ├── New feature announcement
│       ├── "Only 3 spots left" scarcity play
│       └── Special: "First month 50% off"
│
├── Webinars (Bi-weekly)
│   ├── Topic: "Auditing Your AI Visibility" (live demo)
│   ├── Topic: "How to Get Your Brand in ChatGPT Responses"
│   ├── Topic: "AI Search vs Traditional SEO" (comparison)
│   ├── Format: 30-min presentation + 15-min Q&A + replay
│   ├── Gate: Email + company size for lead scoring
│   └── Follow-up: Send replay + offer for attendees (24 hrs)
│
├── Product Tours (Personalized)
│   ├── Tool: Loom (personalized video walkthrough)
│   ├── Trigger: "Schedule Demo" click on website
│   ├── Format: 5-min personalized tour (use first name, company)
│   ├── Include: Smart Recommendations demo + results preview
│   └── CTA: "Questions? Hop on a 15-min call" (Calendly link)
│
├── Comparison Content
│   ├── Blog: "Apex vs Searchable.ai vs Profound" (detailed)
│   ├── Downloadable: Feature comparison PDF (gated)
│   ├── Video: "Why we chose to build differently" (founder story)
│   └── Interactive: "Which tool is right for you?" quiz
│
├── Lead Magnet Strategy
│   ├── Free audit: "Get your AI visibility score in 5 minutes"
│   │   └── Gated: Email capture → instant results
│   ├── Template: "AI Content Optimization Checklist"
│   │   └── Gated: Email capture → PDF download
│   ├── Report: "2026 AI Visibility Trends Report"
│   │   └── Gated: Email + company size → PDF + webinar invite
│   └── Tools: "Brand Mention Tracker" (free lite version)
│       └── Freemium: Limited features → upsell to paid
│
└── Retargeting Campaigns
    ├── LinkedIn: Visited landing page > see ads (1x/week)
    ├── Facebook/Instagram: Website visitor pixel (2x/week)
    ├── Email: Re-engagement series (3x/week first month)
    └── YouTube: Product demo viewers (homepage overlay)

MEASUREMENT:
├── Email: Open rate (target >25%), CTR (>5%), unsubscribe <0.5%
├── Webinars: Attendance (target >40% of registered), engagement
├── Demo requests: Conversion from request → booked call (>50%)
├── Lead scoring: MQL (Marketing Qualified Lead) generation
└── Velocity: Time from first touch → consideration (target: 7-14 days)


STAGE 3: DECISION (BOFU - Bottom of Funnel)
═════════════════════════════════════════════════════════════════
Goal: Convert prospects into customers
Duration: 1-3 weeks
Channels: Sales calls, Proposals, Free trials, Direct sales

Tactics:
├── Sales Sequences (Personalized)
│   ├── Trigger: Lead score > 80 points
│   ├── Day 0: Sales rep intro + "Let's see if Apex is a fit"
│   ├── Day 2: If no response → "Quick 15-min call?"
│   ├── Day 4: Social proof email + testimonial from similar company
│   ├── Day 6: "Here's what we'd recommend for [Company]"
│   ├── Day 8: Executive summary + ROI calculator results
│   ├── Day 10: "Last chance" limited-time offer (30% first month)
│   └── Day 12: Disqualify if no engagement
│
├── Free Trial Program
│   ├── Duration: 14 days + 2-week implementation support
│   ├── What's included: 5 domains, full Smart Recommendations access
│   ├── Onboarding: Video tutorials + 1 check-in call
│   ├── Conversion: 30-40% of trials convert to paid
│   ├── Anti-churn: Check in Day 7 to see progress
│   └── Goal: Get them to complete first recommendation
│
├── Sales Calls (Consultative)
│   ├── Pre-call: Research prospect's industry + competitors
│   ├── Goal: Diagnostic (problem) > Solution (Apex) > Close
│   ├── Discovery: "What's your current visibility in ChatGPT?"
│   ├── Demo: Show their brand in MONITOR, custom AUDIT results
│   ├── ROI Calc: "If we get you to 25% mention rate = $X revenue"
│   └── Close: "Can we move you to a 14-day trial?"
│
├── Proposal Process
│   ├── Generated: Custom proposal PDF (5-min template)
│   ├── Include: Current state analysis, Apex recommendations, ROI
│   ├── Timeline: Send within 24 hours of call
│   ├── Follow-up: Email + Slack DM (not just email)
│   └── Urgency: "Offer valid for 7 days"
│
├── Pricing Strategy
│   ├── Starter: R500/month (1 domain, monitoring only)
│   ├── Professional: R1,200/month (3 domains, recommendations + Jira)
│   ├── Scale: R3,500/month (10 domains, content generation)
│   └── Enterprise: Custom (unlimited domains, white-label, SLA)
│
├── Payment & Onboarding
│   ├── Payment: Local methods (PayFast, M-Pesa, EFT)
│   ├── Onboarding: 30-day guided tour with checklist
│   ├── Quick wins: Set 1 AI query, show first mention result (Day 2)
│   ├── Expansion: Introduce content generation (Week 2)
│   └── Success: 1-month check-in call to review progress
│
└── Expansion Opps (During onboarding)
    ├── Add domains (upgrade from 1 → 3 → 10)
    ├── Add team members (basic → professional tiers)
    ├── Add integrations (Jira, Slack, Asana)
    └── Upsell: Content generation + white-label (12m contracts)

MEASUREMENT:
├── Trial-to-paid: Conversion rate (target >30%)
├── Sales cycle: Days from MQL → customer (target <14 days)
├── ACV: Average contract value (target R15K+ annually)
├── Close rate: % of opportunities that convert (target >20%)
└── Expansion revenue: Upsells per existing customer (target 30% of base)


STAGE 4: RETENTION & ADVOCACY (Post-Customer)
═════════════════════════════════════════════════════════════════
Goal: Keep customers happy, expand usage, generate referrals
Duration: Ongoing (12+ months)
Channels: In-app messaging, Email, Community, Webinars, Referral Program

Tactics:
├── Customer Success Program
│   ├── Onboarding: 30-day structured program
│   │   ├── Week 1: Product walkthrough + quick wins
│   │   ├── Week 2: Recommendations review + strategy
│   │   ├── Week 3: Content generation demo
│   │   └── Week 4: Expansion opportunities + upsells
│   │
│   ├── Health Checks: Monthly check-ins (automated + personal)
│   │   ├── In-app: "Here's your progress this month" dashboard
│   │   ├── Email: Monthly report (recommendations completed, ROI)
│   │   ├── Slack: Integration showing new mentions detected
│   │   └── Call: Quarterly strategy review (Starter tier skips)
│   │
│   ├── Usage Monitoring (via admin dashboard)
│   │   ├── Red flags: No logins in 7 days
│   │   ├── Risk score: Predicts churn 30 days out
│   │   ├── Auto-trigger: Intervention email + "free strategy call"
│   │   └── Recovery: 20% first-time win recovery rate
│   │
│   └── Feature Education
│       ├── New feature webinars (monthly)
│       ├── Tutorial videos (in-app + YouTube)
│       ├── Email tips: "Pro tips for maximizing ROI"
│       └── Community: Slack channel for best-practice sharing
│
├── Retention Email Sequences
│   ├── Welcome back: "3 things to do your first week"
│   ├── Quick wins: "Customer just hit 25% mention rate" (social proof)
│   ├── Educational: "How to prioritize recommendations" (feature spotlight)
│   ├── Expand usage: "More domains = better insights" (upsell)
│   ├── Community: "Apex best practices webinar" (engagement)
│   └── Referral: "Know another brand needing AI visibility?" (viral loop)
│
├── Referral Program
│   ├── Structure: Refer 1 customer → 1 month free
│   ├── Structure: Referred customer gets R500 off first 3 months
│   ├── Tracking: In-app referral link + affiliate dashboard
│   ├── Promotion: Monthly referral leaderboard (gamification)
│   ├── Rewards: Top referrer per month gets spotlight on LinkedIn
│   └── Goal: 10-15% of new customers via referrals
│
├── Community & Advocacy
│   ├── Slack community: 500+ customer community members
│   ├── Case study program: Interview successful customers
│   ├── Ambassador program: Give free Apex to influencers in marketing
│   ├── LinkedIn social proof: Testimonials + logo wall
│   ├── Content: Customer stories series (3x/month)
│   └── Events: Quarterly Apex user conference (virtual)
│
├── Win-Back Campaign (Churned customers)
│   ├── Trigger: Subscription cancelled or lapsed
│   ├── Day 1: "We miss you" + survey why they left
│   ├── Day 3: "Here's what's new since you left"
│   ├── Day 7: Special offer "First month 50% off to come back"
│   ├── Day 14: "Permanently remove my account?" (breakup email)
│   └── Day 21: Archive contact if no response
│
└── Expansion Revenue
    ├── 90-day usage review: "Ready to expand to 10 domains?"
    ├── Team growth: "Add team members to your plan"
    ├── Feature expansion: "Content generation unlocks 3x ROI"
    ├── White-label: "Resell Apex to your clients" (agencies)
    └── Enterprise: "Custom SLA + dedicated support"

MEASUREMENT:
├── NPS (Net Promoter Score): Target >50
├── Churn rate: Target <5% monthly
├── Net Revenue Retention: Target >110%
├── Expansion revenue: Target 30% of new customer revenue
├── Referral rate: Target >15% of new customers
└── Customer lifetime value: Target >R100K (5-year relationship)
```

---

## PART 3: SOCIAL MEDIA STRATEGY BY PLATFORM

### LinkedIn Strategy (Primary B2B Channel)

**Content Mix:**
- 40% Educational (threads, how-to guides, industry insights)
- 30% Social Proof (testimonials, case studies, logos)
- 20% Personal (founder stories, team behind-the-scenes)
- 10% Promotional (limited, event announcements)

**Content Calendar (Weekly):**
```
Monday: Educational thread (tension hook)
  Example: "Why 87% of brands aren't visible in ChatGPT responses..."
  └─ Threads trending: Tuesday-Thursday

Wednesday: Case study or social proof
  Example: "Coffee retailer: 0% to 28% mention rate in 60 days"
  └─ LinkedIn Carousel post (5-slide breakdown)

Thursday: Founder insight or personal story
  Example: "Why we built Apex for African markets"
  └─ LinkedIn document (long-form, 2-3 min read)

Friday: Industry news + Apex angle
  Example: "New Gemini update: What it means for your brand visibility"
  └─ Personal take, not promotional

Weekend: Comment & engage
  └─ Respond to all comments within 2 hours
  └─ Engage with 10-15 relevant posts
```

**LinkedIn Ads (Paid Component):**
```
Audience Segmentation:
├── Cold awareness: Marketing directors, CMOs, founders
│   └─ Message: "Your brand should be in ChatGPT responses"
│   └─ Creative: Video testimonial (60 sec)
│   └─ Budget: R800/week
│
├── Warm retargeting: Website visitors + LinkedIn engagers
│   └─ Message: "Ready to get serious about AI visibility?"
│   └─ Creative: Product demo + pricing
│   └─ Budget: R500/week
│
└── Hot intent: Downloaded lead magnet or attended webinar
    └─ Message: "Let's get you started with a free trial"
    └─ Creative: Testimonial video + CTA
    └─ Budget: R400/week

Monthly LinkedIn Ads Budget: R5,200 (~$280)
```

---

### Instagram/Facebook Strategy (Visual B2C/Community)

**Content Mix:**
- 40% Short-form video (Reels, TikTok-style)
- 30% Customer stories (testimonials, case studies)
- 20% Behind-the-scenes (Apex team, product building)
- 10% Educational carousels (infographics)

**Content Calendar (3x/week):**
```
Monday: Short-form video (15-30 sec)
  Example: "Your brand disappeared from Gemini search—here's why"
  └─ Post to Instagram Reels + Facebook Reels simultaneously
  └─ Repurpose: TikTok version (different hook)

Wednesday: Customer story or testimonial
  Example: "How Sarah's e-commerce brand got featured in Claude"
  └─ Format: Customer interview (3-5 min video)
  └─ Post to Instagram Feed + Stories + Reels

Friday: Carousel or educational graphic
  Example: 5-slide deck on "AI vs Traditional SEO"
  └─ Post to Feed (Instagram) + Feed (Facebook)
  └─ Downloadable: PDF in bio link

Stories (Daily):
├── Morning: Team building Apex
├── Midday: Customer wins/updates
├── Evening: Community engagement
└── Always: Use stickers for engagement (polls, Q&A)

Live Sessions (Weekly):
├── Topic: "Q&A on AI visibility"
├── Format: 15-20 min live stream
├── Cross-post: Instagram + Facebook + LinkedIn
└── Promote: Announce day before
```

**Instagram/Facebook Ads (Paid):**
```
Audience 1: Lookalike audiences (based on website visitors)
├── Message: "See your AI visibility score"
├── Creative: Animated GIF showing score improving
├── Budget: R600/week
└── CPC target: R15-25

Audience 2: Interest-based (CMOs, marketers, entrepreneurs)
├── Message: "Your competitors are in ChatGPT. Are you?"
├── Creative: Comparison carousel (You vs Competitors)
├── Budget: R400/week
└── CPC target: R20-30

Audience 3: Retargeting (video watchers)
├── Message: "Ready to start?"
├── Creative: Call button + link to free trial
├── Budget: R300/week
└── CPC target: R10-15

Monthly Instagram/Facebook Ads: R4,200 (~$225)
```

---

### TikTok Strategy (Viral/Brand Awareness)

**Content Mix:**
- 50% Entertaining/Trending (use trending sounds, dances with Apex twist)
- 30% Educational (quick facts about AI search)
- 15% Behind-the-scenes (Apex team, day in the life)
- 5% Direct asks (Follow our LinkedIn, visit website)

**Content Calendar (Daily):**
```
Daily video (15-30 sec):
├── Morning: Trending format + Apex angle
├── Afternoon: Educational fact + animation
├── Evening: Behind-the-scenes + hook

Hashtag strategy:
├── 3 branded: #ApexGEO, #AIVisibility, #GenerativeSearch
├── 5 industry: #SEO, #MarketingTips, #AITools, #Content, #BrandMarketing
├── 5 trending: Check TikTok Discover daily for trending hashtags
└── Pattern: Mix broad + niche + trending (aim for 200K-1M impressions)

Content ideas:
├── Day 1: "POV: Your brand isn't in ChatGPT" (trending audio)
├── Day 2: "3 AI search engines you've never heard of" (educational)
├── Day 3: "We built something our users didn't ask for" (behind-the-scenes)
├── Day 4: "Worst advice for AI visibility" (trend inversion)
├── Day 5: Case study transformation (before/after)
├── Day 6: "ChatGPT just updated. Here's why it matters" (news)
└── Day 7: User-generated content or testimonial

Goal: 10-50K views per video, 5-10% engagement rate, 500+ followers/month
Viral potential: If 1-2 videos hit 100K+ views/month, goes viral organically
```

---

## PART 4: EMAIL MARKETING SEQUENCES & AUTOMATION

### Email Automation Workflows (Mautic Setup)

**Workflow 1: Lead Capture → Welcome Sequence (7 days)**

```
Trigger: Email signup from website/landing page
│
├─ Day 0 (immediate): Welcome email
│  ├─ Subject: "Welcome to Apex! Here's your AI visibility score"
│  ├─ Body: Video (Loom 3 min) showing how Apex works
│  ├─ CTA: "Get your free audit" (link to gated tool)
│  └─ Personalization: {FIRST_NAME}, {COMPANY_NAME}
│
├─ Day 2: Educational email
│  ├─ Subject: "{FIRST_NAME}, 87% of brands are invisible in ChatGPT"
│  ├─ Body: Case study of coffee retailer (+2,700% AI traffic)
│  ├─ Include: Before/after comparison
│  └─ CTA: "See how we did it" (link to case study PDF)
│
├─ Day 4: Product email
│  ├─ Subject: "The Smart Recommendations Engine, explained"
│  ├─ Body: Feature overview with animation/screenshot
│  ├─ Include: How it saves 5 hours/week vs manual audits
│  └─ CTA: "See it in action" (product demo video)
│
├─ Day 5: Social proof email
│  ├─ Subject: "What customers say about Apex"
│  ├─ Body: 3-4 short testimonial quotes + logos
│  ├─ Include: Star ratings (4.8/5)
│  └─ CTA: "Read full customer stories" (customer page)
│
├─ Day 6: Call-to-action email
│  ├─ Subject: "Your free Apex audit (no credit card required)"
│  ├─ Body: Simple + direct, CTAs are main copy
│  ├─ Buttons: [Get Free Audit] [Schedule Demo] [Watch Demo]
│  └─ P.S.: "Most audits take 5 minutes to complete"
│
└─ Day 7: FOMO/scarcity email
   ├─ Subject: "Last day: Free audit + 2-week trial"
   ├─ Body: Limited offer, "Only 10 spots remaining"
   ├─ Design: Red banner, countdown timer (if email supports)
   └─ CTA: "Claim my free trial" (highest conversion button)

Split Test Opportunities:
├─ Subject line A: "Your AI visibility score"
├─ Subject line B: "87% of brands are invisible—are you one of them?"
├─ Measure: Which gets higher open rate?
├─ Apply: Winner template for future sequences

Scoring Points (lead qualification):
├─ +10: Email opened
├─ +15: Clicked link
├─ +20: Downloaded lead magnet
├─ +30: Watched video demo
├─ +50: Requested free trial
├─ Total after sequence: 75-150 points (MQL threshold: >80 = ready for sales)
```

**Workflow 2: Free Trial Users → Activation Sequence (4 weeks)**

```
Trigger: Free trial account created
│
├─ Day 1 (Welcome): Onboarding begins
│  ├─ Step 1: Video tutorial (Loom: "Getting started in 5 minutes")
│  ├─ Step 2: Add first domain (prompt in app)
│  ├─ Step 3: Check inbox for welcome email
│  └─ Email: "Here's your onboarding checklist"
│
├─ Day 3 (Quick win): First monitor result
│  ├─ In-app: "We found your brand mentioned in ChatGPT!"
│  ├─ Email: "Your first AI visibility result" + screenshot
│  ├─ Include: ROI calculation ("This mention reached 50K+ people")
│  └─ CTA: "View all mentions" (keep them in product)
│
├─ Day 7 (Recommendations): First recommendations generated
│  ├─ In-app: 3-5 recommendations populated
│  ├─ Email: "Your first smart recommendations are ready"
│  ├─ Subject: "{FIRST_NAME}, we found 5 ways to boost your visibility"
│  ├─ Show: Top 3 recommendations with effort/impact scores
│  └─ CTA: "Implement first recommendation"
│
├─ Day 10 (Implementation): Support + guidance
│  ├─ Email: "How to implement your recommendations"
│  ├─ Include: Step-by-step guide for top recommendation
│  ├─ Option: "Want help? Book a 15-min strategy call"
│  └─ Soft CTA: No hard sell, just support
│
├─ Day 14 (Check-in): Mid-trial progress check
│  ├─ Email: "Your first 2 weeks: What we're seeing"
│  ├─ Include: Usage stats (domains added, recommendations viewed, etc.)
│  ├─ Celebrate: "You're in the top 30% of trial users in engagement!"
│  ├─ Content: "5 Pro tips for maximizing your trial"
│  └─ CTA: "Book your strategy call" (low-pressure)
│
├─ Day 18 (Feature education): Introduction to advanced features
│  ├─ Topic: Content generation (create first piece)
│  ├─ Email: "Generate your first AI-optimized content piece"
│  ├─ Include: Demo video + guide
│  ├─ Option: "Let us generate an example for you"
│  └─ CTA: "Generate free sample content"
│
├─ Day 21 (Urgency): 7 days before trial ends
│  ├─ Email: "Your trial ends in 7 days"
│  ├─ Include: Conversion offer ("50% off first 3 months")
│  ├─ AIDA copy: Attention/Interest/Desire/Action
│  ├─ Subject: "Secure your 50% discount—ends tonight"
│  ├─ Buttons: [Upgrade Now] [Need More Time?]
│  └─ Social proof: "235 brands upgraded this week"
│
└─ Day 25 (Final offer): 3 days before trial ends
   ├─ Email: "Final offer: 50% off ends tonight"
   ├─ Design: Red borders, urgent messaging
   ├─ Include: Testimonial video (30-sec customer success story)
   ├─ CTA button: Large, contrasting color
   └─ P.S.: "Upgrade to keep your insights"

Conditional Paths (triggered by behavior):
├─ If >5 recommendations viewed:
│  └─ Send: "Ready to take action? Let's schedule an implementation call"
│
├─ If 0 recommendations viewed:
│  └─ Send: "Need help getting started?" (support-focused, not sales)
│
├─ If integrated with Jira/Slack:
│  └─ Send: "You're already using our integrations! (advanced) users"
│
└─ If didn't implement any recommendations:
   └─ Send: "No time right now? Here's a special offer to explore later"

Post-Trial Paths:
├─ Upgraded to paid? → Customer success sequence begins
├─ Not upgraded? → Win-back sequence (30-60 days later)
└─ Unsubscribed? → Archive, don't contact
```

**Workflow 3: Existing Customers → Retention & Expansion (Ongoing)**

```
Trigger: Subscription active (all months)
│
├─ MONTHLY (Day 1 of month): Progress report
│  ├─ Email: "Your AI visibility this month"
│  ├─ Include: Dashboard snapshot (key metrics)
│  ├─ Highlight: Top mention day, biggest win
│  ├─ CTA: "View full report in dashboard"
│  └─ Time spent: 1 min to read
│
├─ WEEKLY (Every Monday): Quick tips
│  ├─ Email: "This week's AI visibility tip"
│  ├─ Format: Short (150 words), actionable
│  ├─ Examples:
│  │  └─ "How to optimize FAQ for Claude responses"
│  │  └─ "3 brands getting more ChatGPT mentions (and why)"
│  │  └─ "The new Gemini feature that affects your visibility"
│  ├─ CTA: Usually "Learn more in docs" (low-pressure)
│  └─ Goal: Keep product top-of-mind, drive engagement
│
├─ EXPANSION OFFER (Every 60 days): Upsell
│  ├─ Email: "Ready to expand to 10 domains?"
│  ├─ Trigger: Customer has 1-3 domains, active usage
│  ├─ Subject: "Our customers with 5+ domains get 3x results"
│  ├─ Include: Case study + ROI calculation
│  ├─ Offer: "First month free if you upgrade this week"
│  └─ CTA: "Upgrade to Scale plan"
│
├─ EDUCATION (Bi-weekly): Feature deep-dive
│  ├─ Email: "Everything about [Feature]"
│  ├─ Include: Tutorial video (Loom, 3-5 min)
│  ├─ Advanced tips: How power users get maximum ROI
│  ├─ Examples: Customer success stories using this feature
│  └─ CTA: "Try this in your dashboard"
│
├─ COMMUNITY (Monthly): Social + webinar
│  ├─ Email: "Join us for a live Q&A on [topic]"
│  ├─ Invite: User-only webinar or group chat
│  ├─ RSVP: Simple calendar link
│  └─ Value: Learn from peers, share wins, Q&A with Apex team
│
├─ HEALTH CHECK (If inactivity detected): Re-engagement
│  ├─ Trigger: No login in 14 days
│  ├─ Email: "We noticed you haven't checked Apex lately"
│  ├─ Include: "Here's what you're missing" (new mentions, recommendations)
│  ├─ CTA: "View new insights" (direct dashboard link)
│  └─ If >30 days inactive: Escalate to success manager call
│
├─ REFERRAL (Quarterly): Get customer advocates
│  ├─ Email: "Know another brand that needs visibility?"
│  ├─ Include: "Refer a friend = 1 month free for both"
│  ├─ Make it easy: Unique referral link in dashboard
│  ├─ Social proof: "37 customers earned free months this quarter"
│  └─ CTA: "Copy your referral link"
│
└─ ANNIVERSARY (On renewal date): Celebrate + propose expansion
   ├─ Email: "Happy 1-year anniversary with Apex!"
   ├─ Include: Year-in-review stats (mentions tracked, recs completed, ROI)
   ├─ Celebrate: "You've been featured in 245 AI responses!"
   ├─ Propose: "Ready to triple your impact? Let's talk expansion"
   └─ CTA: "Schedule anniversary strategy call"

Churn Prevention Sequence (if cancellation initiated):
├─ Day 0 (immediately): "Wait—can we help?"
├─ Email: "Is something not working for you?"
├─ Include: "Respond and we'll help" (low-pressure support)
├─ Option: Chat or call to troubleshoot
└─ Offer: "3-month special if you stay"
```

---

## PART 5: ADMIN DASHBOARD INTEGRATION SPEC

### Marketing Dashboard Components (In Apex Admin)

**Section 1: Campaign Overview**
```
┌─────────────────────────────────────────────────────────┐
│ Campaign Performance (Real-time)                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ LinkedIn Campaign: "AI Visibility Awareness"            │
│ └─ Impressions: 45,230 | Engagements: 3,421 (7.6%)   │
│ └─ Click-through: 240 | Cost/Lead: R42                 │
│ └─ Status: 🟢 Active (Est. 850 MQLs this month)        │
│                                                          │
│ Email Sequence: "Free Trial Welcome"                    │
│ └─ Sent: 2,145 | Opened: 1,287 (60%) | Clicked: 287   │
│ └─ Trial conversion: 82 (28.6% → 12 paying customers)  │
│ └─ Status: 🟢 Active                                    │
│                                                          │
│ TikTok/Reels: "AI Search 101 Series"                   │
│ └─ Total views: 125K | Avg watch: 8 seconds             │
│ └─ Engagement: 4,250 (3.4%) | Link clicks: 180         │
│ └─ Status: 🟢 Active (viral potential)                  │
│                                                          │
│ Content: Blog + Landing pages                           │
│ └─ Organic traffic: 8,420 | Trial signups: 120         │
│ └─ Blog posts ranking: Top 3 positions (3 keywords)    │
│ └─ Status: 🟢 Active (passive lead gen)                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Section 2: Lead Funnel Visualization**
```
┌─────────────────────────────────────────────────────────┐
│ Lead Funnel (This Month)                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Awareness:       15,000 impressions (LinkedIn, organic) │
│     ↓ 28% click                                         │
│ Website visit:    4,200 visitors                        │
│     ↓ 32% email signup                                  │
│ Email list:       1,340 subscribers (new)               │
│     ↓ 45% clicked email                                 │
│ Engaged lead:       602 (watched video, downloaded)     │
│     ↓ 60% requested demo/trial                          │
│ MQL (Marketing Qualified): 361                          │
│     ↓ 35% accepted sales call                           │
│ SQL (Sales Qualified):      126                         │
│     ↓ 28% converted to trial                            │
│ Trial started:              35                          │
│     ↓ 31% upgraded to paid                              │
│ New Customers:              11                          │
│                                                          │
│ Conversion Rate: 15,000 → 11 customers = 0.07%          │
│ Average Cost per Lead (CAC): R1,800                     │
│ Payback Period: 2.4 months (with R750/month LTV)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Section 3: Content & Campaign Management**
```
┌─────────────────────────────────────────────────────────┐
│ Content Calendar & Publishing Hub                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Create New Content]  [Schedule Post]  [View Calendar]  │
│                                                          │
│ DRAFT (Ready to publish):                               │
│ ├─ LinkedIn: "Why AI search matters in 2026" (Thread)  │
│ │   └─ [Preview] [Edit] [Publish Now] [Schedule]       │
│ │   └─ Target: 45K impressions, 8% engagement          │
│ │                                                       │
│ ├─ TikTok: "Your brand in ChatGPT vs Google" (60sec)   │
│ │   └─ [Preview] [Edit] [Publish] [Post to all]        │
│ │   └─ Auto-post to: TikTok, Reels, YouTube Shorts    │
│ │                                                       │
│ └─ Email: "Weekly AI visibility tip"                    │
│     └─ [Edit] [Preview] [Send Test] [Schedule Send]    │
│     └─ Recipients: 8,420 (active subscribers)           │
│                                                       │
│ SCHEDULED (Publishing automatically):                  │
│ ├─ Monday 9am: LinkedIn thread (+2,000 expected reach) │
│ ├─ Wednesday 12pm: TikTok video (+15K views exp.)      │
│ ├─ Friday 2pm: Email newsletter (+200 clicks exp.)    │
│ └─ Weekend: Reels compilation (+5K views exp.)         │
│                                                       │
│ PUBLISHED (Last 7 days):                              │
│ ├─ Jan 14: LinkedIn case study (2,450 impressions)    │
│ ├─ Jan 12: TikTok trend (22,100 views)                │
│ ├─ Jan 10: Email sequence 2/7 (1,200 opens)           │
│ └─ Jan 8: YouTube tutorial (840 views, 15% engaged)   │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

**Section 4: Lead Scoring & Pipeline**
```
┌─────────────────────────────────────────────────────────┐
│ Lead Scoring & Pipeline                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Lead Score Breakdown:                                   │
│ ├─ Behavioral (40%): Opened email, visited pricing    │
│ ├─ Engagement (30%): Watched video demo, clicked link │
│ ├─ Firmographic (20%): Company size, industry          │
│ └─ Intent (10%): Searched "AI visibility", visited 5x │
│                                                       │
│ PIPELINE VIEW:                                         │
│ ├─ 🔴 Cold (Score <40):        284 leads              │
│ │  └─ Action: Continue nurturing (email sequence)     │
│ │                                                    │
│ ├─ 🟠 Warm (Score 40-70):      158 leads             │
│ │  └─ Action: Retarget with webinar + demo offer     │
│ │                                                    │
│ ├─ 🟡 Hot (Score 70-85):        67 leads             │
│ │  └─ Action: Send free trial offer + sales follow-up│
│ │  └─ Expected conversions: 18-20 (27%)              │
│ │                                                    │
│ └─ 🟢 MQL (Score >85):          48 leads             │
│    └─ Action: Route to sales team for direct outreach│
│    └─ Expected conversions: 15-17 (35%)              │
│                                                       │
│ RECOMMENDED ACTIONS:                                  │
│ ├─ 🔴 Warm up 15 "Warm" leads (below 70 score)       │
│ ├─ 🟠 Follow up on 8 "Hot" leads (72h no response)   │
│ ├─ 🟡 Engage 3 "MQL" leads before they go cold       │
│ └─ 🟢 Analyze: Why did 24% of hot leads drop below 70?
│                                                       │
└─────────────────────────────────────────────────────────┘
```

**Section 5: Email Marketing Automation**
```
┌─────────────────────────────────────────────────────────┐
│ Email Marketing Hub                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Active Sequences:                                       │
│ ├─ Welcome Series (Day 0-7)                             │
│ │   └─ 1,340 total enrolled | 1,087 completed (81%)   │
│ │   └─ Avg open: 62% | Clicks: 8% | Unsubscribe: 0.2%│
│ │   └─ Action: Running smoothly, A/B test subject lines│
│ │                                                      │
│ ├─ Trial Onboarding (Day 1-28)                         │
│ │   └─ 247 enrolled | 168 active (68%) | 35 churned   │
│ │   └─ Status: Converting 28% to paid (target: 30%)   │
│ │   └─ Action: Improve Day 14 re-engagement email     │
│ │                                                      │
│ ├─ Customer Nurture (Ongoing)                          │
│ │   └─ 487 active customers receiving weekly emails    │
│ │   └─ Expansion offers: 12% conversion (upgrade)     │
│ │   └─ Churn prevention: 87% retention rate (target 95%)
│ │   └─ Action: Create new content for advanced users  │
│ │                                                      │
│ └─ Win-Back Campaign (Lapsed > 30 days)               │
│     └─ 126 archived customers targeted                 │
│     └─ Response rate: 8% | Re-activate: 4 customers   │
│     └─ Action: Improve win-back offer ($100 credit)   │
│                                                       │
│ PERFORMANCE METRICS:                                  │
│ ├─ Total emails sent (month): 18,240                 │
│ ├─ Average open rate: 38% (industry: 25%)            │
│ ├─ Average click rate: 6.2% (industry: 3%)           │
│ ├─ Unsubscribe rate: 0.3% (industry: 0.2%)           │
│ ├─ Spam complaints: 0.1% (industry: 0.1%)            │
│ └─ Conversion value: R124,000 (from email links)     │
│                                                       │
│ [Create New Sequence] [Edit Existing] [View Reports] │
│ [A/B Test Subject Lines] [Deliverability Check]     │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

**Section 6: Video & Content Analytics**
```
┌─────────────────────────────────────────────────────────┐
│ Video & Content Performance                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ TOP PERFORMING VIDEOS:                                 │
│ ├─ "Your brand disappeared from ChatGPT" (TikTok)      │
│ │   └─ Views: 124,300 | Likes: 4,200 | Shares: 580   │
│ │   └─ Conversion: 124 link clicks (0.1% → 12 trials) │
│ │   └─ Viral Score: 8/10 (high potential)             │
│ │                                                      │
│ ├─ Product Demo (YouTube, 6 min)                       │
│ │   └─ Views: 2,840 | Avg watch: 3m 24s (57% watched) │
│ │   └─ CTR to trial: 124 clicks (4.4% conversion)     │
│ │   └─ Comments: 38 (high engagement)                 │
│ │                                                      │
│ ├─ Customer Testimonial (LinkedIn, 90 sec)            │
│ │   └─ Views: 8,520 | Engagement: 620 (7.3%)         │
│ │   └─ Reach: 45K impressions (LinkedIn algorithm)    │
│ │   └─ Shares: 42 (viral indicator)                   │
│ │                                                      │
│ └─ Educational Series (YouTube, playlist)             │
│     └─ Total views: 24,100 | Subscribers gained: 520  │
│     └─ Watch time: 3,450 hours (target ranking)       │
│     └─ CTR overall: 2.8% (industry avg: 1.5%)         │
│                                                       │
│ CONTENT GAP ANALYSIS:                                │
│ ├─ ❌ Low engagement on: LinkedIn carousels (2.1%)   │
│ ├─ ✅ High engagement on: Short-form video (5-8%)    │
│ ├─ ⚠️ Need more: Behind-the-scenes content            │
│ └─ 📈 Double down: Customer success stories           │
│                                                       │
│ [Generate Next Batch] [View Scripts] [Edit]          │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

**Section 7: Attribution & ROI Tracking**
```
┌─────────────────────────────────────────────────────────┐
│ Attribution & ROI Analysis                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ REVENUE SOURCE (Last 30 days):                          │
│ ├─ LinkedIn (paid ads): R45,000 revenue                 │
│ │   └─ Cost: R8,200 | ROI: 5.5x | ROAS: 5.5           │
│ │                                                       │
│ ├─ Email (organic): R78,000 revenue                     │
│ │   └─ Cost: R2,400 | ROI: 32.5x | ROAS: 32.5        │
│ │   └─ (Email is highest ROI, allocate more budget)   │
│ │                                                       │
│ ├─ Organic/Blog: R52,000 revenue                        │
│ │   └─ Cost: R3,600 | ROI: 14.4x                       │
│ │   └─ (Compounding—gets better over time)            │
│ │                                                       │
│ ├─ TikTok (viral growth): R18,000 revenue              │
│ │   └─ Cost: R1,200 | ROI: 15x | ROAS: 15            │
│ │   └─ (High potential—scale budget)                  │
│ │                                                       │
│ ├─ Facebook/Instagram (paid): R12,000 revenue         │
│ │   └─ Cost: R6,400 | ROI: 1.9x | ROAS: 1.9         │
│ │   └─ (Lowest ROI—need to optimize creatives)       │
│ │                                                       │
│ └─ Direct/Referral: R28,000 revenue                    │
│     └─ Cost: R0 | ROI: ∞ | ROAS: ∞                    │
│     └─ (Viral loop working—build referral program)    │
│                                                       │
│ TOTAL: R233,000 revenue, R22,000 cost, 10.6x ROI     │
│                                                       │
│ BUDGET RECOMMENDATIONS:                               │
│ ├─ LinkedIn: Maintain (solid performer)               │
│ ├─ Email: +50% budget (best ROI at 32.5x)             │
│ ├─ TikTok: +100% budget (viral potential at 15x)      │
│ ├─ Organic: +25% budget (compound growth)             │
│ ├─ Facebook: -50% budget or overhaul creatives        │
│ └─ Referral: Launch ambassador program (cost: R0)    │
│                                                       │
│ FORECAST (Next 90 days):                              │
│ ├─ Current spend: R22K/month                          │
│ ├─ Optimized spend: R28K/month (+27%)                 │
│ ├─ Projected revenue: R850K+ (+265%)                  │
│ ├─ Customer acquisition: 42 new customers             │
│ └─ CAC: R667 | LTV: R15,000 | Payback: 1.3 months   │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## PART 6: IMPLEMENTATION TIMELINE & PHASED ROLLOUT

### Phase 1: Foundation (Weeks 1-4)
**Setup & Infrastructure**

```
Week 1: Tech Stack Deployment
├─ Set up Mautic (CRM + email marketing)
├─ Configure ListMonk (email sending + list management)
├─ Deploy Postiz (social media scheduling)
├─ Set up Matomo analytics
└─ Configure Zapier/Make for tool integrations

Week 2: Email & CRM Configuration
├─ Import existing contacts/email lists
├─ Create welcome sequence (7 emails)
├─ Set up lead scoring rules
├─ Configure automation triggers
└─ A/B test first email variations

Week 3: Content & Social Setup
├─ Create LinkedIn company page + schedule posts
├─ Set up Instagram/Facebook business accounts
├─ Create TikTok business account
├─ Schedule first batch of content (2 weeks)
└─ Configure hashtags + posting guidelines

Week 4: Dashboard & Reporting
├─ Build Apex admin marketing dashboard
├─ Set up real-time lead funnel tracking
├─ Configure conversion tracking (UTM parameters)
├─ Create monthly reporting templates
└─ Team training on new tools

**Go-live:** Start with soft launch to existing customer list
```

### Phase 2: Content Launch (Weeks 5-8)
**Ramp Up Content Production & Acquisition**

```
Week 5: Content Creation Sprint
├─ Film 20 short-form videos (TikTok, Reels)
├─ Write 8 LinkedIn threads (ready to schedule)
├─ Record 3 YouTube long-form videos
├─ Create 2 lead magnet PDFs (gated)
└─ Develop 4 customer case studies

Week 6: Email Campaigns Ramp-up
├─ Welcome sequence activated (500 new signups)
├─ Trial onboarding sequence live
├─ Customer nurture emails (1st segment)
├─ Perform initial A/B tests
└─ Optimize based on early results (open/click rates)

Week 7: Social Media Blitz
├─ Launch daily posting cadence (5 platforms)
├─ Start LinkedIn ads ($2K/week budget)
├─ Launch TikTok content strategy
├─ Engage in comments 2x daily
└─ Build organic following (target: 500+ followers/week)

Week 8: Optimization & Learnings
├─ Analyze first month of data
├─ Identify top-performing content types
├─ Pause low-performing ads
├─ Double down on winners
└─ Team retrospective + learnings doc

**Expected Results:**
├─ Email list growth: 1,000-1,500 new subscribers
├─ Social followers: 2,000-3,000 combined
├─ Website traffic: 2,500-3,500 visits
├─ MQLs generated: 150-200
└─ Trial signups: 30-40
```

### Phase 3: Sales Funnel Optimization (Weeks 9-16)
**Build Full Conversion Funnel**

```
Week 9-10: Landing Page & Lead Capture
├─ Create 3 high-converting landing pages
│  ├─ LP1: "Free AI Visibility Audit" (lead magnet)
│  ├─ LP2: "See How Competitors Beat You" (comparison)
│  └─ LP3: "Get Your GEO Score" (assessment tool)
├─ Set up gated content forms
├─ Implement thank-you pages with upsells
└─ Configure redirects + tracking

Week 11-12: Paid Campaign Launch
├─ LinkedIn ads: Expand to R5K/week budget
├─ Facebook/Instagram: Launch carousel + video ads
├─ Retargeting campaigns (website visitors)
├─ Lead magnet promotion across channels
└─ Track conversion cost per platform

Week 13-14: Sales Sequence Integration
├─ Connect Mautic to Salesforce/CRM
├─ Set up automated handoff to sales (score >80)
├─ Sales team training on MQL definition
├─ Create sales playbooks (objection handlers)
└─ Sales & marketing alignment meeting (weekly)

Week 15-16: Webinar Campaign
├─ Plan & promote 2 webinar series
├─ Record webinar (Loom, interactive via Zoom)
├─ Set up email sequence pre- and post-webinar
├─ Measure attendance + conversion rate
└─ Repurpose webinar content (YouTube, clips, blog)

**Expected Results:**
├─ Cost per lead: R1,200-1,500 (improve from R1,800)
├─ Email engagement: 35-40% open rate
├─ Trial conversion: 25-30% (improve from 20%)
├─ Demo booking rate: 35-40% of hot leads
└─ Trial-to-paid: 35-40% (improve from 28%)
```

### Phase 4: Scaling & Optimization (Weeks 17-26)
**Double Down on Winners + Build Systems**

```
Month 5: Scale Winning Channels
├─ LinkedIn: R10K/week budget (highest ROI)
├─ Email: Expand sequences + increase frequency
├─ YouTube: Publish 2x/week (build subscriber base)
├─ TikTok: Daily posting + trend-jacking
└─ Organic: Invest in SEO (hire freelance writer)

Month 6: Integrate Marketing into Apex Admin
├─ Add marketing metrics widget to Apex dashboard
├─ Show customer revenue attribution in admin
├─ Create team collaboration tools
├─ Build internal playbooks library
└─ Implement marketing approval workflows

Month 7: Expansion & Partnerships
├─ Build referral program (incentivize customers)
├─ Launch affiliate program (agencies, consultants)
├─ Partner with complementary tools (integrations)
├─ Create ambassador program (power users)
└─ Host quarterly virtual conference

**Expected Results by Month 7:**
├─ Monthly revenue from marketing: R250K-300K
├─ Total customers acquired: 85-100
├─ Customer acquisition cost: R900-1,100
├─ Customer lifetime value: R50K-80K
├─ Payback period: 1.5-2 months
└─ Annual recurring revenue (ARR): R3.5M-4M
```

---

## PART 7: KEY SUCCESS METRICS & TARGETS

### Marketing KPIs Dashboard

```
TIER 1: TOP-LINE GROWTH METRICS (Updated Daily)
┌────────────────────────────────────────────────────┐
│ Metric                 | Target | Current | Status │
├────────────────────────────────────────────────────┤
│ New customers/month    | 35-50  | 28     | 🟠    │
│ Revenue from marketing | R200K+ | R142K  | 🟠    │
│ CAC (Customer Acq Cost)| <R1.5K | R1.2K  | 🟢    │
│ LTV (Lifetime Value)   | >R50K  | R62K   | 🟢    │
│ Payback period         | <2mo   | 1.9mo  | 🟢    │
│ MQL to SQL conversion  | >35%   | 32%    | 🟠    │
└────────────────────────────────────────────────────┘

TIER 2: CHANNEL-SPECIFIC METRICS (Updated Weekly)
┌────────────────────────────────────────────────────┐
│ Channel        | Target ROAS | Current | Status    │
├────────────────────────────────────────────────────┤
│ LinkedIn Ads   | 4-5x        | 5.5x    | 🟢 Good  │
│ Email          | 25-30x      | 32.5x   | 🟢 Excl  │
│ Organic/Blog   | 10-15x      | 14.4x   | 🟢 Good  │
│ TikTok/Viral   | 12-15x      | 15x     | 🟢 Excl  │
│ Facebook/IG    | 2-3x        | 1.9x    | 🔴 Poor  │
│ Referrals      | ∞ (free)    | ∞       | 🟢 Excl  │
└────────────────────────────────────────────────────┘

TIER 3: ENGAGEMENT METRICS (Updated Weekly)
┌────────────────────────────────────────────────────┐
│ Platform/Channel       | Target | Current | Status │
├────────────────────────────────────────────────────┤
│ LinkedIn engagement    | 4-6%   | 5.2%   | 🟢    │
│ Email open rate        | 30-35% | 38%    | 🟢    │
│ Email click rate       | 5-8%   | 6.2%   | 🟢    │
│ TikTok engagement      | 4-6%   | 5.8%   | 🟢    │
│ YouTube watch time     | 50-60% | 57%    | 🟢    │
│ Blog time on page      | 2-3min | 2.8min | 🟢    │
│ Demo video CTR         | 3-5%   | 4.4%   | 🟢    │
└────────────────────────────────────────────────────┘

TIER 4: CONVERSION METRICS (Updated Monthly)
┌────────────────────────────────────────────────────┐
│ Funnel Stage           | Target | Current | Status │
├────────────────────────────────────────────────────┤
│ Awareness → Visit      | 25-30% | 28%    | 🟢    │
│ Visit → Email signup   | 30-35% | 32%    | 🟢    │
│ Signup → MQL           | 50-60% | 45%    | 🟠    │
│ MQL → SQL              | 30-40% | 32%    | 🟢    │
│ SQL → Trial            | 40-50% | 42%    | 🟢    │
│ Trial → Paid           | 25-35% | 28%    | 🟠    │
│ Overall: Awareness→Paid| 0.08%  | 0.07%  | 🟠    │
└────────────────────────────────────────────────────┘

TIER 5: CUSTOMER QUALITY METRICS (Updated Monthly)
┌────────────────────────────────────────────────────┐
│ Metric                 | Target | Current | Status │
├────────────────────────────────────────────────────┤
│ Trial completion rate  | 60-70% | 68%    | 🟢    │
│ Recommendations view   | 80%+   | 82%    | 🟢    │
│ First rec completion   | 50%+   | 52%    | 🟢    │
│ Monthly active users   | 70%+   | 72%    | 🟢    │
│ Churn rate             | <5%    | 3.2%   | 🟢    │
│ Net revenue retention  | >110%  | 112%   | 🟢    │
│ NPS (Net Promoter)     | >50    | 54     | 🟢    │
└────────────────────────────────────────────────────┘
```

---

## PART 8: BUDGET ALLOCATION & FINANCIAL PROJECTIONS

### Year 1 Marketing Budget

```
MONTHLY BREAKDOWN (Year 1):

Months 1-3: Launch Phase (R22K/month)
├─ LinkedIn Ads: R8K (focus: awareness)
├─ Email/CRM: R2K (Mautic hosting)
├─ Content creation: R6K (freelance writers, video)
├─ Tools & infrastructure: R4K (server, monitoring)
├─ Team: R2K (1 part-time manager)
└─ Contingency: R0K
Total: R22K/month × 3 = R66K

Months 4-6: Growth Phase (R35K/month)
├─ LinkedIn Ads: R12K (scale winning campaigns)
├─ Social ads (Fb/IG): R8K (new experiments)
├─ TikTok/Reels promotion: R4K
├─ Email/CRM: R2K
├─ Content creation: R5K (more videos, blog posts)
├─ Tools & infrastructure: R2K
├─ Team: R2K (1 part-time manager)
└─ Contingency: R0K
Total: R35K/month × 3 = R105K

Months 7-12: Scale Phase (R48K/month)
├─ LinkedIn Ads: R15K (scale winning campaigns)
├─ Other paid (Fb/IG, TikTok): R10K
├─ Webinars & events: R6K (hosting, promotion)
├─ Email/CRM: R2K
├─ Content creation: R8K (more videos, case studies)
├─ Tools & infrastructure: R3K (upgrade servers)
├─ Team: R3K (1 FTE marketing manager)
├─ Contingency: R1K
└─ Analytics/consulting: R0K
Total: R48K/month × 6 = R288K

YEAR 1 TOTAL MARKETING BUDGET: R459K

EXPECTED RETURN ON INVESTMENT:
├─ Year 1 customers acquired: ~120
├─ Average contract value: R12K (annual)
├─ Year 1 revenue from marketing: R1.44M
├─ Year 1 marketing spend: R459K
├─ Year 1 ROI: 214% (3.1x return)
│
├─ Year 2 customers: 350+ (compounding)
├─ Year 2 revenue: R4.2M+
├─ Year 2 payback period: 1.3 months
└─ Year 2+ CAC payback: <6 weeks
```

### ROI Projection by Channel (Year 1)

```
LinkedIn Ads: R120K spend → R660K revenue (5.5x ROI)
├─ Months 1-6: Launch brand, build credibility
├─ Months 7-12: Scale, optimize audiences
└─ Long-term: Sustained lead generation engine

Email Marketing: R24K spend → R780K revenue (32.5x ROI) 🏆
├─ Highest ROI channel
├─ Compounding value (list grows)
└─ Expand sequences in months 7-12

Organic/SEO: R72K spend → R1.04M revenue (14.4x ROI)
├─ Slower to start (months 1-3 lag)
├─ Accelerates over time
├─ Self-sustaining by month 6+

TikTok/Viral: R36K spend → R540K revenue (15x ROI)
├─ High variance (some videos flop, some viral)
├─ Best for brand awareness long-term
├─ Scale budget as win rate increases

Facebook/Instagram: R75K spend → R142K revenue (1.9x ROI) 🔴
├─ Lowest performing channel
├─ Consider pausing or rebranding
├─ Or: Hire better creative designer

Webinars/Events: R36K spend → R180K revenue (5x ROI)
├─ Lower volume but high-quality leads
├─ Best for bottom-funnel conversion
└─ Launch in month 7+

Total: R459K spend → R3.84M revenue (8.4x ROI)
```

---

## PART 9: TOOLS INTEGRATION SUMMARY

### Tech Stack Integration Map

```
┌──────────────────────────────────────────────────────────┐
│         APEX MARKETING TECHNOLOGY INTEGRATION             │
└──────────────────────────────────────────────────────────┘

LEVEL 1: DATA COLLECTION
┌─ Apex Customer Data (CRM)
│  ├─ User profiles, domains, engagement metrics
│  ├─ Stored: PostgreSQL (Neon)
│  └─ Accessed by: Mautic, Matomo, admin dashboard
│
├─ Matomo Analytics (Website & funnel tracking)
│  ├─ Tracks: Page views, form submissions, conversions
│  ├─ Integration: UTM parameters, pixel tracking
│  └─ Data sent to: Mautic (lead scoring), Apex dashboard
│
├─ Mautic (CRM & lead scoring)
│  ├─ Stores: Contact data, engagement history, lead scores
│  ├─ Tracks: Email opens, clicks, website visits
│  └─ Connected to: Apex DB, Zapier, email providers
│
└─ PostHog (Product analytics)
   ├─ Tracks: Feature usage, user cohorts, funnels
   ├─ Integration: JavaScript SDK on Apex
   └─ Data for: Product recommendations, churn prediction

LEVEL 2: MARKETING OPERATIONS
┌─ Mautic (CRM hub - central intelligence)
│  ├─ Receives data from: Matomo, PostHog, Apex DB
│  ├─ Sends to: Email provider (ListMonk), Zapier, dashboards
│  ├─ Capabilities: Segmentation, lead scoring, automation
│  └─ Integrations: 200+ via REST API
│
├─ ListMonk (Email delivery engine)
│  ├─ Receives: Segments from Mautic, broadcast lists
│  ├─ Sends: Emails to subscribers (1-2M/month capacity)
│  ├─ Tracks: Opens, clicks (reports back to Mautic)
│  └─ Integrations: Webhooks, API
│
├─ Postiz (Social media scheduler)
│  ├─ Receives: Content calendar from Apex admin
│  ├─ Publishes: LinkedIn, TikTok, Instagram, Facebook
│  ├─ Analytics: Impressions, engagements, clicks
│  └─ Tracks: UTM parameters for conversion tracking
│
├─ Zapier/Make (Automation layer)
│  ├─ Connects: Mautic ↔ Slack, Mautic ↔ Google Sheets
│  ├─ Enables: Notifications, reporting, data exports
│  └─ Used for: Lead alerts, daily digests, backup
│
└─ Loom (Product video creation)
   ├─ Creates: Personalized demo videos
   ├─ Tracks: Views, engagement time
   └─ Integration: Link in emails, landing pages

LEVEL 3: ANALYTICS & REPORTING
┌─ Matomo (Website analytics dashboard)
│  ├─ Reports: Traffic sources, conversion funnels, ROI
│  ├─ Integration: UTM tracking from all channels
│  └─ Exports: Weekly/monthly reports to Apex admin
│
├─ PostHog (Product analytics)
│  ├─ Reports: Feature adoption, user cohorts, retention
│  ├─ Segments: For targeted email campaigns
│  └─ Data: Feeds into marketing dashboards
│
├─ Apex Admin Dashboard (unified view)
│  ├─ Source: Mautic, Matomo, PostHog, custom queries
│  ├─ Shows: Funnel metrics, email stats, campaign ROI
│  ├─ Real-time: Lead scoring, pipeline visualization
│  └─ Action items: Recommended optimizations
│
└─ Google Data Studio / Superset (BI dashboards)
   ├─ Connects to: All data sources via APIs
   ├─ Reports: Executive dashboards, daily metrics
   └─ Automation: Email reports (daily/weekly)

LEVEL 4: ACTIVATION & CONVERSION
┌─ Webstudio / HeyForm (Landing pages & forms)
│  ├─ Creates: Gated assets, lead capture forms
│  ├─ Integrates: Forms → Mautic (lead capture)
│  └─ Tracking: Form submission → email sequence trigger
│
├─ Calendly (Meeting scheduling)
│  ├─ Embeds: In landing pages, emails, Loom videos
│  ├─ Captures: Meeting times + attendee info
│  └─ Integration: Zapier → Mautic (lead scoring boost)
│
└─ Stripe/Local Payment (Payment processing)
   ├─ Integration: Apex admin → payment page
   ├─ Triggers: Email confirmation + onboarding
   └─ Data: Revenue tracking for attribution

LEVEL 5: OPTIMIZATION & AI
┌─ Claude API (Content generation)
│  ├─ Generates: Email subject lines, LinkedIn posts, copy
│  ├─ Input: Brand voice guidelines, product info
│  └─ Output: Content → review → publish (Postiz)
│
├─ OpenSora / FFmpeg (Video generation)
│  ├─ Creates: Demo videos, explainer content from scripts
│  ├─ Integrates: Video → Loom for personalization
│  └─ Use: TikTok, YouTube, landing pages
│
└─ ML Engine (Lead scoring optimization)
   ├─ Learns: From past conversions + churn patterns
   ├─ Improves: Lead scoring accuracy over time
   └─ Output: Better MQL definition → sales efficiency

DATA FLOW DIAGRAM:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Website    │────▶│   Matomo     │────▶│   Mautic    │
│  Analytics  │     │  Analytics   │     │    CRM      │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                   ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
                   │  ListMonk   │    │   Postiz     │    │  Calendly   │
                   │   Email     │    │   Social     │    │  Meetings   │
                   └─────────────┘    └──────────────┘    └─────────────┘
                        │                     │
                        └─────────┬───────────┘
                                  ▼
                        ┌─────────────────────┐
                        │   Apex Admin        │
                        │   Dashboard         │
                        │  (unified view)     │
                        └─────────────────────┘
```

---

## CONCLUSION

This comprehensive marketing and sales workflow system for Apex provides:

✅ **Complete customer journey automation** (awareness → advocacy)
✅ **Open-source tech stack** reducing costs by 65-72% vs SaaS
✅ **Integration with Apex admin dashboard** for unified operations
✅ **Multi-platform social media strategy** (LinkedIn, Instagram, Facebook, TikTok)
✅ **Actionable email sequences** for every stage of the funnel
✅ **Real-time analytics and ROI tracking** by channel
✅ **Scalable infrastructure** supporting 100+ new customers/month

**Expected Year 1 Results:**
- 120+ new customers acquired
- R1.44M revenue from marketing
- 3.1x ROI on R459K marketing spend
- <2 month payback period per customer

**Next Steps:**
1. Week 1-2: Deploy tech stack
2. Week 3-4: Configure email automation + social scheduling
3. Week 5+: Launch content + paid campaigns
4. Ongoing: Monitor metrics + optimize funnels

---

**Document Owner:** Growth & Marketing Team
**Last Updated:** 2026-01-14
**Next Review:** 2026-02-14
