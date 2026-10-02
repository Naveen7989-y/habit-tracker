import { Router } from 'express';
import {
  getStreaks,
  getWeekly,
  getMonthly,
  getCategories,
  getHabitsComparison,
  getDayOfWeek,
  getAnalyticsOverview,
} from '../controllers/statistics.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All statistics routes require authentication
router.use(authenticate);

// Streak statistics
router.get('/streaks', getStreaks);

// Recharts endpoints
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/categories', getCategories);
router.get('/comparison', getHabitsComparison);
router.get('/days', getDayOfWeek);
router.get('/overview', getAnalyticsOverview);

export default router;
