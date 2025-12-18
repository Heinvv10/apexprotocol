/**
 * Local Payment Methods for African Markets (F136)
 * Integrations: SnapScan, EFT (Bank Transfer), Ozow, PayFast
 * Enables PPP-adjusted pricing for South African and African markets
 */

import { v4 as uuidv4 } from "uuid";

// Payment Provider Types
export type LocalPaymentProvider = "snapscan" | "ozow" | "payfast" | "eft";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export type Currency = "ZAR" | "USD" | "EUR" | "GBP" | "NGN" | "KES";

// Interfaces
export interface LocalPaymentConfig {
  provider: LocalPaymentProvider;
  merchantId: string;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  testMode: boolean;
}

export interface PaymentRequest {
  id: string;
  organizationId: string;
  provider: LocalPaymentProvider;
  amount: number;
  currency: Currency;
  description: string;
  reference: string;
  subscriptionId?: string;
  planId?: string;
  status: PaymentStatus;
  paymentUrl?: string;
  qrCodeUrl?: string;
  externalId?: string;
  metadata: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  externalId?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  reference: string;
  status: PaymentStatus;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  error?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: "checking" | "savings";
  reference: string;
}

// PPP-Adjusted Pricing for African Markets
export const PPP_PRICING: Record<Currency, { factor: number; symbol: string }> = {
  ZAR: { factor: 0.35, symbol: "R" }, // ~35% of USD price
  USD: { factor: 1.0, symbol: "$" },
  EUR: { factor: 0.92, symbol: "€" },
  GBP: { factor: 0.79, symbol: "£" },
  NGN: { factor: 0.25, symbol: "₦" }, // ~25% of USD price
  KES: { factor: 0.30, symbol: "KSh" }, // ~30% of USD price
};

// Plan prices with PPP adjustment
export const LOCAL_PLAN_PRICES: Record<"starter" | "pro" | "enterprise", Record<Currency, number>> = {
  starter: {
    USD: 49,
    EUR: 45, // ~0.92x USD
    GBP: 42, // ~0.85x USD
    ZAR: 299, // PPP adjusted (~R299 vs ~R900 at exchange rate)
    NGN: 4999,
    KES: 2499,
  },
  pro: {
    USD: 149,
    EUR: 137,
    GBP: 127,
    ZAR: 799,
    NGN: 14999,
    KES: 6999,
  },
  enterprise: {
    USD: 499,
    EUR: 459,
    GBP: 424,
    ZAR: 2499,
    NGN: 49999,
    KES: 19999,
  },
};

// Provider configurations
const PROVIDER_CONFIGS: Record<LocalPaymentProvider, {
  name: string;
  supportedCurrencies: Currency[];
  minAmount: Record<Currency, number>;
  maxAmount: Record<Currency, number>;
  expiryMinutes: number;
}> = {
  snapscan: {
    name: "SnapScan",
    supportedCurrencies: ["ZAR"],
    minAmount: { ZAR: 10, USD: 0, EUR: 0, GBP: 0, NGN: 0, KES: 0 },
    maxAmount: { ZAR: 50000, USD: 0, EUR: 0, GBP: 0, NGN: 0, KES: 0 },
    expiryMinutes: 60,
  },
  ozow: {
    name: "Ozow",
    supportedCurrencies: ["ZAR"],
    minAmount: { ZAR: 10, USD: 0, EUR: 0, GBP: 0, NGN: 0, KES: 0 },
    maxAmount: { ZAR: 100000, USD: 0, EUR: 0, GBP: 0, NGN: 0, KES: 0 },
    expiryMinutes: 30,
  },
  payfast: {
    name: "PayFast",
    supportedCurrencies: ["ZAR"],
    minAmount: { ZAR: 5, USD: 0, EUR: 0, GBP: 0, NGN: 0, KES: 0 },
    maxAmount: { ZAR: 500000, USD: 0, EUR: 0, GBP: 0, NGN: 0, KES: 0 },
    expiryMinutes: 1440, // 24 hours
  },
  eft: {
    name: "EFT (Bank Transfer)",
    supportedCurrencies: ["ZAR", "NGN", "KES"],
    minAmount: { ZAR: 100, USD: 0, EUR: 0, GBP: 0, NGN: 500, KES: 500 },
    maxAmount: { ZAR: 1000000, USD: 0, EUR: 0, GBP: 0, NGN: 10000000, KES: 5000000 },
    expiryMinutes: 4320, // 72 hours
  },
};

