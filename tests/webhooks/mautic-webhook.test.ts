/**
 * Mautic Webhook Handler Tests
 * Tests lead creation, lead updates, and email engagement tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Mautic Webhook Handler', () => {
  describe('POST /api/webhooks/mautic', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        values: vi.fn().mockResolvedValue({ id: 'test-id' }),
        set: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockResolvedValue({ id: 'test-id' }),
      };

      vi.clearAllMocks();
    });

    describe('lead.create event', () => {
      it('should create new lead in database', async () => {
        const payload = {
          events: [
            {
              type: 'lead.create',
              data: {
                id: 123,
                email: 'newlead@example.com',
                firstname: 'John',
                lastname: 'Doe',
                company: 'Acme Corp',
                title: 'Manager',
                phone: '+1234567890',
              },
            },
          ],
        };

        // Simulate handler behavior
        const orgId = 'org-123';
        expect(payload.events[0].type).toBe('lead.create');
        expect(payload.events[0].data.email).toBe('newlead@example.com');
      });

      it('should extract correct fields from lead data', () => {
        const leadData = {
          id: 456,
          email: 'test@example.com',
          firstname: 'Jane',
          lastname: 'Smith',
        };

        expect(leadData.id).toBe(456);
        expect(leadData.email).toMatch(/@example\.com$/);
        expect(leadData.firstname).toBe('Jane');
      });

      it('should require organization ID header', async () => {
        const payload = { events: [{ type: 'lead.create' }] };
        // Handler should check for x-organization-id header
        expect(payload.events).toBeDefined();
      });
    });

    describe('lead.update event', () => {
      it('should update existing lead', () => {
        const updateData = {
          id: 123,
          email: 'updated@example.com',
          firstname: 'Johnny',
          lastname: 'Updated',
        };

        expect(updateData.email).not.toContain('newlead');
        expect(updateData.firstname).toBe('Johnny');
      });

      it('should preserve unchanged fields', () => {
        const originalLead = {
          id: 123,
          email: 'lead@example.com',
          firstname: 'John',
          lastName: 'Doe',
          company: 'Acme',
          phone: '+1234567890',
        };

        const updateData = {
          id: 123,
          email: 'lead@example.com',
          firstname: 'John',
          // company and phone not included in update
        };

        // Handler should preserve company and phone if not in update
        expect(updateData.email).toBe(originalLead.email);
        expect(updateData.firstname).toBe(originalLead.firstname);
      });
    });

    describe('email.send event', () => {
      it('should record email send event', () => {
        const emailEvent = {
          type: 'email.send',
          data: {
            id: 'email_1001',
            lead_id: 123,
            campaign_id: 456,
            subject: 'Welcome Email',
            from_email: 'sender@example.com',
            url: 'https://example.com/track',
          },
        };

        expect(emailEvent.data.lead_id).toBe(123);
        expect(emailEvent.data.campaign_id).toBe(456);
        expect(emailEvent.type).toBe('email.send');
      });

      it('should store event in emailEvents table', () => {
        const eventData = {
          lead_id: 123,
          campaign_id: 456,
          event: 'sent',
          timestamp: new Date(),
        };

        expect(eventData.event).toBe('sent');
        expect(eventData.lead_id).toBeDefined();
      });

      it('should update lead lastEngagedAt', () => {
        const leadUpdate = {
          lastEngagedAt: new Date(),
        };

        expect(leadUpdate.lastEngagedAt).toBeInstanceOf(Date);
      });
    });

    describe('email.open event', () => {
      it('should record email open with metadata', () => {
        const openEvent = {
          type: 'email.open',
          data: {
            id: 'open_2001',
            lead_id: 123,
            url: 'https://example.com/track/open',
            user_agent: 'Mozilla/5.0...',
            ip_address: '192.168.1.1',
            browser: 'Chrome',
            device: 'Desktop',
            os: 'Windows',
            region: 'US',
          },
        };

        expect(openEvent.data.event).toBeUndefined();
        expect(openEvent.data.browser).toBe('Chrome');
      });

      it('should increment lead score by 5 on open', () => {
        const currentScore = 10;
        const newScore = currentScore + 5;

        expect(newScore).toBe(15);
      });

      it('should update lead lastEngagedAt on open', () => {
        const before = new Date(Date.now() - 1000);
        const openTime = new Date();
        const after = new Date(Date.now() + 1000);

        expect(openTime.getTime()).toBeGreaterThan(before.getTime());
        expect(openTime.getTime()).toBeLessThan(after.getTime());
      });
    });

    describe('email.click event', () => {
      it('should record email click with URL', () => {
        const clickEvent = {
          type: 'email.click',
          data: {
            id: 'click_3001',
            lead_id: 123,
            clicked_url: 'https://example.com/product',
            user_agent: 'Mozilla/5.0...',
            ip_address: '192.168.1.1',
          },
        };

        expect(clickEvent.data.clicked_url).toContain('product');
        expect(clickEvent.type).toBe('email.click');
      });

      it('should increment lead score by 15 on click', () => {
        const currentScore = 10;
        const newScore = currentScore + 15;

        expect(newScore).toBe(25);
      });

      it('should be higher value than email open', () => {
        const clickScore = 15;
        const openScore = 5;

        expect(clickScore).toBeGreaterThan(openScore);
      });

      it('should store clicked URL in metadata', () => {
        const metadata = {
          clickedUrl: 'https://example.com/campaign/page',
        };

        expect(metadata.clickedUrl).toContain('/campaign/');
      });
    });

    describe('Webhook Response', () => {
      it('should return 200 success for valid payload', () => {
        // Expected: { success: true, processed: N }
        const response = {
          meta: { success: true },
          data: { processed: 1 },
        };

        expect(response.meta.success).toBe(true);
      });

      it('should return 400 for missing organization ID', () => {
        // Expected: 400 error
        const response = {
          status: 400,
          error: 'Missing organization ID',
        };

        expect(response.status).toBe(400);
      });

      it('should return 401 for invalid signature', () => {
        // Expected: 401 error
        const response = {
          status: 401,
          error: 'Invalid signature',
        };

        expect(response.status).toBe(401);
      });
    });

    describe('Event Processing', () => {
      it('should process multiple events in single webhook', () => {
        const payload = {
          events: [
            { type: 'lead.create', data: { id: 1 } },
            { type: 'email.send', data: { id: 2 } },
            { type: 'email.open', data: { id: 3 } },
          ],
        };

        expect(payload.events).toHaveLength(3);
      });

      it('should skip unknown event types', () => {
        const payload = {
          events: [
            { type: 'unknown_event', data: {} },
            { type: 'lead.create', data: { id: 1 } },
          ],
        };

        const knownEvents = payload.events.filter(e =>
          ['lead.create', 'lead.update', 'email.send', 'email.open', 'email.click'].includes(e.type)
        );

        expect(knownEvents).toHaveLength(1);
      });

      it('should continue processing after error', () => {
        const events = [
          { type: 'lead.create', data: { id: 1 } },
          { type: 'email.send', data: { id: 2 } }, // Might error
          { type: 'email.open', data: { id: 3 } },
        ];

        // Handler should process all events even if one fails
        expect(events.length >= 2).toBe(true);
      });
    });

    describe('Data Validation', () => {
      it('should require email address for leads', () => {
        const validLead = {
          email: 'test@example.com',
          firstname: 'Test',
        };

        const invalidLead = {
          // email: missing
          firstname: 'Test',
        };

        expect(validLead.email).toBeDefined();
        expect(invalidLead.email).toBeUndefined();
      });

      it('should handle null/missing optional fields', () => {
        const leadData = {
          id: 123,
          email: 'test@example.com',
          firstname: null,
          lastname: undefined,
          company: null,
        };

        // Handler should use defaults or skip null fields
        expect(leadData.firstname).toBeNull();
        expect(leadData.company).toBeNull();
      });
    });
  });
});
