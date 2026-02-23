import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref');
  const email = searchParams.get('email');

  const db = getDb();
  const user = await getSession();

  if (ref) {
    const order = await db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref) as any;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const items = await db.prepare(`
      SELECT oi.*, p.name, p.image, p.slug FROM order_items oi
      JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?
    `).all(order.id);
    return NextResponse.json({ order: { ...order, items } });
  }

  if (user) {
    const orders = await db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    return NextResponse.json({ orders });
  }

  if (email) {
    const orders = await db.prepare('SELECT * FROM orders WHERE guest_email = ? ORDER BY created_at DESC').all(email);
    return NextResponse.json({ orders });
  }

  return NextResponse.json({ orders: [] });
}
