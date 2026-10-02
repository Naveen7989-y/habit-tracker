import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dbDir,
  port: 5432,
  user: 'postgres',
  password: 'postgres'
});

async function main() {
  console.log('Starting Embedded PostgreSQL on port 5432...');
  await pg.start();
  console.log('✅ PostgreSQL is ready and listening on port 5432.');

  const shutdown = async () => {
    console.log('\nStopping PostgreSQL...');
    await pg.stop();
    console.log('PostgreSQL stopped.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('Failed to start PostgreSQL:', err);
  process.exit(1);
});
