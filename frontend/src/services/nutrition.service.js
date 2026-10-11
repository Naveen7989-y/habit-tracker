import api from './api';

export const nutritionService = {
  // Food Catalogue & Search
  async searchFoods(params = {}) {
    const res = await api.get('/nutrition/foods', { params });
    return res.data;
  },

  async getFoodById(id) {
    const res = await api.get(`/nutrition/foods/${id}`);
    return res.data?.food;
  },

  async createCustomFood(foodData) {
    const res = await api.post('/nutrition/foods/custom', foodData);
    return res.data?.food;
  },

  async toggleFavorite(foodItemId) {
    const res = await api.post(`/nutrition/foods/${foodItemId}/favorite`);
    return res.data;
  },

  async getFavorites() {
    const res = await api.get('/nutrition/foods/favorites');
    return res.data?.foods || [];
  },

  async getRecentFoods(limit = 10) {
    const res = await api.get('/nutrition/foods/recent', { params: { limit } });
    return res.data?.foods || [];
  },

  // Daily Diary & Food Logs
  async getDailyLogs(date) {
    const res = await api.get('/nutrition/logs', { params: { date } });
    return res.data;
  },

  async logFood(logData) {
    const res = await api.post('/nutrition/logs', logData);
    return res.data?.log || res.data?.logs;
  },

  async logMultipleFoods(payload) {
    const body = Array.isArray(payload) ? { items: payload } : payload;
    const res = await api.post('/nutrition/logs', body);
    return res.data?.logs || res.data;
  },

  async updateFoodLog(id, updateData) {
    const res = await api.put(`/nutrition/logs/${id}`, updateData);
    return res.data?.log;
  },

  async deleteFoodLog(id) {
    const res = await api.delete(`/nutrition/logs/${id}`);
    return res.data;
  },

  async duplicateFoodLog(id, payload = {}) {
    const res = await api.post(`/nutrition/logs/${id}/duplicate`, payload);
    return res.data?.log;
  },

  async copyDayLogs(payload) {
    const res = await api.post('/nutrition/logs/copy-day', payload);
    return res.data;
  },

  // Homemade Recipes
  async getRecipes() {
    const res = await api.get('/nutrition/recipes');
    return res.data?.recipes || [];
  },

  async getRecipeById(id) {
    const res = await api.get(`/nutrition/recipes/${id}`);
    return res.data?.recipe;
  },

  async createRecipe(recipeData) {
    const res = await api.post('/nutrition/recipes', recipeData);
    return res.data?.recipe;
  },

  async updateRecipe(id, recipeData) {
    const res = await api.put(`/nutrition/recipes/${id}`, recipeData);
    return res.data?.recipe;
  },

  async deleteRecipe(id) {
    const res = await api.delete(`/nutrition/recipes/${id}`);
    return res.data;
  },

  // Goals & TDEE
  async getGoals() {
    const res = await api.get('/nutrition/goals');
    return res.data?.goals;
  },

  async updateGoals(goalsData) {
    const res = await api.put('/nutrition/goals', goalsData);
    return res.data?.goals;
  },

  // Hydration (Water Tracker)
  async getWaterLogs(date) {
    const res = await api.get('/nutrition/water', { params: { date } });
    return res.data;
  },

  async logWater(data) {
    const res = await api.post('/nutrition/water', data);
    return res.data?.entry;
  },

  async deleteWaterLog(id) {
    const res = await api.delete(`/nutrition/water/${id}`);
    return res.data;
  },

  // Weight History
  async getWeightHistory(limit = 30) {
    const res = await api.get('/nutrition/weight', { params: { limit } });
    return res.data?.history || [];
  },

  async logWeight(data) {
    const res = await api.post('/nutrition/weight', data);
    return res.data?.record;
  },

  // Analytics
  async getAnalytics(days = 7) {
    const res = await api.get('/nutrition/analytics', { params: { days } });
    return res.data;
  },

  // Natural Language AI Parsing
  async parseNaturalLanguage(text) {
    const res = await api.post('/nutrition/ai-parse', { text });
    return res.data;
  },
};
