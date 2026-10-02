import { completionService } from '../services/completion.service.js';
import { successResponse } from '../utils/response.js';

export const complete = async (req, res, next) => {
  try {
    const completion = await completionService.completeHabit(
      req.user.id,
      req.params.id,
      req.body
    );
    return successResponse(res, 201, 'Habit marked as completed successfully', { completion });
  } catch (error) {
    next(error);
  }
};

export const undo = async (req, res, next) => {
  try {
    const result = await completionService.undoCompletion(
      req.user.id,
      req.params.id,
      req.params.date
    );
    return successResponse(res, 200, 'Habit completion undone successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const data = await completionService.getHabitCompletions(
      req.user.id,
      req.params.id,
      req.query
    );
    return successResponse(res, 200, 'Completion history retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
