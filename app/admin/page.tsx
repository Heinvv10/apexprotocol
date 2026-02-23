'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['Awaiting Payment', 'Paid', 'Processing', 'Shipped', 'Completed'];
const STATUS_COLORS: Record<string, string> = {
  'Awaiting Payment': 'bg-yellow-900/30 text-yellow-400',
  'Paid': 'bg-blue-900/30 text-blue-400',
  'Processing': 'bg-purple-900/30 text-purple-400',
  'Shipped': 'bg-indigo-900/30 text-indigo-400',
  'Completed': 'bg-green-900/30 text-green-400',
};
const SYNC_COLORS: Record<string, string> = {
  'pending': 'bg-gray-800 text-gray-400',
  'synced': 'bg-green-900/30 text-green-400',
  'failed': 'bg-red-900/30 text-red-400',
};

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pricingProducts, setPricingProducts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [tab, setTab] = useState<'orders' | 'products' | 'pricing' | 'sync' | 'notifications' | 'contacts' | 'members' | 'settings'>('orders');
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '' });
  const [globalMarkup, setGlobalMarkupState] = useState(25);
  const [markupInput, setMarkupInput] = useState('25');
  const [pendingSyncOrders, setPendingSyncOrders] = useState<any[]>([]);
  const [pricingFilter, setPricingFilter] = useState('');
  const [pricingCategory, setPricingCategory] = useState('all');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPassword, setSupplierPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user?.is_admin) router.push('/auth/login');
      else { setAuthed(true); loadData(); }
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ordersRes, productsRes, notifsRes, contactsRes, pricingRes, syncRes, membersRes] = await Promise.all([
      fetch('/api/admin/orders'),
      fetch('/api/products'),
      fetch('/api/admin/notifications'),
      fetch('/api/admin/contacts').catch(() => ({ json: async () => ({ contacts: [] }) })),
      fetch('/api/admin/pricing'),
      fetch('/api/admin/sync'),
      fetch('/api/admin/members').catch(() => ({ json: async () => ({ members: [] }) })),
    ]);
    setOrders((await ordersRes.json()).orders || []);
    setProducts((await productsRes.json()).products || []);
    setNotifications((await notifsRes.json()).notifications || []);
    try { setContacts((await contactsRes.json()).contacts || []); } catch { setContacts([]); }
    const pricingData = await pricingRes.json();
    setPricingProducts(pricingData.products || []);
    setGlobalMarkupState(pricingData.globalMarkup || 25);
    setMarkupInput(String(pricingData.globalMarkup || 25));
    try { setPendingSyncOrders((await syncRes.json()).pendingOrders || []); } catch { setPendingSyncOrders([]); }
    try { setMembers((await membersRes.json()).members || []); } catch { setMembers([]); }
    setLoading(false);
  };

  const updateStatus = async (orderId: number, status: string) => {
    await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) });
    loadData();
  };

  const toggleStock = async (productId: number, currentlySoldOut: number) => {
    await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, sold_out: !currentlySoldOut }) });
    loadData();
  };

  const addNotification = async () => {
    if (!newNotif.title || !newNotif.message) return;
    await fetch('/api/admin/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNotif) });
    setNewNotif({ title: '', message: '' });
    loadData();
  };

  const removeNotification = async (id: number) => {
    await fetch('/api/admin/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadData();
  };

  const updateGlobalMarkup = async () => {
    const val = parseFloat(markupInput);
    if (isNaN(val) || val < 0 || val > 200) return alert('Enter a valid markup (0-200%)');
    await fetch('/api/admin/pricing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ globalMarkup: val }) });
    loadData();
  };

  const updateProductPrice = async (productId: number, field: 'priceOverride' | 'markupOverride', value: string) => {
    const numVal = value === '' ? null : parseFloat(value);
    if (value !== '' && (isNaN(numVal!) || numVal! < 0)) return;
    await fetch('/api/admin/pricing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, [field]: numVal }) });
    loadData();
  };

  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const syncOrder = async (orderId: number, action: string) => {
    if (action === 'sync_to_supplier') {
      setSyncingId(orderId);
      setSyncResult(null);
    }
    const res = await fetch('/api/admin/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, action }) });
    const data = await res.json();
    if (action === 'sync_to_supplier') {
      setSyncingId(null);
      setSyncResult(data);
      setTimeout(() => setSyncResult(null), 10000);
    }
    loadData();
  };

  if (!authed) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const categories = Array.from(new Set(pricingProducts.map((p: any) => p.category))).sort();
  const filteredPricing = pricingProducts.filter((p: any) => {
    if (pricingCategory !== 'all' && p.category !== pricingCategory) return false;
    if (pricingFilter && !p.name.toLowerCase().includes(pricingFilter.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { key: 'orders', label: `Orders (${orders.length})`, icon: '📦' },
    { key: 'pricing', label: 'Pricing', icon: '💰' },
    { key: 'sync', label: `Sync (${pendingSyncOrders.length})`, icon: '🔄' },
    { key: 'products', label: `Stock (${products.length})`, icon: '📋' },
    { key: 'notifications', label: `Alerts (${notifications.length})`, icon: '🔔' },
    { key: 'members', label: `Members (${members.filter((m: any) => !m.approved).length} pending)`, icon: '👥' },
    { key: 'contacts', label: `Contacts (${contacts.length})`, icon: '✉️' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-display font-bold mb-1 text-white uppercase tracking-wider">Admin</h1>
      <p className="text-gray-500 text-sm mb-6 tracking-wide">Apex Protocol Command Center</p>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#1f2937] pb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            tab === t.key
              ? 'bg-[#00d4ff] text-[#0a0a0a] shadow-[0_0_15px_rgba(0,212,255,0.2)]'
              : 'bg-[#111827] text-gray-400 hover:bg-[#1f2937] hover:text-white border border-[#1f2937]'
          }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center py-8 text-gray-500">Loading...</p> : (
        <>
          {/* ORDERS TAB */}
          {tab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 && <p className="text-gray-500 text-center py-8">No orders yet</p>}
              {orders.map((o: any) => (
                <div key={o.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-lg text-white">{o.ref}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${SYNC_COLORS[o.supplier_sync_status] || SYNC_COLORS.pending}`}>
                          Sync: {o.supplier_sync_status || 'pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{o.guest_name || o.guest_email} • {o.shipping_method} • {new Date(o.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">{o.address_street}, {o.address_city}, {o.address_province} {o.address_postal_code}</p>
                      {o.special_instructions && <p className="text-sm italic text-gray-500 mt-1">📝 {o.special_instructions}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#00d4ff] font-display">R{Number(o.total).toFixed(0)}</p>
                      <p className="text-xs text-gray-500">Shipping: R{Number(o.shipping_cost).toFixed(0)}</p>
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="admin-input mt-2 !w-auto !py-1.5">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRICING TAB */}
          {tab === 'pricing' && (
            <div>
              <div className="card p-6 mb-6">
                <h2 className="text-lg font-display font-bold mb-4 text-white uppercase tracking-wider">Global Markup</h2>
                <div className="flex items-center gap-4">
                  <input type="range" min="0" max="100" value={markupInput} onChange={e => setMarkupInput(e.target.value)} className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-[#00d4ff] bg-[#1f2937]" />
                  <div className="flex items-center gap-2">
                    <input type="number" value={markupInput} onChange={e => setMarkupInput(e.target.value)} className="admin-input !w-20 text-center font-bold text-lg" />
                    <span className="text-lg font-bold text-gray-400">%</span>
                  </div>
                  <button onClick={updateGlobalMarkup} className="btn-primary !py-2 !px-6">
                    Apply to All
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Current: {globalMarkup}% · Changes recalculate all products without individual overrides</p>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-display font-bold mb-4 text-white uppercase tracking-wider">Per-Product Pricing</h2>
                <div className="flex gap-3 mb-4">
                  <input type="text" placeholder="Search products..." value={pricingFilter} onChange={e => setPricingFilter(e.target.value)} className="admin-input flex-1" />
                  <select value={pricingCategory} onChange={e => setPricingCategory(e.target.value)} className="admin-input !w-auto">
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left border-b border-[#1f2937]">
                      <tr>
                        <th className="pb-3 pr-4 text-xs uppercase tracking-wider text-gray-500 font-medium">Product</th>
                        <th className="pb-3 pr-4 text-xs uppercase tracking-wider text-gray-500 font-medium">Category</th>
                        <th className="pb-3 pr-4 text-right text-xs uppercase tracking-wider text-gray-500 font-medium">Base</th>
                        <th className="pb-3 pr-4 text-right text-xs uppercase tracking-wider text-gray-500 font-medium">Sell</th>
                        <th className="pb-3 pr-4 text-right text-xs uppercase tracking-wider text-gray-500 font-medium">Margin</th>
                        <th className="pb-3 pr-4 text-center text-xs uppercase tracking-wider text-gray-500 font-medium">Price Override</th>
                        <th className="pb-3 text-center text-xs uppercase tracking-wider text-gray-500 font-medium">Markup %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPricing.map((p: any) => {
                        const margin = p.base_price > 0 ? ((p.sell_price - p.base_price) / p.base_price * 100).toFixed(1) : '0';
                        return (
                          <tr key={p.id} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/30">
                            <td className="py-2.5 pr-4 font-medium text-white">{p.name} {p.sold_out ? '🔴' : ''}</td>
                            <td className="py-2.5 pr-4 text-gray-500 text-xs">{p.category}</td>
                            <td className="py-2.5 pr-4 text-right font-mono text-gray-400">R{Number(p.base_price).toFixed(0)}</td>
                            <td className="py-2.5 pr-4 text-right font-mono font-bold text-[#00d4ff]">R{Number(p.sell_price).toFixed(0)}</td>
                            <td className="py-2.5 pr-4 text-right font-mono text-green-400">{margin}%</td>
                            <td className="py-2.5 pr-4 text-center">
                              <input type="number" placeholder="—" defaultValue={p.price_override || ''} onBlur={e => updateProductPrice(p.id, 'priceOverride', e.target.value)} className="admin-input !w-24 text-center" />
                            </td>
                            <td className="py-2.5 text-center">
                              <input type="number" placeholder="—" defaultValue={p.markup_override ?? ''} onBlur={e => updateProductPrice(p.id, 'markupOverride', e.target.value)} className="admin-input !w-20 text-center" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-3">Price override takes priority. Leave blank to use global markup.</p>
              </div>
            </div>
          )}

          {/* SYNC TAB */}
          {tab === 'sync' && (
            <div>
              <div className="card p-6 mb-6">
                <h2 className="text-lg font-display font-bold mb-2 text-white uppercase tracking-wider">Supplier Order Sync</h2>
                <p className="text-gray-500 text-sm mb-4">Orders ready to push to Muscles SA.</p>
                {pendingSyncOrders.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">No orders pending supplier sync</p>
                ) : (
                  <div className="space-y-4">
                    {pendingSyncOrders.map((o: any) => (
                      <div key={o.id} className="border border-[#1f2937] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-mono font-bold text-lg text-white">{o.ref}</span>
                            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                          </div>
                          <span className="text-lg font-bold text-[#00d4ff] font-display">R{Number(o.total).toFixed(0)}</span>
                        </div>
                        <div className="text-sm mb-3 text-gray-400">
                          <p><strong className="text-gray-300">Ship to:</strong> {o.address_street}, {o.address_city}, {o.address_province} {o.address_postal_code}</p>
                          <p><strong className="text-gray-300">Method:</strong> {o.shipping_method}</p>
                        </div>
                        <div className="bg-[#0a0a0a] rounded-lg p-3 mb-3">
                          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Items to order from supplier:</p>
                          {o.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm py-1 text-gray-400">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span className="font-mono">R{(Number(item.base_price) * item.quantity).toFixed(0)}</span>
                            </div>
                          ))}
                          <div className="border-t border-[#1f2937] mt-2 pt-2 flex justify-between font-bold text-white">
                            <span>Supplier Total:</span>
                            <span>R{o.items?.reduce((sum: number, i: any) => sum + i.base_price * i.quantity, 0).toFixed(0)}</span>
                          </div>
                        </div>
                        {syncResult && syncResult.results && syncingId === null && (
                          <div className={`mb-3 p-3 rounded-lg text-sm ${syncResult.ok ? 'bg-green-900/30 border border-green-700/50 text-green-300' : 'bg-yellow-900/30 border border-yellow-700/50 text-yellow-300'}`}>
                            <p className="font-bold mb-1">{syncResult.message}</p>
                            {syncResult.results.map((r: any, i: number) => (
                              <p key={i} className="text-xs">{r.ok ? '✅' : '❌'} {r.name} {r.ok ? `— R${r.cart_item?.cart_item_price}` : `— ${r.msg}`}</p>
                            ))}
                            {syncResult.supplierTotal > 0 && <p className="mt-1 font-bold">Supplier cart total: R{syncResult.supplierTotal}</p>}
                            {syncResult.ok && <p className="mt-1 text-xs text-green-400">→ Complete the order at my.muscles.co.za/checkout.php</p>}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => syncOrder(o.id, 'sync_to_supplier')}
                            disabled={syncingId === o.id}
                            className="btn-primary !py-2 !px-4 text-xs disabled:opacity-50"
                          >
                            {syncingId === o.id ? '⏳ Syncing...' : '🛒 Push to Muscles SA'}
                          </button>
                          <button onClick={() => syncOrder(o.id, 'mark_synced')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors uppercase tracking-wider">✅ Mark Synced</button>
                          <button onClick={() => syncOrder(o.id, 'mark_failed')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors uppercase tracking-wider">❌ Failed</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STOCK TAB */}
          {tab === 'products' && (
            <div className="card p-6">
              <h2 className="text-lg font-display font-bold mb-4 text-white uppercase tracking-wider">Stock Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left border-b border-[#1f2937]">
                    <tr>
                      <th className="pb-3 pr-4 text-xs uppercase tracking-wider text-gray-500 font-medium">Product</th>
                      <th className="pb-3 pr-4 text-xs uppercase tracking-wider text-gray-500 font-medium">Category</th>
                      <th className="pb-3 pr-4 text-right text-xs uppercase tracking-wider text-gray-500 font-medium">Price</th>
                      <th className="pb-3 text-center text-xs uppercase tracking-wider text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p.id} className="border-b border-[#1f2937]/50 hover:bg-[#1f2937]/30">
                        <td className="py-2.5 pr-4 font-medium text-white">{p.name}</td>
                        <td className="py-2.5 pr-4 text-gray-500 text-xs">{p.category}</td>
                        <td className="py-2.5 pr-4 text-right font-mono text-[#00d4ff]">R{Number(p.sell_price).toFixed(0)}</td>
                        <td className="py-2.5 text-center">
                          <button onClick={() => toggleStock(p.id, p.sold_out)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            p.sold_out ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                          }`}>
                            {p.sold_out ? 'Sold Out' : 'In Stock'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <div>
              <div className="card p-6 mb-6">
                <h2 className="text-lg font-display font-bold mb-4 text-white uppercase tracking-wider">Post Announcement</h2>
                <div className="flex flex-col gap-3">
                  <input type="text" placeholder="Title" value={newNotif.title} onChange={e => setNewNotif(n => ({ ...n, title: e.target.value }))} className="admin-input" />
                  <textarea placeholder="Message" value={newNotif.message} onChange={e => setNewNotif(n => ({ ...n, message: e.target.value }))} className="admin-input" rows={3} />
                  <button onClick={addNotification} className="btn-primary self-start !py-2">Post</button>
                </div>
              </div>
              <div className="space-y-3">
                {notifications.map((n: any) => (
                  <div key={n.id} className="card p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{n.title}</h3>
                      <p className="text-sm text-gray-500">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeNotification(n.id)} className="text-red-400 hover:text-red-300 text-sm transition-colors">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {tab === 'members' && (
            <div>
              <div className="card p-6 mb-6">
                <h2 className="text-lg font-display font-bold mb-2 text-white uppercase tracking-wider">Pending Approval</h2>
                <p className="text-gray-500 text-sm mb-4">Users who registered with a referral and are waiting for access.</p>
                {members.filter((m: any) => !m.approved).length === 0 ? (
                  <p className="text-center py-6 text-gray-600">No pending requests</p>
                ) : (
                  <div className="space-y-3">
                    {members.filter((m: any) => !m.approved).map((m: any) => (
                      <div key={m.id} className="border border-[#1f2937] rounded-lg p-4 flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-sm text-[#00d4ff]">{m.email}</p>
                          {m.phone && <p className="text-sm text-gray-400">{m.phone}</p>}
                          <p className="text-sm text-gray-500 mt-1">Referred by: <strong className="text-yellow-400">{m.referral}</strong></p>
                          <p className="text-xs text-gray-600 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => { await fetch('/api/admin/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: m.id, action: 'approve' }) }); loadData(); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors uppercase tracking-wider">✅ Approve</button>
                          <button onClick={async () => { if (confirm(`Reject and delete ${m.name}?`)) { await fetch('/api/admin/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: m.id, action: 'reject' }) }); loadData(); } }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors uppercase tracking-wider">❌ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold mb-4 text-white uppercase tracking-wider">Approved Members</h2>
                {members.filter((m: any) => m.approved).length === 0 ? (
                  <p className="text-center py-6 text-gray-600">No approved members yet</p>
                ) : (
                  <div className="space-y-2">
                    {members.filter((m: any) => m.approved).map((m: any) => (
                      <div key={m.id} className="border border-[#1f2937]/50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-white">{m.name}</span>
                          <span className="text-sm text-gray-500 ml-3">{m.email}</span>
                          {m.referral && <span className="text-xs text-gray-600 ml-3">via {m.referral}</span>}
                        </div>
                        <span className="text-xs text-green-400">✅ Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTACTS TAB */}
          {tab === 'contacts' && (
            <div className="space-y-3">
              {contacts.length === 0 && <p className="text-gray-500 text-center py-8">No contact requests yet</p>}
              {contacts.map((c: any) => (
                <div key={c.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{c.first_name} {c.last_name}</p>
                      <p className="text-sm text-[#00d4ff]">{c.email}</p>
                      {c.message && <p className="text-sm text-gray-500 mt-1">{c.message}</p>}
                    </div>
                    <span className="text-xs text-gray-600">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === 'settings' && (
            <div className="card p-6">
              <h2 className="text-lg font-display font-bold mb-4 text-white uppercase tracking-wider">Supplier Settings</h2>
              <p className="text-sm text-gray-500 mb-4">Muscles SA login credentials for automated order sync</p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400 uppercase tracking-wider">Supplier Email</label>
                  <input type="email" placeholder="your@email.com" value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} className="admin-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-400 uppercase tracking-wider">Supplier Password</label>
                  <input type="password" placeholder="••••••••" value={supplierPassword} onChange={e => setSupplierPassword(e.target.value)} className="admin-input" />
                </div>
                <button className="btn-primary !py-2">Save Credentials</button>
              </div>
              <div className="mt-8 pt-6 border-t border-[#1f2937]">
                <h3 className="font-bold text-white mb-2">EFT Bank Details</h3>
                <p className="text-sm text-gray-500">Update these in the checkout success page code</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
