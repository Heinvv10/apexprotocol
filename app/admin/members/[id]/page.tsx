'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Order = {
  id: number;
  ref: string;
  status: string;
  supplier_status: string | null;
  supplier_order_id: string | null;
  tracking_number: string | null;
  total: number;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
};

type MemberDetails = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  referral: string | null;
  approved: number;
  created_at: string;
  orders: Order[];
};

const STATUS_COLORS: Record<string, string> = {
  'Awaiting Payment': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Paid': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Quote Sent': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Processing': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Shipped': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Completed': 'bg-green-600/10 text-green-500 border-green-600/20',
  'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id;
  
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    
    fetch(`/api/admin/members/${memberId}`)
      .then(res => res.json())
      .then(data => {
        if (data.member) {
          setMember(data.member);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading member details...</div>;
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Member not found</p>
        <Link href="/admin/members" className="text-apex-accent hover:underline">
          ← Back to Members
        </Link>
      </div>
    );
  }

  const stats = [
    { label: 'Total Orders', value: member.orders.length },
    { label: 'Completed', value: member.orders.filter(o => o.status === 'Completed').length },
    { label: 'In Progress', value: member.orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length },
    { label: 'Total Spent', value: `R${member.orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/members" className="text-sm text-gray-400 hover:text-apex-accent transition-colors mb-2 inline-block">
          ← Back to Members
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{member.name}</h1>
            <p className="text-sm text-gray-400">{member.email}</p>
            {member.phone && <p className="text-sm text-gray-500">{member.phone}</p>}
          </div>
          <div className="flex items-center gap-2">
            {member.approved === 1 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                ✓ Approved Member
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                ⏳ Pending Approval
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Referred By</div>
          <div className="text-base text-white">{member.referral || 'Direct'}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Member Since</div>
          <div className="text-base text-white">
            {new Date(member.created_at).toLocaleDateString('en-ZA', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="card p-4">
            <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Order History</h2>
        {member.orders.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-400">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {member.orders.map(order => (
              <div key={order.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{order.ref}</h3>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-ZA', { 
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">R{Number(order.total).toFixed(2)}</div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-apex-border pt-4 mb-4">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="text-gray-400">R{Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplier Info */}
                {(order.supplier_order_id || order.supplier_status || order.tracking_number) && (
                  <div className="border-t border-apex-border pt-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {order.supplier_order_id && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Supplier Order</div>
                          <div className="text-sm text-white">#{order.supplier_order_id}</div>
                        </div>
                      )}
                      {order.supplier_status && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Supplier Status</div>
                          <div className="text-sm text-gray-300 capitalize">{order.supplier_status.replace('_', ' ')}</div>
                        </div>
                      )}
                      {order.tracking_number && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Tracking</div>
                          <div className="text-sm text-apex-accent font-mono">{order.tracking_number}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
