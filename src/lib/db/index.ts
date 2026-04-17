import { Pool, neonConfig } from "@neondatabase/serverless";
import {
  drizzle,
  type NeonDatabase,
} from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

let _db: NeonDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

function getDatabase(): NeonDatabase<typeof schema> {
  if (!_db) {
    if (!isDatabaseConfigured()) {
      throw new Error(
        "Database not configured. Please set DATABASE_URL environment variable."
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_target, prop) {
    const database = getDatabase();
    const value = database[prop as keyof typeof database];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export function getDb(): NeonDatabase<typeof schema> {
  return getDatabase();
}

export { schema };

export * from "./rls";

export type Database = NeonDatabase<typeof schema>;
