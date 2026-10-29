import { aiService } from '../services/ai.service.js';
import { successResponse } from '../utils/response.js';

export const aiController = {
  async chat(req, res, next) {
    try {
      const { message, category, history, customApiKey } = req.body;
      const result = await aiService.generateAdvice({
        userId: req.user?.id,
        message,
        category,
        history,
        customApiKey,
      });
      return successResponse(res, 200, 'AI response generated successfully', result);
    } catch (error) {
      next(error);
    }
  },

  async getContext(req, res, next) {
    try {
      const context = await aiService.getUserContext(req.user?.id);
      return successResponse(res, 200, 'User health context retrieved successfully', { context });
    } catch (error) {
      next(error);
    }
  },

  async getQuickCards(req, res, next) {
    try {
      const cards = aiService.getQuickAdviceCards();
      return successResponse(res, 200, 'Quick advice cards retrieved successfully', { cards });
    } catch (error) {
      next(error);
    }
  },
};
