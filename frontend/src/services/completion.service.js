import api from './api';

export const completionService = {
  /**
   * Mark habit as completed for a date
   */
  async completeHabit(habitId, payload = {}) {
    const response = await api.post(`/habits/${habitId}/complete`, payload);
    return response.data?.completion;
  },

  /**
   * Undo completion for a specific date
   */
  async undoCompletion(habitId, dateStr) {
    const response = await api.delete(`/habits/${habitId}/complete/${dateStr}`);
    return response.data;
  },

  /**
   * Get completions history for a habit
   */
  async getHabitCompletions(habitId, params = {}) {
    const response = await api.get(`/habits/${habitId}/completions`, { params });
    return response.data;
  },
};
