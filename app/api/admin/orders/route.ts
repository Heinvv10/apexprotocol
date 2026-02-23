import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const orders = await db.prepare(`
    SELECT o.*, string_agg(p.name || ' x' || oi.quantity, ', ') as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();

  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { orderId, status, address } = body;
  const db = getDb();

  // Update status
  if (status !== undefined) {
    const validStatuses = ['Awaiting Payment', 'Paid', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
  }

  // Update address / customer details
  if (address !== undefined) {
    await db.prepare(`
      UPDATE orders SET
        guest_name = ?,
        guest_phone = ?,
        address_line1 = ?,
        address_line2 = ?,
        city = ?,
        province = ?,
        postal_code = ?,
        shipping_method = ?,
        notes = ?
      WHERE id = ?
    `).run(
      address.name,
      address.phone || null,
      address.street,
      address.suburb || null,
      address.city,
      address.province,
      address.postalCode,
      address.shippingMethod,
      address.notes || null,
      orderId
    );
  }

  return NextResponse.json({ ok: true });
}
