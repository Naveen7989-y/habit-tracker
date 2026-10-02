import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all calendar routes with JWT authentication
router.use(authenticate);

// Calendar endpoints
router.get('/month', CalendarController.getMonthCalendar);
router.get('/heatmap', CalendarController.getHeatmap);
router.get('/day/:date', CalendarController.getDayDetails);

export default router;
