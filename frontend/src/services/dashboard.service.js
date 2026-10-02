import api from './api';

export const dashboardService = {
  /**
   * Fetch complete dashboard overview with today's progress, 5 KPI cards, and habits
   */
  async getOverview() {
    const response = await api.get('/dashboard');
    return response.data;
  },

  /**
   * Fetch lightweight today's habit checklist
   */
  async getTodayHabits() {
    const response = await api.get('/dashboard/today');
    return response.data;
  },
};
