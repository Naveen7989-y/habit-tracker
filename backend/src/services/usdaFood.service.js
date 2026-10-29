import prisma from '../config/prisma.js';

/**
 * USDA FoodData Central Integration Service
 * Provides verified external nutritional data with in-memory caching and resilient fallbacks.
 */

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const searchCache = new Map();

// Helper to round nutrients to 1 decimal place
const round = (val) => Math.round((Number(val) || 0) * 10) / 10;

export const usdaFoodService = {
  /**
   * Search USDA FoodData Central with in-memory caching and timeout protection.
   */
  async searchFoods(query, pageSize = 10) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim().toLowerCase();
    const cacheKey = `${trimmedQuery}_${pageSize}`;

    // 1. Check in-memory cache
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const url = new URL(`${USDA_BASE_URL}/foods/search`);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('query', trimmedQuery);
      url.searchParams.set('pageSize', String(Math.min(pageSize, 25)));

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`USDA API responded with status ${response.status} for query "${query}"`);
        return [];
      }

      const data = await response.json();
      if (!data.foods || !Array.isArray(data.foods)) {
        return [];
      }

      const formattedFoods = data.foods.map((food) => this.formatUsdaFood(food));

      // Cache successful response
      searchCache.set(cacheKey, {
        timestamp: Date.now(),
        data: formattedFoods,
      });

      return formattedFoods;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn(`USDA FoodData Central query timed out for "${query}"`);
      } else {
        console.warn('USDA FoodData Central error:', err.message);
      }
      return []; // Return empty array so local database search smoothly takes over
    }
  },

  /**
   * Format a raw USDA FoodData Central item into HAbyTAT's FoodItem format.
   */
  formatUsdaFood(f) {
    const getNutrient = (searchTerms) => {
      if (!f.foodNutrients || !Array.isArray(f.foodNutrients)) return 0;
      const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
      const match = f.foodNutrients.find((item) => {
        const name = (item.nutrientName || '').toLowerCase();
        const number = item.nutrientNumber;
        return terms.some((term) => name.includes(term.toLowerCase()) || number === term);
      });
      return match ? Number(match.value) || 0 : 0;
    };

    // USDA standard values are per 100g unless otherwise specified in servingSize
    const referenceGrams = Number(f.servingSize) > 0 ? Number(f.servingSize) : 100;
    const servingUnit = f.servingSizeUnit ? `${referenceGrams}${f.servingSizeUnit}` : '100g';

    const calories = round(getNutrient(['energy', '1008', '208']));
    const protein = round(getNutrient(['protein', '1003', '203']));
    const carbs = round(getNutrient(['carbohydrate', '1005', '205']));
    const fat = round(getNutrient(['total lipid', 'fat', '1004', '204']));
    const fiber = round(getNutrient(['fiber', '1079', '291']));
    const sugar = round(getNutrient(['sugars, total', 'sugar', '269']));
    const sodium = round(getNutrient(['sodium', '1093', '307']));

    // Build serving portions
    const servings = [
      {
        unitName: `100g standard`,
        gramWeight: 100,
        isDefault: referenceGrams === 100,
      },
    ];

    if (f.householdServingFullText) {
      servings.unshift({
        unitName: f.householdServingFullText,
        gramWeight: referenceGrams,
        isDefault: true,
      });
    } else if (referenceGrams !== 100) {
      servings.unshift({
        unitName: `1 serving (${servingUnit})`,
        gramWeight: referenceGrams,
        isDefault: true,
      });
    }

    return {
      id: `usda_${f.fdcId}`,
      fdcId: f.fdcId,
      name: f.description,
      regionalName: null,
      aliases: `FDC:${f.fdcId}, ${f.additionalDescriptions || ''}`.trim(),
      category: f.foodCategory || 'Global & Packaged Foods',
      cuisine: 'International',
      dietaryType: 'All',
      servingUnit,
      servingSizeGrams: referenceGrams,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      source: 'USDA FoodData Central',
      isVerified: true,
      isExternal: true,
      servings,
    };
  },

  /**
   * Persist a USDA food item into PostgreSQL so future queries and logs use a verified DB record.
   */
  async ensureFoodItemInDb(usdaFormattedFood) {
    if (!usdaFormattedFood || !usdaFormattedFood.fdcId) {
      throw new Error('Valid USDA food with fdcId is required');
    }

    const fdcAlias = `FDC:${usdaFormattedFood.fdcId}`;
    let existing = await prisma.foodItem.findFirst({
      where: {
        OR: [
          { aliases: { contains: fdcAlias } },
          { name: usdaFormattedFood.name },
        ],
      },
      include: { servings: true },
    });

    if (existing) {
      return existing;
    }

    // Create new verified FoodItem
    const created = await prisma.foodItem.create({
      data: {
        name: usdaFormattedFood.name,
        regionalName: usdaFormattedFood.regionalName || null,
        aliases: usdaFormattedFood.aliases || fdcAlias,
        category: usdaFormattedFood.category || 'Global & Packaged Foods',
        cuisine: usdaFormattedFood.cuisine || 'International',
        dietaryType: usdaFormattedFood.dietaryType || 'All',
        servingUnit: usdaFormattedFood.servingUnit || '100g',
        servingSizeGrams: usdaFormattedFood.servingSizeGrams || 100,
        calories: usdaFormattedFood.calories,
        protein: usdaFormattedFood.protein,
        carbs: usdaFormattedFood.carbs,
        fat: usdaFormattedFood.fat,
        fiber: usdaFormattedFood.fiber,
        sugar: usdaFormattedFood.sugar,
        sodium: usdaFormattedFood.sodium,
        source: 'USDA FoodData Central',
        isVerified: true,
        isCustom: false,
        servings: {
          create: usdaFormattedFood.servings?.map((s) => ({
            unitName: s.unitName,
            gramWeight: s.gramWeight,
            isDefault: s.isDefault ?? false,
          })) || [
            { unitName: '100g standard', gramWeight: 100, isDefault: true },
          ],
        },
      },
      include: { servings: true },
    });

    return created;
  },
};
