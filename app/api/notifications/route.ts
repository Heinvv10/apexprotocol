import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = getSession();
  if (!user) return NextResponse.json({ notifications: [] });

  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications WHERE active = 1 ORDER BY created_at DESC LIMIT 10').all();
  return NextResponse.json({ notifications });
}
