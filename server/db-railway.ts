// File speciale per Railway: usa pool standard senza WebSocket
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// In Railway usiamo la connessione standard pg senza WebSocket
console.log('🔌 Usando connessione DB standard per Railway');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configurazione di resilienza per ambiente di produzione
const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // numero massimo di client nel pool
  idleTimeoutMillis: 30000,     // chiude i client inattivi dopo 30 secondi
  connectionTimeoutMillis: 10000, // timeout di connessione
  ssl: {
    rejectUnauthorized: false  // necessario per alcuni provider DB in cloud
  }
};

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });