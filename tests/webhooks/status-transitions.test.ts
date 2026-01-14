/**
 * Lead Status Transition Tests (Phase M2)
 * Tests lead status changes based on engagement metrics and time-based rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Lead Status Lifecycle
 * new → contacted → qualified → engaged → trialing → customer/lost
 */
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'engaged' | 'trialing' | 'customer' | 'lost';

interface LeadData {
  id: string;
  status: LeadStatus;
  email: string;
  leadScore: number;
  mqlScore: number;
  sqlScore: number;
  lastEngagedAt: Date;
  createdAt: Date;
  daysInactive?: number;
}

/**
 * Lead Status Transition Engine
 * Handles state transitions based on engagement and behavioral rules
 */
class LeadStatusTransitionEngine {
  /**
   * Determine if lead should transition from 'new' to 'contacted'
   * Triggered when first email is sent or first contact is made
   */
  shouldTransitionToContacted(lead: LeadData): boolean {
    return lead.status === 'new' && lead.leadScore > 0;
  }

  /**
   * Determine if lead should transition to 'qualified'
   * Requires: MQL score >= 50 (indicates marketing qualification)
   */
  shouldTransitionToQualified(lead: LeadData): boolean {
    return (
      (lead.status === 'contacted' || lead.status === 'new') &&
      lead.mqlScore >= 50
    );
  }

  /**
   * Determine if lead should transition to 'engaged'
   * Requires: Consistent engagement over time, SQL score >= 50
   */
  shouldTransitionToEngaged(lead: LeadData): boolean {
    return (
      lead.status === 'qualified' &&
      lead.sqlScore >= 50 &&
      lead.lastEngagedAt &&
      this.getDaysSinceLastEngagement(lead) <= 7
    );
  }

  /**
   * Determine if lead should transition to 'trialing'
   * Triggered when lead signs up for trial/demo
   */
  shouldTransitionToTrialing(lead: LeadData, trialSignup: boolean): boolean {
    return (
      (lead.status === 'engaged' || lead.status === 'qualified') &&
      trialSignup
    );
  }

  /**
   * Determine if lead should transition to 'customer'
   * Triggered when subscription is activated
   */
  shouldTransitionToCustomer(lead: LeadData, subscriptionActive: boolean): boolean {
    return lead.status === 'trialing' && subscriptionActive;
  }

  /**
   * Determine if lead should transition to 'lost'
   * Rules: 30 days inactive, unsubscribed, or hard bounce
   */
  shouldTransitionToLost(
    lead: LeadData,
    isUnsubscribed: boolean,
    isHardBounce: boolean
  ): boolean {
    const daysInactive = this.getDaysSinceLastEngagement(lead);
    const thirtyDaysInactive = daysInactive >= 30;

    return (
      lead.status !== 'customer' &&
      lead.status !== 'lost' &&
      (thirtyDaysInactive || isUnsubscribed || isHardBounce)
    );
  }

