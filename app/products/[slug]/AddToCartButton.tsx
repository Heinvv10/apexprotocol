'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';

export default function AddToCartButton({ product }: { product: any }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.sell_price,
      image: product.image,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-apex-border rounded">
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2.5 hover:bg-apex-card transition-colors text-apex-muted hover:text-apex-text font-bold">−</button>
        <input
          type="number"
          value={qty}
          onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 text-center py-2.5 border-x border-apex-border bg-transparent text-apex-text text-sm"
          min={1}
        />
        <button onClick={() => setQty(qty + 1)} className="px-4 py-2.5 hover:bg-apex-card transition-colors text-apex-muted hover:text-apex-text font-bold">+</button>
      </div>
      <button
        onClick={handleAdd}
        className={`btn-primary flex-1 ${added ? '!bg-green-500 !text-white' : ''}`}
      >
        {added ? '✓ Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  );
}
