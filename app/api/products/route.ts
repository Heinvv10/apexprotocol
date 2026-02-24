import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const meta = searchParams.get('meta');

  const db = getDb();
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name ILIKE ? OR description ILIKE ? OR category ILIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY category, name';
  const products = await db.prepare(query).all(...params);

  // Fetch distinct categories with counts
  const categoriesResult = await db.prepare(
    'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category'
  ).all();
  
  const categories = categoriesResult.map((row: any) => ({
    category: row.category,
    count: parseInt(row.count),
  }));

  return NextResponse.json({ products, categories });
}
