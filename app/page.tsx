'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', referral: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden hero-gradient">
        {/* Particle dots */}
        <div className="particle-bg" />
        {/* Geometric grid overlay */}
        <div className="absolute inset-0 geo-grid opacity-50" />
        {/* Molecular glow */}
        <div className="absolute inset-0 molecular-bg" />
        
        {/* Floating glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4ff]/[0.02] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[#00d4ff]/[0.03] rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24 w-full">
          <div className="text-center mb-16">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[0.2em] mb-6 uppercase text-glow">
              <span className="text-white">APEX</span>
              <span className="block text-[#00d4ff] text-glow-accent">PROTOCOL</span>
            </h1>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent mx-auto mb-6" />
            <p className="text-gray-400 text-sm sm:text-base tracking-[0.4em] uppercase font-light">
              Performance Engineered
            </p>
          </div>

          {/* Contact Form */}
          {submitted ? (
            <div className="max-w-lg mx-auto text-center animate-fade-in-up">
              <div className="glass rounded-lg p-10 border border-[#00d4ff]/20">
                <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold mb-2 uppercase tracking-wider text-white">Request Received</h2>
                <p className="text-gray-400">We&apos;ll review your application and be in touch shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass rounded-lg p-6 md:p-8">
                {/* SA Only badge */}
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-widest uppercase bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
                    🇿🇦 South Africa Only
                  </span>
                </div>

                <h2 className="font-display text-lg font-bold mb-1 uppercase tracking-wider text-center text-white">Request Access</h2>
                <p className="text-sm text-gray-500 mb-6 text-center">Interested in our products? Apply below.</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={e => update('firstName', e.target.value)}
                        className="input-floating peer"
                        placeholder=" "
                      />
                      <label className="input-floating-label">First Name</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={e => update('lastName', e.target.value)}
                        className="input-floating peer"
                        placeholder=" "
                      />
                      <label className="input-floating-label">Last Name</label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="input-floating peer"
                      placeholder=" "
                    />
                    <label className="input-floating-label">Email Address</label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.referral}
                      onChange={e => update('referral', e.target.value)}
                      className="input-floating peer"
                      placeholder=" "
                    />
                    <label className="input-floating-label">Referred by (Friend&apos;s Name)</label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      className="input-floating peer h-28 resize-none pt-6"
                      placeholder=" "
                    />
                    <label className="input-floating-label !top-6 peer-focus:!top-3 peer-[:not(:placeholder-shown)]:!top-3">Message (Optional)</label>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Submitting...
                      </span>
                    ) : 'REQUEST ACCESS'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Existing customer link */}
          <div className="text-center mt-8">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-[#00d4ff] transition-colors tracking-wide">
              Existing customer? Sign in →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
