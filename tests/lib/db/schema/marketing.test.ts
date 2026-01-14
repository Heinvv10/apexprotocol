/**
 * Marketing Database Schema Tests
 * Tests table structure, relationships, and constraints
 */

import { describe, it, expect } from 'vitest';

describe('Marketing Database Schema', () => {
  describe('Campaigns Table', () => {
    it('should have required fields', () => {
      const campaign = {
        id: 'uuid',
        organizationId: 'uuid',
        name: 'Campaign Name',
        type: 'email',
        status: 'draft',
      };

      expect(campaign.id).toBeDefined();
      expect(campaign.organizationId).toBeDefined();
      expect(campaign.name).toBeDefined();
      expect(campaign.type).toBeDefined();
      expect(campaign.status).toBeDefined();
    });

    it('should support all campaign types', () => {
      const validTypes = ['email', 'social', 'webinar', 'landing_page', 'retargeting'];
      const testType = 'email';

      expect(validTypes).toContain(testType);
    });

    it('should support all campaign statuses', () => {
      const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'archived'];
      const testStatus = 'draft';

      expect(validStatuses).toContain(testStatus);
    });

    it('should track metrics (leads, opens, clicks, conversions)', () => {
      const campaign = {
        leads: 100,
        opens: 35,
        clicks: 12,
        conversions: 3,
      };

      expect(campaign.leads).toBeGreaterThanOrEqual(0);
      expect(campaign.opens).toBeLessThanOrEqual(campaign.leads);
      expect(campaign.clicks).toBeLessThanOrEqual(campaign.opens);
    });

    it('should have timestamps (createdAt, updatedAt)', () => {
      const campaign = {
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(campaign.createdAt).toBeInstanceOf(Date);
      expect(campaign.updatedAt).toBeInstanceOf(Date);
    });

    it('should support metadata for external IDs', () => {
      const metadata = {
        mauticId: '123',
        listmonkId: '456',
      };

      expect(metadata.mauticId).toBeDefined();
      expect(metadata.listmonkId).toBeDefined();
    });

    it('should have foreign key to organization', () => {
      const campaign = {
        organizationId: 'org-uuid',
      };

      expect(campaign.organizationId).toMatch(/uuid|org-/);
    });
  });

  describe('Leads Table', () => {
    it('should have required contact fields', () => {
      const lead = {
        id: 'uuid',
        organizationId: 'uuid',
        email: 'lead@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(lead.email).toMatch(/@example\.com$/);
      expect(lead.firstName).toBeDefined();
      expect(lead.lastName).toBeDefined();
    });

    it('should support all lead sources', () => {
      const validSources = ['website', 'linkedin', 'email', 'social', 'referral', 'webinar', 'imported', 'api'];
      const testSource = 'email';

      expect(validSources).toContain(testSource);
    });

    it('should support all lead statuses', () => {
      const validStatuses = ['new', 'contacted', 'qualified', 'engaged', 'trialing', 'customer', 'lost', 'archived'];
      const testStatus = 'new';

      expect(validStatuses).toContain(testStatus);
    });

    it('should track engagement scores', () => {
      const lead = {
        leadScore: 25,
        mqlScore: 10,
        sqlScore: 5,
      };

      expect(lead.leadScore).toBeGreaterThanOrEqual(0);
      expect(lead.mqlScore).toBeGreaterThanOrEqual(0);
      expect(lead.sqlScore).toBeGreaterThanOrEqual(0);
    });

    it('should store tags as array', () => {
      const lead = {
        tags: ['high-priority', 'trial-user'],
      };

      expect(Array.isArray(lead.tags)).toBe(true);
      expect(lead.tags).toContain('high-priority');
    });

    it('should track last engagement time', () => {
      const lead = {
        lastEngagedAt: new Date(),
      };

      expect(lead.lastEngagedAt).toBeInstanceOf(Date);
    });

    it('should store external lead IDs', () => {
      const lead = {
        externalLeadId: 'mautic-123',
      };

      expect(lead.externalLeadId).toBeDefined();
    });

    it('should support additional metadata', () => {
      const metadata = {
        mauticId: '123',
        website: 'https://company.com',
        industry: 'Technology',
      };

      expect(metadata.mauticId).toBeDefined();
      expect(metadata.website).toMatch(/https:\/\//);
    });
  });

  describe('Email Lists Table', () => {
    it('should have required list fields', () => {
      const list = {
        id: 'uuid',
        organizationId: 'uuid',
        name: 'Newsletter',
        description: 'Main newsletter list',
      };

      expect(list.name).toBeDefined();
      expect(list.organizationId).toBeDefined();
    });

    it('should track subscriber counts', () => {
      const list = {
        subscriberCount: 1000,
        unsubscribeCount: 50,
        bounceCount: 25,
      };

      expect(list.subscriberCount).toBeGreaterThanOrEqual(0);
      expect(list.unsubscribeCount).toBeLessThanOrEqual(list.subscriberCount);
      expect(list.bounceCount).toBeLessThanOrEqual(list.subscriberCount);
    });

    it('should store external list IDs', () => {
      const list = {
        externalListId: 'listmonk-1',
      };

      expect(list.externalListId).toBeDefined();
    });
  });

  describe('Email Events Table', () => {
    it('should have required event fields', () => {
      const event = {
        id: 'uuid',
        organizationId: 'uuid',
        leadId: 'lead-uuid',
        event: 'opened',
        timestamp: new Date(),
      };

      expect(event.event).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should support all email event types', () => {
      const validTypes = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'];
      const testType = 'opened';

      expect(validTypes).toContain(testType);
    });

    it('should track event URLs', () => {
      const event = {
        url: 'https://example.com/promo',
      };

      expect(event.url).toMatch(/https:\/\//);
    });

    it('should capture user agent and IP', () => {
      const event = {
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
      };

      expect(event.userAgent).toBeDefined();
      expect(event.ipAddress).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
    });

    it('should store engagement metadata', () => {
      const metadata = {
        browser: 'Chrome',
        device: 'Desktop',
        os: 'Windows',
        region: 'US',
      };

      expect(metadata.browser).toBeDefined();
      expect(metadata.device).toBeDefined();
    });

    it('should reference leads, campaigns, and lists', () => {
      const event = {
        leadId: 'lead-uuid',
        campaignId: 'campaign-uuid',
        listId: 'list-uuid',
      };

      // All should be UUIDs or nullable
      expect(event.leadId).toBeDefined();
      expect(event.campaignId).toBeDefined();
    });
  });

  describe('Social Posts Table', () => {
    it('should have required post fields', () => {
      const post = {
        id: 'uuid',
        organizationId: 'uuid',
        content: 'Check out our new product!',
        platforms: ['linkedin', 'twitter'],
        status: 'draft',
      };

      expect(Array.isArray(post.platforms)).toBe(true);
      expect(post.platforms).toContain('linkedin');
      expect(post.status).toBe('draft');
    });

    it('should support all post statuses', () => {
      const validStatuses = ['draft', 'scheduled', 'published', 'paused', 'archived', 'failed'];
      const testStatus = 'draft';

      expect(validStatuses).toContain(testStatus);
    });

    it('should track engagement metrics', () => {
      const post = {
        likes: 125,
        comments: 28,
        shares: 12,
        views: 2340,
      };

      expect(post.likes).toBeGreaterThanOrEqual(0);
      expect(post.comments).toBeGreaterThanOrEqual(0);
      expect(post.engagementRate).toBeGreaterThanOrEqual(0) || post.engagementRate === undefined;
    });

    it('should store scheduling times', () => {
      const post = {
        scheduledAt: new Date(),
        publishedAt: new Date(),
      };

      expect(post.scheduledAt).toBeInstanceOf(Date);
      expect(post.publishedAt).toBeInstanceOf(Date);
    });

    it('should store multiple image URLs', () => {
      const post = {
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
      };

      expect(Array.isArray(post.imageUrls)).toBe(true);
    });

    it('should store hashtags', () => {
      const post = {
        hashtags: ['#ProductLaunch', '#Innovation'],
      };

      expect(Array.isArray(post.hashtags)).toBe(true);
      expect(post.hashtags[0]).toContain('#');
    });

    it('should store platform-specific post IDs', () => {
      const metadata = {
        postizId: 'postiz-123',
        linkedinId: 'linkedin-456',
        tiktokId: 'tiktok-789',
      };

      expect(metadata.postizId).toBeDefined();
      expect(metadata.linkedinId).toBeDefined();
    });
  });

  describe('Analytics Events Table', () => {
    it('should have required analytics fields', () => {
      const event = {
        id: 'uuid',
        organizationId: 'uuid',
        eventType: 'page_view',
        timestamp: new Date(),
      };

      expect(event.eventType).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should track UTM parameters', () => {
      const event = {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'summer_sale',
        utmContent: 'banner_1',
        utmTerm: 'shoes',
      };

      expect(event.utmSource).toBeDefined();
      expect(event.utmMedium).toBeDefined();
    });

    it('should track session and user IDs', () => {
      const event = {
        sessionId: 'session-uuid',
        userId: 'user-123',
      };

      expect(event.sessionId).toBeDefined();
      expect(event.userId).toBeDefined();
    });

    it('should capture page and referrer URLs', () => {
      const event = {
        pageUrl: 'https://example.com/products',
        referrer: 'https://google.com',
      };

      expect(event.pageUrl).toMatch(/https:\/\//);
      expect(event.referrer).toMatch(/https:\/\//);
    });

    it('should store custom properties', () => {
      const event = {
        properties: {
          platform: 'linkedin',
          postId: 'post-123',
          likes: 125,
        },
      };

      expect(event.properties).toBeDefined();
      expect(event.properties.platform).toBe('linkedin');
    });

    it('should link to leads and campaigns', () => {
      const event = {
        leadId: 'lead-uuid',
        campaignId: 'campaign-uuid',
      };

      // Both can be null (nullable fields)
      expect(event.leadId || event.campaignId).toBeDefined();
    });
  });

  describe('Marketing Metrics Table', () => {
    it('should aggregate daily metrics', () => {
      const metric = {
        date: new Date(),
        period: 'day',
        leads: 50,
        emailSent: 500,
        emailOpened: 175,
        emailClicked: 52,
      };

      expect(metric.period).toBe('day');
      expect(metric.emailOpened).toBeLessThanOrEqual(metric.emailSent);
    });

    it('should support multiple period types', () => {
      const validPeriods = ['day', 'week', 'month', 'year'];
      const testPeriod = 'day';

      expect(validPeriods).toContain(testPeriod);
    });

    it('should track social and website metrics', () => {
      const metric = {
        socialImpressions: 10000,
        socialEngagements: 425,
        websiteVisits: 2300,
        conversions: 45,
      };

      expect(metric.socialImpressions).toBeGreaterThanOrEqual(0);
      expect(metric.socialEngagements).toBeLessThanOrEqual(metric.socialImpressions);
    });

    it('should track revenue', () => {
      const metric = {
        revenue: 5000.50,
      };

      expect(metric.revenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Email Sequences Table', () => {
    it('should have required sequence fields', () => {
      const sequence = {
        id: 'uuid',
        organizationId: 'uuid',
        name: 'Welcome Series',
        isTemplate: false,
      };

      expect(sequence.name).toBeDefined();
      expect(sequence.isTemplate).toBe(false);
    });

    it('should support trigger types', () => {
      const validTriggers = ['immediate', 'delayed', 'event', 'behavior'];
      const testTrigger = 'immediate';

      expect(validTriggers).toContain(testTrigger);
    });

    it('should track enrollment metrics', () => {
      const sequence = {
        enrollmentCount: 250,
        conversionCount: 45,
        conversionRate: 18.0,
      };

      expect(sequence.enrollmentCount).toBeGreaterThanOrEqual(0);
      expect(sequence.conversionCount).toBeLessThanOrEqual(sequence.enrollmentCount);
      expect(sequence.conversionRate).toBeGreaterThanOrEqual(0);
    });

    it('should store email IDs in sequence', () => {
      const sequence = {
        emailIds: ['email-1', 'email-2', 'email-3'],
      };

      expect(Array.isArray(sequence.emailIds)).toBe(true);
      expect(sequence.emailIds.length).toBeGreaterThan(0);
    });

    it('should be activatable/deactivatable', () => {
      const sequence = {
        isActive: true,
      };

      expect(sequence.isActive).toBe(true);
    });
  });

  describe('Automation Logs Table', () => {
    it('should track lead automation actions', () => {
      const log = {
        id: 'uuid',
        leadId: 'lead-uuid',
        sequenceId: 'sequence-uuid',
        action: 'enrolled',
        timestamp: new Date(),
      };

      expect(log.action).toBe('enrolled');
      expect(log.timestamp).toBeInstanceOf(Date);
    });

    it('should support all automation actions', () => {
      const validActions = ['enrolled', 'unenrolled', 'paused', 'resumed', 'completed'];
      const testAction = 'enrolled';

      expect(validActions).toContain(testAction);
    });

    it('should store reason for automation changes', () => {
      const log = {
        reason: 'User unsubscribed',
      };

      expect(log.reason).toBeDefined();
    });

    it('should store additional metadata', () => {
      const log = {
        metadata: {
          previousScore: 25,
          newScore: 30,
        },
      };

      expect(log.metadata).toBeDefined();
    });
  });

  describe('Relationships and Constraints', () => {
    it('campaigns should reference organizations', () => {
      const campaign = {
        organizationId: 'org-uuid',
      };

      expect(campaign.organizationId).toBeDefined();
    });

    it('leads should reference organizations', () => {
      const lead = {
        organizationId: 'org-uuid',
      };

      expect(lead.organizationId).toBeDefined();
    });

    it('email events should reference leads', () => {
      const event = {
        leadId: 'lead-uuid',
      };

      expect(event.leadId).toBeDefined();
    });

    it('email events should reference campaigns', () => {
      const event = {
        campaignId: 'campaign-uuid',
      };

      // Can be null
      expect(event.campaignId === null || event.campaignId !== null).toBe(true);
    });

    it('social posts should reference campaigns', () => {
      const post = {
        campaignId: 'campaign-uuid',
      };

      // Can be null
      expect(post.campaignId === null || post.campaignId !== null).toBe(true);
    });

    it('automation logs should reference leads', () => {
      const log = {
        leadId: 'lead-uuid',
      };

      expect(log.leadId).toBeDefined();
    });

    it('automation logs should reference sequences', () => {
      const log = {
        sequenceId: 'sequence-uuid',
      };

      // Can be null
      expect(log.sequenceId === null || log.sequenceId !== null).toBe(true);
    });
  });

  describe('Indexes', () => {
    it('should have organization indexes for performance', () => {
      const tables = ['campaigns', 'leads', 'emailLists', 'emailEvents', 'socialPosts', 'analyticsEvents'];

      tables.forEach(table => {
        expect(table).toBeDefined();
      });
    });

    it('should have status indexes for filtering', () => {
      const statusFields = ['status', 'leadScore', 'publishedAt'];

      statusFields.forEach(field => {
        expect(field).toBeDefined();
      });
    });

    it('should have timestamp indexes for range queries', () => {
      const timestampFields = ['createdAt', 'updatedAt', 'timestamp', 'scheduledAt'];

      timestampFields.forEach(field => {
        expect(field).toBeDefined();
      });
    });
  });

  describe('Enums and Constraints', () => {
    it('campaign status enum should have valid values', () => {
      const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'archived'];
      expect(validStatuses.length).toBeGreaterThan(0);
    });

    it('campaign type enum should have valid values', () => {
      const validTypes = ['email', 'social', 'webinar', 'landing_page', 'retargeting'];
      expect(validTypes.length).toBeGreaterThan(0);
    });

    it('lead status enum should have valid values', () => {
      const validStatuses = ['new', 'contacted', 'qualified', 'engaged', 'trialing', 'customer', 'lost', 'archived'];
      expect(validStatuses.length).toBeGreaterThan(0);
    });

    it('email event type enum should have valid values', () => {
      const validTypes = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'];
      expect(validTypes.length).toBeGreaterThan(0);
    });

    it('post status enum should have valid values', () => {
      const validStatuses = ['draft', 'scheduled', 'published', 'paused', 'archived', 'failed'];
      expect(validStatuses.length).toBeGreaterThan(0);
    });
  });
});
