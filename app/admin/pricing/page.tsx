'use client';

import { useEffect, useState, useCallback } from 'react';

export default function PricingPage() {
  const [globalMarkup, setGlobalMarkup] = useState(25);
  const [pendingMarkup, setPendingMarkup] = useState(25);
  const [products, setProducts] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/pricing');
    const data = await res.json();
    setGlobalMarkup(data.globalMarkup);
    setPendingMarkup(data.globalMarkup);
    setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ['All', ...Array.from(new Set(products.map((p: any) => p.category))).sort()];

  const saveGlobalMarkup = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/pricing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ globalMarkup: pendingMarkup }),
    });
    const data = await res.json();
    if (data.ok) {
      setGlobalMarkup(pendingMarkup);
      setLastSaved(`Updated ${data.updated} products to ${pendingMarkup}% markup`);
      load();
    }
    setSaving(false);
  };

  const updateProductOverride = async (productId: number, field: 'priceOverride' | 'markupOverride', value: string) => {
    const val = value === '' ? null : parseFloat(value);
    await fetch('/api/admin/pricing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, [field]: val }),
    });
    load();
  };

  const filteredProducts = products.filter((p: any) => {
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="animate-pulse text-gray-400">Loading pricing data...</div>;

  return (
    <div className="space-y-6">
      {/* Global markup */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-1">Global Markup</h2>
        <p className="text-sm text-gray-500 mb-4">Applied to all products without an individual override.</p>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pendingMarkup}
              onChange={e => setPendingMarkup(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>
          <div className="text-center min-w-[80px]">
            <input
              type="number"
              value={pendingMarkup}
              onChange={e => setPendingMarkup(parseInt(e.target.value) || 0)}
              className="input-field !w-20 text-center text-lg font-bold"
              min={0}
              max={500}
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <button
            onClick={saveGlobalMarkup}
            disabled={saving || pendingMarkup === globalMarkup}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Applying...' : 'Apply to All'}
          </button>
        </div>
        {pendingMarkup !== globalMarkup && (
          <p className="text-sm text-orange-500 mt-2">⚠️ Changed from {globalMarkup}% → {pendingMarkup}%. Click &quot;Apply to All&quot; to update all product prices.</p>
        )}
        {lastSaved && <p className="text-sm text-green-600 mt-2">✓ {lastSaved}</p>}
      </div>

      {/* Product pricing table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Per-Product Pricing</h2>
          <div className="flex gap-2">
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field !py-1.5 !text-sm">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="input-field !py-1.5 !text-sm !w-40"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Leave overrides empty to use global markup ({globalMarkup}%). Price override takes priority over markup override.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="py-2 pr-3 font-medium text-gray-500">Product</th>
                <th className="py-2 px-2 font-medium text-gray-500 text-right w-24">Base (SA)</th>
                <th className="py-2 px-2 font-medium text-gray-500 text-right w-28">Sell Price</th>
                <th className="py-2 px-2 font-medium text-gray-500 text-center w-32">Price Override</th>
                <th className="py-2 px-2 font-medium text-gray-500 text-center w-32">Markup Override</th>
                <th className="py-2 px-2 font-medium text-gray-500 text-center w-20">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p: any) => {
                const margin = Number(p.base_price) > 0 ? ((Number(p.sell_price) - Number(p.base_price)) / p.base_price * 100).toFixed(0) : '-';
                const hasOverride = p.price_override !== null || p.markup_override !== null;
                return (
                  <tr key={p.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${hasOverride ? 'bg-brand-50/50 dark:bg-brand-950/10' : ''}`}>
                    <td className="py-2 pr-3">
                      <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category} · ID:{p.supplier_product_id}</p>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-500">R{p.base_price}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-brand-700 dark:text-brand-400">R{p.sell_price}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        placeholder={`R${Math.round(p.base_price * (1 + globalMarkup / 100))}`}
                        defaultValue={p.price_override ?? ''}
                        onBlur={e => updateProductOverride(p.id, 'priceOverride', e.target.value)}
                        className="input-field !py-1 !text-sm !text-center w-full"
                        min={0}
                        step={1}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder={`${globalMarkup}`}
                          defaultValue={p.markup_override ?? ''}
                          onBlur={e => updateProductOverride(p.id, 'markupOverride', e.target.value)}
                          className="input-field !py-1 !text-sm !text-center w-full"
                          min={0}
                          max={500}
                          step={1}
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className={`py-2 px-2 text-center font-mono text-xs ${Number(margin) >= 25 ? 'text-green-600' : Number(margin) >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {margin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-3">{filteredProducts.length} of {products.length} products shown</p>
      </div>
    </div>
  );
}
