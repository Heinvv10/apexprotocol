import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ addresses: [] });

  const db = getDb();
  const addresses = await db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(user.id);
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label, street, suburb, city, postal_code, province, is_default } = await req.json();
  if (!street || !city || !postal_code || !province) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();

  if (is_default) {
    await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
  }

  const result = await db.prepare(
    'INSERT INTO addresses (user_id, label, street, suburb, city, postal_code, province, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(user.id, label || 'Home', street, suburb || null, city, postal_code, province, is_default ? 1 : 0);

  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const db = getDb();
  await db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, user.id);
  return NextResponse.json({ ok: true });
}
