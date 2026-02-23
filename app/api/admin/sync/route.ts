import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, 
      json_group_array(json_object(
        'id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price,
        'name', p.name, 'supplier_product_id', p.supplier_product_id, 'base_price', p.base_price
      )) as items_json
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all() as any[];

  const allOrders = orders.map(o => ({
    ...o,
    items: JSON.parse(o.items_json || '[]').filter((i: any) => i.id !== null),
    items_json: undefined,
  }));

  // pendingOrders for the sync tab (pending or failed)
  const pendingOrders = allOrders.filter(o => o.supplier_sync_status === 'pending' || o.supplier_sync_status === 'failed');

  return NextResponse.json({ orders: allOrders, pendingOrders });
}

async function loginToSupplier(): Promise<string | null> {
  const db = getDb();
  const email = (db.prepare("SELECT value FROM settings WHERE key = 'supplier_email'").get() as any)?.value;
  const password = (db.prepare("SELECT value FROM settings WHERE key = 'supplier_password'").get() as any)?.value;

  if (!email || !password) return null;

  // Form-based login to get PHPSESSID cookie
  const res = await fetch('https://my.muscles.co.za/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });

  const cookies = res.headers.getSetCookie?.() || [];
  const sessionCookie = cookies.find((c: string) => c.includes('PHPSESSID'));
  return sessionCookie ? sessionCookie.split(';')[0] : null;
}

export async function POST(req: NextRequest) {
  const user = getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, action } = await req.json();
  const db = getDb();

  if (action === 'sync_to_supplier') {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const items = db.prepare(`
      SELECT oi.*, p.supplier_product_id, p.name, p.base_price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId) as any[];

    const missing = items.filter(i => !i.supplier_product_id);
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Missing supplier IDs for: ${missing.map(m => m.name).join(', ')}`,
      }, { status: 400 });
    }

    // Login to Muscles SA
    const sessionCookie = await loginToSupplier();
    if (!sessionCookie) {
      return NextResponse.json({
        error: 'Could not login to supplier. Check credentials in Settings.',
      }, { status: 400 });
    }

    // Add each item to supplier cart
    const results: any[] = [];
    for (const item of items) {
      try {
        const res = await fetch('https://my.muscles.co.za/helpers/cart.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
          },
          body: JSON.stringify({
            func: 'update_cart_items',
            id: item.supplier_product_id,
            qty: item.quantity,
          }),
        });
        const data = await res.json();
        results.push({ name: item.name, ok: data.ok, msg: data.msg, cart_item: data.data?.cart_item });
      } catch (err: any) {
        results.push({ name: item.name, ok: false, msg: err.message });
      }
    }

    const allOk = results.every(r => r.ok);
    db.prepare('UPDATE orders SET supplier_sync_status = ? WHERE id = ?').run(allOk ? 'synced' : 'partial', orderId);

    return NextResponse.json({
      ok: allOk,
      status: allOk ? 'synced' : 'partial',
      message: allOk
        ? `✅ All ${items.length} items added to Muscles SA cart!`
        : `⚠️ Some items failed. Check results.`,
      results,
      supplierTotal: results.filter(r => r.ok).reduce((s, r) => s + (r.cart_item?.cart_item_price || 0) * (r.cart_item?.cart_item_quantity || 1), 0),
    });
  }

  if (action === 'mark_synced') {
    db.prepare('UPDATE orders SET supplier_sync_status = ? WHERE id = ?').run('synced', orderId);
    return NextResponse.json({ ok: true });
  }

  if (action === 'mark_failed') {
    db.prepare('UPDATE orders SET supplier_sync_status = ? WHERE id = ?').run('failed', orderId);
    return NextResponse.json({ ok: true });
  }

  if (action === 'reset') {
    db.prepare('UPDATE orders SET supplier_sync_status = ? WHERE id = ?').run('pending', orderId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
