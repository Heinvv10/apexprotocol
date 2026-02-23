import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscribed } = await req.json();
  const db = getDb();
  await db.prepare('UPDATE users SET subscribed = ? WHERE id = ?').run(subscribed ? 1 : 0, user.id);
  return NextResponse.json({ ok: true });
}
