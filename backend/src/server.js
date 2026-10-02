import app from './app.js';
import { config } from './config/index.js';
import prisma from './config/prisma.js';
import { ensureDatabaseRunning, stopEmbeddedDatabase } from './config/db-bootstrap.js';

let server;

async function startServer() {
  await ensureDatabaseRunning();

  server = app.listen(config.port, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 HAbyTAT Backend running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🔗 API Base URL: http://localhost:${config.port}/api`);
    console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`=================================================\n`);
  });
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] signal received: closing HTTP server...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('Prisma disconnected from database.');
      } catch (err) {
        console.error('Error disconnecting Prisma:', err);
      }
      await stopEmbeddedDatabase();
      process.exit(0);
    });
  } else {
    await stopEmbeddedDatabase();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
