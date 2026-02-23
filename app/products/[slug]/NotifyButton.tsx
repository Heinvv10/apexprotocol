'use client';

import { useState } from 'react';

export default function NotifyButton({ productId }: { productId: number }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = async () => {
    if (!email) return;
    await fetch('/api/products/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, email }),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return <p className="text-apex-accent font-medium text-sm tracking-wide">✓ We&apos;ll notify you when this product is back in stock.</p>;
  }

  return (
    <div className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email for restock notification"
        className="input-field flex-1"
      />
      <button onClick={handleNotify} className="btn-primary whitespace-nowrap">Notify Me</button>
    </div>
  );
}
