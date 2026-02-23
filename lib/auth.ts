import { cookies } from 'next/headers';
import { getDb } from './db';

export function getSession() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;

  const db = getDb();
  // Simple token = base64(userId:email)
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString();
    const [userId] = decoded.split(':');
    const user = db.prepare('SELECT id, email, name, is_admin FROM users WHERE id = ?').get(Number(userId)) as any;
    return user || null;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: number, email: string): string {
  return Buffer.from(`${userId}:${email}`).toString('base64');
}
