import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();

// Protected profile routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, validateBody(updateProfileSchema), updateProfile);

export default router;
