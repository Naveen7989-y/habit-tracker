import { Router } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    // Attempt a lightweight database query if Prisma Client has been generated and connected
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'unreachable (pending migration / setup)';
  }

  res.status(200).json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
