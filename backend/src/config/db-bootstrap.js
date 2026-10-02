import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let embeddedPgInstance = null;

/**
 * Checks if PostgreSQL is listening on port 5432.
 * If not, starts embedded-postgres automatically using the existing .pgdata cluster.
 */
export async function ensureDatabaseRunning() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  if (!isLocal && dbUrl.length > 0) {
    console.log('🌐 Remote PostgreSQL database detected in DATABASE_URL (Supabase/Cloud). Skipping local embedded PostgreSQL.');
    return;
  }

  const isRunning = await checkPort(5432, '127.0.0.1');

  if (isRunning) {
    console.log('📦 PostgreSQL connection detected on port 5432.');
    return;
  }

  console.log('🔄 PostgreSQL is not running. Starting embedded PostgreSQL on port 5432...');
  try {
    const { default: EmbeddedPostgres } = await import('embedded-postgres');
    const dbDir = path.resolve(__dirname, '../../.pgdata');

    embeddedPgInstance = new EmbeddedPostgres({
      databaseDir: dbDir,
      port: 5432,
      user: 'postgres',
      password: 'postgres',
    });

    await embeddedPgInstance.start();
    console.log('✅ Embedded PostgreSQL started and ready on port 5432.');
  } catch (err) {
    console.warn('⚠️ Could not automatically start embedded PostgreSQL:', err.message);
    console.warn('If using external PostgreSQL or Supabase, ensure DATABASE_URL in .env is configured and accessible.');
  }
}

/**
 * Stops embedded PostgreSQL if it was started by this process.
 */
export async function stopEmbeddedDatabase() {
  if (embeddedPgInstance) {
    console.log('🛑 Stopping embedded PostgreSQL...');
    try {
      await embeddedPgInstance.stop();
      console.log('Embedded PostgreSQL stopped.');
    } catch (e) {
      console.warn('Notice stopping embedded PG:', e.message);
    }
  }
}

function checkPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}
