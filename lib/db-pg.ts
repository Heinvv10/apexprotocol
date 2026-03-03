import { neon, neonConfig } from '@neondatabase/serverless';
import { Agent } from 'undici';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');

// Force IPv4 for all Neon HTTP requests — velo server has no IPv6 routing
// undici ignores --dns-result-order, so we patch at the dispatcher level
const ipv4Agent = new Agent({ connect: { family: 4 } } as any);
neonConfig.fetchFunction = (url: RequestInfo | URL, opts?: RequestInit) =>
  fetch(url as string, { ...(opts || {}), dispatcher: ipv4Agent } as RequestInit);

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
