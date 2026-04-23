/**
 * PayFast Checkout API
 * 
 * Creates a checkout session for subscription signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckout, PLANS, DEFAULT_CURRENCY, type PayFastCurrency } from '@/lib/payfast';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession, currentDbUser } from "@/lib/auth/supabase-server";

// Valid currencies
const VALID_CURRENCIES: PayFastCurrency[] = ['ZAR', 'USD', 'EUR', 'GBP'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, billingCycle = 'monthly', currency = DEFAULT_CURRENCY } = body;
    
    // Validate currency
    if (!VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency selected' },
        { status: 400 }
      );
    }
    
    // Validate plan
    if (!Object.prototype.hasOwnProperty.call(PLANS, plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    const isDev = process.env.NODE_ENV === 'development' && process.env.DEV_SUPER_ADMIN === 'true';
    let orgId: string;
    let customerEmail: string;
    let customerFirstName: string | undefined;
    let customerLastName: string | undefined;
    
    if (isDev) {
      // Dev mode: use first organization or create test data
      const [firstOrg] = await db
        .select()
        .from(organizations)
        .limit(1);
      
      if (!firstOrg) {
        return NextResponse.json(
          { error: 'No organization found. Create one first.' },
          { status: 404 }
        );
      }
      
      orgId = firstOrg.id;
      customerEmail = 'test@example.com';
      customerFirstName = 'Test';
      customerLastName = 'User';
    } else {
      // Production: require Supabase Auth session
      const __session = await getSession();
      const sessionOrgId = __session?.orgId ?? null;

      if (!__session?.userId || !sessionOrgId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const user = await currentDbUser();
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Get organization by internal id
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, sessionOrgId))
        .limit(1);

      if (!org) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      orgId = org.id;
      customerEmail = user.email || '';
      customerFirstName = user.name || undefined;
      customerLastName = user.name || undefined;
    }
    
    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    
    // Create checkout
    const checkout = createSubscriptionCheckout({
      organizationId: orgId,
      plan,
      billingCycle,
      currency,
      customerEmail,
      customerFirstName,
      customerLastName,
      returnUrl: `${baseUrl}/billing/success`,
      cancelUrl: `${baseUrl}/billing/cancel`,
      notifyUrl: `${baseUrl}/api/payfast/webhook`,
    });
    
    // Return the form data for client-side submission
    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      formData: checkout.formData,
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
