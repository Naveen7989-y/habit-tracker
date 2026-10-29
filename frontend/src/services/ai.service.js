import api from './api';

export const aiService = {
  /**
   * Send question or prompt to the AI Agent
   * @param {Object} data { message, category, history, customApiKey }
   */
  async sendMessage(data) {
    const res = await api.post('/ai/chat', data);
    return res.data;
  },

  /**
   * Fetch aggregated health, habits, and fitness context
   */
  async getUserContext() {
    const res = await api.get('/ai/context');
    return res.data?.context;
  },

  /**
   * Get curated quick advice cards
   */
  async getQuickCards() {
    const res = await api.get('/ai/quick-cards');
    return res.data?.cards || [];
  },
};
