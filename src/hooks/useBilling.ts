/**
 * Billing Hooks (F175)
 * Wire Billing UI to Stripe Checkout
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useOrganizationId } from "@/stores/auth";

// =============================================================================
// Types
// =============================================================================

export type PlanId = "free" | "starter" | "professional" | "enterprise";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  limits: {
    brands: number;
    auditsPerMonth: number;
    mentionsPerMonth: number;
    teamMembers: number;
    apiRequests: number;
    storageGB: number;
  };
  popular?: boolean;
  stripePriceId?: {
    monthly: string;
    yearly: string;
  };
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account" | "paypal";
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      postalCode?: string;
    };
  };
}

export interface UsageMetrics {
  audits: { used: number; limit: number; resetAt: string };
  mentions: { used: number; limit: number; resetAt: string };
  apiRequests: { used: number; limit: number; resetAt: string };
  storage: { used: number; limit: number };
  teamMembers: { used: number; limit: number };
  brands: { used: number; limit: number };
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchPlans(): Promise<Plan[]> {
  const response = await fetch("/api/billing/plans");
  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }
  const data = await response.json();
  return data.plans || data;
}

async function fetchSubscription(orgId: string): Promise<Subscription | null> {
  const response = await fetch(`/api/billing/subscription?orgId=${orgId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch subscription");
  }
  return response.json();
}

async function fetchInvoices(orgId: string): Promise<Invoice[]> {
  const response = await fetch(`/api/billing/invoices?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch invoices");
  }
  const data = await response.json();
  return data.invoices || data;
}

async function fetchPaymentMethods(orgId: string): Promise<PaymentMethod[]> {
  const response = await fetch(`/api/billing/payment-methods?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch payment methods");
  }
  const data = await response.json();
  return data.paymentMethods || data;
}

async function fetchUsage(orgId: string): Promise<UsageMetrics> {
  const response = await fetch(`/api/billing/usage?orgId=${orgId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch usage");
  }
  return response.json();
}

// =============================================================================
// Plan Hooks
// =============================================================================

/**
 * Hook to fetch available plans
 */
export function usePlans(
  options?: Omit<UseQueryOptions<Plan[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

/**
 * Hook to fetch current subscription
 */
export function useSubscription(
  options?: Omit<UseQueryOptions<Subscription | null>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["billing", "subscription", orgId],
    queryFn: () => fetchSubscription(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch current plan details
 */
export function useCurrentPlan() {
  const { data: plans } = usePlans();
  const { data: subscription } = useSubscription();

  if (!subscription || !plans) {
    return { plan: null, subscription: null };
  }

  const plan = plans.find((p) => p.id === subscription.planId) || null;
  return { plan, subscription };
}

// =============================================================================
// Checkout & Subscription Hooks (F175)
// =============================================================================

/**
 * Hook to create Stripe checkout session
 */
export function useCreateCheckoutSession() {
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      planId,
      interval,
      successUrl,
      cancelUrl,
    }: {
      planId: PlanId;
      interval: BillingInterval;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval,
          successUrl: successUrl || `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: cancelUrl || `${window.location.origin}/settings/billing?canceled=true`,
          orgId,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create checkout session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

/**
 * Hook to upgrade/downgrade subscription
 */
export function useChangePlan() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      planId,
      interval,
    }: {
      planId: PlanId;
      interval?: BillingInterval;
    }) => {
      const response = await fetch("/api/billing/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval, orgId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to change plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "subscription", orgId],
      });
      queryClient.invalidateQueries({
        queryKey: ["billing", "usage", orgId],
      });
    },
  });
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async ({
      immediate = false,
      feedback,
    }: {
      immediate?: boolean;
      feedback?: string;
    } = {}) => {
      const response = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediate, feedback, orgId }),
      });
      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["billing", "subscription", orgId],
      });

      const previousSubscription = queryClient.getQueryData<Subscription>(
        ["billing", "subscription", orgId]
      );

      queryClient.setQueryData<Subscription | null>(
        ["billing", "subscription", orgId],
        (old) =>
          old
            ? { ...old, cancelAtPeriodEnd: true, canceledAt: new Date().toISOString() }
            : old
      );

      return { previousSubscription };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSubscription) {
        queryClient.setQueryData(
          ["billing", "subscription", orgId],
          context.previousSubscription
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "subscription", orgId],
      });
    },
  });
}

/**
 * Hook to resume canceled subscription
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/billing/subscription/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (!response.ok) {
        throw new Error("Failed to resume subscription");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "subscription", orgId],
      });
    },
  });
}

// =============================================================================
// Portal & Payment Method Hooks
// =============================================================================

/**
 * Hook to create Stripe billing portal session
 */
export function useCreatePortalSession() {
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: returnUrl || window.location.href,
          orgId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

/**
 * Hook to fetch payment methods
 */
export function usePaymentMethods(
  options?: Omit<UseQueryOptions<PaymentMethod[]>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["billing", "paymentMethods", orgId],
    queryFn: () => fetchPaymentMethods(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to set default payment method
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch("/api/billing/payment-methods/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId, orgId }),
      });
      if (!response.ok) {
        throw new Error("Failed to set default payment method");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "paymentMethods", orgId],
      });
    },
  });
}

/**
 * Hook to delete payment method
 */
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch(
        `/api/billing/payment-methods/${paymentMethodId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete payment method");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "paymentMethods", orgId],
      });
    },
  });
}

// =============================================================================
// Invoice Hooks
// =============================================================================

/**
 * Hook to fetch invoices
 */
export function useInvoices(
  options?: Omit<UseQueryOptions<Invoice[]>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["billing", "invoices", orgId],
    queryFn: () => fetchInvoices(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to download invoice PDF
 */
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/download`);
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

// =============================================================================
// Usage Hooks
// =============================================================================

/**
 * Hook to fetch usage metrics
 */
export function useUsageMetrics(
  options?: Omit<UseQueryOptions<UsageMetrics>, "queryKey" | "queryFn">
) {
  const orgId = useOrganizationId();

  return useQuery({
    queryKey: ["billing", "usage", orgId],
    queryFn: () => fetchUsage(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    ...options,
  });
}

/**
 * Hook to check if usage limit is reached
 */
export function useUsageLimitCheck() {
  const { data: usage } = useUsageMetrics();

  const isLimitReached = (metric: keyof UsageMetrics) => {
    if (!usage) return false;
    const m = usage[metric];
    return m.used >= m.limit;
  };

  const getUsagePercentage = (metric: keyof UsageMetrics) => {
    if (!usage) return 0;
    const m = usage[metric];
    return Math.round((m.used / m.limit) * 100);
  };

  const isApproachingLimit = (metric: keyof UsageMetrics, threshold = 80) => {
    return getUsagePercentage(metric) >= threshold;
  };

  return {
    usage,
    isLimitReached,
    getUsagePercentage,
    isApproachingLimit,
  };
}

// =============================================================================
// Trial & Promo Hooks
// =============================================================================

/**
 * Hook to start free trial
 */
export function useStartTrial() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (planId: PlanId) => {
      const response = await fetch("/api/billing/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, orgId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to start trial");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "subscription", orgId],
      });
    },
  });
}

/**
 * Hook to apply promo code
 */
export function useApplyPromoCode() {
  const queryClient = useQueryClient();
  const orgId = useOrganizationId();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/billing/promo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orgId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Invalid promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["billing", "subscription", orgId],
      });
    },
  });
}

/**
 * Hook to validate promo code
 */
export function useValidatePromoCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/billing/promo/validate?code=${code}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Invalid promo code");
      }
      return response.json();
    },
  });
}
