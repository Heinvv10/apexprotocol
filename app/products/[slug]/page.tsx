import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';
import NotifyButton from './NotifyButton';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProductTabs from './ProductTabs';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const db = getDb();
  const product = await db.prepare('SELECT * FROM products WHERE slug = ?').get(params.slug) as any;
  if (!product) notFound();

  const related = await db.prepare('SELECT * FROM products WHERE category = ? AND id != ? ORDER BY RANDOM() LIMIT 4')
    .all(product.category, product.id) as any[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-8">
      {/* Breadcrumb */}
      <nav className="text-xs mb-8 text-gray-500 tracking-wider uppercase">
        <Link href="/catalog" className="hover:text-[#00d4ff] transition-colors">Products</Link>
        <span className="mx-2 text-[#1f2937]">/</span>
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-[#00d4ff] transition-colors">{product.category}</Link>
        <span className="mx-2 text-[#1f2937]">/</span>
        <span className="text-gray-400">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Product Image */}
        <div className="rounded-lg overflow-hidden bg-[#0a0f1a] border border-[#1f2937] p-8 flex items-center justify-center aspect-square group">
          <img
            src={`/images/products/${product.image}`}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <p className="text-[10px] font-medium text-[#00d4ff] tracking-[0.2em] uppercase mb-3">{product.category}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-white uppercase tracking-wide">{product.name}</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed whitespace-pre-line">{product.description}</p>

          <div className="text-4xl font-bold text-[#00d4ff] font-display mb-8">
            R{product.sell_price.toFixed(0)}
          </div>

          {product.sold_out ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-bold tracking-wider uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                Currently Sold Out
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3">Get notified when this product is back in stock:</p>
                <NotifyButton productId={product.id} />
              </div>
            </div>
          ) : (
            <AddToCartButton product={product} />
          )}

          {/* Quick shipping info */}
          <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            <span>Free shipping on orders over R4,600 · Dispatched Mon–Thu</span>
          </div>
        </div>
      </div>

      {/* Tabbed section */}
      <ProductTabs product={product} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl font-bold mb-6 uppercase tracking-wider text-white">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {related.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
