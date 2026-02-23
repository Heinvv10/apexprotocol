import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const orders = await await db.prepare(`
    SELECT o.*, GROUP_CONCAT(p.name || ' x' || oi.quantity, ', ') as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();

  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const user = getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, status } = await req.json();
  const validStatuses = ['Awaiting Payment', 'Paid', 'Processing', 'Shipped', 'Completed'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
  return NextResponse.json({ ok: true });
}
