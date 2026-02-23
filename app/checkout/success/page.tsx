'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const ref = params.get('ref') || 'N/A';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="card p-8">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-6">Thank you for your order. Please complete payment using the details below.</p>

        <div className="bg-brand-50 dark:bg-brand-950/30 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-500 mb-1">Order Reference</p>
          <p className="text-3xl font-bold font-mono text-brand-700 dark:text-brand-400">{ref}</p>
        </div>

        <div className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-3">Payment Details (EFT)</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Bank:</span> <strong>Absa</strong></p>
            <p><span className="text-gray-500">Account Name:</span> <strong>Apex Protocol</strong></p>
            <p><span className="text-gray-500">Account Number:</span> <strong>4123044486</strong></p>
            <p><span className="text-gray-500">Branch Code:</span> <strong>632005</strong></p>
            <p><span className="text-gray-500">Account Type:</span> <strong>Cheque</strong></p>
            <p className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">Reference:</span>{' '}
              <strong className="text-brand-600 text-lg">{ref}</strong>
            </p>
          </div>
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">⚠️ Use ONLY the reference number above when making payment — no names or extra info.</p>
          </div>
        </div>

        <div className="text-sm text-gray-500 space-y-2 mb-6 text-left">
          <p>📧 A confirmation will be sent to your email shortly</p>
          <p>💳 Your order will be processed once full payment is received</p>
          <p>📦 Preparation takes 2-5 business days after payment</p>
          <p>🚚 Tracking number sent on dispatch (Mon-Thu)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/orders" className="btn-primary">Track Order</Link>
          <Link href="/catalog" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
