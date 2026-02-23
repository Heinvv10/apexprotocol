import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getGlobalMarkup, setGlobalMarkup, recalcAllPrices, setProductPriceOverride, setProductMarkupOverride } from '@/lib/pricing';

export async function GET() {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const globalMarkup = await getGlobalMarkup();
  const products = await db.prepare(`
    SELECT id, name, category, base_price, sell_price, price_override, markup_override, sold_out, supplier_product_id
    FROM products ORDER BY category, name
  `).all();

  return NextResponse.json({ globalMarkup, products });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Update global markup
  if (body.globalMarkup !== undefined) {
    const markup = parseFloat(body.globalMarkup);
    if (isNaN(markup) || markup < 0 || markup > 500) {
      return NextResponse.json({ error: 'Invalid markup percentage' }, { status: 400 });
    }
    await setGlobalMarkup(markup);
    const result = await recalcAllPrices();
    return NextResponse.json({ ok: true, updated: result.updated, globalMarkup: markup });
  }

  // Update per-product override
  if (body.productId !== undefined) {
    const productId = Number(body.productId);

    if (body.priceOverride !== undefined) {
      const val = body.priceOverride === null || body.priceOverride === '' ? null : parseFloat(body.priceOverride);
      await setProductPriceOverride(productId, val);
    }

    if (body.markupOverride !== undefined) {
      const val = body.markupOverride === null || body.markupOverride === '' ? null : parseFloat(body.markupOverride);
      await setProductMarkupOverride(productId, val);
    }

    const db = getDb();
    const product = await db.prepare('SELECT id, name, base_price, sell_price, price_override, markup_override FROM products WHERE id = ?').get(productId);
    return NextResponse.json({ ok: true, product });
  }

  return NextResponse.json({ error: 'No action specified' }, { status: 400 });
}
