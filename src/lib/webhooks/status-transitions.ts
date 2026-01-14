/**
 * Lead Status Transition Engine
 * Handles lead lifecycle state transitions based on engagement metrics
 * Statuses: new → contacted → qualified → engaged → trialing → customer/lost
 */

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'engaged' | 'trialing' | 'customer' | 'lost';

export interface LeadData {
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
export class LeadStatusTransitionEngine {
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

// Export singleton instance
export const leadStatusTransitionEngine = new LeadStatusTransitionEngine();
