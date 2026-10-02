import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data?.token) {
      localStorage.setItem('habytat_token', response.data.token);
      localStorage.setItem('habytat_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('habytat_token', response.data.token);
      localStorage.setItem('habytat_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('habytat_token');
      localStorage.removeItem('habytat_user');
      localStorage.removeItem('habitpulse_token');
      localStorage.removeItem('habitpulse_user');
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    if (response.data?.user) {
      localStorage.setItem('habytat_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/me', profileData);
    if (response.data?.user) {
      localStorage.setItem('habytat_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  },
};
