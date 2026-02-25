'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user)).catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1f2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="font-display text-base sm:text-lg font-bold tracking-[0.2em] uppercase text-white group-hover:text-[#00d4ff] transition-colors">
              APEX PROTOCOL
            </span>
          </Link>

          {/* Admin Panel Link */}
          <div className="flex items-center gap-6">
            <Link 
              href="/admin" 
              className="text-xs font-medium tracking-[0.15em] uppercase text-gray-400 hover:text-[#00d4ff] transition-colors"
            >
              Admin Panel
            </Link>
            
            <button 
              onClick={handleLogout} 
              className="text-xs text-gray-600 hover:text-red-400 transition-colors tracking-wider uppercase"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
