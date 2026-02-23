'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

const FREE_SHIPPING_THRESHOLD = 4600;

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();

  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[#111827] border border-[#1f2937] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold mb-2 uppercase tracking-wider text-white">Your Cart is Empty</h1>
        <p className="text-gray-500 text-sm mb-8">Browse our catalog to find what you need.</p>
        <Link href="/catalog" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-8">
      <h1 className="font-display text-3xl font-bold mb-8 uppercase tracking-wider text-white">
        Cart <span className="text-gray-500 text-lg font-normal">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card flex items-center gap-4 p-4">
              <Link href={`/products/${item.slug}`} className="shrink-0">
                <img src={`/images/products/${item.image}`} alt={item.name} className="w-20 h-20 object-contain rounded-lg bg-[#0a0f1a] p-2" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="font-bold text-sm text-white hover:text-[#00d4ff] transition-colors block truncate">
                  {item.name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">R{item.price.toFixed(0)} each</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#1f2937] rounded-lg overflow-hidden">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-2 hover:bg-[#1f2937] text-gray-400 hover:text-white text-sm transition-colors font-bold">−</button>
                  <span className="px-3 py-2 text-sm font-medium border-x border-[#1f2937] text-white min-w-[40px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2 hover:bg-[#1f2937] text-gray-400 hover:text-white text-sm transition-colors font-bold">+</button>
                </div>
                <span className="font-bold text-sm w-20 text-right text-[#00d4ff] font-display">R{(item.price * item.quantity).toFixed(0)}</span>
                <button onClick={() => removeItem(item.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart summary sidebar */}
        <div>
          <div className="card p-6 sticky top-24">
            <h3 className="font-display text-sm font-bold mb-4 uppercase tracking-wider text-white">Order Summary</h3>
            
            {/* Free shipping progress */}
            <div className="mb-5">
              <div className="shipping-progress-bar mb-2">
                <div className="fill" style={{ width: `${shippingProgress}%` }} />
              </div>
              {remaining > 0 ? (
                <p className="text-xs text-gray-500">Add <span className="text-[#00d4ff] font-medium">R{remaining.toFixed(0)}</span> more for free shipping!</p>
              ) : (
                <p className="text-xs text-green-400 font-medium">✓ Free shipping unlocked!</p>
              )}
            </div>

            <div className="space-y-2 mb-4 border-t border-[#1f2937] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">R{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className={remaining <= 0 ? 'text-green-400 font-medium' : 'text-gray-400'}>
                  {remaining <= 0 ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-xl border-t border-[#1f2937] pt-4 mb-6">
              <span className="text-white">Total</span>
              <span className="text-[#00d4ff] font-display">R{subtotal.toFixed(0)}</span>
            </div>

            {subtotal < 200 && (
              <p className="text-xs text-red-400 mb-3">Minimum order: R200</p>
            )}

            <Link
              href={subtotal >= 200 ? '/checkout' : '#'}
              className={`btn-primary w-full text-center block ${subtotal < 200 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              Proceed to Checkout
            </Link>

            <Link href="/catalog" className="block text-center text-xs text-gray-500 hover:text-[#00d4ff] transition-colors mt-4">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
