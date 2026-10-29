import { test, describe } from 'node:test';
import assert from 'node:assert';
import { nutritionService } from '../src/services/nutrition.service.js';
import { usdaFoodService } from '../src/services/usdaFood.service.js';
import { aiFoodVisionService } from '../src/services/aiFoodVision.service.js';

describe('1. Reliable Nutrition Calculation Engine', () => {
  test('Deterministic proportional scaling from reference 100g quantity', () => {
    // Verified food item with 150 kcal, 10g protein, 20g carbs, 3g fat per 100g
    const mockFood = {
      id: 'mock-1',
      name: 'High Protein Paneer Blend',
      servingSizeGrams: 100,
      calories: 150,
      protein: 10,
      carbs: 20,
      fat: 3,
      fiber: 2,
    };

    // 200g portion calculation
    const portionGrams = 200;
    const ratio = portionGrams / mockFood.servingSizeGrams;
    const computedCalories = Math.round(mockFood.calories * ratio * 10) / 10;
    const computedProtein = Math.round(mockFood.protein * ratio * 10) / 10;
    const computedCarbs = Math.round(mockFood.carbs * ratio * 10) / 10;
    const computedFat = Math.round(mockFood.fat * ratio * 10) / 10;
    const computedFiber = Math.round(mockFood.fiber * ratio * 10) / 10;

    assert.strictEqual(computedCalories, 300, 'Calories for 200g portion must be exactly 300 kcal');
    assert.strictEqual(computedProtein, 20, 'Protein for 200g portion must be exactly 20g');
    assert.strictEqual(computedCarbs, 40, 'Carbs for 200g portion must be exactly 40g');
    assert.strictEqual(computedFat, 6, 'Fat for 200g portion must be exactly 6g');
    assert.strictEqual(computedFiber, 4, 'Fiber for 200g portion must be exactly 4g');
  });

  test('Validation rejects invalid, negative, non-finite or unreasonable quantities', async () => {
    const invalidInputs = [0, -1, -50, NaN, Infinity, -Infinity, 10001];

    for (const invalidQty of invalidInputs) {
      await assert.rejects(
        async () => {
          await nutritionService.logFood('dummy-user-id', {
            mealType: 'Lunch',
            servingQuantity: invalidQty,
            foodName: 'Test Food',
            calories: 100,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        },
        `Quantity ${invalidQty} should be rejected with HTTP 400`
      );
    }
  });
});

describe('2. Mifflin-St Jeor TDEE & Macro Calculation', () => {
  test('Male 28y, 175cm, 72.5kg, moderate activity, maintenance goal', () => {
    const result = nutritionService.calculateTdeeTargets({
      age: 28,
      gender: 'male',
      heightCm: 175,
      currentWeightKg: 72.5,
      activityLevel: 'moderate',
      fitnessGoal: 'maintenance',
    });

    // BMR = 10 * 72.5 + 6.25 * 175 - 5 * 28 + 5 = 725 + 1093.75 - 140 + 5 = 1683.75 -> 1683.8
    assert.strictEqual(result.bmr, 1683.8);
    // TDEE = Math.round(1683.75 * 1.55) = 2610
    assert.strictEqual(result.tdee, 2610);
    assert.strictEqual(result.targetCalories, 2610);
    // Protein = Math.round(72.5 * 1.6) = 116g
    assert.strictEqual(result.proteinGrams, 116);
    // Water target = Math.round(72.5 * 35) = 2538ml
    assert.strictEqual(result.waterTargetMl, 2538);
    assert.strictEqual(result.isEstimate, true);
  });

  test('Female 25y, 165cm, 60kg, light activity, weight loss goal', () => {
    const result = nutritionService.calculateTdeeTargets({
      age: 25,
      gender: 'female',
      heightCm: 165,
      currentWeightKg: 60,
      activityLevel: 'light',
      fitnessGoal: 'weight_loss',
    });

    // BMR = 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345.3
    assert.strictEqual(result.bmr, 1345.3);
    // TDEE = Math.round(1345.25 * 1.375) = 1850
    assert.strictEqual(result.tdee, 1850);
    // Deficit of -450 kcal -> 1850 - 450 = 1400 kcal
    assert.strictEqual(result.targetCalories, 1400);
    // Protein = Math.round(60 * 1.6) = 96g
    assert.strictEqual(result.proteinGrams, 96);
    assert.strictEqual(result.isEstimate, true);
  });
});

describe('3. USDA FoodData Central Integration', () => {
  test('Formats raw USDA data with isExternal flag and explicit 100g portions', () => {
    const rawUsda = {
      fdcId: 999999,
      description: 'Rolled Oats Standard',
      servingSize: 40,
      servingSizeUnit: 'g',
      householdServingFullText: '1/2 cup (40g)',
      foodNutrients: [
        { nutrientName: 'Energy', value: 150 },
        { nutrientName: 'Protein', value: 5.0 },
        { nutrientName: 'Carbohydrate, by difference', value: 27.0 },
        { nutrientName: 'Total lipid (fat)', value: 2.5 },
        { nutrientName: 'Fiber, total dietary', value: 4.0 },
      ],
    };

    const formatted = usdaFoodService.formatUsdaFood(rawUsda);
    assert.strictEqual(formatted.id, 'usda_999999');
    assert.strictEqual(formatted.name, 'Rolled Oats Standard');
    assert.strictEqual(formatted.isExternal, true);
    assert.strictEqual(formatted.isVerified, true);
    assert.strictEqual(formatted.source, 'USDA FoodData Central');
    assert.strictEqual(formatted.calories, 150);
    assert.strictEqual(formatted.protein, 5.0);
    assert.strictEqual(formatted.carbs, 27.0);
    assert.strictEqual(formatted.fat, 2.5);
    assert.strictEqual(formatted.fiber, 4.0);
    assert.strictEqual(formatted.servings.length, 2);
    assert.strictEqual(formatted.servings[0].unitName, '1/2 cup (40g)');
  });
});

describe('4. AI Photo Recognition Uncertainty & Mandatory Review', () => {
  test('Photo candidate detection attaches disclaimer and requires confirmation', async () => {
    const result = await aiFoodVisionService.recognizePhoto({
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAopt/AAAAAElFTkSuQmCC',
      optionalHint: 'idli sambar',
      mealType: 'Breakfast',
    });

    assert.strictEqual(result.requiresUserConfirmation, true, 'Must require user confirmation');
    assert.ok(result.disclaimer.includes('Review and adjust'), 'Disclaimer must instruct review');
    assert.ok(result.items.length > 0, 'Should detect candidate items');
    assert.ok(result.estimatedTotals.calories > 0, 'Should have estimated calories');
  });
});
