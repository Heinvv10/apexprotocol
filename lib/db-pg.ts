import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ohf0WcXYymk2@ep-cold-firefly-ajeq5xuy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return pool.query(text, params);
}

// Helper functions matching SQLite API for compatibility
export function prepare(sql: string) {
  const pool = getPool();
  return {
    async get(...params: any[]) {
      const result = await pool.query(sql, params);
      return result.rows[0] || null;
    },
    async all(...params: any[]) {
      const result = await pool.query(sql, params);
      return result.rows;
    },
    async run(...params: any[]) {
      const result = await pool.query(sql, params);
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: result.rows[0]?.id || null,
      };
    },
  };
}

export function getDb() {
  // Return pool for compatibility
  const pool = getPool();
  return {
    prepare: (sql: string) => prepare(sql),
    query: (text: string, params?: any[]) => query(text, params),
  };
}
