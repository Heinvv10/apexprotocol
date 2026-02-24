'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

function CatalogPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<{category: string, count: number}[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<number>>(new Set());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, [category, search]);

  // Fetch all products and categories
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => {
      setAllProducts(d.products || []);
      setCategories(d.categories || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
  }, []);

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState(initialSearch);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchDebounce), 300);
    return () => clearTimeout(t);
  }, [searchDebounce]);

  // Build category pill options with counts
  const categoryPills = [
    { category: 'All', count: allProducts.length },
    ...categories,
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-8">
      {/* Notification banners */}
      {notifications.filter(n => !dismissedNotifs.has(n.id)).map(n => (
        <div key={n.id} className="mb-4 bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-lg p-4 flex items-start justify-between">
          <div>
            <p className="font-semibold text-[#00d4ff] text-sm">{n.title}</p>
            <p className="text-sm text-gray-400">{n.message}</p>
          </div>
          <button onClick={() => setDismissedNotifs(prev => new Set([...prev, n.id]))} className="text-gray-500 hover:text-[#00d4ff] ml-4 text-sm">✕</button>
        </div>
      ))}

      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wider text-white">
              Product Catalog
            </h1>
            <p className="text-sm text-gray-500 mt-1 tracking-wide">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          {/* Search with glassmorphism */}
          <div className="relative sm:w-80 w-full">
            <div className="glass rounded-lg">
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchDebounce}
                onChange={e => setSearchDebounce(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Category pills - horizontally scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categoryPills.map(cat => (
            <button
              key={cat.category}
              onClick={() => setCategory(cat.category)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap tracking-wider uppercase flex items-center gap-2 shrink-0 ${
                category === cat.category
                  ? 'bg-[#00d4ff] text-[#0a0a0a] shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                  : 'bg-[#111827] border border-[#1f2937] text-gray-400 hover:border-[#00d4ff]/30 hover:text-white'
              }`}
            >
              {cat.category}
              {cat.count ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  category === cat.category ? 'bg-[#0a0a0a]/20 text-[#0a0a0a]' : 'bg-[#1f2937] text-gray-500'
                }`}>
                  {cat.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Category header */}
      {category !== 'All' && (
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-lg font-display font-bold text-white tracking-wide uppercase">{category}</h2>
          <button onClick={() => setCategory('All')} className="text-xs text-gray-500 hover:text-[#00d4ff] transition-colors">
            ✕ Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-[#0a0f1a]" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-[#1f2937] rounded w-2/3" />
                <div className="h-2 bg-[#1f2937] rounded w-full" />
                <div className="h-6 bg-[#1f2937] rounded w-1/3" />
                <div className="h-10 bg-[#1f2937] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p: any, i: number) => (
            <div key={p.id} className="fade-in-card" style={{ animationDelay: `${i * 60}ms` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#111827] border border-[#1f2937] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">No products found</p>
          <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading catalog...</div>}>
      <CatalogPageContent />
    </Suspense>
  );
}
