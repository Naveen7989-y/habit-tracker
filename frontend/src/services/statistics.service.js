import api from './api';

export const statisticsService = {
  /**
   * Get user streak metrics and per-habit streak details
   */
  async getStreakStats() {
    const response = await api.get('/statistics/streaks');
    return response.data ?? response;
  },

  /**
   * Get 7-day weekly completion volume
   */
  async getWeeklyStats() {
    const response = await api.get('/statistics/weekly');
    return response.data ?? response;
  },

  /**
   * Get rolling trend curve (e.g. 30, 60, 90 days)
   */
  async getMonthlyTrend(days = 30) {
    const response = await api.get('/statistics/monthly', {
      params: { days },
    });
    return response.data ?? response;
  },

  /**
   * Get category breakdown distribution
   */
  async getCategories() {
    const response = await api.get('/statistics/categories');
    return response.data ?? response;
  },

  /**
   * Get habit comparison leaderboard
   */
  async getComparison() {
    const response = await api.get('/statistics/comparison');
    return response.data ?? response;
  },

  /**
   * Get weekday distribution
   */
  async getDayOfWeek() {
    const response = await api.get('/statistics/days');
    return response.data ?? response;
  },

  /**
   * Get comprehensive unified analytics
   */
  async getComprehensiveOverview(days = 30) {
    const response = await api.get('/statistics/overview', {
      params: { days },
    });
    return response.data ?? response;
  },
};
