#!/bin/bash
# Script di avvio per Railway

echo "🚀 Avvio dell'applicazione su Railway"

# Installa pg se manca
if ! npm list pg > /dev/null 2>&1; then
  echo "📦 Installazione di pg e dipendenze necessarie..."
  npm install pg @types/pg --no-save
fi

# Build e avvio
echo "🏗️ Esecuzione build..."
npm run build

echo "🗃️ Applicazione migrazioni DB..."
npm run db:push

echo "🌐 Avvio server..."
NODE_ENV=production node --experimental-modules railway-start.js