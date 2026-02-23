'use client';

import { useState } from 'react';

const TABS = ['Description', 'Dosage & Usage', 'Shipping Info'] as const;

export default function ProductTabs({ product }: { product: any }) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Description');

  return (
    <div className="border-t border-[#1f2937] pt-8">
      {/* Tab headers */}
      <div className="flex gap-0 border-b border-[#1f2937] mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium tracking-wider uppercase transition-all border-b-2 -mb-[1px] ${
              activeTab === tab
                ? 'text-[#00d4ff] border-[#00d4ff]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === 'Description' && (
          <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line max-w-3xl">
            {product.description || 'No description available.'}
          </div>
        )}

        {activeTab === 'Dosage & Usage' && (
          <div className="text-gray-400 text-sm leading-relaxed max-w-3xl">
            <p className="mb-4">Please consult with a healthcare professional before using this product. Follow all recommended dosage guidelines carefully.</p>
            <p className="text-gray-500 text-xs">Disclaimer: Product information is provided for educational purposes only. Apex Protocol does not provide medical advice.</p>
          </div>
        )}

        {activeTab === 'Shipping Info' && (
          <div className="max-w-2xl">
            <div className="overflow-hidden rounded-lg border border-[#1f2937]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#111827]">
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-medium">Method</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]">
                  <tr><td className="px-4 py-3 text-gray-300">Courier to-Door</td><td className="px-4 py-3 text-right text-white font-medium">R180</td></tr>
                  <tr><td className="px-4 py-3 text-gray-300">Courier to-Kiosk</td><td className="px-4 py-3 text-right text-white font-medium">R180</td></tr>
                  <tr><td className="px-4 py-3 text-gray-300">PostNet</td><td className="px-4 py-3 text-right text-white font-medium">R140</td></tr>
                  <tr><td className="px-4 py-3 text-gray-300">Fastway (Main Cities)</td><td className="px-4 py-3 text-right text-white font-medium">R130</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-[#00d4ff] font-medium">🚚 Free shipping on orders over R4,600</p>
              <p className="text-gray-500">Dispatched Monday to Thursday · 2–5 business days delivery</p>
              <p className="text-gray-500">No dispatches on Fridays, weekends, or public holidays</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
