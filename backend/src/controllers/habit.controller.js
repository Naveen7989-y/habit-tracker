import { habitService } from '../services/habit.service.js';
import { successResponse } from '../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const habit = await habitService.createHabit(req.user.id, req.body);
    return successResponse(res, 201, 'Habit created successfully', { habit });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const habits = await habitService.getHabits(req.user.id, req.query);
    return successResponse(res, 200, 'Habits retrieved successfully', {
      habits,
      count: habits.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const habit = await habitService.getHabitById(req.user.id, req.params.id);
    return successResponse(res, 200, 'Habit retrieved successfully', { habit });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const habit = await habitService.updateHabit(req.user.id, req.params.id, req.body);
    return successResponse(res, 200, 'Habit updated successfully', { habit });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await habitService.deleteHabit(req.user.id, req.params.id);
    return successResponse(res, 200, 'Habit deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const toggleArchive = async (req, res, next) => {
  try {
    const habit = await habitService.toggleArchiveHabit(req.user.id, req.params.id);
    const message = habit.isArchived ? 'Habit archived successfully' : 'Habit unarchived successfully';
    return successResponse(res, 200, message, { habit });
  } catch (error) {
    next(error);
  }
};
