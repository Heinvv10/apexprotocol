import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ohf0WcXYymk2@ep-cold-firefly-ajeq5xuy-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
  const toPostgres = (sql: string) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  return {
    prepare: (sql: string) => {
      const pgSql = toPostgres(sql);
      return {
        get: async (...params: any[]) => {
          const result = await pool!.query(pgSql, params.flat());
          return result.rows[0] || null;
        },
        all: async (...params: any[]) => {
          const result = await pool!.query(pgSql, params.flat());
          return result.rows;
        },
        run: async (...params: any[]) => {
          // Add RETURNING id for INSERT statements to capture lastInsertRowid
          const returningSql = /^\s*INSERT/i.test(pgSql) && !/RETURNING/i.test(pgSql)
            ? pgSql + ' RETURNING id'
            : pgSql;
          const result = await pool!.query(returningSql, params.flat());
          return {
            changes: result.rowCount || 0,
            lastInsertRowid: result.rows[0]?.id || null,
          };
        },
      };
    },
    exec: async (sql: string) => {
      await pool!.query(sql);
    },
    // PostgreSQL transaction support
    transaction: (fn: () => void) => {
      // Return a wrapper that executes the function (legacy sync API — use transactionAsync for new code)
      return async () => { await fn(); };
    },
    transactionAsync: async (fn: () => Promise<void>) => {
      const client = await pool!.connect();
      try {
        await client.query('BEGIN');
        await fn();
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

// Initialize admin user if needed (run once on first deploy)
export async function initAdmin() {
  const db = getDb();
  try {
    const adminExists = await db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin123', 10);
      await db.prepare('INSERT INTO users (email, password_hash, name, is_admin, approved) VALUES ($1, $2, $3, 1, 1)').run(
        'admin@apexprotocol.co.za',
        hash,
        'Admin'
      );
    }
  } catch (err) {
    console.error('Admin init error:', err);
  }
}