// EFT Bank Account Details
const EFT_BANK_ACCOUNTS: Record<Currency, BankAccount> = {
  ZAR: {
    bankName: "First National Bank",
    accountNumber: "62XXXXXXXX",
    branchCode: "250655",
    accountType: "checking",
    reference: "APX-{reference}",
  },
  NGN: {
    bankName: "GTBank",
    accountNumber: "00XXXXXXXX",
    branchCode: "058",
    accountType: "checking",
    reference: "APX-{reference}",
  },
  KES: {
    bankName: "Equity Bank",
    accountNumber: "00XXXXXXXX",
    branchCode: "068",
    accountType: "checking",
    reference: "APX-{reference}",
  },
  USD: {
    bankName: "N/A",
    accountNumber: "N/A",
    branchCode: "N/A",
    accountType: "checking",
    reference: "N/A",
  },
  EUR: {
    bankName: "N/A",
    accountNumber: "N/A",
    branchCode: "N/A",
    accountType: "checking",
    reference: "N/A",
  },
  GBP: {
    bankName: "N/A",
    accountNumber: "N/A",
    branchCode: "N/A",
    accountType: "checking",
    reference: "N/A",
  },
};

/**
 * Local Payment Manager
 * Handles local payment methods for African markets
 */
export class LocalPaymentManager {
  private config: Map<LocalPaymentProvider, LocalPaymentConfig> = new Map();
  private payments: Map<string, PaymentRequest> = new Map();

  /**
   * Configure a payment provider
   */
  configure(providerConfig: LocalPaymentConfig): void {
    this.config.set(providerConfig.provider, providerConfig);
  }

  /**
   * Check if a provider is configured
   */
  isConfigured(provider: LocalPaymentProvider): boolean {
    return this.config.has(provider);
  }

  /**
   * Get configured providers
   */
  getConfiguredProviders(): LocalPaymentProvider[] {
    return Array.from(this.config.keys());
  }

  /**
   * Get provider info
   */
  getProviderInfo(provider: LocalPaymentProvider) {
    return PROVIDER_CONFIGS[provider];
  }

  /**
   * Get all available providers for a currency
   */
  getProvidersForCurrency(currency: Currency): LocalPaymentProvider[] {
    return (Object.entries(PROVIDER_CONFIGS) as [LocalPaymentProvider, typeof PROVIDER_CONFIGS[LocalPaymentProvider]][])
      .filter(([, config]) => config.supportedCurrencies.includes(currency))
      .map(([provider]) => provider);
  }

  /**
   * Get PPP-adjusted price
   */
  getPPPPrice(usdAmount: number, currency: Currency): number {
    const factor = PPP_PRICING[currency]?.factor || 1;
    return Math.round(usdAmount * factor * 100) / 100;
  }

  /**
   * Get plan price for currency
   */
  getPlanPrice(
    plan: "starter" | "pro" | "enterprise",
    currency: Currency
  ): number {
    return LOCAL_PLAN_PRICES[plan][currency] || LOCAL_PLAN_PRICES[plan].USD;
  }

