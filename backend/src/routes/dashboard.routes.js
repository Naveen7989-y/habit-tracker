import { Router } from 'express';
import { getOverview, getToday } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { cacheMiddleware } from '../utils/cache.js';

const router = Router();

// All dashboard endpoints require authentication
router.use(authenticate);

// REST API Endpoints with 60-second Redis caching
router.get('/', cacheMiddleware(60, 'dashboard'), getOverview);
router.get('/today', cacheMiddleware(60, 'dashboard'), getToday);

export default router;

