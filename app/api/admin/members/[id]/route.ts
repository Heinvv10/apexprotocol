import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberId = parseInt(params.id);
  if (isNaN(memberId)) {
    return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
  }

  const db = getDb();

  // Get member details
  const member = db.prepare(`
    SELECT id, name, email, phone, referral, approved, created_at
    FROM users
    WHERE id = ? AND is_admin = 0
  `).get(memberId) as any;

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Get member's orders
  const orders = db.prepare(`
    SELECT 
      o.id,
      o.ref,
      o.status,
      o.supplier_status,
      o.supplier_order_id,
      o.tracking_number,
      o.total,
      o.created_at
    FROM orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(memberId) as any[];

  // Get order items for each order
  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT 
        p.name as product_name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(order.id);

    return {
      ...order,
      items,
    };
  });

  return NextResponse.json({
    member: {
      ...member,
      orders: ordersWithItems,
    },
  });
}
