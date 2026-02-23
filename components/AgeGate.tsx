'use client';

import { useState, useEffect } from 'react';

export default function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('apex_age_verified')) setShow(true);
  }, []);

  if (!show) return null;

  const confirm = () => {
    localStorage.setItem('apex_age_verified', '1');
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 age-gate-backdrop">
      <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-8 max-w-md mx-4 text-center">
        {/* Shield icon */}
        <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold mb-3 uppercase tracking-wider text-white">Age Verification</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          You must be at least <span className="text-white font-semibold">18 years old</span> to access this site.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={confirm} className="btn-primary w-full text-base py-3.5">
            I AM 18+
          </button>
          <button
            onClick={() => window.location.href = 'https://google.com'}
            className="btn-secondary w-full text-sm py-2.5 opacity-60 hover:opacity-100"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
