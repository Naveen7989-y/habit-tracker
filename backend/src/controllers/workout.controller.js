import { workoutService } from '../services/workout.service.js';
import { successResponse } from '../utils/response.js';

export const getWorkouts = async (req, res, next) => {
  try {
    const { limit, offset, activityType, date } = req.query;
    const data = await workoutService.getWorkouts(req.user.id, { limit, offset, activityType, date });
    return successResponse(res, 200, 'Workouts retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getWorkoutStats = async (req, res, next) => {
  try {
    const data = await workoutService.getWorkoutStats(req.user.id);
    return successResponse(res, 200, 'Workout statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getWorkoutById = async (req, res, next) => {
  try {
    const data = await workoutService.getWorkoutById(req.user.id, req.params.id);
    return successResponse(res, 200, 'Workout details retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createWorkout = async (req, res, next) => {
  try {
    const data = await workoutService.createWorkout(req.user.id, req.body);
    return successResponse(res, 201, 'Workout logged successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkout = async (req, res, next) => {
  try {
    const data = await workoutService.deleteWorkout(req.user.id, req.params.id);
    return successResponse(res, 200, 'Workout deleted successfully', data);
  } catch (error) {
    next(error);
  }
};
