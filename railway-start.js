// File di avvio CommonJS per Railway
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚂 Avvio dell\'applicazione in ambiente Railway...');
console.log(`📊 Porta assegnata: ${process.env.PORT || '(non impostata)'}`);
console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Directory di lavoro: ${process.cwd()}`);

// Imposta variabili d'ambiente per produzione
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

// Verifica se c'è bisogno di switchare all'implementazione DB alternativa
// specifica per Railway dovuto a problemi WebSocket
function setupRailwaySpecificFiles() {
  try {
    // Copia il file DB Railway se esiste
    const dbRailwayPath = path.join(process.cwd(), 'server/db-railway.ts');
    const dbOriginalPath = path.join(process.cwd(), 'server/db.ts');
    const dbBackupPath = path.join(process.cwd(), 'server/db.backup.ts');
    
    if (fs.existsSync(dbRailwayPath) && fs.existsSync(dbOriginalPath)) {
      console.log('📦 Preparazione configurazione Railway specifica...');
      
      // Backup file originale
      if (!fs.existsSync(dbBackupPath)) {
        fs.copyFileSync(dbOriginalPath, dbBackupPath);
        console.log('✅ Backup del file DB originale completato');
      }
      
      // Usa la versione Railway
      fs.copyFileSync(dbRailwayPath, dbOriginalPath);
      console.log('✅ Configurazione DB per Railway impostata');
    }
  } catch (error) {
    console.error('⚠️ Errore durante la preparazione dei file per Railway:', error);
  }
}

// Configura i file specifici per Railway
setupRailwaySpecificFiles();

// Verifica l'esistenza del file compilato
const distFile = path.join(process.cwd(), 'dist/server/index.js');

if (!fs.existsSync(distFile)) {
  console.error(`❌ File compilato non trovato: ${distFile}`);
  console.error('Esegui prima il build dell\'applicazione');
  process.exit(1);
}

// Esegui il file compilato
console.log(`🚀 Avvio del server da: ${distFile}`);
const server = spawn('node', [distFile], {
  stdio: 'inherit',
  env: process.env
});

server.on('close', (code) => {
  console.log(`Il server si è chiuso con codice ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('Ricevuto SIGINT, chiusura in corso...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Ricevuto SIGTERM, chiusura in corso...');
  server.kill('SIGTERM');
});