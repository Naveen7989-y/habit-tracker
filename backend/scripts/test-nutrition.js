/**
 * Automated Integration Test Suite for Nutrition Tracker API
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🥗 Starting Indian Nutrition Tracker Integration Tests');
  console.log('====================================================\n');

  try {
    // Setup: Login as Demo User
    console.log('Setup: Authenticating Demo User...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@habittracker.com',
        password: 'Demo@123',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.message}`);
    const token = loginData.data.token;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log('  ✅ Authenticated demo user successfully.\n');

    // Test 1: Food Search & Filtering
    console.log('Test 1: Search Indian Food Catalogue (GET /api/nutrition/foods?query=dosa)...');
    const searchRes = await fetch(`${BASE_URL}/nutrition/foods?query=dosa`, { headers: authHeaders });
    const searchData = await searchRes.json();
    if (!searchRes.ok) throw new Error(searchData.message);
    const { foods, totalCount } = searchData.data;
    console.log(`  ✅ Found ${totalCount} matching dishes for "dosa"`);
    if (foods.length === 0) throw new Error('Expected at least 1 food item for "dosa"');
    const firstFood = foods[0];
    console.log(`     • ${firstFood.name} (${firstFood.calories} kcal / ${firstFood.servingSizeGrams}g)`);
    console.log(`     • Servings available: ${firstFood.servings.length} portion choices`);
    console.log('  ✅ Test 1 Passed.\n');

    // Test 2: Toggle & Retrieve Favorites
    console.log('Test 2: Toggle & Retrieve Favorite Food...');
    const favToggleRes = await fetch(`${BASE_URL}/nutrition/foods/${firstFood.id}/favorite`, {
      method: 'POST',
      headers: authHeaders,
    });
    const favToggleData = await favToggleRes.json();
    if (!favToggleRes.ok) throw new Error(favToggleData.message);
    console.log(`  ✅ Toggle response: ${favToggleData.message} (isFavorite: ${favToggleData.data.isFavorite})`);

    const favListRes = await fetch(`${BASE_URL}/nutrition/foods/favorites`, { headers: authHeaders });
    const favListData = await favListRes.json();
    if (!favListRes.ok) throw new Error(favListData.message);
    console.log(`  ✅ Total favorites for user: ${favListData.data.foods.length}`);
    console.log('  ✅ Test 2 Passed.\n');

    // Test 3: Daily Diary Retrieval
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`Test 3: Daily Diary Retrieval (GET /api/nutrition/logs?date=${todayStr})...`);
    const diaryRes = await fetch(`${BASE_URL}/nutrition/logs?date=${todayStr}`, { headers: authHeaders });
    const diaryData = await diaryRes.json();
    if (!diaryRes.ok) throw new Error(diaryData.message);
    const diary = diaryData.data;
    console.log(`  ✅ Date: ${diary.logDate}`);
    console.log(`  ✅ Calorie Goal: ${diary.goals.dailyCalories} kcal | Consumed: ${diary.totals.calories} kcal (${diary.percentage.calories}%)`);
    console.log(`  ✅ Macros Consumed: P: ${diary.totals.protein}g | C: ${diary.totals.carbs}g | F: ${diary.totals.fat}g | Fiber: ${diary.totals.fiber}g`);
    console.log(`  ✅ Meals tracked: ${diary.meals.length} meal sections`);
    if (diary.meals.length < 5) throw new Error('Expected at least 5 meal categories in diary');
    console.log('  ✅ Test 3 Passed.\n');

    // Test 4: Log Food Item (Server-Authoritative Calculation)
    console.log('Test 4: Log Food Item with Portion (POST /api/nutrition/logs)...');
    const logRes = await fetch(`${BASE_URL}/nutrition/logs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        foodItemId: firstFood.id,
        mealType: 'Breakfast',
        logDate: todayStr,
        servingQuantity: 2,
        servingUnit: firstFood.servings[0]?.unitName || 'piece',
        servingGramWeight: firstFood.servings[0]?.gramWeight || 80,
      }),
    });
    const logData = await logRes.json();
    if (!logRes.ok) throw new Error(logData.message);
    const createdLog = logData.data.log;
    console.log(`  ✅ Logged: "${createdLog.foodName}" x ${createdLog.servingQuantity} ${createdLog.servingUnit}`);
    console.log(`  ✅ Calculated: ${createdLog.calories} kcal, ${createdLog.protein}g protein, ${createdLog.carbs}g carbs, ${createdLog.fat}g fat`);
    if (createdLog.calories <= 0) throw new Error('Expected positive calorie calculation');
    console.log('  ✅ Test 4 Passed.\n');

    // Test 5: Update & Duplicate Food Log
    console.log(`Test 5: Update Food Log (PUT /api/nutrition/logs/${createdLog.id})...`);
    const updateRes = await fetch(`${BASE_URL}/nutrition/logs/${createdLog.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        servingQuantity: 3,
        notes: 'Extra crispy',
      }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(updateData.message);
    console.log(`  ✅ Updated quantity to 3. New calories: ${updateData.data.log.calories} kcal`);

    console.log(`  Duplicate Food Log to Afternoon Snack...`);
    const dupRes = await fetch(`${BASE_URL}/nutrition/logs/${createdLog.id}/duplicate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        targetMealType: 'Evening Snack',
        targetDate: todayStr,
      }),
    });
    const dupData = await dupRes.json();
    if (!dupRes.ok) throw new Error(dupData.message);
    const duplicatedLog = dupData.data.log;
    console.log(`  ✅ Duplicated to ${duplicatedLog.mealType}`);
    console.log('  ✅ Test 5 Passed.\n');

    // Test 6: Delete Food Logs
    console.log(`Test 6: Delete Test Food Logs (DELETE /api/nutrition/logs/${createdLog.id})...`);
    const del1 = await fetch(`${BASE_URL}/nutrition/logs/${createdLog.id}`, { method: 'DELETE', headers: authHeaders });
    if (!del1.ok) throw new Error('Failed to delete log 1');
    const del2 = await fetch(`${BASE_URL}/nutrition/logs/${duplicatedLog.id}`, { method: 'DELETE', headers: authHeaders });
    if (!del2.ok) throw new Error('Failed to delete duplicated log');
    console.log('  ✅ Logs deleted cleanly.');
    console.log('  ✅ Test 6 Passed.\n');

    // Test 7: Homemade Recipe Engine
    console.log('Test 7: Homemade Indian Recipe Creation & Nutrition Calculation...');
    const recipeRes = await fetch(`${BASE_URL}/nutrition/recipes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Test Tadka Moong Dal Khichdi',
        description: 'Light comfort khichdi with roasted cumin and ghee',
        servings: 3,
        cookedWeightGrams: 450,
        notes: 'Good for post-workout recovery',
        ingredients: [
          {
            ingredientName: 'Cooked Basmati Rice',
            quantity: 1,
            unit: 'cup (200g)',
            grams: 200,
            calories: 260,
            protein: 5.4,
            carbs: 56.6,
            fat: 0.8,
            fiber: 1.4,
          },
          {
            ingredientName: 'Cooked Yellow Moong Dal',
            quantity: 1,
            unit: 'katori (150g)',
            grams: 150,
            calories: 148,
            protein: 7.4,
            carbs: 18.2,
            fat: 5.2,
            fiber: 4.8,
          },
          {
            ingredientName: 'Pure Desi Ghee',
            quantity: 1,
            unit: 'tablespoon (14g)',
            grams: 14,
            calories: 125,
            protein: 0,
            carbs: 0,
            fat: 14,
            fiber: 0,
          },
        ],
      }),
    });
    const recipeData = await recipeRes.json();
    if (!recipeRes.ok) throw new Error(recipeData.message);
    const recipe = recipeData.data.recipe;
    console.log(`  ✅ Recipe Created: "${recipe.name}" (${recipe.servings} servings)`);
    console.log(`     • Total Batch: ${recipe.totalCalories} kcal, ${recipe.totalProtein}g protein, ${recipe.totalCarbs}g carbs, ${recipe.totalFat}g fat`);
    console.log(`     • Per Serving: ${recipe.caloriesPerServing} kcal, ${recipe.proteinPerServing}g protein, ${recipe.carbsPerServing}g carbs, ${recipe.fatPerServing}g fat`);
    if (recipe.caloriesPerServing <= 0) throw new Error('Expected positive per-serving calories');
    console.log('  ✅ Test 7 Passed.\n');

    // Test 8: Nutrition Goals & Mifflin-St Jeor TDEE Engine
    console.log('Test 8: Nutrition Goals & Mifflin-St Jeor TDEE Calculation...');
    const goalRes = await fetch(`${BASE_URL}/nutrition/goals`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        autoCalculateFromStats: true,
        age: 30,
        gender: 'male',
        heightCm: 178,
        currentWeightKg: 74,
        fitnessGoal: 'weight_loss',
        activityLevel: 'moderate',
        dietaryPreference: 'Veg',
      }),
    });
    const goalData = await goalRes.json();
    if (!goalRes.ok) throw new Error(goalData.message);
    const updatedGoals = goalData.data.goals;
    console.log(`  ✅ TDEE Target Calories: ${updatedGoals.dailyCalories} kcal (calculated for 74kg, 178cm, 30y male with weight_loss)`);
    console.log(`  ✅ Recommended Macros: Protein: ${updatedGoals.proteinGrams}g | Carbs: ${updatedGoals.carbsGrams}g | Fat: ${updatedGoals.fatGrams}g | Fiber: ${updatedGoals.fiberGrams}g`);
    if (updatedGoals.dailyCalories < 1200 || updatedGoals.dailyCalories > 3500) {
      throw new Error(`Calculated calories out of realistic range: ${updatedGoals.dailyCalories}`);
    }
    console.log('  ✅ Test 8 Passed.\n');

    // Test 9: Hydration Tracking
    console.log('Test 9: Hydration Water Tracker (POST & GET /api/nutrition/water)...');
    const waterRes = await fetch(`${BASE_URL}/nutrition/water`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        logDate: todayStr,
        amountMl: 250,
      }),
    });
    const waterData = await waterRes.json();
    if (!waterRes.ok) throw new Error(waterData.message);
    const waterEntry = waterData.data.entry;
    console.log(`  ✅ Logged 250ml water (Entry ID: ${waterEntry.id})`);

    const waterSummaryRes = await fetch(`${BASE_URL}/nutrition/water?date=${todayStr}`, { headers: authHeaders });
    const waterSummaryData = await waterSummaryRes.json();
    if (!waterSummaryRes.ok) throw new Error(waterSummaryData.message);
    console.log(`  ✅ Total Water Today: ${waterSummaryData.data.totalMl}ml / ${waterSummaryData.data.targetMl}ml (${waterSummaryData.data.percentage}%)`);
    console.log('  ✅ Test 9 Passed.\n');

    // Test 10: Weight Tracking History
    console.log('Test 10: Weight Tracking History (POST & GET /api/nutrition/weight)...');
    const weightRes = await fetch(`${BASE_URL}/nutrition/weight`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        logDate: todayStr,
        weightKg: 73.8,
        note: 'Post hydration weigh-in',
      }),
    });
    const weightData = await weightRes.json();
    if (!weightRes.ok) throw new Error(weightData.message);
    console.log(`  ✅ Recorded weight: ${weightData.data.record.weightKg} kg on ${weightData.data.record.logDate}`);

    const weightHistRes = await fetch(`${BASE_URL}/nutrition/weight`, { headers: authHeaders });
    const weightHistData = await weightHistRes.json();
    if (!weightHistRes.ok) throw new Error(weightHistData.message);
    console.log(`  ✅ Weight history records: ${weightHistData.data.history.length}`);
    console.log('  ✅ Test 10 Passed.\n');

    // Test 11: Nutrition Analytics & Trends
    console.log('Test 11: Nutrition Analytics (GET /api/nutrition/analytics?days=7)...');
    const analyticsRes = await fetch(`${BASE_URL}/nutrition/analytics?days=7`, { headers: authHeaders });
    const analyticsData = await analyticsRes.json();
    if (!analyticsRes.ok) throw new Error(analyticsData.message);
    const analytics = analyticsData.data;
    console.log(`  ✅ 7-Day Trend: ${analytics.dailyTrend.length} days analyzed`);
    console.log(`  ✅ Logging Consistency: ${analytics.consistencyPercentage}%`);
    console.log(`  ✅ Daily Averages: ${analytics.averages.calories} kcal | ${analytics.averages.protein}g P | ${analytics.averages.carbs}g C | ${analytics.averages.fat}g F`);
    console.log('  ✅ Test 11 Passed.\n');

    // Test 12: Natural Language / AI Food Parser
    console.log('Test 12: Natural Language Food Parser (POST /api/nutrition/ai-parse)...');
    const aiParseRes = await fetch(`${BASE_URL}/nutrition/ai-parse`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'I ate 2 dosas with coconut chutney and 1 katori dal tadka',
      }),
    });
    const aiParseData = await aiParseRes.json();
    if (!aiParseRes.ok) throw new Error(aiParseData.message);
    const parsed = aiParseData.data;
    console.log(`  ✅ Parsed items count: ${parsed.parsedCount}`);
    for (const item of parsed.items) {
      console.log(`     • ${item.quantity}x ${item.foodName} (${item.servingUnit}): ${item.calories} kcal, ${item.protein}g protein`);
    }
    console.log(`  ✅ Estimated Totals: ${parsed.estimatedTotals.calories} kcal, ${parsed.estimatedTotals.protein}g protein, ${parsed.estimatedTotals.carbs}g carbs`);
    if (parsed.parsedCount === 0) throw new Error('Expected at least 1 parsed item from natural language string');
    console.log('  ✅ Test 12 Passed.\n');

    console.log('====================================================');
    console.log('🎉 ALL 12 NUTRITION API INTEGRATION TESTS PASSED 100%!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
