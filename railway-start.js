// File di avvio CommonJS per Railway
const { spawn } = require('child_process');
const path = require('path');

console.log('🚂 Avvio dell\'applicazione in ambiente Railway...');
console.log(`📊 Porta assegnata: ${process.env.PORT || '(non impostata)'}`);
console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Directory di lavoro: ${process.cwd()}`);

// Verifica l'esistenza del file compilato
const fs = require('fs');
const distFile = path.join(process.cwd(), 'dist/server/index.js');

if (!fs.existsSync(distFile)) {
  console.error(`❌ File compilato non trovato: ${distFile}`);
  console.error('Esegui prima il build dell\'applicazione');
  process.exit(1);
}

// Imposta la porta corretta
process.env.PORT = process.env.PORT || '5000';

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