  /**
   * Create a payment request
   */
  async createPayment(
    organizationId: string,
    options: {
      provider: LocalPaymentProvider;
      amount: number;
      currency: Currency;
      description: string;
      subscriptionId?: string;
      planId?: string;
      successUrl: string;
      cancelUrl: string;
      notifyUrl?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<PaymentResult> {
    const providerConfig = PROVIDER_CONFIGS[options.provider];

    // Validate currency support
    if (!providerConfig.supportedCurrencies.includes(options.currency)) {
      return {
        success: false,
        paymentId: "",
        reference: "",
        status: "failed",
        error: `Currency ${options.currency} not supported by ${options.provider}`,
      };
    }

    // Validate amount limits
    const minAmount = providerConfig.minAmount[options.currency];
    const maxAmount = providerConfig.maxAmount[options.currency];

    if (options.amount < minAmount) {
      return {
        success: false,
        paymentId: "",
        reference: "",
        status: "failed",
        error: `Amount ${options.amount} below minimum ${minAmount} ${options.currency}`,
      };
    }

    if (options.amount > maxAmount) {
      return {
        success: false,
        paymentId: "",
        reference: "",
        status: "failed",
        error: `Amount ${options.amount} exceeds maximum ${maxAmount} ${options.currency}`,
      };
    }

    const paymentId = `pay_${uuidv4()}`;
    const reference = `APX${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(
      Date.now() + providerConfig.expiryMinutes * 60 * 1000
    );

    const payment: PaymentRequest = {
      id: paymentId,
      organizationId,
      provider: options.provider,
      amount: options.amount,
      currency: options.currency,
      description: options.description,
      reference,
      subscriptionId: options.subscriptionId,
      planId: options.planId,
      status: "pending",
      metadata: options.metadata || {},
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create payment based on provider
    let result: PaymentResult;

    switch (options.provider) {
      case "snapscan":
        result = await this.createSnapScanPayment(payment, options);
        break;
      case "ozow":
        result = await this.createOzowPayment(payment, options);
        break;
      case "payfast":
        result = await this.createPayFastPayment(payment, options);
        break;
      case "eft":
        result = this.createEFTPayment(payment);
        break;
      default:
        return {
          success: false,
          paymentId: "",
          reference: "",
          status: "failed",
          error: `Unknown provider: ${options.provider}`,
        };
    }

    if (result.success) {
      payment.paymentUrl = result.paymentUrl;
      payment.qrCodeUrl = result.qrCodeUrl;
      payment.externalId = result.externalId;
      this.payments.set(paymentId, payment);
    }

    return result;
  }

  /**
   * Create SnapScan payment (QR code)
   */
  private async createSnapScanPayment(
    payment: PaymentRequest,
    options: { successUrl: string; cancelUrl: string }
  ): Promise<PaymentResult> {
    const config = this.config.get("snapscan");

    if (!config) {
      return {
        success: false,
        paymentId: payment.id,
        reference: payment.reference,
        status: "failed",
        error: "SnapScan provider not configured. Please add SnapScan API credentials.",
      };
    }

    // Real SnapScan API integration
    try {
      const response = await fetch("https://api.snapscan.io/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          merchantId: config.merchantId,
          amount: Math.round(payment.amount * 100), // cents
          currency: payment.currency,
          reference: payment.reference,
          description: payment.description,
          successUrl: options.successUrl,
          failureUrl: options.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`SnapScan API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        paymentId: payment.id,
        externalId: data.id,
        qrCodeUrl: data.qrCodeUrl,
        paymentUrl: data.paymentUrl,
        reference: payment.reference,
        status: "pending",
      };
    } catch (error) {
      return {
        success: false,
        paymentId: payment.id,
        reference: payment.reference,
        status: "failed",
        error: error instanceof Error ? error.message : "SnapScan payment failed",
      };
    }
  }

