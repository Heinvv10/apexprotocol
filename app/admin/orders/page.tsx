'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['Awaiting Payment', 'Quote Sent', 'Payment Received', 'Payment Sent', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const STATUS_COLORS: Record<string, string> = {
  'Awaiting Payment': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Quote Sent': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Payment Received': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Payment Sent': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Processing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Shipped': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const SHIPPING_METHODS: Record<string, string> = {
  courier_door: 'The Courier Guy (Door-to-Door)',
  courier_kiosk: 'The Courier Guy (Kiosk)',
  postnet: 'PostNet (Counter)',
  fastway: 'Fastway (Door-to-Door)',
};

const PROVINCES = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editItems, setEditItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [emailResult, setEmailResult] = useState<{id: number, msg: string} | null>(null);

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

  const openEdit = (o: any) => {
    setEditOrder(o);
    setEditForm({
      name: o.guest_name || '',
      email: o.guest_email || '',
      phone: o.guest_phone || '',
      street: o.address_line1 || '',
      suburb: o.address_line2 || '',
      city: o.city || '',
      province: o.province || '',
      postalCode: o.postal_code || '',
      shippingMethod: o.shipping_method || 'courier_door',
      notes: o.notes || '',
      shippingCost: o.shipping_cost || 0,
    });
    setEditItems(Array.isArray(o.items) ? o.items : []);
  };

  const saveEdit = async () => {
    setSaving(true);
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: editOrder.id,
        address: editForm,
        items: editItems,
        shippingCost: Number(editForm.shippingCost || editOrder?.shipping_cost || 0),
      }),
    });
    setSaving(false);
    setEditOrder(null);
    setEditItems([]);
    load();
  };

  const upd = (field: string, value: string) => setEditForm((p: any) => ({ ...p, [field]: value }));

  const resendEmail = async (orderId: number) => {
    setSendingEmail(orderId);
    setEmailResult(null);
    const res = await fetch('/api/admin/orders/resend-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    setEmailResult({ id: orderId, msg: data.ok ? `✅ Sent to ${data.sentTo}` : `❌ ${data.error}` });
    setSendingEmail(null);
  };

  const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);

  if (loading) return <div className="animate-pulse text-gray-400">Loading orders...</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
            {s} ({s === 'All' ? orders.length : orders.filter(o => o.status === s).length})
          </button>
        ))}
      </div>

      {/* Email result toast */}
      {emailResult && (
        <div className={`card p-3 border-l-4 flex items-center justify-between ${emailResult.msg.startsWith('✅') ? 'border-green-500' : 'border-red-500'}`}>
          <span className="text-sm">{emailResult.msg}</span>
          <button onClick={() => setEmailResult(null)} className="text-gray-400 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* Orders list */}
      {filtered.map((o: any) => (
        <div key={o.id} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-brand-700 dark:text-brand-400">{o.ref}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>{o.status}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {o.guest_name}{o.guest_phone ? ` · ${o.guest_phone}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {[o.address_line1, o.address_line2, o.city, o.province, o.postal_code].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-gray-400 mt-1">{o.items_summary}</p>
              {o.special_instructions && <p className="text-xs text-orange-500 mt-1">📝 {o.special_instructions}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(o.created_at).toLocaleString()} · {SHIPPING_METHODS[o.shipping_method] || o.shipping_method} · Shipping R{Number(o.shipping_cost).toFixed(0)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <p className="font-bold text-lg">R{Number(o.total).toFixed(0)}</p>
              <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => openEdit(o)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-all">
                ✏️ Edit Details
              </button>
              {o.guest_email && (
                <button onClick={() => resendEmail(o.id)} disabled={sendingEmail === o.id}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50">
                  {sendingEmail === o.id ? '⏳ Sending...' : '📧 Resend Email'}
                </button>
              )}
              <p className="text-xs text-gray-500">{o.guest_email || 'No email'}</p>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && <p className="text-gray-400 text-center py-8">No orders found</p>}

      {/* Edit Modal */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Edit Order — {editOrder.ref}</h2>
              <button onClick={() => setEditOrder(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Order Items */}
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2 font-medium">Order Items</p>
                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div key={item.item_id} className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2">
                      <span className="flex-1 text-sm text-white truncate">{item.name}</span>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-400">Qty</label>
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={e => setEditItems(prev => prev.map((it, i) => i === idx ? {...it, quantity: Number(e.target.value)} : it))}
                          className="w-14 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white text-center focus:outline-none focus:border-[#00d4ff]"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-400">R</label>
                        <input
                          type="number" min="0" step="0.01" value={item.price}
                          onChange={e => setEditItems(prev => prev.map((it, i) => i === idx ? {...it, price: Number(e.target.value)} : it))}
                          className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white text-center focus:outline-none focus:border-[#00d4ff]"
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-16 text-right">= R{(item.quantity * item.price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                {/* Live total preview */}
                <div className="mt-2 flex justify-between text-sm font-bold text-[#00d4ff] bg-gray-800/30 rounded px-3 py-2">
                  <span>Total (items + shipping)</span>
                  <span>R{(editItems.reduce((s, i) => s + i.quantity * i.price, 0) + Number(editForm.shippingCost || editOrder?.shipping_cost || 0)).toFixed(0)}</span>
                </div>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2 font-medium">Customer</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Full Name</label>
                    <input value={editForm.name} onChange={e => upd('name', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <input value={editForm.phone} onChange={e => upd('phone', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-gray-400">Email Address</label>
                  <input type="email" value={editForm.email} onChange={e => upd('email', e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2 font-medium">Delivery Address</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Street Address</label>
                    <input value={editForm.street} onChange={e => upd('street', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Suburb</label>
                    <input value={editForm.suburb} onChange={e => upd('suburb', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">City</label>
                      <input value={editForm.city} onChange={e => upd('city', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Postal Code</label>
                      <input value={editForm.postalCode} onChange={e => upd('postalCode', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Province</label>
                    <select value={editForm.province} onChange={e => upd('province', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]">
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2 font-medium">Shipping Method</p>
                <select value={editForm.shippingMethod} onChange={e => upd('shippingMethod', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]">
                  {Object.entries(SHIPPING_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="mt-3">
                  <label className="text-xs text-gray-400">Shipping Cost (R)</label>
                  <input
                    type="number" min="0" step="0.01" value={editForm.shippingCost || 0}
                    onChange={e => upd('shippingCost', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-400">Internal Notes</label>
                <textarea value={editForm.notes} onChange={e => upd('notes', e.target.value)} rows={2}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button onClick={() => setEditOrder(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#00d4ff] hover:bg-[#00a8cc] text-black text-sm font-bold rounded-lg transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
