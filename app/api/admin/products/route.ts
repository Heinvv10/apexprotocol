import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = getSession();
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, sold_out } = await req.json();
  const db = getDb();
  await db.prepare('UPDATE products SET sold_out = ? WHERE id = ?').run(sold_out ? 1 : 0, productId);
  return NextResponse.json({ ok: true });
}
