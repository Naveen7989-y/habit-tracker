import prisma from '../config/prisma.js';

/**
 * Advanced Nutrition Service for HAByTAT
 * Production-grade calculations, portion conversions, and meal management
 */

// Helper to round to 1 decimal place
const round = (val) => Math.round((Number(val) || 0) * 10) / 10;

// Default daily nutrition targets
export const DEFAULT_GOALS = {
  dailyCalories: 2000,
  proteinGrams: 125,
  carbsGrams: 225,
  fatGrams: 65,
  fiberGrams: 30,
  waterTargetMl: 2500,
  fitnessGoal: 'maintenance',
  activityLevel: 'sedentary',
  dietaryPreference: 'Veg',
  calculationMethod: 'Mifflin-St Jeor',
};

// Standard meal types supported by diary
export const MEAL_TYPES = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Evening Snack',
  'Dinner',
  'Custom',
];

export const nutritionService = {
  // ==========================================
  // 1. FOOD SEARCH & CATALOGUE
  // ==========================================

  async searchFoods(userId, { query = '', category, cuisine, dietaryType, page = 1, limit = 25 }) {
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      // Either system verified food OR custom food created by this user
      OR: [
        { userId: null },
        { userId },
      ],
    };

    if (query && query.trim() !== '') {
      const q = query.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { regionalName: { contains: q, mode: 'insensitive' } },
            { aliases: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }
    if (cuisine && cuisine !== 'All') {
      where.cuisine = cuisine;
    }
    if (dietaryType && dietaryType !== 'All') {
      where.dietaryType = dietaryType;
    }

    const [foods, totalCount, userFavorites] = await Promise.all([
      prisma.foodItem.findMany({
        where,
        include: {
          servings: {
            orderBy: [{ isDefault: 'desc' }, { gramWeight: 'asc' }],
          },
        },
        orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        skip,
        take,
      }),
      prisma.foodItem.count({ where }),
      userId
        ? prisma.favoriteFood.findMany({
            where: { userId },
            select: { foodItemId: true },
          })
        : [],
    ]);

    const favoriteSet = new Set(userFavorites.map((f) => f.foodItemId));

    const formattedFoods = foods.map((f) => ({
      ...f,
      isFavorite: favoriteSet.has(f.id),
    }));

    return {
      foods: formattedFoods,
      totalCount,
      page: Number(page),
      totalPages: Math.ceil(totalCount / take) || 1,
    };
  },

  async getFoodById(userId, foodId) {
    const food = await prisma.foodItem.findUnique({
      where: { id: foodId },
      include: {
        servings: {
          orderBy: [{ isDefault: 'desc' }, { gramWeight: 'asc' }],
        },
      },
    });

    if (!food) {
      const error = new Error('Food item not found');
      error.statusCode = 404;
      throw error;
    }

    let isFavorite = false;
    if (userId) {
      const fav = await prisma.favoriteFood.findUnique({
        where: {
          userId_foodItemId: {
            userId,
            foodItemId: foodId,
          },
        },
      });
      isFavorite = !!fav;
    }

    return { ...food, isFavorite };
  },

  async createCustomFood(userId, data) {
    const {
      name,
      regionalName,
      aliases,
      category = 'Staples & Ingredients',
      cuisine = 'Pan-Indian',
      dietaryType = 'Veg',
      servingUnit = '100g',
      servingSizeGrams = 100,
      calories,
      protein,
      carbs,
      fat,
      fiber = 0,
      sugar = 0,
      sodium = 0,
      servings = [],
    } = data;

    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      const error = new Error('Name, calories, protein, carbs, and fat are required');
      error.statusCode = 400;
      throw error;
    }

    const food = await prisma.foodItem.create({
      data: {
        userId,
        name: name.trim(),
        regionalName: regionalName ? regionalName.trim() : null,
        aliases: aliases ? aliases.trim() : null,
        category,
        cuisine,
        dietaryType,
        servingUnit,
        servingSizeGrams: Number(servingSizeGrams) || 100,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        fiber: Number(fiber) || 0,
        sugar: Number(sugar) || 0,
        sodium: Number(sodium) || 0,
        source: 'User Custom Food',
        isVerified: false,
        isCustom: true,
        servings: {
          create: [
            {
              unitName: `1 standard serving (${servingSizeGrams}g)`,
              gramWeight: Number(servingSizeGrams) || 100,
              isDefault: true,
            },
            ...servings.map((s) => ({
              unitName: s.unitName,
              gramWeight: Number(s.gramWeight),
              isDefault: false,
            })),
          ],
        },
      },
      include: {
        servings: true,
      },
    });

    return food;
  },

  async toggleFavorite(userId, foodItemId) {
    const existing = await prisma.favoriteFood.findUnique({
      where: {
        userId_foodItemId: {
          userId,
          foodItemId,
        },
      },
    });

    if (existing) {
      await prisma.favoriteFood.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false, message: 'Removed from favorites' };
    }

    await prisma.favoriteFood.create({
      data: {
        userId,
        foodItemId,
      },
    });
    return { isFavorite: true, message: 'Added to favorites' };
  },

  async getFavorites(userId) {
    const favorites = await prisma.favoriteFood.findMany({
      where: { userId },
      include: {
        foodItem: {
          include: {
            servings: {
              orderBy: [{ isDefault: 'desc' }, { gramWeight: 'asc' }],
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      ...f.foodItem,
      isFavorite: true,
    }));
  },

  async getRecentFoods(userId, limit = 10) {
    const recentLogs = await prisma.foodLog.findMany({
      where: { userId, foodItemId: { not: null } },
      orderBy: { loggedAt: 'desc' },
      take: 40,
      include: {
        foodItem: {
          include: {
            servings: true,
          },
        },
      },
    });

    // Unique by foodItemId
    const seen = new Set();
    const result = [];
    for (const log of recentLogs) {
      if (log.foodItem && !seen.has(log.foodItem.id)) {
        seen.add(log.foodItem.id);
        result.push(log.foodItem);
        if (result.length >= limit) break;
      }
    }

    return result;
  },

  // ==========================================
  // 2. DAILY FOOD DIARY & LOGGING
  // ==========================================

  async getDailyLogs(userId, date) {
    const logDate = date || new Date().toISOString().split('T')[0];

    const [logs, goals, waterLogs, weightLog] = await Promise.all([
      prisma.foodLog.findMany({
        where: { userId, logDate },
        include: {
          foodItem: {
            select: {
              id: true,
              category: true,
              cuisine: true,
              dietaryType: true,
            },
          },
          recipe: {
            select: {
              id: true,
              name: true,
              servings: true,
            },
          },
        },
        orderBy: { loggedAt: 'asc' },
      }),
      this.getGoals(userId),
      prisma.waterLog.findMany({
        where: { userId, logDate },
      }),
      prisma.weightLog.findUnique({
        where: {
          userId_logDate: {
            userId,
            logDate,
          },
        },
      }),
    ]);

    // Group logs into meal sections
    const meals = {
      Breakfast: [],
      'Morning Snack': [],
      Lunch: [],
      'Evening Snack': [],
      Dinner: [],
      Custom: [],
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const log of logs) {
      const mealKey = meals[log.mealType] ? log.mealType : 'Custom';
      meals[mealKey].push(log);

      totalCalories += log.calories;
      totalProtein += log.protein;
      totalCarbs += log.carbs;
      totalFat += log.fat;
      totalFiber += log.fiber;
    }

    // Calculate subtotal for each meal
    const mealSummaries = Object.keys(meals).map((mealType) => {
      const items = meals[mealType];
      const subtotal = items.reduce(
        (acc, item) => ({
          calories: round(acc.calories + item.calories),
          protein: round(acc.protein + item.protein),
          carbs: round(acc.carbs + item.carbs),
          fat: round(acc.fat + item.fat),
          fiber: round(acc.fiber + item.fiber),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      return {
        mealType,
        items,
        subtotal,
        itemCount: items.length,
      };
    });

    const totalWaterMl = waterLogs.reduce((acc, curr) => acc + curr.amountMl, 0);

    const totals = {
      calories: round(totalCalories),
      protein: round(totalProtein),
      carbs: round(totalCarbs),
      fat: round(totalFat),
      fiber: round(totalFiber),
    };

    const remaining = {
      calories: Math.max(0, round(goals.dailyCalories - totals.calories)),
      protein: Math.max(0, round(goals.proteinGrams - totals.protein)),
      carbs: Math.max(0, round(goals.carbsGrams - totals.carbs)),
      fat: Math.max(0, round(goals.fatGrams - totals.fat)),
      fiber: Math.max(0, round(goals.fiberGrams - totals.fiber)),
    };

    const percentage = {
      calories: Math.min(100, Math.round((totals.calories / (goals.dailyCalories || 1)) * 100)),
      protein: Math.min(100, Math.round((totals.protein / (goals.proteinGrams || 1)) * 100)),
      carbs: Math.min(100, Math.round((totals.carbs / (goals.carbsGrams || 1)) * 100)),
      fat: Math.min(100, Math.round((totals.fat / (goals.fatGrams || 1)) * 100)),
      fiber: Math.min(100, Math.round((totals.fiber / (goals.fiberGrams || 1)) * 100)),
    };

    return {
      logDate,
      meals: mealSummaries,
      totals,
      remaining,
      percentage,
      goals,
      water: {
        totalMl: totalWaterMl,
        targetMl: goals.waterTargetMl,
        glassesCount: Math.round(totalWaterMl / 250),
        percentage: Math.min(100, Math.round((totalWaterMl / (goals.waterTargetMl || 1)) * 100)),
      },
      weight: weightLog ? weightLog.weightKg : null,
    };
  },

  async logFood(userId, data) {
    const {
      foodItemId,
      recipeId,
      foodName,
      mealType = 'Lunch',
      logDate,
      servingQuantity = 1,
      servingUnit = 'standard serving',
      servingGramWeight,
      notes,
    } = data;

    if (!mealType) {
      const error = new Error('Meal type is required');
      error.statusCode = 400;
      throw error;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = logDate || todayStr;
    const qty = Number(servingQuantity) || 1;

    let computedName = foodName;
    let computedGrams = 100 * qty;
    let computedCalories = 0;
    let computedProtein = 0;
    let computedCarbs = 0;
    let computedFat = 0;
    let computedFiber = 0;

    if (foodItemId) {
      const food = await prisma.foodItem.findUnique({
        where: { id: foodItemId },
        include: { servings: true },
      });

      if (!food) {
        const error = new Error('Selected food item does not exist');
        error.statusCode = 404;
        throw error;
      }

      computedName = food.name;

      // Find unit weight
      let singleUnitGrams = food.servingSizeGrams;
      if (servingGramWeight) {
        singleUnitGrams = Number(servingGramWeight);
      } else if (food.servings && food.servings.length > 0) {
        const matchedServing = food.servings.find((s) => s.unitName === servingUnit);
        if (matchedServing) {
          singleUnitGrams = matchedServing.gramWeight;
        }
      }

      computedGrams = singleUnitGrams * qty;
      const ratio = computedGrams / (food.servingSizeGrams || 100);

      computedCalories = round(food.calories * ratio);
      computedProtein = round(food.protein * ratio);
      computedCarbs = round(food.carbs * ratio);
      computedFat = round(food.fat * ratio);
      computedFiber = round(food.fiber * ratio);
    } else if (recipeId) {
      const recipe = await prisma.recipe.findFirst({
        where: { id: recipeId, userId },
      });

      if (!recipe) {
        const error = new Error('Recipe not found or not owned by user');
        error.statusCode = 404;
        throw error;
      }

      computedName = recipe.name;
      computedGrams = recipe.cookedWeightGrams ? (recipe.cookedWeightGrams / recipe.servings) * qty : 150 * qty;

      computedCalories = round(recipe.caloriesPerServing * qty);
      computedProtein = round(recipe.proteinPerServing * qty);
      computedCarbs = round(recipe.carbsPerServing * qty);
      computedFat = round(recipe.fatPerServing * qty);
      computedFiber = round(recipe.fiberPerServing * qty);
    } else {
      // Manual custom logging with explicit nutrients
      if (data.calories === undefined) {
        const error = new Error('Either foodItemId, recipeId, or manual nutrients are required');
        error.statusCode = 400;
        throw error;
      }

      computedName = foodName || 'Quick Food Entry';
      computedGrams = Number(data.totalGrams) || 100 * qty;
      computedCalories = round(data.calories);
      computedProtein = round(data.protein || 0);
      computedCarbs = round(data.carbs || 0);
      computedFat = round(data.fat || 0);
      computedFiber = round(data.fiber || 0);
    }

    const createdLog = await prisma.foodLog.create({
      data: {
        userId,
        foodItemId: foodItemId || null,
        recipeId: recipeId || null,
        foodName: computedName,
        mealType,
        logDate: targetDate,
        servingQuantity: qty,
        servingUnit,
        totalGrams: round(computedGrams),
        calories: computedCalories,
        protein: computedProtein,
        carbs: computedCarbs,
        fat: computedFat,
        fiber: computedFiber,
        notes: notes ? notes.trim() : null,
      },
    });

    return createdLog;
  },

  async updateFoodLog(userId, logId, updateData) {
    const existing = await prisma.foodLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      const error = new Error('Food log entry not found or not authorized');
      error.statusCode = 404;
      throw error;
    }

    const {
      mealType,
      servingQuantity,
      servingUnit,
      servingGramWeight,
      notes,
    } = updateData;

    let totalGrams = existing.totalGrams;
    let calories = existing.calories;
    let protein = existing.protein;
    let carbs = existing.carbs;
    let fat = existing.fat;
    let fiber = existing.fiber;

    // Recalculate if quantity or serving changed and foodItemId is present
    if (servingQuantity !== undefined || servingGramWeight !== undefined || servingUnit !== undefined) {
      const qty = servingQuantity !== undefined ? Number(servingQuantity) : existing.servingQuantity;

      if (existing.foodItemId) {
        const food = await prisma.foodItem.findUnique({
          where: { id: existing.foodItemId },
          include: { servings: true },
        });

        if (food) {
          let singleUnitGrams = food.servingSizeGrams;
          const unitToUse = servingUnit || existing.servingUnit;

          if (servingGramWeight) {
            singleUnitGrams = Number(servingGramWeight);
          } else if (food.servings && food.servings.length > 0) {
            const matchedServing = food.servings.find((s) => s.unitName === unitToUse);
            if (matchedServing) {
              singleUnitGrams = matchedServing.gramWeight;
            }
          }

          totalGrams = round(singleUnitGrams * qty);
          const ratio = totalGrams / (food.servingSizeGrams || 100);

          calories = round(food.calories * ratio);
          protein = round(food.protein * ratio);
          carbs = round(food.carbs * ratio);
          fat = round(food.fat * ratio);
          fiber = round(food.fiber * ratio);
        }
      } else if (existing.recipeId) {
        const recipe = await prisma.recipe.findUnique({
          where: { id: existing.recipeId },
        });

        if (recipe) {
          calories = round(recipe.caloriesPerServing * qty);
          protein = round(recipe.proteinPerServing * qty);
          carbs = round(recipe.carbsPerServing * qty);
          fat = round(recipe.fatPerServing * qty);
          fiber = round(recipe.fiberPerServing * qty);
        }
      }
    }

    const updated = await prisma.foodLog.update({
      where: { id: logId },
      data: {
        mealType: mealType || existing.mealType,
        servingQuantity: servingQuantity !== undefined ? Number(servingQuantity) : existing.servingQuantity,
        servingUnit: servingUnit || existing.servingUnit,
        totalGrams,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    return updated;
  },

  async deleteFoodLog(userId, logId) {
    const existing = await prisma.foodLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      const error = new Error('Food log entry not found or not authorized');
      error.statusCode = 404;
      throw error;
    }

    await prisma.foodLog.delete({
      where: { id: logId },
    });

    return { message: 'Food log entry deleted successfully', deletedLog: existing };
  },

  async duplicateFoodLog(userId, logId, { targetMealType, targetDate }) {
    const existing = await prisma.foodLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      const error = new Error('Food log entry not found');
      error.statusCode = 404;
      throw error;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const duplicated = await prisma.foodLog.create({
      data: {
        userId,
        foodItemId: existing.foodItemId,
        recipeId: existing.recipeId,
        foodName: existing.foodName,
        mealType: targetMealType || existing.mealType,
        logDate: targetDate || todayStr,
        servingQuantity: existing.servingQuantity,
        servingUnit: existing.servingUnit,
        totalGrams: existing.totalGrams,
        calories: existing.calories,
        protein: existing.protein,
        carbs: existing.carbs,
        fat: existing.fat,
        fiber: existing.fiber,
        notes: existing.notes ? `${existing.notes} (Duplicated)` : null,
      },
    });

    return duplicated;
  },

  async copyDayLogs(userId, { fromDate, toDate }) {
    if (!fromDate || !toDate) {
      const error = new Error('fromDate and toDate are required');
      error.statusCode = 400;
      throw error;
    }

    const sourceLogs = await prisma.foodLog.findMany({
      where: { userId, logDate: fromDate },
    });

    if (sourceLogs.length === 0) {
      const error = new Error(`No meals recorded on ${fromDate} to copy`);
      error.statusCode = 404;
      throw error;
    }

    const createdLogs = [];
    for (const log of sourceLogs) {
      const newLog = await prisma.foodLog.create({
        data: {
          userId,
          foodItemId: log.foodItemId,
          recipeId: log.recipeId,
          foodName: log.foodName,
          mealType: log.mealType,
          logDate: toDate,
          servingQuantity: log.servingQuantity,
          servingUnit: log.servingUnit,
          totalGrams: log.totalGrams,
          calories: log.calories,
          protein: log.protein,
          carbs: log.carbs,
          fat: log.fat,
          fiber: log.fiber,
          notes: log.notes,
        },
      });
      createdLogs.push(newLog);
    }

    return {
      message: `Copied ${createdLogs.length} food items to ${toDate}`,
      count: createdLogs.length,
      logs: createdLogs,
    };
  },

  // ==========================================
  // 3. HOMEMADE INDIAN RECIPES
  // ==========================================

  async getRecipes(userId) {
    const recipes = await prisma.recipe.findMany({
      where: { userId },
      include: {
        ingredients: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recipes;
  },

  async getRecipeById(userId, recipeId) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, userId },
      include: {
        ingredients: {
          include: {
            foodItem: true,
          },
        },
      },
    });

    if (!recipe) {
      const error = new Error('Recipe not found');
      error.statusCode = 404;
      throw error;
    }

    return recipe;
  },

  async createRecipe(userId, data) {
    const {
      name,
      description,
      servings = 1,
      cookedWeightGrams,
      notes,
      ingredients = [],
    } = data;

    if (!name || !name.trim()) {
      const error = new Error('Recipe name is required');
      error.statusCode = 400;
      throw error;
    }

    const numServings = Math.max(1, Number(servings) || 1);

    // Calculate recipe nutrition by summing ingredients
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const processedIngredients = [];

    for (const ing of ingredients) {
      let ingCalories = Number(ing.calories) || 0;
      let ingProtein = Number(ing.protein) || 0;
      let ingCarbs = Number(ing.carbs) || 0;
      let ingFat = Number(ing.fat) || 0;
      let ingFiber = Number(ing.fiber) || 0;
      const ingGrams = Number(ing.grams) || 100;

      // If foodItemId is provided, compute authoritative nutrition
      if (ing.foodItemId) {
        const food = await prisma.foodItem.findUnique({
          where: { id: ing.foodItemId },
        });

        if (food) {
          const ratio = ingGrams / (food.servingSizeGrams || 100);
          ingCalories = round(food.calories * ratio);
          ingProtein = round(food.protein * ratio);
          ingCarbs = round(food.carbs * ratio);
          ingFat = round(food.fat * ratio);
          ingFiber = round(food.fiber * ratio);
        }
      }

      totalCalories += ingCalories;
      totalProtein += ingProtein;
      totalCarbs += ingCarbs;
      totalFat += ingFat;
      totalFiber += ingFiber;

      processedIngredients.push({
        foodItemId: ing.foodItemId || null,
        ingredientName: ing.ingredientName || 'Ingredient',
        quantity: Number(ing.quantity) || 1,
        unit: ing.unit || 'g',
        grams: ingGrams,
        calories: ingCalories,
        protein: ingProtein,
        carbs: ingCarbs,
        fat: ingFat,
        fiber: ingFiber,
      });
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        name: name.trim(),
        description: description ? description.trim() : null,
        servings: numServings,
        cookedWeightGrams: cookedWeightGrams ? Number(cookedWeightGrams) : null,
        totalCalories: round(totalCalories),
        totalProtein: round(totalProtein),
        totalCarbs: round(totalCarbs),
        totalFat: round(totalFat),
        totalFiber: round(totalFiber),
        caloriesPerServing: round(totalCalories / numServings),
        proteinPerServing: round(totalProtein / numServings),
        carbsPerServing: round(totalCarbs / numServings),
        fatPerServing: round(totalFat / numServings),
        fiberPerServing: round(totalFiber / numServings),
        notes: notes ? notes.trim() : null,
        ingredients: {
          create: processedIngredients,
        },
      },
      include: {
        ingredients: true,
      },
    });

    return recipe;
  },

  async updateRecipe(userId, recipeId, data) {
    const existing = await prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!existing) {
      const error = new Error('Recipe not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    const {
      name,
      description,
      servings = existing.servings,
      cookedWeightGrams,
      notes,
      ingredients,
    } = data;

    const numServings = Math.max(1, Number(servings) || 1);

    return await prisma.$transaction(async (tx) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;

      if (ingredients && Array.isArray(ingredients)) {
        // Delete old ingredients
        await tx.recipeIngredient.deleteMany({
          where: { recipeId },
        });

        // Insert new ingredients
        for (const ing of ingredients) {
          let ingCalories = Number(ing.calories) || 0;
          let ingProtein = Number(ing.protein) || 0;
          let ingCarbs = Number(ing.carbs) || 0;
          let ingFat = Number(ing.fat) || 0;
          let ingFiber = Number(ing.fiber) || 0;
          const ingGrams = Number(ing.grams) || 100;

          if (ing.foodItemId) {
            const food = await tx.foodItem.findUnique({
              where: { id: ing.foodItemId },
            });
            if (food) {
              const ratio = ingGrams / (food.servingSizeGrams || 100);
              ingCalories = round(food.calories * ratio);
              ingProtein = round(food.protein * ratio);
              ingCarbs = round(food.carbs * ratio);
              ingFat = round(food.fat * ratio);
              ingFiber = round(food.fiber * ratio);
            }
          }

          totalCalories += ingCalories;
          totalProtein += ingProtein;
          totalCarbs += ingCarbs;
          totalFat += ingFat;
          totalFiber += ingFiber;

          await tx.recipeIngredient.create({
            data: {
              recipeId,
              foodItemId: ing.foodItemId || null,
              ingredientName: ing.ingredientName || 'Ingredient',
              quantity: Number(ing.quantity) || 1,
              unit: ing.unit || 'g',
              grams: ingGrams,
              calories: ingCalories,
              protein: ingProtein,
              carbs: ingCarbs,
              fat: ingFat,
              fiber: ingFiber,
            },
          });
        }
      } else {
        totalCalories = existing.totalCalories;
        totalProtein = existing.totalProtein;
        totalCarbs = existing.totalCarbs;
        totalFat = existing.totalFat;
        totalFiber = existing.totalFiber;
      }

      const updated = await tx.recipe.update({
        where: { id: recipeId },
        data: {
          name: name ? name.trim() : existing.name,
          description: description !== undefined ? description : existing.description,
          servings: numServings,
          cookedWeightGrams: cookedWeightGrams !== undefined ? Number(cookedWeightGrams) : existing.cookedWeightGrams,
          totalCalories: round(totalCalories),
          totalProtein: round(totalProtein),
          totalCarbs: round(totalCarbs),
          totalFat: round(totalFat),
          totalFiber: round(totalFiber),
          caloriesPerServing: round(totalCalories / numServings),
          proteinPerServing: round(totalProtein / numServings),
          carbsPerServing: round(totalCarbs / numServings),
          fatPerServing: round(totalFat / numServings),
          fiberPerServing: round(totalFiber / numServings),
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: {
          ingredients: true,
        },
      });

      return updated;
    });
  },

  async deleteRecipe(userId, recipeId) {
    const existing = await prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!existing) {
      const error = new Error('Recipe not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    await prisma.recipe.delete({
      where: { id: recipeId },
    });

    return { message: 'Recipe deleted successfully' };
  },

  // ==========================================
  // 4. NUTRITION GOALS & TDEE ENGINE
  // ==========================================

  async getGoals(userId) {
    let goal = await prisma.nutritionGoal.findUnique({
      where: { userId },
    });

    if (!goal) {
      // Create initial default goal
      goal = await prisma.nutritionGoal.create({
        data: {
          userId,
          ...DEFAULT_GOALS,
        },
      });
    }

    return goal;
  },

  async updateGoals(userId, data) {
    const {
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      fiberGrams,
      waterTargetMl,
      fitnessGoal,
      activityLevel,
      age,
      gender,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      dietaryPreference,
      autoCalculateFromStats = false,
    } = data;

    let targetCalories = dailyCalories;
    let targetProtein = proteinGrams;
    let targetCarbs = carbsGrams;
    let targetFat = fatGrams;
    let targetFiber = fiberGrams;

    // Optional Mifflin-St Jeor TDEE formula
    if (autoCalculateFromStats && age && gender && heightCm && currentWeightKg) {
      const w = Number(currentWeightKg);
      const h = Number(heightCm);
      const a = Number(age);
      const g = String(gender).toLowerCase();

      // BMR Calculation
      let bmr = 10 * w + 6.25 * h - 5 * a + (g === 'female' ? -161 : 5);

      // Activity factor
      const act = activityLevel || 'sedentary';
      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very_active: 1.725,
      };
      const tdee = bmr * (multipliers[act] || 1.2);

      // Fitness goal adjustment
      const goalType = fitnessGoal || 'maintenance';
      let calAdjustment = 0;
      if (goalType === 'weight_loss') {
        calAdjustment = -450;
      } else if (goalType === 'weight_gain') {
        calAdjustment = +350;
      }

      targetCalories = Math.max(1200, Math.round(tdee + calAdjustment));

      // Recommended macro distribution for Indian diet:
      // Protein: 1.6g per kg of body weight
      targetProtein = Math.round(w * 1.6);
      // Fat: 25% of calories (9 kcal / g)
      targetFat = Math.round((targetCalories * 0.25) / 9);
      // Carbs: remainder calories (4 kcal / g)
      const proteinCalories = targetProtein * 4;
      const fatCalories = targetFat * 9;
      const remainingCalories = Math.max(200, targetCalories - (proteinCalories + fatCalories));
      targetCarbs = Math.round(remainingCalories / 4);
      targetFiber = Math.round(Math.max(25, (targetCalories / 1000) * 14));
    }

    const updated = await prisma.nutritionGoal.upsert({
      where: { userId },
      update: {
        dailyCalories: targetCalories !== undefined ? Number(targetCalories) : undefined,
        proteinGrams: targetProtein !== undefined ? Number(targetProtein) : undefined,
        carbsGrams: targetCarbs !== undefined ? Number(targetCarbs) : undefined,
        fatGrams: targetFat !== undefined ? Number(targetFat) : undefined,
        fiberGrams: targetFiber !== undefined ? Number(targetFiber) : undefined,
        waterTargetMl: waterTargetMl !== undefined ? Number(waterTargetMl) : undefined,
        fitnessGoal: fitnessGoal || undefined,
        activityLevel: activityLevel || undefined,
        age: age !== undefined ? Number(age) : undefined,
        gender: gender || undefined,
        heightCm: heightCm !== undefined ? Number(heightCm) : undefined,
        currentWeightKg: currentWeightKg !== undefined ? Number(currentWeightKg) : undefined,
        targetWeightKg: targetWeightKg !== undefined ? Number(targetWeightKg) : undefined,
        dietaryPreference: dietaryPreference || undefined,
      },
      create: {
        userId,
        dailyCalories: targetCalories !== undefined ? Number(targetCalories) : DEFAULT_GOALS.dailyCalories,
        proteinGrams: targetProtein !== undefined ? Number(targetProtein) : DEFAULT_GOALS.proteinGrams,
        carbsGrams: targetCarbs !== undefined ? Number(targetCarbs) : DEFAULT_GOALS.carbsGrams,
        fatGrams: targetFat !== undefined ? Number(targetFat) : DEFAULT_GOALS.fatGrams,
        fiberGrams: targetFiber !== undefined ? Number(targetFiber) : DEFAULT_GOALS.fiberGrams,
        waterTargetMl: waterTargetMl !== undefined ? Number(waterTargetMl) : DEFAULT_GOALS.waterTargetMl,
        fitnessGoal: fitnessGoal || DEFAULT_GOALS.fitnessGoal,
        activityLevel: activityLevel || DEFAULT_GOALS.activityLevel,
        age: age ? Number(age) : null,
        gender: gender || null,
        heightCm: heightCm ? Number(heightCm) : null,
        currentWeightKg: currentWeightKg ? Number(currentWeightKg) : null,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : null,
        dietaryPreference: dietaryPreference || DEFAULT_GOALS.dietaryPreference,
      },
    });

    return updated;
  },

  // ==========================================
  // 5. HYDRATION (WATER TRACKING)
  // ==========================================

  async getWaterLogs(userId, date) {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = date || todayStr;

    const [logs, goal] = await Promise.all([
      prisma.waterLog.findMany({
        where: { userId, logDate: targetDate },
        orderBy: { loggedAt: 'asc' },
      }),
      this.getGoals(userId),
    ]);

    const totalMl = logs.reduce((acc, curr) => acc + curr.amountMl, 0);

    return {
      logDate: targetDate,
      totalMl,
      targetMl: goal.waterTargetMl,
      percentage: Math.min(100, Math.round((totalMl / (goal.waterTargetMl || 1)) * 100)),
      entries: logs,
    };
  },

  async logWater(userId, { logDate, amountMl = 250 }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = logDate || todayStr;

    const newLog = await prisma.waterLog.create({
      data: {
        userId,
        logDate: targetDate,
        amountMl: Number(amountMl) || 250,
      },
    });

    return newLog;
  },

  async deleteWaterLog(userId, logId) {
    const existing = await prisma.waterLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      const error = new Error('Water log entry not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    await prisma.waterLog.delete({
      where: { id: logId },
    });

    return { message: 'Water log removed successfully' };
  },

  // ==========================================
  // 6. WEIGHT TRACKING
  // ==========================================

  async getWeightHistory(userId, limit = 30) {
    const logs = await prisma.weightLog.findMany({
      where: { userId },
      orderBy: { logDate: 'asc' },
      take: Number(limit) || 30,
    });

    return logs;
  },

  async logWeight(userId, { logDate, weightKg, note }) {
    if (!weightKg) {
      const error = new Error('Weight in kg is required');
      error.statusCode = 400;
      throw error;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = logDate || todayStr;

    const weight = await prisma.weightLog.upsert({
      where: {
        userId_logDate: {
          userId,
          logDate: targetDate,
        },
      },
      update: {
        weightKg: Number(weightKg),
        note: note ? note.trim() : undefined,
      },
      create: {
        userId,
        logDate: targetDate,
        weightKg: Number(weightKg),
        note: note ? note.trim() : null,
      },
    });

    // Also update currentWeightKg in NutritionGoal if present
    await prisma.nutritionGoal.updateMany({
      where: { userId },
      data: { currentWeightKg: Number(weightKg) },
    });

    return weight;
  },

  // ==========================================
  // 7. NUTRITION ANALYTICS & TRENDS
  // ==========================================

  async getAnalytics(userId, days = 7) {
    const numDays = Math.min(60, Math.max(3, Number(days) || 7));
    const today = new Date();
    const dateStrings = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dateStrings.push(d.toISOString().split('T')[0]);
    }

    const [logs, goals, weightHistory] = await Promise.all([
      prisma.foodLog.findMany({
        where: {
          userId,
          logDate: { in: dateStrings },
        },
      }),
      this.getGoals(userId),
      prisma.weightLog.findMany({
        where: {
          userId,
          logDate: { in: dateStrings },
        },
      }),
    ]);

    const weightMap = new Map(weightHistory.map((w) => [w.logDate, w.weightKg]));

    // Aggregate daily stats
    const dailyMap = new Map();
    for (const d of dateStrings) {
      dailyMap.set(d, {
        date: d,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        calorieTarget: goals.dailyCalories,
        weight: weightMap.get(d) || null,
        mealSplit: {
          Breakfast: 0,
          Lunch: 0,
          Dinner: 0,
          Snacks: 0,
        },
        hasLogs: false,
      });
    }

    for (const log of logs) {
      const dayData = dailyMap.get(log.logDate);
      if (dayData) {
        dayData.hasLogs = true;
        dayData.calories = round(dayData.calories + log.calories);
        dayData.protein = round(dayData.protein + log.protein);
        dayData.carbs = round(dayData.carbs + log.carbs);
        dayData.fat = round(dayData.fat + log.fat);
        dayData.fiber = round(dayData.fiber + log.fiber);

        const meal = log.mealType;
        if (meal === 'Breakfast') {
          dayData.mealSplit.Breakfast += log.calories;
        } else if (meal === 'Lunch') {
          dayData.mealSplit.Lunch += log.calories;
        } else if (meal === 'Dinner') {
          dayData.mealSplit.Dinner += log.calories;
        } else {
          dayData.mealSplit.Snacks += log.calories;
        }
      }
    }

    const dailyTrend = Array.from(dailyMap.values());
    const loggedDays = dailyTrend.filter((d) => d.hasLogs);

    const avgCalories = loggedDays.length > 0
      ? round(loggedDays.reduce((acc, d) => acc + d.calories, 0) / loggedDays.length)
      : 0;
    const avgProtein = loggedDays.length > 0
      ? round(loggedDays.reduce((acc, d) => acc + d.protein, 0) / loggedDays.length)
      : 0;
    const avgCarbs = loggedDays.length > 0
      ? round(loggedDays.reduce((acc, d) => acc + d.carbs, 0) / loggedDays.length)
      : 0;
    const avgFat = loggedDays.length > 0
      ? round(loggedDays.reduce((acc, d) => acc + d.fat, 0) / loggedDays.length)
      : 0;
    const avgFiber = loggedDays.length > 0
      ? round(loggedDays.reduce((acc, d) => acc + d.fiber, 0) / loggedDays.length)
      : 0;

    // Consistency score (% of days with logged meals)
    const consistencyPercentage = Math.round((loggedDays.length / numDays) * 100);

    return {
      periodDays: numDays,
      loggedDaysCount: loggedDays.length,
      consistencyPercentage,
      averages: {
        calories: avgCalories,
        protein: avgProtein,
        carbs: avgCarbs,
        fat: avgFat,
        fiber: avgFiber,
      },
      goals: {
        calories: goals.dailyCalories,
        protein: goals.proteinGrams,
        carbs: goals.carbsGrams,
        fat: goals.fatGrams,
        fiber: goals.fiberGrams,
      },
      dailyTrend,
    };
  },

  // ==========================================
  // 8. NATURAL LANGUAGE / AI FOOD PARSER
  // ==========================================

  async parseNaturalLanguageFood(text) {
    if (!text || !text.trim()) {
      const error = new Error('Text prompt is required');
      error.statusCode = 400;
      throw error;
    }

    const input = text.trim();

    // Fetch catalogue food items to match against
    const allFoods = await prisma.foodItem.findMany({
      where: { userId: null },
      include: { servings: true },
    });

    const parsedItems = [];

    // Common number words map
    const numWords = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      half: 0.5,
      quarter: 0.25,
      a: 1,
      an: 1,
    };

    // Split text into clauses by commas, "and", "+", "with"
    const clauses = input
      .split(/,|\band\b|\+|\bwith\b/i)
      .map((c) => c.trim())
      .filter(Boolean);

    for (const clause of clauses) {
      // Find food match
      let bestFood = null;
      let highestScore = 0;

      const lowerClause = clause.toLowerCase();

      for (const food of allFoods) {
        let score = 0;
        const foodNameLower = food.name.toLowerCase();
        const aliasesLower = (food.aliases || '').toLowerCase();
        const regionalLower = (food.regionalName || '').toLowerCase();

        // Exact keyword tokens
        const keywords = [
          ...foodNameLower.split(/[\s(),/]+/),
          ...aliasesLower.split(/[\s(),/]+/),
          ...regionalLower.split(/[\s():|/]+/),
        ].filter((w) => w.length > 2);

        for (const kw of keywords) {
          if (lowerClause.includes(kw)) {
            score += kw.length;
          }
        }

        if (score > highestScore && score >= 4) {
          highestScore = score;
          bestFood = food;
        }
      }

      if (bestFood) {
        // Extract quantity from clause
        let quantity = 1;
        const qtyMatch = lowerClause.match(/(\d+(\.\d+)?)/);
        if (qtyMatch) {
          quantity = parseFloat(qtyMatch[1]);
        } else {
          for (const [w, val] of Object.entries(numWords)) {
            const regex = new RegExp(`\\b${w}\\b`, 'i');
            if (regex.test(lowerClause)) {
              quantity = val;
              break;
            }
          }
        }

        // Determine matching serving unit
        let chosenServing = bestFood.servings.find((s) => s.isDefault) || bestFood.servings[0];
        if (lowerClause.includes('cup')) {
          const cupServing = bestFood.servings.find((s) => s.unitName.toLowerCase().includes('cup'));
          if (cupServing) chosenServing = cupServing;
        } else if (lowerClause.includes('katori') || lowerClause.includes('bowl')) {
          const katoriServing = bestFood.servings.find(
            (s) => s.unitName.toLowerCase().includes('katori') || s.unitName.toLowerCase().includes('bowl')
          );
          if (katoriServing) chosenServing = katoriServing;
        } else if (lowerClause.includes('plate')) {
          const plateServing = bestFood.servings.find((s) => s.unitName.toLowerCase().includes('plate'));
          if (plateServing) chosenServing = plateServing;
        } else if (lowerClause.includes('tablespoon') || lowerClause.includes('tbsp') || lowerClause.includes('spoon')) {
          const spoonServing = bestFood.servings.find((s) => s.unitName.toLowerCase().includes('tablespoon'));
          if (spoonServing) chosenServing = spoonServing;
        }

        const totalGrams = chosenServing ? chosenServing.gramWeight * quantity : 100 * quantity;
        const ratio = totalGrams / (bestFood.servingSizeGrams || 100);

        parsedItems.push({
          foodItemId: bestFood.id,
          foodName: bestFood.name,
          category: bestFood.category,
          dietaryType: bestFood.dietaryType,
          quantity,
          servingUnit: chosenServing ? chosenServing.unitName : '100g',
          servingGramWeight: chosenServing ? chosenServing.gramWeight : 100,
          totalGrams: round(totalGrams),
          calories: round(bestFood.calories * ratio),
          protein: round(bestFood.protein * ratio),
          carbs: round(bestFood.carbs * ratio),
          fat: round(bestFood.fat * ratio),
          fiber: round(bestFood.fiber * ratio),
          confidence: Math.min(0.95, round(highestScore / 15)),
        });
      }
    }

    const estimatedTotals = parsedItems.reduce(
      (acc, item) => ({
        calories: round(acc.calories + item.calories),
        protein: round(acc.protein + item.protein),
        carbs: round(acc.carbs + item.carbs),
        fat: round(acc.fat + item.fat),
        fiber: round(acc.fiber + item.fiber),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    return {
      originalPrompt: input,
      parsedCount: parsedItems.length,
      items: parsedItems,
      estimatedTotals,
    };
  },
};