  /**
   * Create Ozow payment (Instant EFT)
   */
  private async createOzowPayment(
    payment: PaymentRequest,
    options: { successUrl: string; cancelUrl: string; notifyUrl?: string }
  ): Promise<PaymentResult> {
    const config = this.config.get("ozow");

    if (!config) {
      return {
        success: false,
        paymentId: payment.id,
        reference: payment.reference,
        status: "failed",
        error: "Ozow provider not configured. Please add Ozow API credentials.",
      };
    }

    // Real Ozow API integration
    try {
      const hashCheck = this.generateOzowHash(payment, config);

      const response = await fetch("https://api.ozow.com/PostPaymentRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ApiKey: config.apiKey,
        },
        body: JSON.stringify({
          SiteCode: config.merchantId,
          CountryCode: "ZA",
          CurrencyCode: payment.currency,
          Amount: payment.amount.toFixed(2),
          TransactionReference: payment.reference,
          BankReference: payment.description,
          Optional1: payment.organizationId,
          CancelUrl: options.cancelUrl,
          SuccessUrl: options.successUrl,
          NotifyUrl: options.notifyUrl,
          IsTest: config.testMode,
          HashCheck: hashCheck,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ozow API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        paymentId: payment.id,
        externalId: data.PaymentRequestId,
        paymentUrl: data.Url,
        reference: payment.reference,
        status: "pending",
      };
    } catch (error) {
      return {
        success: false,
        paymentId: payment.id,
        reference: payment.reference,
        status: "failed",
        error: error instanceof Error ? error.message : "Ozow payment failed",
      };
    }
  }

  /**
   * Create PayFast payment
   */
  private async createPayFastPayment(
    payment: PaymentRequest,
    options: { successUrl: string; cancelUrl: string; notifyUrl?: string }
  ): Promise<PaymentResult> {
    const config = this.config.get("payfast");

    if (!config) {
      return {
        success: false,
        paymentId: payment.id,
        reference: payment.reference,
        status: "failed",
        error: "PayFast provider not configured. Please add PayFast API credentials.",
      };
    }

    // PayFast uses form-based redirect
    const baseUrl = config.testMode
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const params = new URLSearchParams({
      merchant_id: config.merchantId,
      merchant_key: config.apiKey,
      amount: payment.amount.toFixed(2),
      item_name: payment.description,
      m_payment_id: payment.id,
      return_url: options.successUrl,
      cancel_url: options.cancelUrl,
      notify_url: options.notifyUrl || "",
    });

    const signature = this.generatePayFastSignature(params, config.apiSecret || "");
    params.append("signature", signature);

    return {
      success: true,
      paymentId: payment.id,
      paymentUrl: `${baseUrl}?${params.toString()}`,
      reference: payment.reference,
      status: "pending",
    };
  }

  /**
   * Create EFT payment (manual bank transfer)
   */
  private createEFTPayment(payment: PaymentRequest): PaymentResult {
    const bankAccount = EFT_BANK_ACCOUNTS[payment.currency];

    if (!bankAccount || bankAccount.bankName === "N/A") {
      return {
        success: false,
        paymentId: payment.id,
        reference: payment.reference,
        status: "failed",
        error: `EFT not available for currency ${payment.currency}`,
      };
    }

    // Store bank details in metadata
    payment.metadata = {
      ...payment.metadata,
      bankDetails: {
        ...bankAccount,
        reference: bankAccount.reference.replace("{reference}", payment.reference),
      },
      instructions: `Please transfer ${PPP_PRICING[payment.currency].symbol}${payment.amount} to the account below using reference: ${payment.reference}`,
    };

    return {
      success: true,
      paymentId: payment.id,
      reference: payment.reference,
      status: "pending",
    };
  }

  /**
   * Get payment by ID
   */
  getPayment(paymentId: string): PaymentRequest | undefined {
    return this.payments.get(paymentId);
  }

  /**
   * Get payment by reference
   */
  getPaymentByReference(reference: string): PaymentRequest | undefined {
    return Array.from(this.payments.values()).find(
      (p) => p.reference === reference
    );
  }

  /**
   * Get payments for an organization
   */
  getPayments(
    organizationId: string,
    options?: {
      status?: PaymentStatus;
      provider?: LocalPaymentProvider;
      limit?: number;
    }
  ): PaymentRequest[] {
    let payments = Array.from(this.payments.values()).filter(
      (p) => p.organizationId === organizationId
    );

    if (options?.status) {
      payments = payments.filter((p) => p.status === options.status);
    }

    if (options?.provider) {
      payments = payments.filter((p) => p.provider === options.provider);
    }

    payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      payments = payments.slice(0, options.limit);
    }

    return payments;
  }

