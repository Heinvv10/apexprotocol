'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', referral: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (!form.referral.trim()) { setError('A referral name is required to register'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password, referral: form.referral }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); }
    else setSuccess(true);
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md text-center">
          <div className="card p-8 border-apex-border">
            <div className="text-5xl mb-4">📨</div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-apex-text mb-3">Request Submitted</h1>
            <div className="w-8 h-[2px] bg-apex-accent mx-auto mb-6" />
            <p className="text-apex-muted/80 mb-2">
              Your access request has been sent to our admin team for review.
            </p>
            <p className="text-apex-muted/60 text-sm mb-6">
              You&apos;ll receive an email at <strong className="text-apex-accent">{form.email}</strong> once your account is approved.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-apex-text">Request Access</h1>
          <div className="w-8 h-[2px] bg-apex-accent mx-auto mt-3" />
          <p className="text-apex-muted/60 text-sm mt-3">
            Apex Protocol is invite-only. Enter who referred you and we&apos;ll review your request.
          </p>
        </div>

        <div className="card p-6 md:p-8 border-apex-border">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input value={form.name} onChange={e => update('name', e.target.value)} className="input-floating peer" placeholder=" " required />
              <label className="input-floating-label">Full Name</label>
            </div>
            <div className="relative">
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-floating peer" placeholder=" " required />
              <label className="input-floating-label">Email</label>
            </div>
            <div className="relative">
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="input-floating peer" placeholder=" " />
              <label className="input-floating-label">Phone (optional)</label>
            </div>
            <div className="relative">
              <input value={form.referral} onChange={e => update('referral', e.target.value)} className="input-floating peer" placeholder=" " required />
              <label className="input-floating-label">Who referred you?</label>
            </div>
            <div className="relative">
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input-floating peer" placeholder=" " required minLength={6} />
              <label className="input-floating-label">Password</label>
            </div>
            <div className="relative">
              <input type="password" value={form.confirm} onChange={e => update('confirm', e.target.value)} className="input-floating peer" placeholder=" " required />
              <label className="input-floating-label">Confirm Password</label>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Submitting...' : 'Request Access'}
            </button>
          </form>
          <p className="text-center text-sm mt-6 text-apex-muted/60">
            Already approved?{' '}
            <Link href="/auth/login" className="text-apex-accent hover:text-apex-accent-dim font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
