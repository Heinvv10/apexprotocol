// BL-55 smoke-test endpoint — REMOVE after Bugsink wiring is verified.
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') ?? 'test@example.com';
  const phone = url.searchParams.get('phone') ?? '+27 83 555 1234';
  throw new Error(
    `BL-55 smoke test: email=${email} phone=${phone} id=550e8400-e29b-41d4-a716-446655440000`,
  );
}
