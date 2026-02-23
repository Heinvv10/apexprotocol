'use client';

import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      setSettings(d.settings || {});
      setLoading(false);
    });
  }, []);

  const update = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Supplier Integration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-1">Supplier Integration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Credentials for Muscles SA (my.muscles.co.za). Used for automated order sync.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Supplier Email</label>
            <input
              type="email"
              value={settings.supplier_email || ''}
              onChange={e => update('supplier_email', e.target.value)}
              className="input-field"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Supplier Password</label>
            <input
              type="password"
              value={settings.supplier_password || ''}
              onChange={e => update('supplier_password', e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-400 mt-1">Stored locally in SQLite. Will be encrypted in production.</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h4 className="font-medium text-sm mb-2">Supplier Cart API Reference</h4>
          <div className="text-xs text-gray-500 font-mono space-y-1">
            <p>Endpoint: POST https://my.muscles.co.za/helpers/cart.php</p>
            <p>Payload: {`{func: "update_cart_items", id: <supplier_product_id>, qty: <quantity>}`}</p>
            <p>Auth: Session cookie from login</p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-1">Pricing Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Global markup is managed on the Pricing tab. Current value: <strong>{settings.global_markup_percentage}%</strong>
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>📐 Sell Price = Base Price × (1 + markup%)</p>
          <p>🎯 Per-product price override takes priority</p>
          <p>📊 Per-product markup override takes next priority</p>
          <p>🌐 Global markup applies to everything else</p>
        </div>
      </div>

      {/* Future features */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-1">Coming Soon</h2>
        <div className="space-y-2 text-sm text-gray-500">
          <p>🔄 <strong>Automated supplier sync</strong> — Auto-place orders on Muscles SA</p>
          <p>💳 <strong>PayFast integration</strong> — Online card payments</p>
          <p>📧 <strong>Email notifications</strong> — Order confirmations & tracking</p>
          <p>📊 <strong>Analytics dashboard</strong> — Sales trends, popular products</p>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="text-green-600 text-sm">✓ Settings saved</span>}
      </div>
    </div>
  );
}
