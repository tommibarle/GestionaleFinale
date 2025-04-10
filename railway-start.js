// Script di avvio per Railway
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';
import fs from 'fs';

// Imposta la directory globale dell'app
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__dirname = __dirname;
global.__filename = __filename;

// Crea il require per supportare i moduli CommonJS
const require = createRequire(import.meta.url);

// Verifica la presenza di variabili d'ambiente critiche
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. Please configure your database connection.');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET not set. Please configure your session secret.');
  process.exit(1);
}

// Imposta la porta con default a quella che Railway richiede
const PORT = process.env.PORT || 3000;
process.env.PORT = PORT.toString();

// Verifica che il file compilato esista
const indexPath = resolve(__dirname, 'dist', 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error(`Could not find the built application at ${indexPath}. Make sure the build process completed successfully.`);
  process.exit(1);
}

// Avvia l'applicazione
try {
  console.log(`Starting application from ${indexPath}`);
  console.log(`Using PORT: ${PORT}`);
  console.log(`DATABASE_URL is ${process.env.DATABASE_URL ? 'set' : 'not set'}`);
  console.log(`SESSION_SECRET is ${process.env.SESSION_SECRET ? 'set' : 'not set'}`);
  
  // Importa ed esegui l'applicazione
  import('./dist/index.js')
    .catch(err => {
      console.error('Failed to start the application:', err);
      process.exit(1);
    });
} catch (error) {
  console.error('Error starting the application:', error);
  process.exit(1);
}