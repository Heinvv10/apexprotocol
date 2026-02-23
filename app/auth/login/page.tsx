'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setLoading(false);
    } else {
      if (data.user.is_admin) router.push('/admin');
      else router.push('/orders');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-apex-text">Sign In</h1>
          <div className="w-8 h-[2px] bg-apex-accent mx-auto mt-3" />
        </div>
        
        <div className="card p-6 md:p-8 border-apex-border">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-floating peer" placeholder=" " required />
              <label className="input-floating-label">Email</label>
            </div>
            <div className="relative">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-floating peer" placeholder=" " required />
              <label className="input-floating-label">Password</label>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm mt-6 text-apex-muted/60">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-apex-accent hover:text-apex-accent-dim font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
