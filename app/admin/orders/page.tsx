'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['Awaiting Payment', 'Paid', 'Processing', 'Shipped', 'Completed'];
const STATUS_COLORS: Record<string, string> = {
  'Awaiting Payment': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Processing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Shipped': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const SYNC_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  synced: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const load = async () => {
    const res = await fetch('/api/admin/orders');
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: number, status: string) => {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    load();
  };

  const syncToSupplier = async (orderId: number) => {
    setSyncingId(orderId);
    setSyncResult(null);
    const res = await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'sync' }),
    });
    const data = await res.json();
    setSyncResult({ orderId, ...data });
    setSyncingId(null);
    load();
  };

  const markSync = async (orderId: number, action: string) => {
    await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action }),
    });
    load();
  };

  const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);

  if (loading) return <div className="animate-pulse text-gray-400">Loading orders...</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['All', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {s} {s === 'All' ? `(${orders.length})` : `(${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Sync result popup */}
      {syncResult && (
        <div className={`card p-4 border-l-4 ${syncResult.error ? 'border-red-500' : 'border-green-500'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{syncResult.error ? '❌ Sync Failed' : '✓ Sync Result'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{syncResult.message || syncResult.error}</p>
              {syncResult.payload && (
                <details className="mt-2">
                  <summary className="text-xs text-brand-600 cursor-pointer">View supplier cart payload</summary>
                  <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(syncResult.payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <button onClick={() => setSyncResult(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
      )}

      {/* Orders list */}
      {filtered.map((o: any) => (
        <div key={o.id} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-brand-700 dark:text-brand-400">{o.ref}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                  {o.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SYNC_COLORS[o.supplier_sync_status] || 'bg-gray-100'}`}>
                  🔄 {o.supplier_sync_status || 'pending'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {o.guest_name}{o.guest_phone ? ` · ${o.guest_phone}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {[o.address_street, o.address_suburb, o.address_city, o.address_province].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-gray-400 mt-1">{o.items_summary}</p>
              {o.special_instructions && (
                <p className="text-xs text-orange-500 mt-1">📝 {o.special_instructions}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(o.created_at).toLocaleString()} · {o.shipping_method} · Shipping R{o.shipping_cost}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <p className="font-bold text-lg">R{o.total?.toFixed(0)}</p>

              {/* Status selector */}
              <select
                value={o.status}
                onChange={e => updateStatus(o.id, e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>

              {/* Sync to Supplier */}
              <div className="flex gap-1">
                <button
                  onClick={() => syncToSupplier(o.id)}
                  disabled={syncingId === o.id}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {syncingId === o.id ? '⏳ Syncing...' : '🔄 Sync to Supplier'}
                </button>
                {o.supplier_sync_status !== 'synced' && (
                  <button
                    onClick={() => markSync(o.id, 'mark_synced')}
                    className="px-2 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200"
                    title="Manually mark as synced"
                  >✓</button>
                )}
                {o.supplier_sync_status === 'synced' && (
                  <button
                    onClick={() => markSync(o.id, 'reset')}
                    className="px-2 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
                    title="Reset sync status"
                  >↺</button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-8">No orders found</p>
      )}
    </div>
  );
}
