import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { productId, email } = await req.json();

  if (!productId || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const db = getDb();
  db.prepare('INSERT INTO stock_notify (product_id, email) VALUES (?, ?)').run(Number(productId), String(email));

  return NextResponse.json({ ok: true });
}
