import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Require authentication for all AI Agent endpoints
router.use(authenticate);

router.post('/chat', aiController.chat);
router.get('/context', aiController.getContext);
router.get('/quick-cards', aiController.getQuickCards);

export default router;
