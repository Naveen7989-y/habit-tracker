import api from './api';

export const calendarService = {
  /**
   * Fetch month calendar data
   * @param {number} [year]
   * @param {number} [month]
   */
  async getMonthView(year, month) {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const response = await api.get('/calendar/month', { params });
    return response.data ?? response;
  },

  /**
   * Fetch GitHub-style contribution heatmap
   * @param {number} [days=90]
   */
  async getHeatmap(days = 90) {
    const response = await api.get('/calendar/heatmap', {
      params: { days },
    });
    return response.data ?? response;
  },

  /**
   * Fetch detailed completions for a specific date (YYYY-MM-DD)
   * @param {string} date
   */
  async getDayDetails(date) {
    const response = await api.get(`/calendar/day/${date}`);
    return response.data ?? response;
  },
};
