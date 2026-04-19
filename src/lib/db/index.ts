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
    // Aggressive eviction for Neon-style auto-paused DBs. Long-idle
    // connections end up pointing at a paused compute that takes a
    // TCP-level timeout to recycle. 30s was leaving zombies alive.
    idleTimeoutMillis: 10_000,
    // Give up on a new connection attempt fast — if Neon is waking up
    // we'd rather retry at the callsite than sit here forever.
    connectionTimeoutMillis: 15_000,
    // TCP keep-alive so the OS evicts broken sockets proactively.
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    // Fallback: if a socket sits unused too long, recycle it.
    maxLifetimeSeconds: Number(process.env.DATABASE_MAX_LIFETIME_SEC ?? 300),
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
