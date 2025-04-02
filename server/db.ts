import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from "./logger";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL for production environments (like Heroku)
const isProduction = process.env.NODE_ENV === 'production';
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false  // Required for Heroku PostgreSQL
  } : undefined
};

export const pool = new Pool(poolConfig);

// Log SSL configuration
if (isProduction) {
  logger.info('PostgreSQL using SSL connection (rejectUnauthorized: false)');
} else {
  logger.info('PostgreSQL using standard connection without SSL');
}

// Log connection status
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL connection error:', { error: err });
});

export const db = drizzle(pool, { schema });

// Simple function to check database connection
export async function checkConnection() {
  try {
    const { rows } = await pool.query('SELECT 1 as result');
    if (rows[0].result === 1) {
      logger.info('Database connection test successful');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Database connection test failed:', { error });
    return false;
  }
}
