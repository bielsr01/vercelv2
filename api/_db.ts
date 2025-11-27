import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

const rawConnectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const connectionString = rawConnectionString?.replace(/:\s+/g, ':').trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('[Database] Using Supabase database');

export const pool = new Pool({ 
  connectionString, 
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle({ client: pool, schema });
