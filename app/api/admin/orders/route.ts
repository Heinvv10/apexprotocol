import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const orders = await db.prepare(`
    SELECT o.*, 
      string_agg(p.name || ' x' || oi.quantity, ', ') as items_summary,
      json_agg(json_build_object(
        'item_id', oi.id,
        'product_id', oi.product_id,
        'name', p.name,
        'quantity', oi.quantity,
        'price', oi.price
      )) FILTER (WHERE oi.id IS NOT NULL) as items
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
  const { orderId, status, address, items, shippingCost } = body;
  const db = getDb();

  // Update status
  if (status !== undefined) {
    const validStatuses = ['Awaiting Payment', 'Quote Sent', 'Paid', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
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
        guest_email = ?,
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
      address.email || null,
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

  // Update order items (qty, price) + recalculate totals
  if (items !== undefined && Array.isArray(items)) {
    // Update each item
    for (const item of items) {
      await db.prepare(
        'UPDATE order_items SET quantity = ?, price = ? WHERE id = ? AND order_id = ?'
      ).run(item.quantity, item.price, item.item_id, orderId);
    }
    // Recalculate subtotal and total
    const subtotal = items.reduce((s: number, i: any) => s + i.quantity * i.price, 0);
    const total = subtotal + (shippingCost || 0);
    await db.prepare(
      'UPDATE orders SET subtotal = ?, total = ? WHERE id = ?'
    ).run(subtotal, total, orderId);
  }

  return NextResponse.json({ ok: true });
}
