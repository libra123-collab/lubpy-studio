import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './init.ts';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export function getDatabaseConfig(): PoolConfig {
  // If SQL_HOST is provided (e.g. Cloud SQL unix socket or remote host), prioritize it
  if (process.env.SQL_HOST) {
    return {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || 'postgres',
      database: process.env.SQL_DB_NAME || 'lubpy_studio',
      port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  // If DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  // In production, database configuration must not be omitted
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL DATABASE ERROR: Neither SQL_HOST nor DATABASE_URL is configured in production environment.');
  }

  // Development fallback to standard local postgres
  return {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'postgres',
    database: 'lubpy_studio',
    port: 5432,
    max: 10,
    connectionTimeoutMillis: 10000,
  };
}

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const config = getDatabaseConfig();
    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('⚠️ PostgreSQL Pool Error:', err.message);
    });

    // Auto-initialize schema and seed data
    initializeDatabase(global._postgresPool).catch((err) => {
      console.error('❌ Database initialization error:', err.message || err);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Utility to verify real-time PostgreSQL database connectivity
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Database connection check failed:', err.message || err);
    return false;
  }
}
