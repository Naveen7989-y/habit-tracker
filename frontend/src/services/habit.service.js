import api from './api';

export const habitService = {
  async getHabits(params = {}) {
    const response = await api.get('/habits', { params });
    return response.data?.habits || [];
  },

  async getHabitById(id) {
    const response = await api.get(`/habits/${id}`);
    return response.data?.habit;
  },

  async createHabit(habitData) {
    const response = await api.post('/habits', habitData);
    return response.data?.habit;
  },

  async updateHabit(id, updateData) {
    const response = await api.put(`/habits/${id}`, updateData);
    return response.data?.habit;
  },

  async deleteHabit(id) {
    const response = await api.delete(`/habits/${id}`);
    return response.data;
  },

  async toggleArchive(id) {
    const response = await api.patch(`/habits/${id}/archive`);
    return response.data?.habit;
  },
};
