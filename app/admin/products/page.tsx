'use client';

import { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');

  const load = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleStock = async (productId: number, currentlySoldOut: number) => {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, sold_out: !currentlySoldOut }),
    });
    load();
  };

  const categories = ['All', ...Array.from(new Set(products.map((p: any) => p.category))).sort()];

  const filtered = products.filter((p: any) => {
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (stockFilter === 'sold_out' && !p.sold_out) return false;
    if (stockFilter === 'in_stock' && p.sold_out) return false;
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="animate-pulse text-gray-400">Loading products...</div>;

  const soldOutCount = products.filter(p => p.sold_out).length;
  const inStockCount = products.length - soldOutCount;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-gray-500">Total Products</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
          <p className="text-xs text-gray-500">In Stock</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{soldOutCount}</p>
          <p className="text-xs text-gray-500">Sold Out</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field !py-1.5 !text-sm !w-auto">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {[
            { key: 'all', label: 'All' },
            { key: 'in_stock', label: 'In Stock' },
            { key: 'sold_out', label: 'Sold Out' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStockFilter(f.key as any)}
              className={`px-3 py-1.5 text-xs font-medium ${stockFilter === f.key ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-800'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-field !py-1.5 !text-sm !w-40"
        />
      </div>

      {/* Products list */}
      <div className="space-y-1">
        {filtered.map((p: any) => (
          <div key={p.id} className="card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img src={`/images/products/${p.image}`} alt="" className="w-10 h-10 object-contain rounded bg-gray-50 dark:bg-gray-800 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.category} · R{p.sell_price} · Supplier ID: {p.supplier_product_id || '—'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleStock(p.id, p.sold_out)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                p.sold_out
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
              }`}
            >
              {p.sold_out ? '🔴 Sold Out' : '🟢 In Stock'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} of {products.length} products shown</p>
    </div>
  );
}
