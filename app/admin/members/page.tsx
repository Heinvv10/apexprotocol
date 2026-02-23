'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Member = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  referral: string | null;
  approved: number;
  created_at: string;
  order_count: number;
  completed_orders: number;
  pending_orders: number;
  total_spent: number;
  last_order_date: string | null;
};

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchMembers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/members');
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAction = async (userId: number, action: 'approve' | 'reject') => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this member?`)) return;
    
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });

    if (res.ok) {
      fetchMembers();
    } else {
      alert('Failed to ' + action + ' member');
    }
  };

  const filteredMembers = members.filter(m => {
    if (filter === 'pending') return m.approved === 0;
    if (filter === 'approved') return m.approved === 1;
    return true;
  });

  const pendingCount = members.filter(m => m.approved === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Members</h1>
        <p className="text-sm text-gray-400">Manage customer accounts and approvals</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: 'All Members', count: members.length },
          { key: 'pending' as const, label: 'Pending Approval', count: pendingCount },
          { key: 'approved' as const, label: 'Approved', count: members.length - pendingCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-apex-accent text-apex-black'
                : 'bg-apex-card text-gray-400 hover:bg-apex-card/80'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading members...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400">No {filter !== 'all' ? filter : ''} members found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-apex-border">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Member</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Referred By</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Orders</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Total Spent</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id} className="border-b border-apex-border/50 hover:bg-apex-card/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">{member.name}</div>
                        <div className="text-sm text-gray-400">{member.email}</div>
                        {member.phone && <div className="text-xs text-gray-500">{member.phone}</div>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{member.referral || '—'}</td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="text-white">{member.order_count} total</div>
                        <div className="text-xs text-gray-400">
                          {member.completed_orders} delivered, {member.pending_orders} pending
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white">
                      R{member.total_spent ? member.total_spent.toFixed(2) : '0.00'}
                    </td>
                    <td className="p-4">
                      {member.approved === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          ✓ Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(member.created_at).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/members/${member.id}`)}
                          className="px-3 py-1.5 text-xs font-medium rounded bg-apex-card hover:bg-apex-card/80 text-gray-300 transition-colors"
                        >
                          View Details
                        </button>
                        {member.approved === 0 && (
                          <>
                            <button
                              onClick={() => handleAction(member.id, 'approve')}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleAction(member.id, 'reject')}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
