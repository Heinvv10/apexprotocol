import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const db = getDb();
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY category, name';
  const products = await await db.prepare(query).all(...params);

  return NextResponse.json({ products });
}