  /**
   * Calculate days since last engagement
   */
  getDaysSinceLastEngagement(lead: LeadData): number {
    if (!lead.lastEngagedAt) {
      const daysSinceCreated = Math.floor(
        (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceCreated;
    }

    const daysSinceEngagement = Math.floor(
      (Date.now() - lead.lastEngagedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceEngagement;
  }

  /**
   * Execute transition and return new status
   */
  executeTransition(lead: LeadData): LeadStatus {
    // Check for lost status first (highest priority)
    if (this.shouldTransitionToLost(lead, false, false)) {
      return 'lost';
    }

    // Check for customer (goal state)
    if (this.shouldTransitionToCustomer(lead, false)) {
      return 'customer';
    }

    // Check for trialing
    if (this.shouldTransitionToTrialing(lead, false)) {
      return 'trialing';
    }

    // Check for engaged
    if (this.shouldTransitionToEngaged(lead)) {
      return 'engaged';
    }

    // Check for qualified
    if (this.shouldTransitionToQualified(lead)) {
      return 'qualified';
    }

    // Check for contacted
    if (this.shouldTransitionToContacted(lead)) {
      return 'contacted';
    }

    // No transition, keep current status
    return lead.status;
  }

  /**
   * Get all valid transitions from current status
   */
  getValidTransitions(currentStatus: LeadStatus): LeadStatus[] {
    const transitions: Record<LeadStatus, LeadStatus[]> = {
      new: ['contacted', 'qualified', 'lost'],
      contacted: ['qualified', 'engaged', 'lost'],
      qualified: ['engaged', 'trialing', 'lost'],
      engaged: ['trialing', 'lost'],
      trialing: ['customer', 'lost'],
      customer: [], // Customer is terminal state
      lost: [], // Lost is terminal state
    };

    return transitions[currentStatus] || [];
  }
}

describe('Lead Status Transitions', () => {
  let engine: LeadStatusTransitionEngine;
  let baseLead: LeadData;

  beforeEach(() => {
    engine = new LeadStatusTransitionEngine();
    vi.clearAllMocks();

    baseLead = {
      id: 'lead-123',
      status: 'new',
      email: 'lead@example.com',
      leadScore: 0,
      mqlScore: 0,
      sqlScore: 0,
      lastEngagedAt: new Date(),
      createdAt: new Date(),
    };
  });

  describe('Transition: new → contacted', () => {
    it('should transition to contacted when lead score > 0', () => {
      const lead = { ...baseLead, status: 'new' as LeadStatus, leadScore: 5 };
      expect(engine.shouldTransitionToContacted(lead)).toBe(true);
    });

    it('should not transition if lead score is 0', () => {
      const lead = { ...baseLead, status: 'new' as LeadStatus, leadScore: 0 };
      expect(engine.shouldTransitionToContacted(lead)).toBe(false);
    });

    it('should not transition if already contacted', () => {
      const lead = { ...baseLead, status: 'contacted' as LeadStatus, leadScore: 5 };
      expect(engine.shouldTransitionToContacted(lead)).toBe(false);
    });
  });

  describe('Transition: contacted/new → qualified', () => {
    it('should transition to qualified with MQL score >= 50', () => {
      const lead = {
        ...baseLead,
        status: 'contacted' as LeadStatus,
        mqlScore: 50,
      };
      expect(engine.shouldTransitionToQualified(lead)).toBe(true);
    });

    it('should transition from new to qualified directly', () => {
      const lead = {
        ...baseLead,
        status: 'new' as LeadStatus,
        mqlScore: 60,
      };
      expect(engine.shouldTransitionToQualified(lead)).toBe(true);
    });

    it('should not transition with MQL score < 50', () => {
      const lead = {
        ...baseLead,
        status: 'contacted' as LeadStatus,
        mqlScore: 49,
      };
      expect(engine.shouldTransitionToQualified(lead)).toBe(false);
    });

    it('should require exactly >= 50 for qualification', () => {
      const lead = {
        ...baseLead,
        status: 'contacted' as LeadStatus,
        mqlScore: 50,
      };
      expect(engine.shouldTransitionToQualified(lead)).toBe(true);
    });
  });

  describe('Transition: qualified → engaged', () => {
    it('should transition to engaged with SQL score >= 50 and recent engagement', () => {
      const lead = {
        ...baseLead,
        status: 'qualified' as LeadStatus,
        sqlScore: 50,
        lastEngagedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      };
      expect(engine.shouldTransitionToEngaged(lead)).toBe(true);
    });

    it('should not transition if SQL score < 50', () => {
      const lead = {
        ...baseLead,
        status: 'qualified' as LeadStatus,
        sqlScore: 49,
        lastEngagedAt: new Date(),
      };
      expect(engine.shouldTransitionToEngaged(lead)).toBe(false);
    });

    it('should not transition if last engagement > 7 days ago', () => {
      const lead = {
        ...baseLead,
        status: 'qualified' as LeadStatus,
        sqlScore: 50,
        lastEngagedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      };
      expect(engine.shouldTransitionToEngaged(lead)).toBe(false);
    });

    it('should transition if engagement is exactly 7 days old', () => {
      const lead = {
        ...baseLead,
        status: 'qualified' as LeadStatus,
        sqlScore: 50,
        lastEngagedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      };
      expect(engine.shouldTransitionToEngaged(lead)).toBe(true);
    });

    it('should require qualified status', () => {
      const lead = {
        ...baseLead,
        status: 'contacted' as LeadStatus,
        sqlScore: 50,
        lastEngagedAt: new Date(),
      };
      expect(engine.shouldTransitionToEngaged(lead)).toBe(false);
    });
  });

  describe('Transition: engaged/qualified → trialing', () => {
    it('should transition to trialing when trial signup occurs', () => {
      const lead = { ...baseLead, status: 'engaged' as LeadStatus };
      expect(engine.shouldTransitionToTrialing(lead, true)).toBe(true);
    });

    it('should transition from qualified to trialing on trial signup', () => {
      const lead = { ...baseLead, status: 'qualified' as LeadStatus };
      expect(engine.shouldTransitionToTrialing(lead, true)).toBe(true);
    });

    it('should not transition without trial signup', () => {
      const lead = { ...baseLead, status: 'engaged' as LeadStatus };
      expect(engine.shouldTransitionToTrialing(lead, false)).toBe(false);
    });

    it('should not transition from contacted status', () => {
      const lead = { ...baseLead, status: 'contacted' as LeadStatus };
      expect(engine.shouldTransitionToTrialing(lead, true)).toBe(false);
    });
  });

  describe('Transition: trialing → customer', () => {
    it('should transition to customer when subscription is active', () => {
      const lead = { ...baseLead, status: 'trialing' as LeadStatus };
      expect(engine.shouldTransitionToCustomer(lead, true)).toBe(true);
    });

    it('should not transition if subscription not active', () => {
      const lead = { ...baseLead, status: 'trialing' as LeadStatus };
      expect(engine.shouldTransitionToCustomer(lead, false)).toBe(false);
    });

    it('should not transition from non-trialing status', () => {
      const lead = { ...baseLead, status: 'engaged' as LeadStatus };
      expect(engine.shouldTransitionToCustomer(lead, true)).toBe(false);
    });
  });

  describe('Transition: any → lost', () => {
    it('should transition to lost after 30 days inactive', () => {
      const lead = {
        ...baseLead,
        status: 'engaged' as LeadStatus,
        lastEngagedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
      };
      expect(engine.shouldTransitionToLost(lead, false, false)).toBe(true);
    });

    it('should not transition before 30 days inactive', () => {
      const lead = {
        ...baseLead,
        status: 'engaged' as LeadStatus,
        lastEngagedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
      };
      expect(engine.shouldTransitionToLost(lead, false, false)).toBe(false);
    });

    it('should transition to lost on unsubscribe', () => {
      const lead = { ...baseLead, status: 'engaged' as LeadStatus };
      expect(engine.shouldTransitionToLost(lead, true, false)).toBe(true);
    });

    it('should transition to lost on hard bounce', () => {
      const lead = { ...baseLead, status: 'engaged' as LeadStatus };
      expect(engine.shouldTransitionToLost(lead, false, true)).toBe(true);
    });

    it('should not transition customer to lost', () => {
      const lead = { ...baseLead, status: 'customer' as LeadStatus };
      expect(engine.shouldTransitionToLost(lead, true, false)).toBe(false);
    });

    it('should not transition already lost leads', () => {
      const lead = {
        ...baseLead,
        status: 'lost' as LeadStatus,
        lastEngagedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      };
      expect(engine.shouldTransitionToLost(lead, true, true)).toBe(false);
    });
  });

  describe('Days Since Last Engagement Calculation', () => {
    it('should calculate days correctly when lastEngagedAt is set', () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const lead = { ...baseLead, lastEngagedAt: fiveDaysAgo };

      const days = engine.getDaysSinceLastEngagement(lead);
      expect(days).toBe(5);
    });

    it('should calculate from creation date if lastEngagedAt is null', () => {
      const now = new Date();
      const lead = {
        ...baseLead,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        lastEngagedAt: null as any,
      };

      const days = engine.getDaysSinceLastEngagement(lead);
      expect(days).toBe(3);
    });

    it('should handle same-day engagement', () => {
      const lead = { ...baseLead, lastEngagedAt: new Date() };
      const days = engine.getDaysSinceLastEngagement(lead);
      expect(days).toBe(0);
    });
  });

  describe('Execute Transition (Full Workflow)', () => {
    it('should progress through full lifecycle: new → contacted → qualified', () => {
      let lead: LeadData = {
        ...baseLead,
        status: 'new',
        leadScore: 10,
      };

      lead.status = engine.executeTransition(lead);
      expect(lead.status).toBe('contacted');

      lead.mqlScore = 50;
      lead.status = engine.executeTransition(lead);
      expect(lead.status).toBe('qualified');
    });

    it('should maintain status if no transition conditions met', () => {
      const lead = {
        ...baseLead,
        status: 'qualified' as LeadStatus,
        sqlScore: 0, // Not enough for engaged
      };

      const newStatus = engine.executeTransition(lead);
      expect(newStatus).toBe('qualified');
    });

    it('should prioritize lost status (highest priority)', () => {
      const lead = {
        ...baseLead,
        status: 'qualified' as LeadStatus,
        mqlScore: 100,
        sqlScore: 100,
        lastEngagedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
      };

      const newStatus = engine.executeTransition(lead);
      expect(newStatus).toBe('lost');
    });
  });

  describe('Valid Transitions Map', () => {
    it('should allow new → contacted, qualified, lost', () => {
      const transitions = engine.getValidTransitions('new');
      expect(transitions).toEqual(['contacted', 'qualified', 'lost']);
    });

    it('should allow contacted → qualified, engaged, lost', () => {
      const transitions = engine.getValidTransitions('contacted');
      expect(transitions).toEqual(['qualified', 'engaged', 'lost']);
    });

    it('should allow qualified → engaged, trialing, lost', () => {
      const transitions = engine.getValidTransitions('qualified');
      expect(transitions).toEqual(['engaged', 'trialing', 'lost']);
    });

    it('should allow engaged → trialing, lost', () => {
      const transitions = engine.getValidTransitions('engaged');
      expect(transitions).toEqual(['trialing', 'lost']);
    });

    it('should allow trialing → customer, lost', () => {
      const transitions = engine.getValidTransitions('trialing');
      expect(transitions).toEqual(['customer', 'lost']);
    });

    it('should have no valid transitions from customer (terminal)', () => {
      const transitions = engine.getValidTransitions('customer');
      expect(transitions).toEqual([]);
    });

    it('should have no valid transitions from lost (terminal)', () => {
      const transitions = engine.getValidTransitions('lost');
      expect(transitions).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined lastEngagedAt', () => {
      const lead = {
        ...baseLead,
        status: 'engaged' as LeadStatus,
        lastEngagedAt: undefined as any,
      };

      expect(() => engine.shouldTransitionToEngaged(lead)).not.toThrow();
    });

    it('should handle very high lead scores', () => {
      const lead = {
        ...baseLead,
        status: 'new' as LeadStatus,
        leadScore: 999999,
      };

      expect(engine.shouldTransitionToContacted(lead)).toBe(true);
    });

    it('should handle exact boundary: 30 days inactive', () => {
      const lead = {
        ...baseLead,
        status: 'engaged' as LeadStatus,
        lastEngagedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Exactly 30 days
      };

      expect(engine.shouldTransitionToLost(lead, false, false)).toBe(true);
    });

    it('should handle multiple simultaneous conditions', () => {
      const lead = {
        ...baseLead,
        status: 'engaged' as LeadStatus,
        mqlScore: 100,
        sqlScore: 100,
      };

      // Should remain engaged (no transition triggered)
      const newStatus = engine.executeTransition(lead);
      expect(newStatus).toBe('engaged');
    });
  });
});
