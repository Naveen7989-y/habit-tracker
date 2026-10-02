import { Router } from 'express';
import {
  create,
  getAll,
  getOne,
  update,
  remove,
  toggleArchive,
} from '../controllers/habit.controller.js';
import {
  complete,
  undo,
  getHistory,
} from '../controllers/completion.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createHabitSchema, updateHabitSchema } from '../validators/habit.validator.js';
import { completeHabitSchema } from '../validators/completion.validator.js';

const router = Router();

// All habit and completion routes require authentication
router.use(authenticate);

// Habit CRUD Routes
router.get('/', getAll);
router.post('/', validateBody(createHabitSchema), create);
router.get('/:id', getOne);
router.put('/:id', validateBody(updateHabitSchema), update);
router.delete('/:id', remove);
router.patch('/:id/archive', toggleArchive);

// Completion Routes (Section 16 Specification)
router.post('/:id/complete', validateBody(completeHabitSchema), complete);
router.delete('/:id/complete/:date', undo);
router.get('/:id/completions', getHistory);

export default router;
