import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');

// Use Neon serverless HTTP driver — works over port 443, no TCP/5432 needed
const sql = neon(DATABASE_URL);

export async function query(text: string, params?: any[]) {
  const rows = await sql.query(text, params || []);
  return { rows };
}

export function getDb() {
  return { query };
}

export default { query, getDb };
