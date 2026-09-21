import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './init.ts';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 15000 }
      : {
          host: process.env.SQL_HOST || '127.0.0.1',
          user: process.env.SQL_USER || 'postgres',
          password: process.env.SQL_PASSWORD || 'postgres',
          database: process.env.SQL_DB_NAME || 'lubpy_studio',
          port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
          max: 10,
          connectionTimeoutMillis: 15000,
        };

    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      // Suppress unhandled pool error crashes when offline
      if (err.message.includes('ECONNREFUSED')) {
        // Handled silently by storage engine
        return;
      }
      console.warn('⚠️ SQL Pool notice:', err.message);
    });

    // Auto-initialize schema in background
    initializeDatabase(global._postgresPool).catch(_ => {
      // Handled in initializeDatabase
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
