import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configura WebSocket per Neon - modalità flessibile per supportare sia ambiente di sviluppo che produzione
// In produzione, usa il default HTTP polling se il WebSocket fallisce
try {
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true; // Usa WSS per connessioni sicure
  neonConfig.pipelineTLS = true; // Ottimizza connessione TLS
  
  // Configurazione aggiuntiva per ambienti di produzione (Railway)
  if (process.env.NODE_ENV === 'production') {
    // neonConfig.forceHTTP = true; // Forza HTTP polling in produzione se i WebSocket non funzionano
    console.log('Configurazione database per ambiente di produzione');
  }
} catch (error) {
  console.error('Errore nella configurazione WebSocket per Neon:', error);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configura opzioni del pool in base all'ambiente
const poolOptions: any = { 
  connectionString: process.env.DATABASE_URL 
};

// In produzione aggiungiamo opzioni di fallback e resilienza
if (process.env.NODE_ENV === 'production') {
  poolOptions.max = 20; // Numero massimo di connessioni
  poolOptions.idleTimeoutMillis = 30000; // Timeout per connessioni inattive
  poolOptions.connectionTimeoutMillis = 10000; // Timeout per nuove connessioni

  console.log('Pool configurato per ambiente di produzione con resilienza aggiuntiva');

  // Se hai problemi di WebSocket in produzione, puoi forzare HTTP polling:
  // neonConfig.forceHTTP = true;
}

export const pool = new Pool(poolOptions);
export const db = drizzle(pool, { schema });