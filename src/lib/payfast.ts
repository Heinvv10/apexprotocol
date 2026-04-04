export const PLANS: Record<string, { name: string; monthlyPrice: number; annualPrice: number }> = {};
export const DEFAULT_CURRENCY = "ZAR";
export type PayFastCurrency = "ZAR" | "USD" | "EUR" | "GBP";

interface CheckoutParams {
  organizationId: string;
  plan: string;
  billingCycle: string;
  currency: PayFastCurrency;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

interface CheckoutResult {
  url: string;
  formData: Record<string, string>;
}

export function createSubscriptionCheckout(params: CheckoutParams): CheckoutResult {
  return {
    url: "https://sandbox.payfast.co.za/eng/process",
    formData: {
      merchant_id: process.env.PAYFAST_MERCHANT_ID ?? "",
      merchant_key: process.env.PAYFAST_MERCHANT_KEY ?? "",
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notify_url: params.notifyUrl,
      email_address: params.customerEmail,
      amount: "0.00",
      item_name: `${params.plan} - ${params.billingCycle}`,
    },
  };
}
