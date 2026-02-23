'use client';

import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  'Awaiting Payment': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Processing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Shipped': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function OrdersPage() {
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const searchByEmail = async () => {
    const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setOrder(null);
    setSearched(true);
  };

  const searchByRef = async () => {
    const res = await fetch(`/api/orders?ref=${encodeURIComponent(ref)}`);
    const data = await res.json();
    setOrder(data.order || null);
    setOrders([]);
    setSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Track Orders</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card p-4">
          <label className="text-sm font-medium mb-2 block">Search by Order Reference</label>
          <div className="flex gap-2">
            <input placeholder="LA-XXXXXXXX" value={ref} onChange={e => setRef(e.target.value)} className="input-field" />
            <button onClick={searchByRef} className="btn-primary whitespace-nowrap">Search</button>
          </div>
        </div>
        <div className="card p-4">
          <label className="text-sm font-medium mb-2 block">Search by Email</label>
          <div className="flex gap-2">
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
            <button onClick={searchByEmail} className="btn-primary whitespace-nowrap">Search</button>
          </div>
        </div>
      </div>

      {order && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{order.ref}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
              {order.status}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-gray-500">Name:</span> {order.guest_name}</div>
            <div><span className="text-gray-500">Email:</span> {order.guest_email}</div>
            <div><span className="text-gray-500">Shipping:</span> {order.shipping_method} (R{order.shipping_cost})</div>
            <div><span className="text-gray-500">Date:</span> {new Date(order.created_at).toLocaleDateString()}</div>
          </div>
          {order.items && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.name} × {item.quantity}</span>
                  <span>R{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span><span>R{order.total.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{o.ref}</p>
                <p className="text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()} · R{o.total.toFixed(0)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {searched && !order && orders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  );
}
