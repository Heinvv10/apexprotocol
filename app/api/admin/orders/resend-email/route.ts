import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendOrderConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  const db = getDb();

  // Fetch order
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const email = order.guest_email;
  if (!email) return NextResponse.json({ error: 'No email address on this order' }, { status: 400 });

  // Fetch items with product names
  const items = await db.prepare(`
    SELECT p.name, oi.quantity, oi.price
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(orderId) as any[];

  await sendOrderConfirmation({
    ref: order.ref,
    customerName: order.guest_name,
    customerEmail: email,
    items: items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: Number(i.price) })),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shipping_cost),
    total: Number(order.total),
    shippingMethod: order.shipping_method,
    address: {
      street: order.address_line1 || '',
      suburb: order.address_line2 || '',
      city: order.city || '',
      province: order.province || '',
      postalCode: order.postal_code || '',
    },
  });

  return NextResponse.json({ ok: true, sentTo: email });
}
