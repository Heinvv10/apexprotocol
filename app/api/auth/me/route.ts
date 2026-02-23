import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = getSession();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
