import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const useSupabase = !!process.env.SUPABASE_DATABASE_URL;
// Trim whitespace from connection string to handle copy/paste issues
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

// Dedicated session pool - ALWAYS uses pg driver for connect-pg-simple compatibility
export const sessionPool = new PgPool({ 
  connectionString, 
  ssl: { rejectUnauthorized: false },
  max: 5 // Limit connections for serverless
});

export const db = useSupabase
  ? drizzlePg({ client: pool as PgPool, schema })
  : drizzleNeon({ client: pool as NeonPool, schema });
