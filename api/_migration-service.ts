import { Pool } from 'pg';

export interface TableStats {
  name: string;
  count: number;
}

export interface MigrationStats {
  tables: TableStats[];
  totalRecords: number;
}

export class MigrationService {
  private sourcePool: Pool;

  constructor() {
    this.sourcePool = new Pool({ 
      connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async getStats(): Promise<MigrationStats> {
    const tables = ['users', 'account_holders', 'betting_houses', 'surebet_sets', 'bets'];
    const stats: TableStats[] = [];
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const result = await this.sourcePool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        stats.push({ name: table, count });
        totalRecords += count;
      } catch (error) {
        stats.push({ name: table, count: 0 });
      }
    }

    return { tables: stats, totalRecords };
  }

  async exportToSQL(): Promise<string> {
    const lines: string[] = [];
    
    lines.push('-- Supabase Migration Script');
    lines.push('-- Generated: ' + new Date().toISOString());
    lines.push('-- Run this script in Supabase SQL Editor or via psql');
    lines.push('');
    
    lines.push('-- Drop existing tables (in reverse order of dependencies)');
    lines.push('DROP TABLE IF EXISTS bets CASCADE;');
    lines.push('DROP TABLE IF EXISTS surebet_sets CASCADE;');
    lines.push('DROP TABLE IF EXISTS betting_houses CASCADE;');
    lines.push('DROP TABLE IF EXISTS account_holders CASCADE;');
    lines.push('DROP TABLE IF EXISTS users CASCADE;');
    lines.push('');

    lines.push('-- Create tables');
    lines.push(`
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account_holders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE betting_houses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  name TEXT NOT NULL,
  notes TEXT,
  account_holder_id VARCHAR REFERENCES account_holders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE surebet_sets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  event_date TIMESTAMP,
  sport TEXT,
  league TEXT,
  team_a TEXT,
  team_b TEXT,
  profit_percentage DECIMAL(5,2),
  status TEXT DEFAULT 'pending',
  is_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  surebet_set_id VARCHAR REFERENCES surebet_sets(id),
  betting_house_id VARCHAR REFERENCES betting_houses(id),
  bet_type TEXT NOT NULL,
  odd DECIMAL(8,3) NOT NULL,
  stake DECIMAL(10,2) NOT NULL,
  potential_profit DECIMAL(10,2) NOT NULL,
  result TEXT,
  actual_profit DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bets_surebet_set ON bets(surebet_set_id);
CREATE INDEX idx_surebet_sets_user ON surebet_sets(user_id);
CREATE INDEX idx_betting_houses_user ON betting_houses(user_id);
CREATE INDEX idx_account_holders_user ON account_holders(user_id);
`);
    lines.push('');

    const tables = [
      { name: 'users', order: 1 },
      { name: 'account_holders', order: 2 },
      { name: 'betting_houses', order: 3 },
      { name: 'surebet_sets', order: 4 },
      { name: 'bets', order: 5 }
    ];

    for (const table of tables) {
      lines.push(`-- Data for ${table.name}`);
      
      try {
        const result = await this.sourcePool.query(`SELECT * FROM ${table.name}`);
        
        if (result.rows.length === 0) {
          lines.push(`-- No data in ${table.name}`);
          lines.push('');
          continue;
        }

        const columns = Object.keys(result.rows[0]);
        
        for (const row of result.rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return String(val);
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ');
          
          lines.push(`INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values});`);
        }
        
        lines.push('');
      } catch (error) {
        lines.push(`-- Error exporting ${table.name}: ${error instanceof Error ? error.message : 'Unknown'}`);
        lines.push('');
      }
    }

    lines.push('-- Migration complete!');
    lines.push(`-- Total tables: ${tables.length}`);
    
    return lines.join('\n');
  }
}
