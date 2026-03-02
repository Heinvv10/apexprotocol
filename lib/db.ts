import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL!;

// Use Neon serverless HTTP driver — works over port 443, no TCP/5432 needed
const sql = neon(DATABASE_URL);

// Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
const toPostgres = (query: string) => {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
};

export function getDb() {
  return {
    prepare: (query: string) => {
      const pgSql = toPostgres(query);
      return {
        get: async (...params: any[]) => {
          const rows = await sql.query(pgSql, params.flat());
          return rows[0] || null;
        },
        all: async (...params: any[]) => {
          return await sql.query(pgSql, params.flat());
        },
        run: async (...params: any[]) => {
          const returningSql = /^\s*INSERT/i.test(pgSql) && !/RETURNING/i.test(pgSql)
            ? pgSql + ' RETURNING id'
            : pgSql;
          const rows = await sql.query(returningSql, params.flat());
          return {
            changes: rows.length,
            lastInsertRowid: (rows[0] as any)?.id || null,
          };
        },
      };
    },
    exec: async (query: string) => {
      await sql.query(query, []);
    },
    transactionAsync: async (fn: () => Promise<void>) => {
      // Neon HTTP driver doesn't support true transactions — execute sequentially
      await fn();
    },
  };
}

export async function initAdmin() {
  const db = getDb();
  try {
    const adminExists = await db.prepare('SELECT id FROM users WHERE is_admin = $1').get(1);
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin123', 10);
      await db.prepare('INSERT INTO users (email, password_hash, name, is_admin, approved) VALUES ($1, $2, $3, $4, $5)').run(
        'admin@apexprotocol.co.za', hash, 'Admin', 1, 1
      );
    }
  } catch (err) {
    console.error('Admin init error:', err);
  }
}
