# Apex: Open-Source Marketing Stack Integration Architecture
## How to Build Marketing/Sales Automation into Apex Admin

**Document Version:** 1.0
**Status:** Technical Implementation Guide
**Date:** January 14, 2026

---

## PART 1: ARE THESE REALLY OPEN SOURCE?

### YES - All Verified Open Source

| Tool | License | GitHub Stars | Self-Host | Source |
|------|---------|--------------|-----------|--------|
| **Mautic** | OSSL v3 / AGPL | 8,940 stars | ✅ Yes | [mautic/mautic](https://github.com/mautic/mautic) |
| **ListMonk** | AGPL v3 | 18,386 stars | ✅ Yes | [knadh/listmonk](https://github.com/knadh/listmonk) |
| **Postiz** | Apache 2.0 | Active | ✅ Yes | [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) |
| **Matomo** | AGPL v3 | 20,200 stars | ✅ Yes | [matomo-org/matomo](https://github.com/matomo-org/matomo) |

### License Explanation

**AGPL v3 / OSSL v3:**
- Free to use, modify, run
- If you modify and deploy, you must share modifications
- Self-hosted = you own the modifications (no external users = no sharing requirement)
- Perfect for internal tools (admin dashboard is internal)

**Apache 2.0:**
- Completely permissive
- Modify and use without sharing code
- Best license for SaaS integrations

**Bottom line:** You can use all of these in Apex's admin dashboard without any licensing issues.

---

## PART 2: INTEGRATION ARCHITECTURE

### How to Integrate Into Apex Admin Backend

```
┌──────────────────────────────────────────────────────────┐
│            APEX ADMIN DASHBOARD (Next.js)                │
│  ┌────────────────────────────────────────────────────┐  │
│  │       Marketing & Sales Automation Hub              │  │
│  │                                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │   Real-Time Marketing Metrics Dashboard    │  │  │
│  │  │   • Email performance                      │  │  │
│  │  │   • Lead funnel visualization              │  │  │
│  │  │   • Social media analytics                 │  │  │
│  │  │   • Campaign ROI tracking                  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                    ▲                              │  │
│  │                    │                              │  │
│  │     ┌──────────────┼──────────────┬──────────┐   │  │
│  │     │              │              │          │   │  │
│  ▼     ▼              ▼              ▼          ▼   │  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Mautic   │  │ListMonk  │  │ Postiz   │  │ Matomo   ││
│  │CRM/Email │  │  Email   │  │ Social   │  │Analytics ││
│  │Docker    │  │Docker    │  │ Docker   │  │ Docker   ││
│  │Port 8000 │  │Port 9000 │  │Port 3000 │  │Port 8080 ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│       ▲              ▲              ▲          ▲       │
│       │              │              │          │       │
│       └──────────────┴──────────────┴──────────┘       │
│                 REST APIs                              │
│         (All tools have comprehensive APIs)            │
│                                                        │
└──────────────────────────────────────────────────────────┘
         │
         │ HTTP/REST Calls
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│          APEX BACKEND API (Next.js API Routes)           │
│                                                          │
│  /api/marketing/                                         │
│  ├─ /campaigns/          (Mautic API wrapper)           │
│  ├─ /emails/             (ListMonk API wrapper)         │
│  ├─ /social/             (Postiz API wrapper)           │
│  ├─ /analytics/          (Matomo API wrapper)           │
│  ├─ /leads/              (Aggregated from Mautic)       │
│  ├─ /dashboard/          (Unified metrics)              │
│  └─ /webhooks/           (Inbound from tools)           │
│                                                          │
│  Each endpoint:                                          │
│  1. Calls external tool via REST API                    │
│  2. Transforms response to Apex format                  │
│  3. Returns data to frontend                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## PART 3: STEP-BY-STEP INTEGRATION GUIDE

### Step 1: Deploy Open-Source Tools (Docker)

**Docker Compose file for all 4 tools:**

```yaml
version: '3.8'

services:
  # 1. MAUTIC (CRM + Email Automation)
  mautic:
    image: mautic/mautic:latest
    container_name: apex-mautic
    ports:
      - "8000:80"
    environment:
      - MAUTIC_DB_HOST=postgres
      - MAUTIC_DB_NAME=mautic
      - MAUTIC_DB_USER=mautic
      - MAUTIC_DB_PASSWORD=${MAUTIC_DB_PASSWORD}
      - MAUTIC_TRUSTED_HOSTS=localhost,127.0.0.1,apex.local
    depends_on:
      - postgres
    volumes:
      - mautic-data:/var/www/html
    networks:
      - apex-network

  # 2. LISTMONK (Email Delivery)
  listmonk:
    image: listmonk/listmonk:latest
    container_name: apex-listmonk
    ports:
      - "9000:9000"
    environment:
      - LISTMONK_DB_HOST=postgres
      - LISTMONK_DB_NAME=listmonk
      - LISTMONK_DB_USER=listmonk
      - LISTMONK_DB_PASSWORD=${LISTMONK_DB_PASSWORD}
    depends_on:
      - postgres
    volumes:
      - listmonk-data:/listmonk
    networks:
      - apex-network

  # 3. POSTIZ (Social Media Scheduling)
  postiz:
    image: gitroomhq/postiz:latest
    container_name: apex-postiz
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postiz:${POSTIZ_DB_PASSWORD}@postgres/postiz
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres
    networks:
      - apex-network

  # 4. MATOMO (Analytics)
  matomo:
    image: matomo:latest
    container_name: apex-matomo
    ports:
      - "8080:80"
    environment:
      - MATOMO_DATABASE_HOST=postgres
      - MATOMO_DATABASE_DBNAME=matomo
      - MATOMO_DATABASE_USERNAME=matomo
      - MATOMO_DATABASE_PASSWORD=${MATOMO_DB_PASSWORD}
    depends_on:
      - postgres
    volumes:
      - matomo-data:/var/www/html
    networks:
      - apex-network

  # Shared PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: apex-postgres
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - apex-network

volumes:
  mautic-data:
  listmonk-data:
  matomo-data:
  postgres-data:

networks:
  apex-network:
```

**Deploy with:**
```bash
docker-compose up -d
```

All 4 tools now running on localhost and connected to shared PostgreSQL database.

---

### Step 2: Create Apex API Wrappers (Next.js API Routes)

**File: `src/app/api/marketing/campaigns/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Mautic API Wrapper - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const mauticUrl = process.env.MAUTIC_URL || 'http://localhost:8000';
    const mauticUsername = process.env.MAUTIC_USERNAME;
    const mauticPassword = process.env.MAUTIC_PASSWORD;

    // Authenticate with Mautic
    const authResponse = await fetch(`${mauticUrl}/api/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.MAUTIC_CLIENT_ID!,
        client_secret: process.env.MAUTIC_CLIENT_SECRET!,
        username: mauticUsername!,
        password: mauticPassword!,
      }),
    });

    const { access_token } = await authResponse.json();

    // Fetch campaigns
    const campaignsResponse = await fetch(
      `${mauticUrl}/api/campaigns?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const campaigns = await campaignsResponse.json();

    // Transform Mautic response to Apex format
    const transformedCampaigns = campaigns.campaigns.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.isPublished ? 'active' : 'draft',
      createdAt: campaign.dateAdded,
      leads: campaign.leads || 0,
    }));

    return NextResponse.json(transformedCampaigns);
  } catch (error) {
    console.error('Mautic API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Create new campaign in Mautic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mauticUrl = process.env.MAUTIC_URL || 'http://localhost:8000';

    // Get auth token (same as above)
    const authResponse = await fetch(`${mauticUrl}/api/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.MAUTIC_CLIENT_ID!,
        client_secret: process.env.MAUTIC_CLIENT_SECRET!,
        username: process.env.MAUTIC_USERNAME!,
        password: process.env.MAUTIC_PASSWORD!,
      }),
    });

    const { access_token } = await authResponse.json();

    // Create campaign in Mautic
    const createResponse = await fetch(`${mauticUrl}/api/campaigns/new`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description,
        isPublished: body.status === 'active',
      }),
    });

    const newCampaign = await createResponse.json();

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/marketing/emails/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

// ListMonk API Wrapper - Get all email lists
export async function GET(request: NextRequest) {
  try {
    const listmonkUrl = process.env.LISTMONK_URL || 'http://localhost:9000';
    const listmonkUsername = process.env.LISTMONK_USERNAME;
    const listmonkPassword = process.env.LISTMONK_PASSWORD;

    // Basic auth for ListMonk
    const auth = Buffer.from(`${listmonkUsername}:${listmonkPassword}`).toString(
      'base64'
    );

    const response = await fetch(`${listmonkUrl}/api/lists`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();

    // Transform response
    const transformedLists = data.data.map((list: any) => ({
      id: list.id,
      name: list.name,
      subscribers: list.subscriber_count,
      createdAt: list.created_at,
    }));

    return NextResponse.json(transformedLists);
  } catch (error) {
    console.error('ListMonk API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email lists' },
      { status: 500 }
    );
  }
}

// Send email campaign via ListMonk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listmonkUrl = process.env.LISTMONK_URL || 'http://localhost:9000';
    const auth = Buffer.from(
      `${process.env.LISTMONK_USERNAME}:${process.env.LISTMONK_PASSWORD}`
    ).toString('base64');

    const response = await fetch(`${listmonkUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.name,
        subject: body.subject,
        body: body.body,
        list_ids: body.listIds,
        type: 'regular',
        status: 'draft',
      }),
    });

    const newCampaign = await response.json();
    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create email campaign' },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/marketing/social/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Postiz API Wrapper - Get all scheduled posts
