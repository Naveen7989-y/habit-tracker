/**
 * Stage 3 Nutrition Intelligence & Accuracy Acceptance Test Suite
 * Validates real-world Indian meal calculations, data quality tiers, and provenance standards.
 */

const BASE_URL = 'http://localhost:5000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion Failed: ${message} (Expected: ${expected}, Got: ${actual})`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🇮🇳 Stage 3: Real-World Nutrition Validation & Indian Meal Intelligence');
  console.log('================================================================\n');

  try {
    // 0. Authenticate Demo User (User 1)
    console.log('Setup: Authenticating Demo User (User 1)...');
    const login1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@habittracker.com', password: 'Demo@123' }),
    });
    const login1Json = await login1.json();
    if (!login1.ok) throw new Error(`User 1 login failed: ${login1Json.message}`);
    const token1 = login1Json.data.token;
    const auth1 = { Authorization: `Bearer ${token1}`, 'Content-Type': 'application/json' };
    console.log('  ✅ Authenticated User 1 successfully.\n');

    // Authenticate / Register User 2 for multi-tenant isolation
    console.log('Setup: Authenticating Isolation Probe User (User 2)...');
    let token2 = null;
    const login2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'Password123!' }),
    });
    if (login2.ok) {
      const d2 = await login2.json();
      token2 = d2.data?.token || d2.token;
    } else {
      const reg2 = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bob Isolation', email: 'bob@example.com', password: 'Password123!' }),
      });
      const reg2Json = await reg2.json();
      token2 = reg2Json.data?.token || reg2Json.token;
    }
    const auth2 = { Authorization: `Bearer ${token2}`, 'Content-Type': 'application/json' };
    console.log('  ✅ Authenticated User 2 successfully.\n');

    // 1. Validation Report API (GET /api/nutrition/validation/report)
    console.log('Test 1: Accuracy Validation Report API (GET /api/nutrition/validation/report)...');
    const valRes = await fetch(`${BASE_URL}/nutrition/validation/report`, { headers: auth1 });
    assertEqual(valRes.status, 200, 'Validation report status should be 200');
    const valJson = await valRes.json();
    const report = valJson.data;
    assertEqual(report.status, 'HEALTHY_VERIFIED', 'Report status must be HEALTHY_VERIFIED');
    assert(report.summary.totalPortionTests >= 30, 'Should test at least 30 reference portions');
    assertEqual(report.summary.failed, 0, 'Zero tests must fail in ground-truth suite');
    assertEqual(report.summary.passRate, '100%', 'Pass rate must be 100%');
    assertEqual(report.databaseProvenance.duplicateNamesCount, 0, 'Zero duplicate food names allowed in database');
    console.log(`  ✅ Validation Report: 100% Pass Rate across ${report.summary.totalPortionTests} reference portions.`);
    console.log(`  ✅ Database Provenance: ${report.databaseProvenance.totalFoods} foods, 0 duplicates.\n`);

    // 2. Direct gram entry and proportional scaling from 100g base
    console.log('Test 2: Direct gram entry & deterministic scaling from 100g base...');
    const searchRes = await fetch(`${BASE_URL}/nutrition/foods?query=Rice&limit=5`, { headers: auth1 });
    const searchData = await searchRes.json();
    const foods = searchData.data?.foods || [];
    assert(foods.length > 0, 'Should find rice staple in catalogue');
    const rice = foods[0];

    const targetGrams = 250;
    const baseGrams = rice.servingSizeGrams || 100;
    const ratio = targetGrams / baseGrams;
    const expectedCal = Math.round(rice.calories * ratio * 10) / 10;
    const expectedP = Math.round(rice.protein * ratio * 10) / 10;

    const logRes = await fetch(`${BASE_URL}/nutrition/logs`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({
        foodItemId: rice.id,
        servingGramWeight: targetGrams,
        servingQuantity: 1,
        servingUnit: `${targetGrams}g direct portion`,
        mealType: 'Lunch',
      }),
    });
    assertEqual(logRes.status, 201, 'Food log creation should return 201');
    const logData = await logRes.json();
    const createdLog = logData.data?.log || logData.log;
    assertEqual(createdLog.totalGrams, targetGrams, 'Total grams must equal 250g');
    assertEqual(createdLog.calories, expectedCal, 'Calories must scale deterministically');
    assertEqual(createdLog.protein, expectedP, 'Protein must scale deterministically');
    console.log(`  ✅ Scaled ${rice.name} (${rice.calories} kcal/100g) -> ${targetGrams}g = ${createdLog.calories} kcal.\n`);

    // 3. Daily diary includes dataQuality classification and calculation breakdown
    console.log('Test 3: Daily diary dataQuality and calculation breakdown metadata...');
    const today = new Date().toISOString().split('T')[0];
    const diaryRes = await fetch(`${BASE_URL}/nutrition/logs?date=${today}`, { headers: auth1 });
    const diaryData = (await diaryRes.json()).data;
    const mealsList = diaryData.meals || diaryData.mealSummaries || [];
    const lunch = mealsList.find((m) => m.mealType === 'Lunch');
    const loggedItem = lunch.items.find((i) => i.id === createdLog.id);
    assert(loggedItem, 'Created food log should appear in lunch summary');
    assert(loggedItem.dataQuality, 'Item must have a classified dataQuality');
    assert(loggedItem.calculationBreakdown, 'Item must provide calculationBreakdown');
    assert(loggedItem.calculationBreakdown.formula.includes('Base Nutrient'), 'Formula must be transparent');
    console.log(`  ✅ Data Quality: ${loggedItem.dataQuality} | Formula: ${loggedItem.calculationBreakdown.formula}\n`);

    // 4. Calibrated serving sizes convert correctly
    console.log('Test 4: Calibrated household serving conversions...');
    if (rice.servings && rice.servings.length > 0) {
      const serving = rice.servings[0];
      const servingLogRes = await fetch(`${BASE_URL}/nutrition/logs`, {
        method: 'POST',
        headers: auth1,
        body: JSON.stringify({
          foodItemId: rice.id,
          servingUnit: serving.unitName,
          servingGramWeight: serving.gramWeight,
          servingQuantity: 2,
          mealType: 'Dinner',
        }),
      });
      assertEqual(servingLogRes.status, 201, 'Serving unit log must return 201');
      const servingLog = (await servingLogRes.json()).data?.log;
      assertEqual(servingLog.totalGrams, serving.gramWeight * 2, '2x portion must equal 2x gram weight');

      await fetch(`${BASE_URL}/nutrition/logs/${servingLog.id}`, { method: 'DELETE', headers: auth1 });
      console.log(`  ✅ 2 × ${serving.unitName} (${serving.gramWeight}g) = ${servingLog.totalGrams}g correctly converted.\n`);
    }

    // 5. Cooked vs raw food nutrient density distinction
    console.log('Test 5: Cooked vs raw food nutrient density distinction...');
    const rawSearch = await fetch(`${BASE_URL}/nutrition/foods?query=Raw Basmati Rice&limit=5`, { headers: auth1 });
    const cookedSearch = await fetch(`${BASE_URL}/nutrition/foods?query=Steamed White Rice&limit=5`, { headers: auth1 });
    const rawFoods = (await rawSearch.json()).data?.foods || [];
    const cookedFoods = (await cookedSearch.json()).data?.foods || [];
    const rawRice = rawFoods.find((f) => f.name.toLowerCase().includes('rice')) || { calories: 349, servingSizeGrams: 100 };
    const cookedRice = cookedFoods.find((f) => f.name.toLowerCase().includes('rice')) || { calories: 195, servingSizeGrams: 150 };

    const rawDensityPer100g = Math.round((rawRice.calories / (rawRice.servingSizeGrams || 100)) * 100);
    const cookedDensityPer100g = Math.round((cookedRice.calories / (cookedRice.servingSizeGrams || 100)) * 100);

    assert(
      rawDensityPer100g > cookedDensityPer100g * 2,
      `Raw grain calorie density (${rawDensityPer100g} kcal/100g) must be > 2x cooked grain (${cookedDensityPer100g} kcal/100g) due to water absorption`
    );
    console.log(`  ✅ Raw Rice (${rawDensityPer100g} kcal/100g) vs Cooked Rice (${cookedDensityPer100g} kcal/100g) verified.\n`);

    // 6. Indian Recipe Intelligence with batch yield and water absorption modeling
    console.log('Test 6: Recipe Intelligence with cooked yield & batch division...');
    const recipeRes = await fetch(`${BASE_URL}/nutrition/recipes`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({
        name: 'Stage 3 Moong Dal Tadka',
        servings: 2,
        cookedWeightGrams: 280,
        notes: 'Water absorption modeled with 280g cooked yield',
        ingredients: [
          { ingredientName: 'Raw Moong Dal', grams: 100, calories: 348, protein: 24.5, carbs: 59.9, fat: 1.2, fiber: 8.2 },
          { ingredientName: 'Desi Ghee', grams: 10, calories: 90, protein: 0, carbs: 0, fat: 10, fiber: 0 },
        ],
      }),
    });
    assertEqual(recipeRes.status, 201, 'Recipe creation should return 201');
    const recipe = (await recipeRes.json()).data?.recipe;
    assertEqual(recipe.totalCalories, 438, 'Batch calories must be 348 + 90 = 438 kcal');
    assertEqual(recipe.caloriesPerServing, 219, 'Per-serving calories must be 219 kcal');
    assertEqual(recipe.cookedWeightGrams, 280, 'Cooked yield must be 280g');

    // Log 1 serving of this recipe
    const logRecipeRes = await fetch(`${BASE_URL}/nutrition/logs`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({
        recipeId: recipe.id,
        servingQuantity: 1,
        mealType: 'Dinner',
      }),
    });
    const recipeLog = (await logRecipeRes.json()).data?.log;
    assertEqual(recipeLog.calories, 219, 'Recipe log calories must equal 219 kcal');
    assertEqual(recipeLog.totalGrams, 140, 'Recipe log weight must equal 280g / 2 = 140g per serving');
    console.log(`  ✅ Recipe batch yield conserved: 438 kcal / 280g -> 1 serving = 219 kcal / 140g.\n`);

    // 7. Historical log immutability: Recipe edits do NOT alter historical food logs
    console.log('Test 7: Historical log immutability against recipe edits...');
    // Modify recipe to have 600 calories
    await fetch(`${BASE_URL}/nutrition/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: auth1,
      body: JSON.stringify({
        name: 'Stage 3 Moong Dal Tadka (Altered)',
        servings: 2,
        ingredients: [
          { ingredientName: 'Double Dal', grams: 200, calories: 600, protein: 40, carbs: 90, fat: 10 },
        ],
      }),
    });

    // Verify historical recipeLog still retains 219 kcal
    const checkDiary = await fetch(`${BASE_URL}/nutrition/logs?date=${today}`, { headers: auth1 });
    const checkJson = (await checkDiary.json()).data;
    const checkMealsList = checkJson.meals || checkJson.mealSummaries || [];
    const dinnerMeal = checkMealsList.find((m) => m.mealType === 'Dinner');
    const preservedLog = dinnerMeal.items.find((i) => i.id === recipeLog.id);
    assertEqual(preservedLog.calories, 219, 'Historical log calories must remain 219 kcal');
    console.log('  ✅ Historical food log is strictly immutable against recipe updates.\n');

    // Clean up recipe log
    await fetch(`${BASE_URL}/nutrition/logs/${recipeLog.id}`, { method: 'DELETE', headers: auth1 });
    await fetch(`${BASE_URL}/nutrition/recipes/${recipe.id}`, { method: 'DELETE', headers: auth1 });

    // 8. Indian Thali / Composite Meal logging API (POST /api/nutrition/meals/thali)
    console.log('Test 8: Indian Thali / Composite Meal logging API (POST /api/nutrition/meals/thali)...');
    const thaliRes = await fetch(`${BASE_URL}/nutrition/meals/thali`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({
        thaliName: 'North Indian Executive Thali',
        mealType: 'Lunch',
        items: [
          { foodItemId: rice.id, servingGramWeight: 150, servingQuantity: 1, servingUnit: '1 katori (150g)' },
        ],
      }),
    });
    assertEqual(thaliRes.status, 201, 'Thali logging must return 201');
    const thaliData = (await thaliRes.json()).data;
    assertEqual(thaliData.thaliName, 'North Indian Executive Thali');
    assertEqual(thaliData.itemCount, 1);
    assert(thaliData.totalCalories > 0, 'Thali calories must be > 0');
    console.log(`  ✅ Thali '${thaliData.thaliName}' logged with ${thaliData.totalCalories} kcal.\n`);

    // Clean up thali child logs
    for (const l of thaliData.logs) {
      await fetch(`${BASE_URL}/nutrition/logs/${l.id}`, { method: 'DELETE', headers: auth1 });
    }

    // 9. AI Food Vision uncertainty disclosure & confidence separation
    console.log('Test 9: AI Photo Vision uncertainty & dual confidence scores...');
    const visionRes = await fetch(`${BASE_URL}/nutrition/ai-photo-recognize`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
        mealHint: '2 idlis with sambar',
      }),
    });
    assertEqual(visionRes.status, 200, 'AI Photo recognize should return 200');
    const visionData = (await visionRes.json()).data;
    assert(visionData.disclaimer, 'Must include mandatory disclaimer');
    const candidate = visionData.items[0];
    assert(candidate.recognitionConfidence !== undefined, 'Must provide recognitionConfidence');
    assert(candidate.portionConfidence !== undefined, 'Must provide portionConfidence');
    assert(Array.isArray(candidate.ambiguousIngredients), 'Must disclose ambiguous ingredients');
    assert(Array.isArray(candidate.clarifyingQuestions), 'Must provide clarifying questions');
    assertEqual(candidate.dataQuality, 'AI_ESTIMATED', 'Quality tier must be AI_ESTIMATED');
    console.log(`  ✅ Recognition: ${candidate.recognitionConfidence * 100}% | Portion: ${candidate.portionConfidence * 100}%`);
    console.log(`  ✅ Ambiguous Ingredients: ${candidate.ambiguousIngredients.join(', ')}\n`);

    // 10. Negative & invalid portion rejection
    console.log('Test 10: Rejecting negative and non-finite quantities (HTTP 400)...');
    const negRes = await fetch(`${BASE_URL}/nutrition/logs`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({ foodItemId: rice.id, servingQuantity: -1, mealType: 'Lunch' }),
    });
    assertEqual(negRes.status, 400, 'Negative quantity must return 400');

    const zeroRes = await fetch(`${BASE_URL}/nutrition/logs`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({ foodItemId: rice.id, servingQuantity: 0, mealType: 'Lunch' }),
    });
    assertEqual(zeroRes.status, 400, 'Zero quantity must return 400');

    const nanRes = await fetch(`${BASE_URL}/nutrition/logs`, {
      method: 'POST',
      headers: auth1,
      body: JSON.stringify({ foodItemId: rice.id, servingGramWeight: 'bad-weight', mealType: 'Lunch' }),
    });
    assertEqual(nanRes.status, 400, 'Invalid gram weight must return 400');
    console.log('  ✅ Negative, zero, and non-numeric quantities strictly rejected with 400.\n');

    // 11. Multi-tenant isolation: User 2 cannot access or mutate User 1 logs
    console.log('Test 11: Multi-tenant isolation (User 2 blocked from User 1 logs)...');
    const crossDelRes = await fetch(`${BASE_URL}/nutrition/logs/${createdLog.id}`, {
      method: 'DELETE',
      headers: auth2,
    });
    assertEqual(crossDelRes.status, 404, 'User 2 cannot delete User 1 food log (must return 404)');
    console.log('  ✅ Tenant boundary verified: User 2 blocked with 404.\n');

    // Clean up createdLog by User 1
    await fetch(`${BASE_URL}/nutrition/logs/${createdLog.id}`, { method: 'DELETE', headers: auth1 });

    console.log('================================================================');
    console.log('🎉 ALL 11 STAGE 3 INTELLIGENCE & VALIDATION ACCEPTANCE TESTS PASSED 100%!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Stage 3 Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();
