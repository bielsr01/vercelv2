import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const useSupabase = !!process.env.SUPABASE_DATABASE_URL;
const rawConnectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const connectionString = rawConnectionString?.replace(/:\s+/g, ':').trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`[Database] Using ${useSupabase ? 'Supabase' : 'Neon'} database`);

export const pool = useSupabase 
  ? new PgPool({ connectionString, ssl: { rejectUnauthorized: false } })
  : new NeonPool({ connectionString });

export const db = useSupabase
  ? drizzlePg({ client: pool as PgPool, schema })
  : drizzleNeon({ client: pool as NeonPool, schema });
