import { getUserId, getOrganizationId } from "@/lib/auth/clerk";
/**
 * Local Payments API (F136)
 * GET /api/billing/local-payments - Get providers, payments, status
 * POST /api/billing/local-payments - Create payment, handle webhooks, confirm EFT
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/supabase-server";
import { z } from "zod";
import {
  localPaymentManager,
  formatPaymentResponse,
  formatBankDetailsResponse,
  type LocalPaymentProvider,
  type Currency,
  type PaymentStatus,
  PPP_PRICING,
  LOCAL_PLAN_PRICES,
} from "@/lib/billing/local-payments";

const VALID_PROVIDERS: LocalPaymentProvider[] = ["snapscan", "ozow", "payfast", "eft"];
const VALID_CURRENCIES: Currency[] = ["ZAR", "USD", "EUR", "GBP", "NGN", "KES"];

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizationId = orgId || userId;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "providers";

    switch (action) {
      case "providers":
        return handleGetProviders(searchParams.get("currency") as Currency | null);

      case "payment": {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) {
          return NextResponse.json(
            { error: "paymentId is required" },
            { status: 400 }
          );
        }
        return handleGetPayment(paymentId, organizationId);
      }

      case "payments": {
        const status = searchParams.get("status");
        const provider = searchParams.get("provider") as LocalPaymentProvider | null;
        const limit = parseInt(searchParams.get("limit") || "50");
        return handleGetPayments(organizationId, { status, provider, limit });
      }

      case "pricing": {
        const currency = searchParams.get("currency") as Currency;
        return handleGetPricing(currency);
      }

      case "bankDetails": {
        const currency = searchParams.get("currency") as Currency;
        const reference = searchParams.get("reference");
        if (!currency || !reference) {
          return NextResponse.json(
            { error: "currency and reference are required" },
            { status: 400 }
          );
        }
        return handleGetBankDetails(currency, reference);
      }

      case "status": {
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) {
          return NextResponse.json(
            { error: "paymentId is required" },
            { status: 400 }
          );
        }
        return handleGetPaymentStatus(paymentId, organizationId);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: providers, payment, payments, pricing, bankDetails, status" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process local payments request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const orgId = await getOrganizationId();
    const body = await request.json();
    const action = body.action;

    // Webhooks don't require auth
    if (action === "webhook") {
      return handleWebhook(body);
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizationId = orgId || userId;

    switch (action) {
      case "configure":
        return handleConfigure(body);

      case "createPayment":
        return handleCreatePayment(organizationId, body);

      case "confirmEFT":
        return handleConfirmEFT(body);

      case "refund":
        return handleRefund(organizationId, body);

      case "cancel":
        return handleCancelPayment(organizationId, body);

      case "expirePending":
        return handleExpirePending();

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: configure, createPayment, confirmEFT, refund, cancel, webhook, expirePending" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Local payment operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handlers
function handleGetProviders(currency: Currency | null) {
  const providers = currency
    ? localPaymentManager.getProvidersForCurrency(currency)
    : VALID_PROVIDERS;

  const providerDetails = providers.map((provider) => {
    const info = localPaymentManager.getProviderInfo(provider);
    return {
      id: provider,
      name: info.name,
      supportedCurrencies: info.supportedCurrencies,
      minAmount: info.minAmount,
      maxAmount: info.maxAmount,
      expiryMinutes: info.expiryMinutes,
      configured: localPaymentManager.isConfigured(provider),
    };
  });

  return NextResponse.json({
    success: true,
    providers: providerDetails,
    supportedCurrencies: VALID_CURRENCIES,
  });
}

function handleGetPayment(paymentId: string, organizationId: string) {
  const payment = localPaymentManager.getPayment(paymentId);

  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  if (payment.organizationId !== organizationId) {
    return NextResponse.json(
      { error: "Unauthorized to access this payment" },
      { status: 403 }
    );
  }

  const isExpired = localPaymentManager.isPaymentExpired(paymentId);

  return NextResponse.json({
    success: true,
    payment: formatPaymentResponse(payment),
    isExpired,
    bankDetails: payment.provider === "eft" ? payment.metadata.bankDetails : undefined,
  });
}

function handleGetPayments(
  organizationId: string,
  options: { status: string | null; provider: LocalPaymentProvider | null; limit: number }
) {
  const payments = localPaymentManager.getPayments(organizationId, {
    status: options.status as PaymentStatus | undefined,
    provider: options.provider || undefined,
    limit: options.limit,
  });

  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    completed: payments.filter((p) => p.status === "completed").length,
    failed: payments.filter((p) => p.status === "failed").length,
    cancelled: payments.filter((p) => p.status === "cancelled").length,
  };

  return NextResponse.json({
    success: true,
    payments: payments.map(formatPaymentResponse),
    stats,
  });
}

function handleGetPricing(currency?: Currency) {
  if (currency && !VALID_CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { error: "Invalid currency" },
      { status: 400 }
    );
  }

  const pricingInfo = currency
    ? {
        currency,
        symbol: PPP_PRICING[currency].symbol,
        pppFactor: PPP_PRICING[currency].factor,
        plans: {
          starter: LOCAL_PLAN_PRICES.starter[currency] || LOCAL_PLAN_PRICES.starter.USD,
          pro: LOCAL_PLAN_PRICES.pro[currency] || LOCAL_PLAN_PRICES.pro.USD,
          enterprise: LOCAL_PLAN_PRICES.enterprise[currency] || LOCAL_PLAN_PRICES.enterprise.USD,
        },
      }
    : Object.fromEntries(
        VALID_CURRENCIES.map((curr) => [
          curr,
          {
            symbol: PPP_PRICING[curr].symbol,
            pppFactor: PPP_PRICING[curr].factor,
            plans: {
              starter: LOCAL_PLAN_PRICES.starter[curr] || LOCAL_PLAN_PRICES.starter.USD,
              pro: LOCAL_PLAN_PRICES.pro[curr] || LOCAL_PLAN_PRICES.pro.USD,
              enterprise: LOCAL_PLAN_PRICES.enterprise[curr] || LOCAL_PLAN_PRICES.enterprise.USD,
            },
          },
        ])
      );

  return NextResponse.json({
    success: true,
    pricing: pricingInfo,
    availableProviders: currency
      ? localPaymentManager.getProvidersForCurrency(currency)
      : VALID_PROVIDERS,
  });
}

function handleGetBankDetails(currency: Currency, reference: string) {
  if (!VALID_CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { error: "Invalid currency" },
      { status: 400 }
    );
  }

  const bankDetails = localPaymentManager.getEFTBankDetails(currency, reference);

  if (!bankDetails) {
    return NextResponse.json(
      { error: `EFT not available for currency ${currency}` },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    bankDetails: formatBankDetailsResponse(bankDetails),
    instructions: `Please transfer the amount to the account below using reference: ${bankDetails.reference}`,
  });
}

function handleGetPaymentStatus(paymentId: string, organizationId: string) {
  const payment = localPaymentManager.getPayment(paymentId);

  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  if (payment.organizationId !== organizationId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const isExpired = localPaymentManager.isPaymentExpired(paymentId);

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    status: payment.status,
    isExpired,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
    createdAt: payment.createdAt.toISOString(),
    completedAt: payment.completedAt?.toISOString(),
  });
}

// POST handlers
function handleConfigure(body: unknown) {
  const schema = z.object({
    provider: z.enum(VALID_PROVIDERS as [string, ...string[]]),
    merchantId: z.string().min(1),
    apiKey: z.string().min(1),
    apiSecret: z.string().optional(),
    webhookSecret: z.string().optional(),
    testMode: z.boolean().default(true),
  });

  const data = schema.parse(body);

  localPaymentManager.configure({
    provider: data.provider as LocalPaymentProvider,
    merchantId: data.merchantId,
    apiKey: data.apiKey,
    apiSecret: data.apiSecret,
    webhookSecret: data.webhookSecret,
    testMode: data.testMode,
  });

  return NextResponse.json({
    success: true,
    message: `${data.provider} configured successfully`,
    testMode: data.testMode,
  });
}

async function handleCreatePayment(organizationId: string, body: unknown) {
  const schema = z.object({
    provider: z.enum(VALID_PROVIDERS as [string, ...string[]]),
    amount: z.number().positive(),
    currency: z.enum(VALID_CURRENCIES as [string, ...string[]]),
    description: z.string().min(1).max(200),
    subscriptionId: z.string().optional(),
    planId: z.string().optional(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
    notifyUrl: z.string().url().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const data = schema.parse(body);

  const result = await localPaymentManager.createPayment(organizationId, {
    provider: data.provider as LocalPaymentProvider,
    amount: data.amount,
    currency: data.currency as Currency,
    description: data.description,
    subscriptionId: data.subscriptionId,
    planId: data.planId,
    successUrl: data.successUrl,
    cancelUrl: data.cancelUrl,
    notifyUrl: data.notifyUrl,
    metadata: data.metadata,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, success: false },
      { status: 400 }
    );
  }

  // Get full payment details if EFT
  let bankDetails;
  if (data.provider === "eft") {
    const payment = localPaymentManager.getPayment(result.paymentId);
    bankDetails = payment?.metadata?.bankDetails;
  }

  return NextResponse.json({
    success: true,
    paymentId: result.paymentId,
    reference: result.reference,
    paymentUrl: result.paymentUrl,
    qrCodeUrl: result.qrCodeUrl,
    status: result.status,
    bankDetails,
  });
}

async function handleConfirmEFT(body: unknown) {
  const schema = z.object({
    reference: z.string().min(1),
    confirmed: z.boolean(),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
  });

  const data = schema.parse(body);

  const result = await localPaymentManager.handleWebhook("eft", {
    reference: data.reference,
    confirmed: data.confirmed,
    transactionId: data.transactionId,
    notes: data.notes,
  });

  if (!result.handled) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    paymentId: result.paymentId,
    status: result.status,
    message: data.confirmed ? "Payment confirmed" : "Payment rejected",
  });
}

async function handleRefund(organizationId: string, body: unknown) {
  const schema = z.object({
    paymentId: z.string().min(1),
    amount: z.number().positive().optional(),
    reason: z.string().max(500).optional(),
  });

  const data = schema.parse(body);

  // Verify ownership
  const payment = localPaymentManager.getPayment(data.paymentId);
  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  if (payment.organizationId !== organizationId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const result = await localPaymentManager.requestRefund(
    data.paymentId,
    data.amount,
    data.reason
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, success: false },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    refundId: result.refundId,
    amount: result.amount,
    status: result.status,
  });
}

function handleCancelPayment(organizationId: string, body: unknown) {
  const schema = z.object({
    paymentId: z.string().min(1),
  });

  const data = schema.parse(body);

  const payment = localPaymentManager.getPayment(data.paymentId);

  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  if (payment.organizationId !== organizationId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  if (payment.status !== "pending") {
    return NextResponse.json(
      { error: "Can only cancel pending payments" },
      { status: 400 }
    );
  }

  const updated = localPaymentManager.updatePaymentStatus(
    data.paymentId,
    "cancelled"
  );

  return NextResponse.json({
    success: true,
    paymentId: updated?.id,
    status: updated?.status,
    message: "Payment cancelled",
  });
}

async function handleWebhook(body: unknown) {
  const schema = z.object({
    provider: z.enum(VALID_PROVIDERS as [string, ...string[]]),
    payload: z.record(z.string(), z.unknown()),
    signature: z.string().optional(),
  });

  const data = schema.parse(body);

  const result = await localPaymentManager.handleWebhook(
    data.provider as LocalPaymentProvider,
    data.payload,
    data.signature
  );

  return NextResponse.json({
    success: result.handled,
    paymentId: result.paymentId,
    status: result.status,
  });
}

function handleExpirePending() {
  const expiredCount = localPaymentManager.expirePendingPayments();

  return NextResponse.json({
    success: true,
    expiredCount,
    message: `${expiredCount} pending payments expired`,
  });
}
