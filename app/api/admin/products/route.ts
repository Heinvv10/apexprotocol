import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const products = await db.prepare(
    'SELECT id, name, price, sold_out FROM products WHERE sold_out = 0 OR sold_out IS NULL ORDER BY name'
  ).all();
  return NextResponse.json({ products });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, sold_out } = await req.json();
  const db = getDb();
  await db.prepare('UPDATE products SET sold_out = ? WHERE id = ?').run(sold_out ? 1 : 0, productId);
  return NextResponse.json({ ok: true });
}
