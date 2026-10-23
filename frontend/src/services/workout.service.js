import api from './api';

export const workoutService = {
  /**
   * Get all workouts with optional filters
   */
  async getWorkouts(params = {}) {
    const res = await api.get('/workouts', { params });
    return res.data;
  },

  /**
   * Get aggregated workout stats (total active minutes, total distance, total calories, PRs)
   */
  async getStats() {
    const res = await api.get('/workouts/stats');
    return res.data;
  },

  /**
   * Get single workout by ID
   */
  async getWorkoutById(id) {
    const res = await api.get(`/workouts/${id}`);
    return res.data;
  },

  /**
   * Save a newly recorded or completed workout
   */
  async logWorkout(workoutData) {
    const res = await api.post('/workouts', workoutData);
    return res.data;
  },

  /**
   * Delete a workout by ID
   */
  async deleteWorkout(id) {
    const res = await api.delete(`/workouts/${id}`);
    return res.data;
  },
};
