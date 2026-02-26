import { NextRequest, NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/db-pg';

const CATEGORY_ORDER = [
  'Oral Anabolic Steroids',
  'Injectable Anabolic Steroids',
  'Research Chemicals',
  'Peptides & Other Hormones',
  'Fat Loss Agents',
  'Anti-Estrogens & Ancillaries',
  'Mental Health',
  'Supplements & Vitamins',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (category) {
    sql += ` AND category = $${idx++}`;
    params.push(category);
  }
  if (search) {
    sql += ` AND (name ILIKE $${idx} OR description ILIKE $${idx + 1} OR category ILIKE $${idx + 2})`;
    const s = `%${search}%`;
    params.push(s, s, s);
    idx += 3;
  }

  sql += ' ORDER BY name';
  const products = (await pgQuery(sql, params)).rows;

  // Categories in Muscles SA order with counts
  const catRows = (await pgQuery(
    'SELECT category, COUNT(*) as count FROM products GROUP BY category'
  )).rows;
  const catMap = Object.fromEntries(catRows.map((r: any) => [r.category, parseInt(r.count)]));
  const categories = CATEGORY_ORDER
    .filter(c => catMap[c])
    .map(c => ({ category: c, count: catMap[c] }));

  return NextResponse.json({ products, categories });
}
