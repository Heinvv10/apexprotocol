# APEX ADMIN OPERATIONS PRD v1.0
## PRD-ADMIN-006: Social Media Management

**Document Status**: APPROVED
**Version**: 1.0
**Last Updated**: 2026-01-15
**Phase**: Phase 5 (Social Media) - 2-3 weeks
**Scope**: Multi-platform posting, engagement tracking, algorithm monitoring, competitor tracking, analytics, Postiz integration

---

## 1. EXECUTIVE SUMMARY

The Social Media Management module enables marketing teams to manage social media presence across multiple platforms (LinkedIn, Twitter/X, Instagram, Facebook, YouTube). It provides post scheduling, engagement tracking, algorithm change detection, and competitor monitoring.

**Implemented Features**: 8 pages - Overview, Channels, Posting, Compose, Engagement, Analytics, Algorithm Monitoring, Competitor Tracking

**Full API Integration**: ✅ Complete with React hooks (useSocialAccounts, useSocialMentions, useSocialPosts, useSocialMetrics)

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
- Social media team cannot schedule posts across platforms
- No centralized engagement tracking
- Cannot detect algorithm changes that affect reach
- No competitor visibility tracking
- Analytics scattered across platforms

### 2.2 Business Goals
1. Schedule content across all social platforms from one place
2. Track engagement and respond to mentions quickly
3. Detect platform algorithm changes before they impact visibility
4. Monitor competitor social presence and performance
5. Measure social media ROI

### 2.3 Key Metrics
- Post scheduling efficiency: <5 min per post
- Response time to mentions: Target <1 hour
- Algorithm change detection: Within 24 hours
- Engagement rate: Track by platform
- Social ROI: Attribution to leads/customers

---

## 3. TARGET USERS

| Role | Primary Use Case |
|------|------------------|
| **Social Media Manager** | Schedule posts, monitor engagement, track competitors |
| **Content Creator** | Create posts, check performance, optimize timing |
| **Community Manager** | Respond to mentions, track sentiment |
| **Marketing Manager** | Monitor ROI, algorithm changes, strategy |

---

## 4. SCOPE & CONSTRAINTS

### 4.1 In Scope
- Social media channel management (LinkedIn, Twitter/X, Instagram, Facebook, YouTube)
- Multi-platform post composer with character limits
- Post scheduling and queue management
- Post performance tracking (views, likes, comments, shares)
- Engagement tracking (mentions, replies, sentiment analysis)
- Algorithm monitoring (detect platform behavior changes)
- Competitor tracking (monitor competitor accounts)
- Social media analytics dashboard
- Postiz integration for posting

### 4.2 Out of Scope
- Instagram Stories/Reels automation (Phase 6)
- TikTok integration (Phase 6)
- Social listening beyond mentions (Phase 6)
- Advanced sentiment AI (Phase 6)

### 4.3 Constraints
- Must integrate with Postiz API
- Post data in `social_posts` table
- Real-time updates via webhooks
- Character limits per platform enforced
- Performance: Post list <1s for 100+ posts

---

## 5. DETAILED REQUIREMENTS

### 5.1 Social Media Overview Page

