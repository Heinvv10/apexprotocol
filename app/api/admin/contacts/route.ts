import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const contacts = await await db.prepare('SELECT * FROM contact_requests ORDER BY created_at DESC').all();
  return NextResponse.json({ contacts });
}
