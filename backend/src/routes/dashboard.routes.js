import { Router } from 'express';
import { getOverview, getToday } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All dashboard endpoints require authentication
router.use(authenticate);

// REST API Endpoints
router.get('/', getOverview);
router.get('/today', getToday);

export default router;