**Path**: `/admin/social-media`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media                │
│ Title: "Social Media"                           │
│ Actions: [+ Compose Post] [Schedule]            │
├─ Stats Bar ─────────────────────────────────────┤
│ Total Posts: 245 | This Month: 45 | Scheduled: 12│
│ Total Engagement: 15.4k | Avg Engagement: 3.2% │
├─ Platform Overview (card-secondary) ────────────┤
│ LinkedIn:   1.2k followers | 4.5% engagement    │
│ Twitter/X:  3.5k followers | 2.8% engagement    │
│ Instagram:  2.1k followers | 5.2% engagement    │
│ Facebook:   1.8k followers | 3.1% engagement    │
│ YouTube:    850 subscribers | 12% engagement    │
├─ Recent Posts (card-tertiary) ──────────────────┤
│ Latest 5 posts with performance metrics          │
├─ Quick Actions ─────────────────────────────────┤
│ [Compose Post] [View Engagement] [Analytics]    │
└─────────────────────────────────────────────────┘
```

---

### 5.2 Channel Management Page

**Path**: `/admin/social-media/channels`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Channels     │
│ Title: "Social Media Channels"                  │
│ Actions: [+ Connect Channel] [Refresh All]      │
├─ Channel Cards (Grid) ──────────────────────────┤
│ ┌─ LinkedIn Card ───────────────────────────┐   │
│ │ LinkedIn                                  │   │
│ │ Status: Connected | Health: Good          │   │
│ │                                            │   │
│ │ Account: Apex Company Page                │   │
│ │ Followers: 1,245                          │   │
│ │ Posts This Month: 12                      │   │
│ │                                            │   │
│ │ Performance:                               │   │
│ │ • Avg Engagement: 4.5%                    │   │
│ │ • Best Time: 9-11 AM                      │   │
│ │ • Top Post: Product Launch (245 likes)    │   │
│ │                                            │   │
│ │ [View Analytics] [Settings] [Disconnect]  │   │
│ └───────────────────────────────────────────┘   │
│ (More platform cards: Twitter, Instagram, etc.)  │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Channel Cards**: One per connected platform
- **Connection Status**: Connected, Disconnected, Error
- **Platform Health**: API quota, posting status
- **Performance Metrics**: Followers, posts, engagement
- **Connect Channel**: OAuth flow for new platforms

**API Integration**: ✅ Full integration with `useSocialAccounts(brandId)` hook

---

### 5.3 Post Scheduling & Management Page

**Path**: `/admin/social-media/posting`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Posting      │
│ Title: "Social Posting"                         │
│ Actions: [+ Create Post]                        │
├─ Stats Bar ─────────────────────────────────────┤
│ Total: 245 | Scheduled: 12 | Published: 200    │
│ Drafts: 33                                      │
├─ Filters ───────────────────────────────────────┤
│ Status: [All / Scheduled / Published / Draft / Failed]│
│ Platform: [All / LinkedIn / Twitter / Instagram / Facebook / YouTube]│
├─ Post List ─────────────────────────────────────┤
│ ┌─ Post Card ───────────────────────────────┐   │
│ │ [LinkedIn Icon] LinkedIn                  │   │
│ │ [Scheduled Badge] in 2h                   │   │
│ │                                            │   │
│ │ Excited to announce our latest AI-        │   │
│ │ powered content optimization features! 🚀 │   │
│ │ Now you can automatically optimize...     │   │
│ │                                            │   │
│ │ Created: Jan 10 | By: Marketing Team      │   │
│ │                                            │   │
│ │ [View] [Edit] [Delete]                    │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ ┌─ Post Card (Published) ───────────────────┐   │
│ │ [Instagram Icon] Instagram                │   │
│ │ [Published Badge] 12h ago                 │   │
│ │                                            │   │
│ │ Behind the scenes: Our team building...   │   │
│ │                                            │   │
│ │ Engagement:                                │   │
│ │ • 287 likes | 45 comments                 │   │
│ │ • 12 shares | 5,432 views                 │   │
│ │                                            │   │
│ │ [View] [Analytics]                        │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Post List**: All posts (scheduled, published, draft, failed)
- **Filters**: Status, platform
- **Post Cards**: Show content preview and metrics
- **Bulk Actions**: Delete, reschedule multiple posts

**API Integration**: ✅ Full integration with `useSocialPosts(brandId)` hook

**Hydration Fix Applied**: ✅ Client-side number formatting to prevent SSR/CSR mismatch

---

### 5.4 Post Composer Page

**Path**: `/admin/social-media/compose`

**Layout** (Implemented as `PostComposer` component - 350 lines):
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Compose      │
│ Title: "Compose Post"                           │
├─ Main Composer (70%) ───────────────────────────┤
│                                                  │
│ ┌─ Platform Selection ─────────────────────┐    │
│ │ [LinkedIn✓] [Twitter✓] [Instagram] [Facebook]│ │
│ │ [YouTube]                                 │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌─ Content Editor ─────────────────────────┐    │
│ │ What would you like to share?            │    │
│ │                                           │    │
│ │ [____________________________________]    │    │
│ │ [____________________________________]    │    │
│ │ [____________________________________]    │    │
│ │                                           │    │
│ │ 245 characters remaining (Limit: 280)    │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌─ Media Upload (Coming Soon) ─────────────┐    │
│ │ [Image Icon] [Video Icon]                │    │
│ │ Media upload coming soon                  │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌─ Publishing Options ─────────────────────┐    │
│ │ [Post Now] [Schedule]                    │    │
│ │                                           │    │
│ │ IF Schedule:                              │    │
│ │ Date: [Jan 16, 2026]                     │    │
│ │ Time: [10:00 AM]                         │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ [Publish Now] [Schedule Post] [Save Draft]      │
│                                                  │
├─ Sidebar (30%) ─────────────────────────────────┤
│                                                  │
│ ┌─ Platform Tips ──────────────────────────┐    │
│ │ LinkedIn: Max 3,000 characters           │    │
│ │ Twitter/X: Max 280 characters            │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌─ Suggested Hashtags ─────────────────────┐    │
│ │ [#GEO] [#AEO] [#AIOptimization]         │    │
│ │ [#ContentMarketing] [#Innovation]        │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌─ Best Time to Post ──────────────────────┐    │
│ │ LinkedIn: 9-11 AM                        │    │
│ │ Twitter/X: 12-3 PM                       │    │
│ │ Instagram: 7-9 PM                        │    │
│ └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Platform Selection**: Multi-platform posting with visual toggles
- **Character Limits**: Real-time character counting per platform
- **Platform-Specific Limits**: LinkedIn (3000), Twitter (280), Instagram (2200), Facebook (63206), YouTube (5000)
- **Hashtag Suggestions**: Pre-configured list of relevant hashtags
- **Scheduling**: Immediate or scheduled posting
- **Best Time Recommendations**: Platform-specific optimal posting times
- **Media Upload**: Placeholder for future implementation

**Implementation**: ✅ Complete with `PostComposer` component (src/components/admin/post-composer.tsx)

---

### 5.5 Engagement Tracking Page

**Path**: `/admin/social-media/engagement`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Engagement   │
│ Title: "Social Engagement"                      │
│ Actions: [Mark All Read] [Export]               │
├─ Stats Bar ─────────────────────────────────────┤
│ Mentions: 45 | Replies: 23 | DMs: 12           │
│ Avg Response Time: 45 min | Sentiment: 82% Pos │
├─ Filters ───────────────────────────────────────┤
│ Type: [All / Mentions / Replies / DMs]         │
│ Platform: [All / LinkedIn / Twitter / ...]     │
│ Sentiment: [All / Positive / Neutral / Negative]│
│ Lead Status: [All / Captured / Pending]        │
├─ Engagement Feed ───────────────────────────────┤
│ ┌─ Mention Card ────────────────────────────┐   │
│ │ [LinkedIn Icon] John Doe mentioned you    │   │
│ │ [Positive Sentiment] 2h ago               │   │
│ │                                            │   │
│ │ "Great article on AI optimization! 🚀    │   │
│ │  We're seeing similar results..."          │   │
│ │                                            │   │
│ │ Lead Status: [Captured ✓]                │   │
│ │ Lead Score: 75                            │   │
│ │                                            │   │
│ │ [Reply] [Add to CRM] [Mark Read]         │   │
│ └───────────────────────────────────────────┘   │
│ (More mention cards...)                          │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Engagement Feed**: All mentions, replies, DMs
- **Sentiment Analysis**: Positive, neutral, negative
- **Lead Capture**: Convert mentions to CRM leads
- **Response Templates**: Quick replies
- **Filters**: Type, platform, sentiment, lead status

**API Integration**: ✅ Full integration with `useSocialMentions(brandId)` hook

---

### 5.6 Analytics Dashboard

**Path**: `/admin/social-media/analytics`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Analytics    │
│ Title: "Social Media Analytics"                 │
│ Actions: [Export Report] [Date Range]           │
├─ Overview Stats (card-secondary) ───────────────┤
│ ┌─ Total Reach ──┬─ Engagement ──┬─ Followers ──┐│
│ │ 45.2k          │ 3.2%          │ 9.7k         ││
│ │ +12% vs last   │ +0.5% vs last │ +245 this mo ││
│ └───────────────┴───────────────┴──────────────┘│
├─ Platform Breakdown (card-secondary) ───────────┤
│ Platform | Posts | Reach | Engagement | Followers│
│ ──────────────────────────────────────────────── │
│ LinkedIn │ 12    │ 12.4k │ 4.5%       │ 1.2k    │
│ Twitter  │ 25    │ 15.8k │ 2.8%       │ 3.5k    │
│ Instagram│ 18    │ 10.5k │ 5.2%       │ 2.1k    │
│ Facebook │ 8     │ 5.2k  │ 3.1%       │ 1.8k    │
│ YouTube  │ 2     │ 1.3k  │ 12.0%      │ 850     │
├─ Top Posts (card-tertiary) ─────────────────────┤
│ 1. Product Launch (LinkedIn) - 2.4k views       │
│ 2. Behind the Scenes (Instagram) - 1.8k views   │
│ 3. Tips & Tricks (Twitter) - 1.5k views         │
├─ Engagement Trends (card-secondary) ────────────┤
│ [Chart showing engagement rate over time]        │
└─────────────────────────────────────────────────┘
```

