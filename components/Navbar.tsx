'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from './CartProvider';
import AdminNav from './AdminNav';

export default function Navbar() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === '/';

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user)).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  // If user is admin, show admin navbar instead
  if (user?.is_admin) {
    return <AdminNav />;
  }

  const navLinkClass = (path: string) =>
    `text-xs font-medium tracking-[0.15em] uppercase transition-all relative py-1 ${
      pathname === path
        ? 'text-[#00d4ff]'
        : 'text-gray-400 hover:text-white'
    }`;

  const activeIndicator = (path: string) =>
    pathname === path ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#00d4ff]' : 'hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-[2px] hover:after:bg-[#00d4ff]/30';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding
          ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1f2937]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={user ? '/catalog' : '/'} className="flex items-center gap-2 group">
              <span className="font-display text-base sm:text-lg font-bold tracking-[0.2em] uppercase text-white group-hover:text-[#00d4ff] transition-colors">
                APEX PROTOCOL
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {user && (
                <>
                  <Link href="/catalog" className={`${navLinkClass('/catalog')} ${activeIndicator('/catalog')}`}>Products</Link>
                  <Link href="/orders" className={`${navLinkClass('/orders')} ${activeIndicator('/orders')}`}>Orders</Link>
                </>
              )}
              {user ? (
                <>
                  <Link href="/cart" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    {totalItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#00d4ff] text-[#0a0a0a] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors tracking-wider uppercase">
                    Sign Out
                  </button>
                </>
              ) : (
                !isLanding && (
                  <Link href="/auth/login" className="text-xs font-medium text-gray-400 hover:text-[#00d4ff] transition-colors tracking-wider uppercase">
                    Sign In
                  </Link>
                )
              )}
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-3">
              {user && (
                <Link href="/cart" className="relative p-2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#00d4ff] text-[#0a0a0a] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden py-4 border-t border-[#1f2937] animate-fade-in-up">
              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href="/catalog" className="text-sm font-medium text-gray-400 hover:text-[#00d4ff] tracking-wider uppercase py-1" onClick={() => setMenuOpen(false)}>Products</Link>
                    <Link href="/orders" className="text-sm font-medium text-gray-400 hover:text-[#00d4ff] tracking-wider uppercase py-1" onClick={() => setMenuOpen(false)}>Orders</Link>
                    <Link href="/terms" className="text-sm font-medium text-gray-400 hover:text-[#00d4ff] tracking-wider uppercase py-1" onClick={() => setMenuOpen(false)}>T&Cs</Link>
                    <button onClick={handleLogout} className="text-left text-sm font-medium text-red-400/70 hover:text-red-400 tracking-wider uppercase py-1">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-[#00d4ff] tracking-wider uppercase py-1" onClick={() => setMenuOpen(false)}>Sign In</Link>
                    <Link href="/auth/register" className="text-sm font-medium text-gray-400 hover:text-[#00d4ff] tracking-wider uppercase py-1" onClick={() => setMenuOpen(false)}>Register</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      {user && (
        <div className="mobile-bottom-nav md:hidden">
          <div className="flex items-center justify-around">
            <Link href="/catalog" className={`flex flex-col items-center gap-1 px-4 py-1 ${pathname === '/catalog' ? 'text-[#00d4ff]' : 'text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="text-[10px] font-medium tracking-wider uppercase">Products</span>
            </Link>
            <Link href="/cart" className={`flex flex-col items-center gap-1 px-4 py-1 relative ${pathname === '/cart' ? 'text-[#00d4ff]' : 'text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 right-2 bg-[#00d4ff] text-[#0a0a0a] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{totalItems}</span>
              )}
              <span className="text-[10px] font-medium tracking-wider uppercase">Cart</span>
            </Link>
            <Link href="/orders" className={`flex flex-col items-center gap-1 px-4 py-1 ${pathname === '/orders' ? 'text-[#00d4ff]' : 'text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[10px] font-medium tracking-wider uppercase">Account</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
