#!/bin/bash
# Script di build per Railway

echo "🏗️ Building for Railway deployment..."

# Assicurati che il build di Vite funzioni
echo "📦 Building frontend with Vite..."
npm run build

# Compila il file server/railway.ts per produzione
echo "🔨 Compiling server for production..."
npx esbuild server/railway.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/railway.js

# Applica le migrazioni al database
echo "🗃️ Applying database migrations..."
npm run db:push

echo "✅ Build completato con successo!"