**API Integration**: ✅ Full integration with `useSocialMetrics(brandId)` hook

---

### 5.7 Algorithm Monitoring Page

**Path**: `/admin/social-media/algorithm-monitoring`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Algorithm    │
│ Title: "Algorithm Monitoring"                   │
│ Actions: [Refresh] [Alert Settings]             │
├─ Recent Changes Detected (card-secondary) ──────┤
│ ┌─ Algorithm Change ────────────────────────┐   │
│ │ LinkedIn Algorithm Update                 │   │
│ │ Detected: Jan 12, 2026                    │   │
│ │ Confidence: 87%                           │   │
│ │                                            │   │
│ │ Changes Detected:                          │   │
│ │ • Text posts: -15% reach                  │   │
│ │ • Video posts: +32% reach                 │   │
│ │ • Comments: +45% engagement weight        │   │
│ │                                            │   │
│ │ Recommendation: Increase video content    │   │
│ │ and prioritize comment engagement         │   │
│ └───────────────────────────────────────────┘   │
├─ Platform Status (card-secondary) ──────────────┤
│ LinkedIn: ⚠️ Recent Change (Jan 12)            │
│ Twitter/X: ✅ Stable                            │
│ Instagram: ✅ Stable                            │
│ Facebook: ⚠️ Recent Change (Jan 8)             │
│ YouTube: ✅ Stable                              │
├─ Best Practices (card-tertiary) ────────────────┤
│ Current Recommendations:                         │
│ • LinkedIn: Post videos 9-11 AM                 │
│ • Twitter: Thread format performing well         │
│ • Instagram: Reels getting 3x more reach        │
│ • Facebook: Focus on engagement in comments     │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Change Detection**: Aggregate data from customer base to detect algorithm changes
- **Platform Status**: Current status of each platform
- **Recommendations**: Actionable suggestions based on changes
- **Confidence Scoring**: How confident we are in detected changes

