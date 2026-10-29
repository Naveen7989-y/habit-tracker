import { Router } from 'express';
import { nutritionController } from '../controllers/nutrition.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all nutrition endpoints
router.use(authenticate);

// Food Catalogue & Search
router.get('/foods', nutritionController.searchFoods);
router.get('/foods/recent', nutritionController.getRecentFoods);
router.get('/foods/favorites', nutritionController.getFavorites);
router.get('/foods/:id', nutritionController.getFoodById);
router.post('/foods/custom', nutritionController.createCustomFood);
router.post('/foods/:foodItemId/favorite', nutritionController.toggleFavorite);

// Daily Diary & Food Logs
router.get('/logs', nutritionController.getDailyLogs);
router.post('/logs', nutritionController.logFood);
router.put('/logs/:id', nutritionController.updateFoodLog);
router.delete('/logs/:id', nutritionController.deleteFoodLog);
router.post('/logs/:id/duplicate', nutritionController.duplicateFoodLog);
router.post('/logs/copy-day', nutritionController.copyDayLogs);

// Homemade Indian Recipes
router.get('/recipes', nutritionController.getRecipes);
router.post('/recipes', nutritionController.createRecipe);
router.get('/recipes/:id', nutritionController.getRecipeById);
router.put('/recipes/:id', nutritionController.updateRecipe);
router.delete('/recipes/:id', nutritionController.deleteRecipe);

// Nutrition Goals (TDEE / Mifflin-St Jeor)
router.get('/goals', nutritionController.getGoals);
router.put('/goals', nutritionController.updateGoals);
router.post('/goals/calculate-tdee', nutritionController.calculateTdeeTargets);

// Hydration (Water Tracker)
router.get('/water', nutritionController.getWaterLogs);
router.post('/water', nutritionController.logWater);
router.delete('/water/:id', nutritionController.deleteWaterLog);

// Weight Tracking
router.get('/weight', nutritionController.getWeightHistory);
router.post('/weight', nutritionController.logWeight);

// Nutrition Analytics
router.get('/analytics', nutritionController.getAnalytics);

// AI Food Parsing & Photo Recognition
router.post('/ai-parse', nutritionController.parseNaturalLanguage);
router.post('/ai-photo-recognize', nutritionController.recognizeFoodPhoto);

export default router;
