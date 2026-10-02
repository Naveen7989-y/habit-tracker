import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

let prisma;

if (config.isProduction) {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export default prisma;
