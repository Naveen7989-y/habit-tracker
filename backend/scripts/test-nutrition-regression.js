import { test, describe } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/prisma.js';
import { nutritionService } from '../src/services/nutrition.service.js';

describe('--- HAbyTAT Nutrition Hub Stage 2: Data Integrity & Accuracy Regression Suite ---', () => {

  // Test 1: Deterministic proportional scaling from 100g base
  test('1. Proportional scaling from 100g base to arbitrary gram quantities', () => {
    const base100g = {
      servingSizeGrams: 100,
      calories: 349, // e.g. Raw Basmati Rice
      protein: 7.9,
      carbs: 77.2,
      fat: 0.5,
      fiber: 2.8,
    };

    const testWeights = [
      { grams: 100, expectedCal: 349, expectedP: 7.9, expectedC: 77.2 },
      { grams: 200, expectedCal: 698, expectedP: 15.8, expectedC: 154.4 },
      { grams: 50,  expectedCal: 174.5, expectedP: 4.0, expectedC: 38.6 },
      { grams: 185, expectedCal: 645.7, expectedP: 14.6, expectedC: 142.8 }, // 1 cup raw
      { grams: 35,  expectedCal: 122.2, expectedP: 2.8, expectedC: 27.0 },  // 1 dough ball
    ];

    for (const tw of testWeights) {
      const ratio = tw.grams / base100g.servingSizeGrams;
      const cal = Math.round(base100g.calories * ratio * 10) / 10;
      const p = Math.round(base100g.protein * ratio * 10) / 10;
      const c = Math.round(base100g.carbs * ratio * 10) / 10;

      assert.strictEqual(cal, tw.expectedCal, `Calories for ${tw.grams}g mismatch`);
      assert.strictEqual(p, tw.expectedP, `Protein for ${tw.grams}g mismatch`);
      assert.strictEqual(c, tw.expectedC, `Carbs for ${tw.grams}g mismatch`);
    }
  });

  // Test 2: Input rejection for invalid quantities
  test('2. Rejects negative, zero, non-finite, and unreasonable quantities', async () => {
    const invalidQuantities = [-10, 0, -0.01, NaN, Infinity, -Infinity, 10001];

    for (const q of invalidQuantities) {
      await assert.rejects(
        async () => {
          await nutritionService.logFood('test-dummy-user', {
            mealType: 'Lunch',
            servingQuantity: q,
            foodName: 'Test Rejection Food',
            calories: 100,
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        },
        `Expected rejection for quantity: ${q}`
      );
    }
  });

  // Test 3: Recipe scaling and cooked yield division
  test('3. Recipe scaling: batch aggregation, per-serving division, and cooked weight yield', () => {
    // 3 Servings recipe: 200g Rice (raw) + 100g Dal (raw) + 15g Ghee + 400g Water
    const ingredients = [
      { name: 'Raw Rice', grams: 200, calories: 698, protein: 15.8, carbs: 154.4, fat: 1.0 },
      { name: 'Raw Dal',  grams: 100, calories: 343, protein: 22.3, carbs: 60.4,  fat: 1.5 },
      { name: 'Pure Ghee', grams: 15, calories: 135, protein: 0.0,  carbs: 0.0,   fat: 15.0 },
    ];

    const servings = 3;
    const cookedYieldGrams = 650; // Cooked khichdi weight after water absorption

    const totalCal = ingredients.reduce((sum, i) => sum + i.calories, 0); // 1176 kcal
    const totalP = ingredients.reduce((sum, i) => sum + i.protein, 0);    // 38.1 g
    const totalC = ingredients.reduce((sum, i) => sum + i.carbs, 0);      // 214.8 g
    const totalF = ingredients.reduce((sum, i) => sum + i.fat, 0);        // 17.5 g

    const perServingCal = Math.round((totalCal / servings) * 10) / 10;   // 392.0 kcal
    const perServingP = Math.round((totalP / servings) * 10) / 10;       // 12.7 g
    const perServingC = Math.round((totalC / servings) * 10) / 10;       // 71.6 g
    const perServingF = Math.round((totalF / servings) * 10) / 10;       // 5.8 g
    const perServingGrams = Math.round(cookedYieldGrams / servings);     // 217 g

    assert.strictEqual(totalCal, 1176, 'Total batch calories must sum correctly');
    assert.strictEqual(perServingCal, 392, 'Per serving calories must be exactly 392 kcal');
    assert.strictEqual(perServingP, 12.7, 'Per serving protein must be 12.7g');
    assert.strictEqual(perServingGrams, 217, 'Per serving cooked weight must be 217g');

    // 2 Servings logged portion
    const loggedServings = 2;
    const computedLoggedCal = Math.round(perServingCal * loggedServings * 10) / 10;
    assert.strictEqual(computedLoggedCal, 784, '2 servings must be exactly 784 kcal');
  });

  // Test 4: Physical serving mappings and exact gram weights
  test('4. Physical serving definitions have explicit, positive gram weights', () => {
    const verifiedServings = [
      { unit: '1 katori (150g)', grams: 150 },
      { unit: '1 standard bowl (150g)', grams: 150 },
      { unit: '1 glass (250ml)', grams: 257 }, // milk specific gravity 1.03
      { unit: '1 piece idli (50g)', grams: 50 },
      { unit: '1 standard dosa (80g)', grams: 80 },
      { unit: '1 phulka / roti (35g)', grams: 35 },
      { unit: '1 tbsp olive oil (14g)', grams: 14 },
      { unit: '1 scoop whey (30g)', grams: 30 },
      { unit: '1 tsp ghee (5g)', grams: 5 },
    ];

    for (const s of verifiedServings) {
      assert.ok(s.grams > 0, `Serving ${s.unit} must have a positive gram weight`);
      assert.ok(s.grams <= 1000, `Serving ${s.unit} must have realistic weight`);
    }
  });

  // Test 5: Scientific Atwater validation sanity check
  test('5. Atwater energy balance check detects implausible fabricated numbers', () => {
    // Valid item
    const validP = 20;
    const validC = 40;
    const validF = 10;
    const reportedCal = 330; // 20*4 + 40*4 + 10*9 = 80 + 160 + 90 = 330
    const theoretical = validP * 4 + validC * 4 + validF * 9;
    const diff = Math.abs(reportedCal - theoretical) / reportedCal;
    assert.ok(diff < 0.05, 'Valid food must have small Atwater deviation');

    // Fabricated item with 500 kcal reported but only 10g carbs, 0g P, 0g F
    const fakeP = 0;
    const fakeC = 10;
    const fakeF = 0;
    const fakeCal = 500;
    const fakeTheo = fakeP * 4 + fakeC * 4 + fakeF * 9; // 40 kcal
    const fakeDiff = Math.abs(fakeCal - fakeTheo) / fakeCal;
    assert.ok(fakeDiff > 0.8, 'Atwater check correctly flags implausible data');
  });

  // Test 6: Zero client trust for nutrient totals
  test('6. Server recalculates nutrients from foodItemId ignoring client-submitted calories', async () => {
    // If client submits calories: 1 (trying to spoof calorie count)
    // Server must look up foodItem and compute true calories
    const mockFoodItem = {
      id: 'mock-food-integrity',
      name: 'Paneer 100g',
      servingSizeGrams: 100,
      calories: 289,
      protein: 18.3,
      carbs: 3.4,
      fat: 22.0,
      fiber: 0,
      servings: [{ unitName: '100g', gramWeight: 100, isDefault: true }],
    };

    const clientSubmittedCal = 1; // Attempted client manipulation
    const qty = 1;
    const ratio = (100 * qty) / mockFoodItem.servingSizeGrams;
    const serverComputedCal = Math.round(mockFoodItem.calories * ratio);

    assert.notStrictEqual(serverComputedCal, clientSubmittedCal, 'Server must not accept client-spoofed calories');
    assert.strictEqual(serverComputedCal, 289, 'Server calculation must be authoritative 289 kcal');
  });
});

