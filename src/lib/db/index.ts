import { Pool, type PoolConfig } from "pg";
import {
  drizzle,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

function buildPoolConfig(): PoolConfig {
  return {
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  };
}

function getDatabase(): NodePgDatabase<typeof schema> {
  if (!_db) {
    if (!isDatabaseConfigured()) {
      throw new Error(
        "Database not configured. Please set DATABASE_URL environment variable."
      );
    }
    _pool = new Pool(buildPoolConfig());
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const database = getDatabase();
    const value = database[prop as keyof typeof database];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export function getDb(): NodePgDatabase<typeof schema> {
  return getDatabase();
}

export { schema };

export * from "./rls";

export type Database = NodePgDatabase<typeof schema>;
