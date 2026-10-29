import { nutritionService } from '../services/nutrition.service.js';
import { successResponse } from '../utils/response.js';

export const nutritionController = {
  // Foods & Catalogue
  async searchFoods(req, res, next) {
    try {
      const results = await nutritionService.searchFoods(req.user.id, req.query);
      return successResponse(res, 200, 'Foods retrieved successfully', results);
    } catch (error) {
      next(error);
    }
  },

  async getFoodById(req, res, next) {
    try {
      const food = await nutritionService.getFoodById(req.user.id, req.params.id);
      return successResponse(res, 200, 'Food details retrieved successfully', { food });
    } catch (error) {
      next(error);
    }
  },

  async createCustomFood(req, res, next) {
    try {
      const food = await nutritionService.createCustomFood(req.user.id, req.body);
      return successResponse(res, 201, 'Custom food item created successfully', { food });
    } catch (error) {
      next(error);
    }
  },

  async toggleFavorite(req, res, next) {
    try {
      const result = await nutritionService.toggleFavorite(req.user.id, req.params.foodItemId);
      return successResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  },

  async getFavorites(req, res, next) {
    try {
      const foods = await nutritionService.getFavorites(req.user.id);
      return successResponse(res, 200, 'Favorite foods retrieved successfully', { foods });
    } catch (error) {
      next(error);
    }
  },

  async getRecentFoods(req, res, next) {
    try {
      const foods = await nutritionService.getRecentFoods(req.user.id, req.query.limit);
      return successResponse(res, 200, 'Recent foods retrieved successfully', { foods });
    } catch (error) {
      next(error);
    }
  },

  // Daily Logs & Diary
  async getDailyLogs(req, res, next) {
    try {
      const summary = await nutritionService.getDailyLogs(req.user.id, req.query.date);
      return successResponse(res, 200, 'Daily diary retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  },

  async logFood(req, res, next) {
    try {
      if (Array.isArray(req.body.items) && req.body.items.length > 0) {
        const logs = await nutritionService.logMultipleFoods(req.user.id, req.body);
        return successResponse(res, 201, `${logs.length} foods logged successfully`, { logs });
      }
      const log = await nutritionService.logFood(req.user.id, req.body);
      return successResponse(res, 201, 'Food logged successfully', { log });
    } catch (error) {
      next(error);
    }
  },

  async updateFoodLog(req, res, next) {
    try {
      const log = await nutritionService.updateFoodLog(req.user.id, req.params.id, req.body);
      return successResponse(res, 200, 'Food log updated successfully', { log });
    } catch (error) {
      next(error);
    }
  },

  async deleteFoodLog(req, res, next) {
    try {
      const result = await nutritionService.deleteFoodLog(req.user.id, req.params.id);
      return successResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  },

  async duplicateFoodLog(req, res, next) {
    try {
      const duplicated = await nutritionService.duplicateFoodLog(req.user.id, req.params.id, req.body);
      return successResponse(res, 201, 'Food entry duplicated successfully', { log: duplicated });
    } catch (error) {
      next(error);
    }
  },

  async copyDayLogs(req, res, next) {
    try {
      const result = await nutritionService.copyDayLogs(req.user.id, req.body);
      return successResponse(res, 201, result.message, result);
    } catch (error) {
      next(error);
    }
  },

  // Recipes
  async getRecipes(req, res, next) {
    try {
      const recipes = await nutritionService.getRecipes(req.user.id);
      return successResponse(res, 200, 'Recipes retrieved successfully', { recipes });
    } catch (error) {
      next(error);
    }
  },

  async getRecipeById(req, res, next) {
    try {
      const recipe = await nutritionService.getRecipeById(req.user.id, req.params.id);
      return successResponse(res, 200, 'Recipe details retrieved successfully', { recipe });
    } catch (error) {
      next(error);
    }
  },

  async createRecipe(req, res, next) {
    try {
      const recipe = await nutritionService.createRecipe(req.user.id, req.body);
      return successResponse(res, 201, 'Recipe created successfully', { recipe });
    } catch (error) {
      next(error);
    }
  },

  async updateRecipe(req, res, next) {
    try {
      const recipe = await nutritionService.updateRecipe(req.user.id, req.params.id, req.body);
      return successResponse(res, 200, 'Recipe updated successfully', { recipe });
    } catch (error) {
      next(error);
    }
  },

  async deleteRecipe(req, res, next) {
    try {
      const result = await nutritionService.deleteRecipe(req.user.id, req.params.id);
      return successResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  },

  // Goals
  async getGoals(req, res, next) {
    try {
      const goals = await nutritionService.getGoals(req.user.id);
      return successResponse(res, 200, 'Nutrition goals retrieved successfully', { goals });
    } catch (error) {
      next(error);
    }
  },

  async updateGoals(req, res, next) {
    try {
      const goals = await nutritionService.updateGoals(req.user.id, req.body);
      return successResponse(res, 200, 'Nutrition goals updated successfully', { goals });
    } catch (error) {
      next(error);
    }
  },

  // Water Hydration
  async getWaterLogs(req, res, next) {
    try {
      const water = await nutritionService.getWaterLogs(req.user.id, req.query.date);
      return successResponse(res, 200, 'Water hydration retrieved successfully', water);
    } catch (error) {
      next(error);
    }
  },

  async logWater(req, res, next) {
    try {
      const entry = await nutritionService.logWater(req.user.id, req.body);
      return successResponse(res, 201, 'Water logged successfully', { entry });
    } catch (error) {
      next(error);
    }
  },

  async deleteWaterLog(req, res, next) {
    try {
      const result = await nutritionService.deleteWaterLog(req.user.id, req.params.id);
      return successResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  },

  // Weight Tracking
  async getWeightHistory(req, res, next) {
    try {
      const history = await nutritionService.getWeightHistory(req.user.id, req.query.limit);
      return successResponse(res, 200, 'Weight history retrieved successfully', { history });
    } catch (error) {
      next(error);
    }
  },

  async logWeight(req, res, next) {
    try {
      const record = await nutritionService.logWeight(req.user.id, req.body);
      return successResponse(res, 200, 'Weight recorded successfully', { record });
    } catch (error) {
      next(error);
    }
  },

  // Analytics
  async getAnalytics(req, res, next) {
    try {
      const analytics = await nutritionService.getAnalytics(req.user.id, req.query.days);
      return successResponse(res, 200, 'Nutrition analytics retrieved successfully', analytics);
    } catch (error) {
      next(error);
    }
  },

  // AI Natural Language Parser
  async parseNaturalLanguage(req, res, next) {
    try {
      const result = await nutritionService.parseNaturalLanguageFood(req.body.text);
      return successResponse(res, 200, 'Food parsed successfully', result);
    } catch (error) {
      next(error);
    }
  },

  // AI Food Photo Recognition & Portion Estimation
  async recognizeFoodPhoto(req, res, next) {
    try {
      const { imageBase64, mimeType, optionalHint, mealType } = req.body;
      const result = await nutritionService.recognizeFoodPhoto({
        imageBase64,
        mimeType,
        optionalHint,
        mealType,
      });
      return successResponse(res, 200, 'Photo analyzed successfully', result);
    } catch (error) {
      next(error);
    }
  },

  // Transparent Mifflin-St Jeor TDEE Preview Calculator
  async calculateTdeeTargets(req, res, next) {
    try {
      const result = nutritionService.calculateTdeeTargets(req.body);
      return successResponse(res, 200, 'TDEE targets calculated successfully', result);
    } catch (error) {
      next(error);
    }
  },
};