**Implementation**: ✅ Static data showing 4 detected platform changes

---

### 5.8 Competitor Tracking Page

**Path**: `/admin/social-media/competitor-tracking`

**Layout**:
```
┌─ Header ────────────────────────────────────────┐
│ Breadcrumb: Admin > Social Media > Competitors  │
│ Title: "Competitor Tracking"                    │
│ Actions: [+ Add Competitor] [Export]            │
├─ Share of Voice (card-secondary) ───────────────┤
│ Our Brand: 13.2% | Competitor A: 24.5%         │
│ Competitor B: 18.7% | Competitor C: 15.3%      │
│ Others: 28.3%                                   │
├─ Competitor Cards ──────────────────────────────┤
│ ┌─ Competitor A ────────────────────────────┐   │
│ │ TechCorp Inc                              │   │
│ │ Industry: SaaS | Category: Marketing      │   │
│ │                                            │   │
│ │ Social Presence:                           │   │
│ │ • LinkedIn: 12.5k followers               │   │
│ │ • Twitter: 25.4k followers                │   │
│ │ • Instagram: 8.2k followers               │   │
│ │                                            │   │
│ │ Activity:                                  │   │
│ │ • Posts This Month: 45                    │   │
│ │ • Avg Engagement: 4.8%                    │   │
│ │ • Most Active: LinkedIn                   │   │
│ │                                            │   │
│ │ Share of Voice: 24.5%                     │   │
│ │                                            │   │
│ │ [View Details] [Compare] [Remove]         │   │
│ └───────────────────────────────────────────┘   │
│ (More competitor cards...)                       │
└─────────────────────────────────────────────────┘
```

