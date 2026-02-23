'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { useState } from 'react';

interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  sell_price: number;
  image: string;
  sold_out: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.sell_price),
      image: product.image,
    }, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="card card-hover group relative flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-[#0a0f1a]">
          <img
            src={`/images/products/${product.image}`}
            alt={product.name}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Sold out overlay */}
          {product.sold_out ? (
            <div className="sold-out-overlay">
              <span className="sold-out-badge">SOLD OUT</span>
            </div>
          ) : null}
        </div>
      </Link>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-sm mb-1.5 text-white group-hover:text-[#00d4ff] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">{product.description}</p>

        {/* Price */}
        <div className="text-2xl font-bold text-[#00d4ff] font-display mb-4">
          R{Number(product.sell_price).toFixed(0)}
        </div>

        {/* Action */}
        {product.sold_out ? (
          <Link
            href={`/products/${product.slug}`}
            className="w-full py-3 rounded-lg text-center text-sm font-bold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            NOTIFY ME
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            {/* Qty selector */}
            <div className="flex items-center border border-[#1f2937] rounded-lg overflow-hidden shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                className="px-2.5 py-2.5 hover:bg-[#1f2937] text-gray-400 hover:text-white text-sm transition-colors font-bold"
              >−</button>
              <span className="px-2 py-2.5 text-sm font-medium text-white min-w-[28px] text-center border-x border-[#1f2937]">{qty}</span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(qty + 1); }}
                className="px-2.5 py-2.5 hover:bg-[#1f2937] text-gray-400 hover:text-white text-sm transition-colors font-bold"
              >+</button>
            </div>
            {/* Add to cart */}
            <button
              onClick={handleAdd}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                added
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-[#00d4ff] text-[#0a0a0a] hover:bg-[#00a8cc] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]'
              }`}
            >
              {added ? '✓ ADDED' : 'ADD TO CART'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
