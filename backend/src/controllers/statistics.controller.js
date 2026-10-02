import { statisticsService } from '../services/statistics.service.js';
import { successResponse } from '../utils/response.js';

export const getStreaks = async (req, res, next) => {
  try {
    const data = await statisticsService.getStreakStatistics(req.user.id);
    return successResponse(res, 200, 'Streak statistics calculated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getWeekly = async (req, res, next) => {
  try {
    const data = await statisticsService.getWeeklyCompletionStats(req.user.id);
    return successResponse(res, 200, 'Weekly completion statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getMonthly = async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await statisticsService.getMonthlyTrendStats(req.user.id, days);
    return successResponse(res, 200, 'Monthly trend statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const data = await statisticsService.getCategoryBreakdownStats(req.user.id);
    return successResponse(res, 200, 'Category breakdown statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getHabitsComparison = async (req, res, next) => {
  try {
    const data = await statisticsService.getHabitComparisonStats(req.user.id);
    return successResponse(res, 200, 'Habit comparison statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getDayOfWeek = async (req, res, next) => {
  try {
    const data = await statisticsService.getDayOfWeekStats(req.user.id);
    return successResponse(res, 200, 'Day of week statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await statisticsService.getComprehensiveAnalytics(req.user.id, days);
    return successResponse(res, 200, 'Comprehensive analytics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
