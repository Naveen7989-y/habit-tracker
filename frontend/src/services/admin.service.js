import api from './api';

export const adminService = {
  // Public content endpoint
  async getPublicContent() {
    const res = await api.get('/admin/public/content');
    return res?.data?.content || res?.content || null;
  },

  // Admin login
  async adminLogin(credentials) {
    const res = await api.post('/auth/admin-login', credentials);
    return res?.data || res;
  },

  // Telemetry overview
  async getOverview() {
    const res = await api.get('/admin/overview');
    return res?.data || res;
  },

  // User management
  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res?.data || res;
  },

  async updateUserRole(userId, role) {
    const res = await api.put(`/admin/users/${userId}/role`, { role });
    return res?.data?.user || res?.user;
  },

  async deleteUser(userId) {
    const res = await api.delete(`/admin/users/${userId}`);
    return res?.data || res;
  },

  // Site Content & CMS
  async getContent() {
    const res = await api.get('/admin/content');
    return res?.data?.content || res?.content;
  },

  async updateContent(contentData) {
    const res = await api.put('/admin/content', contentData);
    return res?.data?.content || res?.content;
  },

  // Food Catalogue CMS
  async getCatalogueFoods(params = {}) {
    const res = await api.get('/admin/foods', { params });
    return res?.data || res;
  },

  async createCatalogueFood(foodData) {
    const res = await api.post('/admin/foods', foodData);
    return res?.data?.food || res?.food;
  },

  async updateCatalogueFood(foodId, foodData) {
    const res = await api.put(`/admin/foods/${foodId}`, foodData);
    return res?.data?.food || res?.food;
  },

  async deleteCatalogueFood(foodId) {
    const res = await api.delete(`/admin/foods/${foodId}`);
    return res?.data || res;
  },

  // Broadcast Notifications Management
  async getPublicNotifications() {
    const res = await api.get('/admin/public/notifications');
    return res?.data?.notifications || res?.notifications || [];
  },

  async getNotifications() {
    const res = await api.get('/admin/notifications');
    return res?.data?.notifications || res?.notifications || [];
  },

  async createNotification(notificationData) {
    const res = await api.post('/admin/notifications', notificationData);
    return res?.data?.notification || res?.notification;
  },

  async updateNotification(id, notificationData) {
    const res = await api.put(`/admin/notifications/${id}`, notificationData);
    return res?.data?.notification || res?.notification;
  },

  async deleteNotification(id) {
    const res = await api.delete(`/admin/notifications/${id}`);
    return res?.data || res;
  },
};