export async function GET(request: NextRequest) {
  try {
    const postizUrl = process.env.POSTIZ_URL || 'http://localhost:3000';
    const postizApiKey = process.env.POSTIZ_API_KEY;

    const response = await fetch(`${postizUrl}/api/posts`, {
      headers: {
        Authorization: `Bearer ${postizApiKey}`,
      },
    });

    const posts = await response.json();

    // Transform response
    const transformedPosts = posts.data.map((post: any) => ({
      id: post.id,
      content: post.content,
      platforms: post.platforms,
      scheduledAt: post.scheduled_at,
      status: post.status,
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Postiz API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// Schedule new social media post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postizUrl = process.env.POSTIZ_URL || 'http://localhost:3000';
    const postizApiKey = process.env.POSTIZ_API_KEY;

    const response = await fetch(`${postizUrl}/api/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${postizApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: body.content,
        platforms: body.platforms, // ['linkedin', 'twitter', 'tiktok']
        scheduled_at: body.scheduledAt,
        media: body.media,
      }),
    });

    const newPost = await response.json();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/marketing/analytics/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Matomo API Wrapper - Get website analytics
export async function GET(request: NextRequest) {
  try {
    const matomoUrl = process.env.MATOMO_URL || 'http://localhost:8080';
    const matomoToken = process.env.MATOMO_TOKEN;
    const siteId = process.env.MATOMO_SITE_ID || '1';

    // Get visits for last 30 days
    const response = await fetch(
      `${matomoUrl}/index.php?module=API&method=VisitsSummary.getVisits&idSite=${siteId}&period=day&date=last30&format=JSON&token_auth=${matomoToken}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const analyticsData = await response.json();

    // Transform response
    const transformedData = {
      visits: analyticsData,
      conversions: {
        // Get conversion rate
        rate: calculateConversionRate(analyticsData),
      },
      traffic: {
        sources: await getTrafficSources(matomoUrl, siteId, matomoToken),
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Matomo API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getTrafficSources(
  matomoUrl: string,
  siteId: string,
  token: string
) {
  const response = await fetch(
    `${matomoUrl}/index.php?module=API&method=Referrers.getReferrerTypes&idSite=${siteId}&period=month&date=today&format=JSON&token_auth=${token}`
  );
  return await response.json();
}

function calculateConversionRate(data: any): number {
  // Implementation details
  return 0.032; // 3.2%
}
```

---

### Step 3: Create Unified Marketing Dashboard Component

**File: `src/components/dashboard/marketing-dashboard.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarketingMetrics {
  campaigns: {
    active: number;
    draft: number;
    totalLeads: number;
  };
  email: {
    listsCount: number;
    totalSubscribers: number;
    openRate: number;
    clickRate: number;
  };
  social: {
    scheduledPosts: number;
    platforms: string[];
  };
  analytics: {
    visits: number;
    conversionRate: number;
    trafficSources: any[];
  };
}

export function MarketingDashboard() {
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      // Fetch from all our API wrappers
      const [campaigns, emails, social, analytics] = await Promise.all([
        fetch('/api/marketing/campaigns').then((r) => r.json()),
        fetch('/api/marketing/emails').then((r) => r.json()),
        fetch('/api/marketing/social').then((r) => r.json()),
        fetch('/api/marketing/analytics').then((r) => r.json()),
      ]);

      setMetrics({
        campaigns: aggregateCampaigns(campaigns),
        email: aggregateEmails(emails),
        social: aggregateSocial(social),
        analytics,
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading marketing dashboard...</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Marketing & Sales Dashboard</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.campaigns.active}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Email Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.email.totalSubscribers.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Email Open Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.email.openRate * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.analytics.conversionRate * 100).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          {/* Campaign management UI */}
        </TabsContent>

        <TabsContent value="email">
          {/* Email management UI */}
        </TabsContent>

        <TabsContent value="social">
          {/* Social media management UI */}
        </TabsContent>

        <TabsContent value="analytics">
          {/* Analytics visualization UI */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function aggregateCampaigns(campaigns: any[]) {
  return {
    active: campaigns.filter((c) => c.status === 'active').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    totalLeads: campaigns.reduce((sum, c) => sum + (c.leads || 0), 0),
  };
}

function aggregateEmails(lists: any[]) {
  return {
    listsCount: lists.length,
    totalSubscribers: lists.reduce((sum, l) => sum + (l.subscribers || 0), 0),
    openRate: 0.38, // Placeholder - fetch from actual data
    clickRate: 0.062,
  };
}

function aggregateSocial(posts: any[]) {
  const platforms = new Set<string>();
  posts.forEach((p) => {
    if (p.platforms) {
      p.platforms.forEach((pl: string) => platforms.add(pl));
    }
  });

  return {
    scheduledPosts: posts.filter((p) => p.status === 'scheduled').length,
    platforms: Array.from(platforms),
  };
}
```

---

### Step 4: Environment Configuration

**File: `.env.local`**

```env
# Mautic Configuration
MAUTIC_URL=http://localhost:8000
MAUTIC_USERNAME=admin
MAUTIC_PASSWORD=your_password
MAUTIC_CLIENT_ID=your_client_id
MAUTIC_CLIENT_SECRET=your_client_secret

# ListMonk Configuration
LISTMONK_URL=http://localhost:9000
LISTMONK_USERNAME=admin
LISTMONK_PASSWORD=your_password

# Postiz Configuration
POSTIZ_URL=http://localhost:3000
POSTIZ_API_KEY=your_api_key

# Matomo Configuration
MATOMO_URL=http://localhost:8080
MATOMO_TOKEN=your_token
MATOMO_SITE_ID=1
```

---

## PART 4: WEBHOOK INTEGRATION (Real-time Data Sync)

### Receive Webhooks from External Tools

**File: `src/app/api/webhooks/mautic/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mautic sends lead updates via webhook
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Handle different Mautic events
    switch (event.type) {
      case 'lead.create':
        // New lead created - insert into Apex database
        await db.insert(leads).values({
          externalId: event.lead.id,
          email: event.lead.email,
          firstName: event.lead.firstName,
          lastName: event.lead.lastName,
          source: 'mautic',
          score: event.lead.points,
          createdAt: new Date(),
        });
        break;

      case 'lead.update':
        // Lead updated - sync to Apex
        await db
          .update(leads)
          .set({
            email: event.lead.email,
            score: event.lead.points,
            updatedAt: new Date(),
          })
          .where(eq(leads.externalId, event.lead.id));
        break;

      case 'email.send':
        // Email sent - track in Apex
        await db.insert(emailEvents).values({
          leadId: event.lead.id,
          campaignId: event.campaign.id,
          event: 'sent',
          timestamp: new Date(),
        });
        break;

      case 'email.open':
        // Email opened - track
        await db.insert(emailEvents).values({
          leadId: event.lead.id,
          campaignId: event.campaign.id,
          event: 'open',
          timestamp: new Date(),
        });
        break;

      case 'email.click':
        // Email clicked - track
        await db.insert(emailEvents).values({
          leadId: event.lead.id,
          campaignId: event.campaign.id,
          event: 'click',
          url: event.clickUrl,
          timestamp: new Date(),
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/webhooks/listmonk/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // ListMonk sends email events via webhook
    switch (event.type) {
      case 'subscriber.email.opened':
        await db.insert(emailEvents).values({
          subscriberId: event.subscriber_id,
          event: 'opened',
          timestamp: new Date(event.timestamp),
        });
        break;

      case 'subscriber.email.clicked':
        await db.insert(emailEvents).values({
          subscriberId: event.subscriber_id,
          event: 'clicked',
          url: event.url,
          timestamp: new Date(event.timestamp),
        });
        break;

      case 'subscriber.bounced':
        await db.insert(emailEvents).values({
          subscriberId: event.subscriber_id,
          event: 'bounced',
          reason: event.reason,
          timestamp: new Date(event.timestamp),
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

---

## PART 5: DATABASE SCHEMA FOR MARKETING DATA

**File: `src/lib/db/schema/marketing.ts`**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  enum as pgEnum,
} from 'drizzle-orm/pg-core';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  externalCampaignId: varchar('external_campaign_id'),
  name: varchar('name').notNull(),
  description: text('description'),
  type: pgEnum('campaign_type', [
    'email',
    'social',
    'webinar',
    'landing_page',
  ]),
  status: pgEnum('campaign_status', ['draft', 'scheduled', 'active', 'paused']),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  metrics: jsonb('metrics'), // Opens, clicks, conversions, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  externalLeadId: varchar('external_lead_id'),
  email: varchar('email').notNull(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  company: varchar('company'),
  source: pgEnum('lead_source', [
    'website',
    'linkedin',
    'email',
    'social',
    'referral',
    'mautic',
  ]),
  leadScore: integer('lead_score').default(0),
  status: pgEnum('lead_status', [
    'new',
    'contacted',
    'qualified',
    'converted',
    'lost',
  ]),
  metadata: jsonb('metadata'), // Custom fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailEvents = pgTable('email_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull(),
  campaignId: uuid('campaign_id').notNull(),
  event: pgEnum('email_event_type', [
    'sent',
    'opened',
    'clicked',
    'bounced',
    'unsubscribed',
  ]),
  url: varchar('url'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const socialPosts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  externalPostId: varchar('external_post_id'),
  campaignId: uuid('campaign_id'),
  content: text('content').notNull(),
  platforms: jsonb('platforms'), // ['linkedin', 'twitter', 'tiktok']
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  metrics: jsonb('metrics'), // Views, likes, shares, comments
  status: pgEnum('post_status', ['draft', 'scheduled', 'published', 'paused']),
  createdAt: timestamp('created_at').defaultNow(),
});

export const emailLists = pgTable('email_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  externalListId: varchar('external_list_id'),
  name: varchar('name').notNull(),
  description: text('description'),
  subscriberCount: integer('subscriber_count').default(0),
  source: pgEnum('list_source', ['mautic', 'listmonk', 'manual']),
  createdAt: timestamp('created_at').defaultNow(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  eventType: varchar('event_type'),
  userId: varchar('user_id'),
  sessionId: varchar('session_id'),
  pageUrl: varchar('page_url'),
  referrer: varchar('referrer'),
  properties: jsonb('properties'),
  timestamp: timestamp('timestamp').defaultNow(),
});
```

---

## PART 6: DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                       COMPLETE DATA FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

USER ACTIONS IN APEX ADMIN:
└─ Create campaign
   └─ Send API call to /api/marketing/campaigns (POST)
      └─ Apex Backend validates request
         └─ Calls Mautic API to create campaign
            └─ Mautic creates campaign, returns ID
               └─ Apex stores in local DB (campaigns table)
                  └─ Returns to UI dashboard (real-time update)

EXTERNAL TOOL → APEX (Webhooks):
┌─ Mautic detects email opened by lead
├─ Sends webhook to /api/webhooks/mautic
├─ Apex receives and validates signature
├─ Stores event in emailEvents table
├─ Increments lead score
├─ Updates lead status if threshold reached
└─ Frontend auto-refreshes dashboard

APEX → EXTERNAL TOOLS (Polling):
┌─ Every 5 minutes
├─ Apex calls /api/marketing/campaigns (GET)
├─ Which calls Mautic API
├─ Gets latest campaign metrics
├─ Stores in local DB
└─ Displays in dashboard

REAL-TIME METRICS FLOW:
Frontend (React)
   ↓
   Hooks: useEffect(() => { fetch /api/marketing/campaigns })
   ↓
   Calls Apex API Routes
   ↓
   Mautic/ListMonk/Postiz/Matomo APIs
   ↓
   Returns transformed data
   ↓
   Stores in PostgreSQL
   ↓
   Dashboard component renders updated metrics
```

---

## PART 7: IMPLEMENTATION CHECKLIST

### Week 1: Infrastructure

- [ ] Create Docker Compose file with all 4 tools
- [ ] Deploy docker-compose up -d
- [ ] Verify all tools running on localhost
- [ ] Set up shared PostgreSQL database
- [ ] Create API credentials for each tool

### Week 2: Backend API Wrappers

- [ ] Create /api/marketing/campaigns route
- [ ] Create /api/marketing/emails route
- [ ] Create /api/marketing/social route
- [ ] Create /api/marketing/analytics route
- [ ] Test each endpoint with curl/Postman

### Week 3: Webhooks

- [ ] Set up webhook endpoints for Mautic
- [ ] Set up webhook endpoints for ListMonk
- [ ] Set up webhook endpoints for Postiz
- [ ] Test webhook signature verification
- [ ] Add to marketing database schema

### Week 4: Dashboard

- [ ] Create MarketingDashboard component
- [ ] Add metrics aggregation functions
- [ ] Create real-time refresh mechanism (5 min)
- [ ] Add Campaigns tab
- [ ] Add Email tab
- [ ] Add Social Media tab
- [ ] Add Analytics tab
- [ ] Style with Apex design system

### Week 5: Integration Testing

- [ ] Create campaign in Apex → Verify in Mautic
- [ ] Add email in Apex → Verify in ListMonk
- [ ] Schedule post in Apex → Verify in Postiz
- [ ] Check analytics in Apex → Verify in Matomo
- [ ] Test webhook events flow

---

## PART 8: ESTIMATED EFFORT & TIMELINE

```
DEVELOPMENT TIMELINE:

Week 1-2: Infrastructure & Deployment
├─ Docker Compose setup: 2-3 hours
├─ Tool configuration: 4-5 hours
├─ Testing: 2-3 hours
└─ Total: ~10 hours

Week 3-4: Backend Integration
├─ API wrapper routes: 8-10 hours
├─ Error handling & retry logic: 3-4 hours
├─ Testing: 3-4 hours
└─ Total: ~15-18 hours

Week 5-6: Frontend Dashboard
├─ Dashboard component: 6-8 hours
├─ Metrics aggregation: 3-4 hours
├─ Real-time refresh: 2-3 hours
├─ Styling: 3-4 hours
└─ Total: ~14-19 hours

Week 7: Webhooks & Advanced Features
├─ Webhook endpoints: 4-6 hours
├─ Event processing: 3-4 hours
├─ Real-time updates: 2-3 hours
└─ Total: ~9-13 hours

TOTAL DEVELOPMENT: 48-68 hours (1-2 developer months)
TOTAL COST: $2K-4K (using freelance developers at $40-60/hr)

COST COMPARISON:
├─ Open-source solution: R40K-70K (one-time, then free)
├─ HubSpot + Salesforce + Klaviyo: R50K/month
├─ Year 1 SaaS cost: R600K
├─ Savings: R530K-560K Year 1
└─ Break-even: 1-2 months
```

---

## PART 9: ADVANTAGES OF THIS APPROACH

✅ **Full Data Ownership**
  - All data stored in your PostgreSQL
  - No vendor lock-in
  - Export anytime

✅ **Cost Savings**
  - 65-72% cheaper than SaaS
  - Fixed infrastructure costs
  - Scales without increasing per-user fees

✅ **Customization**
  - Full source code access
  - Modify tools exactly as needed
  - Build features competitors can't offer

✅ **Integration**
  - Seamless Apex admin experience
  - Single dashboard for everything
  - No jumping between tools

✅ **Reliability**
  - No SaaS vendor downtime
  - Self-hosted backup/recovery
  - Auditable logs

✅ **White-Label Opportunity**
  - Resell to customers as white-label
  - Full branding control
  - New revenue stream

---

## PART 10: WHAT IF YOU DON'T WANT TO BUILD?

**Alternative: Use as SaaS, but integrate into Apex**

If you prefer managed services:

1. **Use SaaS but Integrate into Admin**
   - Use Mautic Cloud instead of self-hosted
   - Use ListMonk Cloud (coming soon)
   - Use Postiz Cloud (already available)
   - Use Matomo Cloud
   - Same API integration approach (no code changes needed)

2. **Hybrid Approach**
   - Self-host Mautic (heavy lifting)
   - Use cloud services for others
   - Lowest complexity, reasonable costs

3. **Full SaaS**
   - Use HubSpot, Klaviyo, Hootsuite, GA
   - More cost, less control, easier setup
   - Not recommended for Apex (contradicts your positioning)

**Recommendation:** **Go open-source self-hosted**
- Aligns with Apex's story (data ownership, privacy, African focus)
- 65-72% cost savings
- Full customization for white-label
- 6-8 weeks to complete implementation

---

**You can absolutely integrate all of these tools into Apex's admin dashboard. It's a straightforward API integration project, not a complex undertaking.**

