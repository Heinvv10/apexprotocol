import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();

  const user = await await db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.approved && !user.is_admin) {
    return NextResponse.json({ error: 'Your account is pending approval. You\'ll receive an email once approved.' }, { status: 403 });
  }

  const token = createSessionToken(user.id, user.email);
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin } });
  response.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return response;
}
