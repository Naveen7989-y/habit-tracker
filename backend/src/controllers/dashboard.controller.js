import { dashboardService } from '../services/dashboard.service.js';
import { successResponse } from '../utils/response.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardOverview(req.user.id);
    return successResponse(res, 200, 'Dashboard overview retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getToday = async (req, res, next) => {
  try {
    const data = await dashboardService.getTodayHabits(req.user.id);
    return successResponse(res, 200, "Today's habits retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};