**Features**:
- **Competitor List**: Track specific competitors
- **Share of Voice**: Our mentions vs competitor mentions
- **Competitor Activity**: Posts, engagement, platforms
- **Performance Comparison**: Side-by-side metrics

**Implementation**: ✅ Shows 4 competitors with 13.2% share of voice for our brand

---

## 6. API REQUIREMENTS

### 6.1 Social Account APIs

**GET `/api/admin/social/accounts`**
```typescript
Response: {
  data: Array<{
    id: string
    platform: "linkedin" | "twitter" | "instagram" | "facebook" | "youtube"
    accountName: string
    status: "connected" | "disconnected" | "error"
    followers: number
    postsThisMonth: number
    avgEngagement: number
    healthStatus: "good" | "warning" | "error"
  }>
}
```

**API Integration**: ✅ Implemented with `useSocialAccounts(brandId)` hook

### 6.2 Social Post APIs

**GET `/api/admin/social/posts`**
```typescript
Query Parameters:
  - status?: "scheduled" | "published" | "draft" | "failed"
  - platform?: string
  - dateFrom?: ISO8601
  - dateTo?: ISO8601

Response: {
  data: Array<{
    id: string
    platform: string
    content: string
    mediaUrls: string[]
    status: string
    scheduledFor?: ISO8601
    publishedAt?: ISO8601
    engagement?: {
      likes: number
      comments: number
      shares: number
      views: number
    }
    author: string
    createdAt: ISO8601
  }>
}
```

**API Integration**: ✅ Implemented with `useSocialPosts(brandId)` hook

### 6.3 Social Mention APIs

**GET `/api/admin/social/mentions`**
```typescript
Response: {
  data: Array<{
    id: string
    platform: string
    author: string
    content: string
    sentiment: "positive" | "neutral" | "negative"
    leadStatus: "captured" | "pending" | "ignored"
    leadScore?: number
    timestamp: ISO8601
  }>
}
```

**API Integration**: ✅ Implemented with `useSocialMentions(brandId)` hook

### 6.4 Social Metrics APIs

**GET `/api/admin/social/metrics`**
```typescript
Response: {
  overview: {
    totalReach: number
    engagementRate: number
    totalFollowers: number
    growthRate: number
  }
  platforms: Array<{
    platform: string
    posts: number
    reach: number
    engagement: number
    followers: number
  }>
  topPosts: Array<{
    platform: string
    content: string
    views: number
    engagement: number
  }>
}
```

**API Integration**: ✅ Implemented with `useSocialMetrics(brandId)` hook

### 6.5 Postiz Integration

**POST `/api/integrations/postiz/posts`** (Create post)
**PUT `/api/integrations/postiz/posts/[id]`** (Update post)
**DELETE `/api/integrations/postiz/posts/[id]`** (Delete post)
**Webhook**: `/api/webhooks/postiz` (Already exists - receives events)

---

## 7. DATABASE SCHEMA

**Existing Tables**:
- `social_posts` - Post data, platform, content, engagement
- `platforms` - Postiz credentials and configuration

**Post Status Values**:
- `draft` - Created but not scheduled
- `scheduled` - Scheduled for future posting
- `published` - Successfully posted
- `failed` - Posting failed

