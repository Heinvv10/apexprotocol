import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSetting, setSetting } from '@/lib/pricing';

const ALLOWED_KEYS = ['global_markup_percentage', 'supplier_email', 'supplier_password'];

export async function GET() {
  const user = getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    settings[key] = getSetting(key);
    // Mask password
    if (key === 'supplier_password' && settings[key]) {
      settings[key] = '••••••••';
    }
  }
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const user = getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updated: string[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.includes(key) && typeof value === 'string') {
      // Don't overwrite password with masked value
      if (key === 'supplier_password' && value === '••••••••') continue;
      setSetting(key, value);
      updated.push(key);
    }
  }

  return NextResponse.json({ ok: true, updated });
}
