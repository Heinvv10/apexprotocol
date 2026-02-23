import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getGlobalMarkup } from '@/lib/pricing';

export async function GET() {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const totalProducts = (await db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c;
  const soldOutProducts = (await db.prepare('SELECT COUNT(*) as c FROM products WHERE sold_out = 1').get() as any).c;
  const totalOrders = (await db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;

  const ordersByStatus = await db.prepare(`
    SELECT status, COUNT(*) as count, SUM(total) as revenue
    FROM orders GROUP BY status
  `).all();

  const totalRevenue = (await db.prepare("SELECT COALESCE(SUM(total), 0) as r FROM orders WHERE status IN ('Paid','Processing','Shipped','Completed')").get() as any).r;
  const pendingRevenue = (await db.prepare("SELECT COALESCE(SUM(total), 0) as r FROM orders WHERE status = 'Awaiting Payment'").get() as any).r;

  const recentOrders = await db.prepare(`
    SELECT o.*, GROUP_CONCAT(p.name || ' x' || oi.quantity, ', ') as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    GROUP BY o.id ORDER BY o.created_at DESC LIMIT 10
  `).all();

  const syncStats = await db.prepare(`
    SELECT supplier_sync_status, COUNT(*) as count 
    FROM orders GROUP BY supplier_sync_status
  `).all();

  const topProducts = await db.prepare(`
    SELECT p.name, p.sell_price, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    GROUP BY oi.product_id
    ORDER BY total_qty DESC LIMIT 10
  `).all();

  return NextResponse.json({
    totalProducts,
    soldOutProducts,
    totalOrders,
    totalRevenue,
    pendingRevenue,
    ordersByStatus,
    recentOrders,
    syncStats,
    topProducts,
    globalMarkup: await getGlobalMarkup(),
  });
}
