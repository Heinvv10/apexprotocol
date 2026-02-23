import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendOrderConfirmation } from '@/lib/email';
// Sequential ref generation (AP-0001, AP-0002, ...)

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, shipping, customer, address, subtotal, total, quoteAction, agreedTerms } = body;

  if (!items?.length || !customer?.name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (subtotal < 200) {
    return NextResponse.json({ error: 'Minimum order is R200' }, { status: 400 });
  }

  const db = getDb();
  const user = getSession();
  // Get next sequential order number
  const lastOrder = await await db.prepare('SELECT ref FROM orders ORDER BY id DESC LIMIT 1').get() as { ref: string } | undefined;
  let nextNum = 1;
  if (lastOrder?.ref) {
    const match = lastOrder.ref.match(/AP-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const orderRef = `AP-${String(nextNum).padStart(4, '0')}`;

  const insertOrder = await await db.prepare(`
    INSERT INTO orders (ref, user_id, guest_email, guest_name, guest_phone, address_line1, address_line2, city, province, postal_code, shipping_method, shipping_cost, subtotal, total, special_instructions, quote_action, agreed_terms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = await await db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

  const tx = db.transaction(() => {
    const result = insertOrder.run(
      orderRef,
      user?.id || null,
      customer.email || null,
      customer.name,
      customer.phone || null,
      address?.street || null,
      address?.suburb ? `${address.suburb}` : null,
      address?.city || null,
      address?.province || null,
      address?.postalCode || null,
      shipping.method,
      shipping.cost,
      subtotal,
      total,
      customer.instructions || null,
      quoteAction || 'create_new',
      agreedTerms ? 1 : 0
    );
    const orderId = result.lastInsertRowid;
    for (const item of items) {
      insertItem.run(orderId, item.id, item.quantity, item.price);
    }
  });

  tx();

  // Send confirmation email (async, don't block response)
  if (customer.email) {
    sendOrderConfirmation({
      ref: orderRef,
      customerName: customer.name,
      customerEmail: customer.email,
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      shippingCost: shipping.cost,
      total,
      shippingMethod: shipping.method,
      address: {
        street: address?.street || '',
        suburb: address?.suburb || '',
        city: address?.city || '',
        province: address?.province || '',
        postalCode: address?.postalCode || '',
      },
    }).catch((err) => {
      console.error('Failed to send order confirmation email:', err);
    });
  }

  return NextResponse.json({ orderRef });
}
