import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const notifications = await db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, message } = await req.json();
  if (!title || !message) return NextResponse.json({ error: 'Title and message required' }, { status: 400 });

  const db = getDb();
  await db.prepare('INSERT INTO notifications (title, message) VALUES (?, ?)').run(title, message);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const db = getDb();
  await db.prepare('UPDATE notifications SET active = 0 WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
