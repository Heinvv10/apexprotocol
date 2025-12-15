import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return !!url && url !== "postgresql://placeholder";
};

// Lazy initialization to avoid build-time errors
let _db: NeonHttpDatabase<typeof schema> | null = null;
let _sql: NeonQueryFunction<boolean, boolean> | null = null;

function getDatabase(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!isDatabaseConfigured()) {
      throw new Error(
        "Database not configured. Please set DATABASE_URL environment variable."
      );
    }
    _sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(_sql, { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const database = getDatabase();
    const value = database[prop as keyof typeof database];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

// Export getDb function for explicit access
export function getDb(): NeonHttpDatabase<typeof schema> {
  return getDatabase();
}

// Export schema for use in queries
export { schema };

// Export RLS utilities
export * from "./rls";

// Export commonly used types
export type Database = NeonHttpDatabase<typeof schema>;
