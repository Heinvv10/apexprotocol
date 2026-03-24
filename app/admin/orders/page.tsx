'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const STATUSES = ['Awaiting Payment', 'Quote Sent', 'Payment Received', 'Payment Sent', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Awaiting Payment': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  'Quote Sent':       { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Payment Received': { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  'Payment Sent':     { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   dot: 'bg-cyan-400' },
  'Processing':       { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  'Shipped':          { bg: 'bg-indigo-500/15', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  'Completed':        { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400' },
  'Cancelled':        { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
};

const SHIPPING_METHODS: Record<string, string> = {
  courier_door:   'The Courier Guy (Door-to-Door)',
  courier_kiosk:  'The Courier Guy (Kiosk)',
  postnet:        'PostNet (Counter)',
  fastway:        'Fastway (Door-to-Door)',
};

const PROVINCES = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cfg = STATUS_CONFIG[value] || { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 cursor-pointer transition-all hover:border-white/20 ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {value}
        <svg className={`w-3 h-3 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-[#1a2235] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {STATUSES.map(s => {
            const c = STATUS_CONFIG[s] || { bg: '', text: 'text-gray-400', dot: 'bg-gray-400' };
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all hover:bg-white/5 ${s === value ? 'bg-white/5' : ''} ${c.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                {s}
                {s === value && <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY_NEW_ORDER = {
  name: '', email: '', phone: '', notes: '',
  street: '', suburb: '', city: '', province: 'Gauteng', postalCode: '',
  shippingMethod: 'courier_door', shippingCost: '180',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editItems, setEditItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [emailResult, setEmailResult] = useState<{id: number, msg: string} | null>(null);

  // Create Order state
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState<any>(EMPTY_NEW_ORDER);
  const [newItems, setNewItems] = useState<any[]>([{ product_id: '', name: '', quantity: 1, price: '' }]);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string[]>(['']);

  const load = async () => {
    const [ordersRes, productsRes] = await Promise.all([
      fetch('/api/admin/orders'),
      fetch('/api/admin/products'),
    ]);
    const ordersData = await ordersRes.json();
    setOrders(ordersData.orders || []);
    try {
      const productsData = await productsRes.json();
      setProducts(productsData.products || productsData || []);
    } catch {}
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

  const updNew = (field: string, value: string) => setNewForm((p: any) => ({ ...p, [field]: value }));

  const setNewItem = (idx: number, field: string, value: any) => {
    setNewItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addNewItem = () => {
    setNewItems(prev => [...prev, { product_id: '', name: '', quantity: 1, price: '' }]);
    setProductSearch(prev => [...prev, '']);
  };

  const removeNewItem = (idx: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== idx));
    setProductSearch(prev => prev.filter((_, i) => i !== idx));
  };

  const selectProduct = (idx: number, product: any) => {
    setNewItems(prev => prev.map((it, i) => i === idx
      ? { ...it, product_id: product.id, name: product.name, price: String(product.price) }
      : it));
    setProductSearch(prev => prev.map((s, i) => i === idx ? product.name : s));
  };

  const createOrder = async () => {
    setCreating(true);
    setCreateResult(null);
    const validItems = newItems.filter(i => i.name && Number(i.quantity) > 0 && Number(i.price) > 0);
    if (!newForm.name || !validItems.length) {
      setCreateResult('❌ Customer name and at least one item with price are required.');
      setCreating(false);
      return;
    }
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: newForm.name, email: newForm.email, phone: newForm.phone, notes: newForm.notes },
        shipping: {
          street: newForm.street, suburb: newForm.suburb, city: newForm.city,
          province: newForm.province, postalCode: newForm.postalCode,
          shippingMethod: newForm.shippingMethod, shippingCost: Number(newForm.shippingCost || 0),
        },
        items: validItems,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setCreateResult(`✅ Order ${data.ref} created!`);
      setNewForm(EMPTY_NEW_ORDER);
      setNewItems([{ product_id: '', name: '', quantity: 1, price: '' }]);
      setProductSearch(['']);
      load();
      setTimeout(() => { setShowCreate(false); setCreateResult(null); }, 1800);
    } else {
      setCreateResult(`❌ ${data.error || 'Failed to create order'}`);
    }
    setCreating(false);
  };

  const newSubtotal = newItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
  const newTotal = newSubtotal + Number(newForm.shippingCost || 0);

  const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);

  if (loading) return <div className="animate-pulse text-gray-400">Loading orders...</div>;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Orders</h1>
        <button
          onClick={() => { setShowCreate(true); setCreateResult(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d4ff] hover:bg-[#00b8d9] text-black text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#00d4ff]/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['All', ...STATUSES].map(s => {
          const cfg = STATUS_CONFIG[s];
          const isActive = statusFilter === s;
          const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? cfg ? `${cfg.bg} ${cfg.text} border-current/30` : 'bg-brand-600 text-white border-brand-500'
                  : 'bg-gray-800/50 text-gray-500 border-transparent hover:text-gray-300'
              }`}>
              {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
              {s} <span className={`${isActive ? 'opacity-70' : 'opacity-50'}`}>({count})</span>
            </button>
          );
        })}
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
                <StatusBadge status={o.status} />
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
              <StatusDropdown value={o.status} onChange={s => updateStatus(o.id, s)} />
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

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-white">Create New Order</h2>
                <p className="text-xs text-gray-400 mt-0.5">Place a manual order for a phone customer</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-5">

              {/* Customer Details */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Customer Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Full Name *</label>
                    <input value={newForm.name} onChange={e => updNew('name', e.target.value)} placeholder="e.g. John Smith"
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <input value={newForm.phone} onChange={e => updNew('phone', e.target.value)} placeholder="0821234567"
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email (optional)</label>
                    <input type="email" value={newForm.email} onChange={e => updNew('email', e.target.value)} placeholder="john@email.com"
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Order Items *</p>
                <div className="space-y-2">
                  {newItems.map((item, idx) => {
                    const filtered_products = products.filter((p: any) =>
                      !productSearch[idx] || p.name.toLowerCase().includes(productSearch[idx].toLowerCase())
                    ).slice(0, 8);
                    return (
                      <div key={idx} className="bg-gray-800/60 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <label className="text-xs text-gray-400">Product</label>
                            <input
                              value={productSearch[idx] || item.name}
                              onChange={e => {
                                setProductSearch(prev => prev.map((s, i) => i === idx ? e.target.value : s));
                                setNewItem(idx, 'name', e.target.value);
                                setNewItem(idx, 'product_id', '');
                              }}
                              placeholder="Search or type product name..."
                              className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600"
                            />
                            {productSearch[idx] && !item.product_id && filtered_products.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2235] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                {filtered_products.map((p: any) => (
                                  <button key={p.id} onClick={() => selectProduct(idx, p)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 text-left">
                                    <span className="text-white truncate">{p.name}</span>
                                    <span className="text-[#00d4ff] font-bold ml-2 flex-shrink-0">R{Number(p.price).toFixed(0)}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {newItems.length > 1 && (
                            <button onClick={() => removeNewItem(idx)}
                              className="mt-5 text-red-400 hover:text-red-300 text-lg leading-none flex-shrink-0">✕</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">Qty</label>
                            <input type="number" min="1" value={item.quantity}
                              onChange={e => setNewItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#00d4ff]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Unit Price (R)</label>
                            <input type="number" min="0" step="0.01" value={item.price}
                              onChange={e => setNewItem(idx, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                          </div>
                        </div>
                        {item.name && item.price && (
                          <p className="text-xs text-right text-gray-400">
                            Line total: <span className="text-[#00d4ff] font-bold">R{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(0)}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={addNewItem}
                  className="mt-2 w-full py-2 border border-dashed border-gray-600 hover:border-[#00d4ff] text-gray-400 hover:text-[#00d4ff] text-xs font-medium rounded-xl transition-all">
                  + Add Another Item
                </button>
              </div>

              {/* Delivery Address */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Delivery Address</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Street Address</label>
                    <input value={newForm.street} onChange={e => updNew('street', e.target.value)} placeholder="123 Main Street"
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">Suburb</label>
                      <input value={newForm.suburb} onChange={e => updNew('suburb', e.target.value)} placeholder="Suburb"
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">City</label>
                      <input value={newForm.city} onChange={e => updNew('city', e.target.value)} placeholder="City"
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">Province</label>
                      <select value={newForm.province} onChange={e => updNew('province', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]">
                        {PROVINCES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Postal Code</label>
                      <input value={newForm.postalCode} onChange={e => updNew('postalCode', e.target.value)} placeholder="0000"
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] placeholder-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Shipping</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Method</label>
                    <select value={newForm.shippingMethod} onChange={e => updNew('shippingMethod', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff]">
                      {Object.entries(SHIPPING_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Shipping Cost (R)</label>
                    <input type="number" min="0" value={newForm.shippingCost} onChange={e => updNew('shippingCost', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-400">Internal Notes (optional)</label>
                <textarea value={newForm.notes} onChange={e => updNew('notes', e.target.value)} rows={2} placeholder="Phone order, special instructions..."
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] resize-none placeholder-gray-600" />
              </div>

              {/* Order total */}
              <div className="bg-gray-800/40 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <span>Subtotal: <span className="text-white font-medium">R{newSubtotal.toFixed(0)}</span></span>
                  <span className="mx-2">·</span>
                  <span>Shipping: <span className="text-white font-medium">R{Number(newForm.shippingCost || 0).toFixed(0)}</span></span>
                </div>
                <div className="text-[#00d4ff] font-bold text-lg">R{newTotal.toFixed(0)}</div>
              </div>

              {createResult && (
                <div className={`p-3 rounded-xl text-sm font-medium ${createResult.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {createResult}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={createOrder} disabled={creating}
                className="flex-1 px-4 py-2.5 bg-[#00d4ff] hover:bg-[#00b8d9] text-black text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? (
                  <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Creating...</>
                ) : '+ Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

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
