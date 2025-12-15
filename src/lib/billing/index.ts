/**
 * Billing Module
 * Stripe integration, subscription management, usage metering for GEO/AEO platform
 *
 * F132: Stripe Integration
 * F133: Subscription Plans Backend
 * F134: Usage Metering Backend
 * F135: Customer Portal
 * F136: Local Payment Methods
 */

// F132-F135: Stripe Billing
export {
  StripeBillingManager,
  stripeBillingManager,
  SUBSCRIPTION_PLANS,
  formatSubscriptionResponse,
  formatPlanResponse,
  type PlanTier,
  type BillingCycle,
  type SubscriptionStatus,
  type UsageType,
  type SubscriptionPlan,
  type PlanLimits,
  type Subscription,
  type UsageRecord,
  type UsageEvent,
  type Invoice,
  type CheckoutSession,
  type PortalSession,
} from "./stripe";

// F136: Local Payment Methods
export {
  LocalPaymentManager,
  localPaymentManager,
  PPP_PRICING,
  LOCAL_PLAN_PRICES,
  formatPaymentResponse,
  formatBankDetailsResponse,
  type LocalPaymentProvider,
  type PaymentStatus,
  type Currency,
  type LocalPaymentConfig,
  type PaymentRequest,
  type PaymentResult,
  type RefundResult,
  type BankAccount,
} from "./local-payments";
