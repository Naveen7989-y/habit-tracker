import { Router } from 'express';
import {
  getWorkouts,
  getWorkoutStats,
  getWorkoutById,
  createWorkout,
  deleteWorkout,
} from '../controllers/workout.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Require authentication for all workout endpoints
router.use(authenticate);

router.get('/', getWorkouts);
router.get('/stats', getWorkoutStats);
router.get('/:id', getWorkoutById);
router.post('/', createWorkout);
router.delete('/:id', deleteWorkout);

export default router;
