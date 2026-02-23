'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="border-t border-[#1f2937] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-600 tracking-wider">
          <span>© {new Date().getFullYear()} Apex Protocol</span>
          <span className="hidden sm:inline text-[#1f2937]">·</span>
          <a href="/terms" className="hover:text-gray-400 transition-colors">Terms</a>
          <span className="hidden sm:inline text-[#1f2937]">·</span>
          <span>apexprotocol.co.za</span>
        </div>
      </div>
    </footer>
  );
}