**Platform Values**:
- `linkedin`, `twitter`, `instagram`, `facebook`, `youtube`

---

## 8. IMPLEMENTATION STATUS

### 8.1 Pages Implemented (8 pages)
✅ `/admin/social-media/page.tsx` - Overview
✅ `/admin/social-media/channels/page.tsx` - Channel management
✅ `/admin/social-media/posting/page.tsx` - Post list
✅ `/admin/social-media/compose/page.tsx` - Post composer
✅ `/admin/social-media/engagement/page.tsx` - Engagement tracking
✅ `/admin/social-media/analytics/page.tsx` - Analytics dashboard
✅ `/admin/social-media/algorithm-monitoring/page.tsx` - Algorithm monitoring
✅ `/admin/social-media/competitor-tracking/page.tsx` - Competitor tracking

### 8.2 Components Implemented
✅ `PostComposer` component (350 lines) - Full multi-platform composer with:
  - Platform selection (LinkedIn, Twitter, Instagram, Facebook, YouTube)
  - Character limit enforcement per platform
  - Scheduling (immediate or scheduled)
  - Hashtag suggestions
  - Best time recommendations
  - Draft saving

### 8.3 API Integration Status
✅ **Full API Integration Complete** with 4 React hooks:
- `useSocialAccounts(brandId)` - Channel management
- `useSocialMentions(brandId)` - Engagement tracking
- `useSocialPosts(brandId)` - Post management
- `useSocialMetrics(brandId)` - Analytics

✅ **Hydration Fix Applied**: Client-side number formatting in Posting page

---

## 9. SECURITY & COMPLIANCE

- All social data protected by org context
- OAuth tokens encrypted for platform credentials
- Post content moderation (manual approval)
- Rate limiting on API calls
- Audit log: Track all post creation/deletion

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- Character limit enforcement
- Platform-specific validation
- Scheduling logic
- Engagement calculation

### 10.2 Integration Tests
- Social account APIs work
- Post creation/scheduling works
- Postiz integration syncs
- Webhook events update metrics

### 10.3 E2E Tests (Playwright)
- Navigate to channels page
- Connect new channel
- Navigate to compose page
- Create and schedule post
- View post in posting list
- Check engagement page

---

## 11. ACCEPTANCE CRITERIA

**Channel Management**:
- [x] Shows all connected platforms
- [x] Platform health status accurate
- [x] Can connect new channels
- [x] Performance metrics display
- [x] API integration working

**Post Composer**:
- [x] Multi-platform selection works
- [x] Character limits enforced per platform
- [x] Scheduling works (immediate/scheduled)
- [x] Hashtag suggestions available
- [x] Draft saving works
- [x] PostComposer component fully functional

**Post Management**:
- [x] Post list shows all statuses
- [x] Filters work (status, platform)
- [x] Published posts show engagement
- [x] Can edit scheduled posts
- [x] API integration working
- [x] Hydration fix applied

**Engagement Tracking**:
- [x] Mentions display correctly
- [x] Sentiment analysis shown
- [x] Lead capture works
- [x] Filters work (platform, sentiment)
- [x] API integration working

**Analytics**:
- [x] Overview stats accurate
- [x] Platform breakdown displays
- [x] Top posts shown
- [x] Engagement trends chart
- [x] API integration working

---

## 12. TIMELINE & DEPENDENCIES

**Duration**: 2-3 weeks (Phase 5)

**Dependencies**:
- Admin layout (PRD-001) ✅
- Database with social_posts table ✅
- Postiz webhook handler ✅

**Blockers**: None

---

## 13. OPEN QUESTIONS

1. **Instagram Stories**: Should we support Stories/Reels? (Recommendation: Phase 6)
2. **TikTok Integration**: Should we add TikTok? (Recommendation: Phase 6 if market demands)
3. **AI Content Suggestions**: AI-powered post ideas? (Recommendation: Phase 6)

---

**Next PRD**: PRD-ADMIN-007 (Platform Monitoring - Phase 6)
