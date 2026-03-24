import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { customer, shipping, items } = body;

  if (!customer?.name || !items?.length) {
    return NextResponse.json({ error: 'Name and at least one item required' }, { status: 400 });
  }

  const db = getDb();

  // Generate next ref
  const last = await db.prepare(`SELECT ref FROM orders ORDER BY id DESC LIMIT 1`).get();
  let nextNum = 1;
  if (last && (last as any).ref) {
    const match = ((last as any).ref as string).match(/AP-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const ref = `AP-${String(nextNum).padStart(4, '0')}`;

  const shippingCost = Number(shipping?.shippingCost || 0);
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.price), 0);
  const total = subtotal + shippingCost;

  const result = await db.prepare(`
    INSERT INTO orders (
      ref, status, guest_name, guest_email, guest_phone,
      address_line1, address_line2, city, province, postal_code,
      shipping_method, shipping_cost, subtotal, total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ref,
    'Awaiting Payment',
    customer.name,
    customer.email || null,
    customer.phone || null,
    shipping?.street || null,
    shipping?.suburb || null,
    shipping?.city || null,
    shipping?.province || null,
    shipping?.postalCode || null,
    shipping?.shippingMethod || 'courier_door',
    shippingCost,
    subtotal,
    total,
    customer.notes || null,
  );

  const orderId = (result as any).lastInsertRowid;

  for (const item of items) {
    await db.prepare(`
      INSERT INTO order_items (order_id, product_id, name, quantity, price)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, item.product_id || null, item.name, Number(item.quantity), Number(item.price));
  }

  return NextResponse.json({ ok: true, ref, orderId });
}

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
    const validStatuses = ['Awaiting Payment', 'Quote Sent', 'Payment Received', 'Payment Sent', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
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