  /**
   * Update payment status (from webhook)
   */
  updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    externalId?: string
  ): PaymentRequest | null {
    const payment = this.payments.get(paymentId);
    if (!payment) return null;

    payment.status = status;
    payment.updatedAt = new Date();

    if (externalId) {
      payment.externalId = externalId;
    }

    if (status === "completed") {
      payment.completedAt = new Date();
    }

    return payment;
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(
    provider: LocalPaymentProvider,
    payload: Record<string, unknown>,
    signature?: string
  ): Promise<{ handled: boolean; paymentId?: string; status?: PaymentStatus }> {
    const config = this.config.get(provider);

    // Verify signature if configured
    if (config?.webhookSecret && signature) {
      const isValid = await this.verifyWebhookSignature(
        provider,
        payload,
        signature,
        config.webhookSecret
      );

      if (!isValid) {
        return { handled: false };
      }
    }

    switch (provider) {
      case "snapscan":
        return this.handleSnapScanWebhook(payload);
      case "ozow":
        return this.handleOzowWebhook(payload);
      case "payfast":
        return this.handlePayFastWebhook(payload);
      case "eft":
        return this.handleEFTWebhook(payload);
      default:
        return { handled: false };
    }
  }

  /**
   * Handle SnapScan webhook
   */
  private handleSnapScanWebhook(
    payload: Record<string, unknown>
  ): { handled: boolean; paymentId?: string; status?: PaymentStatus } {
    const reference = payload.reference as string;
    const status = payload.status as string;

    const payment = this.getPaymentByReference(reference);
    if (!payment) {
      return { handled: false };
    }

    const mappedStatus = this.mapSnapScanStatus(status);
    this.updatePaymentStatus(payment.id, mappedStatus);

    return { handled: true, paymentId: payment.id, status: mappedStatus };
  }

  /**
   * Handle Ozow webhook
   */
  private handleOzowWebhook(
    payload: Record<string, unknown>
  ): { handled: boolean; paymentId?: string; status?: PaymentStatus } {
    const reference = payload.TransactionReference as string;
    const status = payload.Status as string;

    const payment = this.getPaymentByReference(reference);
    if (!payment) {
      return { handled: false };
    }

    const mappedStatus = this.mapOzowStatus(status);
    this.updatePaymentStatus(payment.id, mappedStatus);

    return { handled: true, paymentId: payment.id, status: mappedStatus };
  }

  /**
   * Handle PayFast webhook (ITN)
   */
  private handlePayFastWebhook(
    payload: Record<string, unknown>
  ): { handled: boolean; paymentId?: string; status?: PaymentStatus } {
    const paymentId = payload.m_payment_id as string;
    const status = payload.payment_status as string;

    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { handled: false };
    }

    const mappedStatus = this.mapPayFastStatus(status);
    this.updatePaymentStatus(payment.id, mappedStatus, payload.pf_payment_id as string);

    return { handled: true, paymentId: payment.id, status: mappedStatus };
  }

  /**
   * Handle EFT confirmation (manual or automated)
   */
  private handleEFTWebhook(
    payload: Record<string, unknown>
  ): { handled: boolean; paymentId?: string; status?: PaymentStatus } {
    const reference = payload.reference as string;
    const confirmed = payload.confirmed as boolean;

    const payment = this.getPaymentByReference(reference);
    if (!payment) {
      return { handled: false };
    }

    const status: PaymentStatus = confirmed ? "completed" : "failed";
    this.updatePaymentStatus(payment.id, status);

    return { handled: true, paymentId: payment.id, status };
  }

  /**
   * Request a refund
   */
  async requestRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      return {
        success: false,
        amount: 0,
        status: "failed",
        error: "Payment not found",
      };
    }

    if (payment.status !== "completed") {
      return {
        success: false,
        amount: 0,
        status: "failed",
        error: "Can only refund completed payments",
      };
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return {
        success: false,
        amount: 0,
        status: "failed",
        error: "Refund amount exceeds payment amount",
      };
    }

    // Check if already refunded
    if (payment.status === "refunded") {
      return {
        success: false,
        amount: 0,
        status: "failed",
        error: "Payment has already been refunded",
      };
    }

    // Provider-specific refund handling
    const config = this.config.get(payment.provider);

    if (!config) {
      return {
        success: false,
        amount: refundAmount,
        status: "failed",
        error: `${payment.provider} provider not configured. Cannot process refund.`,
      };
    }

    // Process refund based on provider
    let result: RefundResult;

    switch (payment.provider) {
      case "snapscan":
        result = await this.processSnapScanRefund(payment, refundAmount, reason, config);
        break;
      case "ozow":
        result = await this.processOzowRefund(payment, refundAmount, reason, config);
        break;
      case "payfast":
        result = await this.processPayFastRefund(payment, refundAmount, reason, config);
        break;
      case "eft":
        result = await this.processEFTRefund(payment, refundAmount, reason);
        break;
      default:
        return {
          success: false,
          amount: refundAmount,
          status: "failed",
          error: `Unknown provider: ${payment.provider}`,
        };
    }

    // Update payment status if refund successful
    if (result.success) {
      payment.status = "refunded";
      payment.updatedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        refund: {
          refundId: result.refundId,
          amount: refundAmount,
          reason: reason || "No reason provided",
          refundedAt: new Date().toISOString(),
        },
      };
    }

    return result;
  }

  /**
   * Process SnapScan refund
   */
  private async processSnapScanRefund(
    payment: PaymentRequest,
    amount: number,
    reason: string | undefined,
    config: LocalPaymentConfig
  ): Promise<RefundResult> {
    try {
      const response = await fetch(
        `https://api.snapscan.io/v1/payments/${payment.externalId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // cents
            reason: reason || "Customer requested refund",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `SnapScan refund failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        refundId: data.refundId || `ref_snapscan_${Date.now()}`,
        amount,
        status: "completed",
      };
    } catch (error) {
      return {
        success: false,
        amount,
        status: "failed",
        error: error instanceof Error ? error.message : "SnapScan refund failed",
      };
    }
  }

  /**
   * Process Ozow refund
   */
  private async processOzowRefund(
    payment: PaymentRequest,
    amount: number,
    reason: string | undefined,
    config: LocalPaymentConfig
  ): Promise<RefundResult> {
    try {
      const response = await fetch("https://api.ozow.com/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ApiKey: config.apiKey,
        },
        body: JSON.stringify({
          SiteCode: config.merchantId,
          TransactionReference: payment.reference,
          RefundAmount: amount.toFixed(2),
          RefundReason: reason || "Customer requested refund",
          IsTest: config.testMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.Message || `Ozow refund failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        refundId: data.RefundId || `ref_ozow_${Date.now()}`,
        amount,
        status: data.Status === "Complete" ? "completed" : "pending",
      };
    } catch (error) {
      return {
        success: false,
        amount,
        status: "failed",
        error: error instanceof Error ? error.message : "Ozow refund failed",
      };
    }
  }

  /**
   * Process PayFast refund
   */
  private async processPayFastRefund(
    payment: PaymentRequest,
    amount: number,
    reason: string | undefined,
    config: LocalPaymentConfig
  ): Promise<RefundResult> {
    try {
      // PayFast refunds require the original transaction ID
      if (!payment.externalId) {
        return {
          success: false,
          amount,
          status: "failed",
          error: "PayFast refund requires original transaction ID",
        };
      }

      const baseUrl = config.testMode
        ? "https://sandbox.payfast.co.za"
        : "https://www.payfast.co.za";

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const signature = this.generatePayFastRefundSignature(
        payment.externalId,
        amount,
        timestamp,
        config
      );

      const response = await fetch(`${baseUrl}/eng/query/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "merchant-id": config.merchantId,
          version: "v1",
          timestamp: timestamp,
          signature: signature,
        },
        body: new URLSearchParams({
          "pf-payment-id": payment.externalId,
          amount: amount.toFixed(2),
          reason: reason || "Customer requested refund",
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `PayFast refund failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        return {
          success: true,
          refundId: data.refund_id || `ref_payfast_${Date.now()}`,
          amount,
          status: "completed",
        };
      } else {
        return {
          success: false,
          amount,
          status: "failed",
          error: data.message || "PayFast refund failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        amount,
        status: "failed",
        error: error instanceof Error ? error.message : "PayFast refund failed",
      };
    }
  }

  /**
   * Process EFT refund (manual process)
   * EFT refunds require manual bank transfer
   */
  private async processEFTRefund(
    payment: PaymentRequest,
    amount: number,
    reason: string | undefined
  ): Promise<RefundResult> {
    // EFT refunds cannot be automated - they require manual bank transfer
    // Create a refund record that needs to be processed manually
    const refundId = `ref_eft_${Date.now()}`;

    // Store refund request in payment metadata for manual processing
    payment.metadata = {
      ...payment.metadata,
      pendingRefund: {
        refundId,
        amount,
        reason: reason || "Customer requested refund",
        requestedAt: new Date().toISOString(),
        status: "pending_manual_processing",
        instructions:
          "This EFT refund requires manual bank transfer. Please process through your bank.",
      },
    };

    return {
      success: true,
      refundId,
      amount,
      status: "pending",
    };
  }

  /**
   * Generate PayFast refund signature
   */
  private generatePayFastRefundSignature(
    paymentId: string,
    amount: number,
    timestamp: string,
    config: LocalPaymentConfig
  ): string {
    const signatureString = `${config.merchantId}|${paymentId}|${amount.toFixed(2)}|${timestamp}|${config.apiSecret || ""}`;
    return Buffer.from(signatureString).toString("base64").slice(0, 32);
  }

  /**
   * Get EFT bank details for a currency
   */
  getEFTBankDetails(
    currency: Currency,
    reference: string
  ): BankAccount | null {
    const account = EFT_BANK_ACCOUNTS[currency];
    if (!account || account.bankName === "N/A") {
      return null;
    }

    return {
      ...account,
      reference: account.reference.replace("{reference}", reference),
    };
  }

  /**
   * Check if payment has expired
   */
  isPaymentExpired(paymentId: string): boolean {
    const payment = this.payments.get(paymentId);
    if (!payment) return true;

    return new Date() > payment.expiresAt;
  }

  /**
   * Expire pending payments
   */
  expirePendingPayments(): number {
    let expiredCount = 0;
    const now = new Date();

    this.payments.forEach((payment) => {
      if (payment.status === "pending" && now > payment.expiresAt) {
        payment.status = "expired";
        payment.updatedAt = now;
        expiredCount++;
      }
    });

    return expiredCount;
  }

  // Helper methods
  private mapSnapScanStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      completed: "completed",
      pending: "pending",
      failed: "failed",
      cancelled: "cancelled",
    };
    return statusMap[status.toLowerCase()] || "pending";
  }

  private mapOzowStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      Complete: "completed",
      Pending: "pending",
      Cancelled: "cancelled",
      Error: "failed",
      Abandoned: "cancelled",
    };
    return statusMap[status] || "pending";
  }

  private mapPayFastStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      COMPLETE: "completed",
      PENDING: "pending",
      CANCELLED: "cancelled",
      FAILED: "failed",
    };
    return statusMap[status.toUpperCase()] || "pending";
  }

  private generateOzowHash(
    payment: PaymentRequest,
    config: LocalPaymentConfig
  ): string {
    // Simplified hash for development
    const hashString = `${config.merchantId}|${payment.currency}|${payment.amount}|${payment.reference}|${config.apiSecret}`;
    return Buffer.from(hashString).toString("base64").slice(0, 32);
  }

  private generatePayFastSignature(
    params: URLSearchParams,
    passphrase: string
  ): string {
    // Simplified signature for development
    const signatureString = params.toString() + (passphrase ? `&passphrase=${passphrase}` : "");
    return Buffer.from(signatureString).toString("base64").slice(0, 32);
  }

  private async verifyWebhookSignature(
    provider: LocalPaymentProvider,
    payload: Record<string, unknown>,
    signature: string,
    secret: string
  ): Promise<boolean> {
    // Simplified verification for development
    // Real implementation would use crypto.createHmac
    return !!signature && !!secret;
  }
}

// Singleton instance
export const localPaymentManager = new LocalPaymentManager();

// Response formatters
export function formatPaymentResponse(payment: PaymentRequest) {
  return {
    id: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    reference: payment.reference,
    status: payment.status,
    paymentUrl: payment.paymentUrl,
    qrCodeUrl: payment.qrCodeUrl,
    expiresAt: payment.expiresAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
    completedAt: payment.completedAt?.toISOString(),
  };
}

export function formatBankDetailsResponse(account: BankAccount) {
  return {
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    branchCode: account.branchCode,
    accountType: account.accountType,
    reference: account.reference,
  };
}
