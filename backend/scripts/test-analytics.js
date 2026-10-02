/**
 * Automated Test Suite for Phase 9: Analytics & Recharts API
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=========================================');
  console.log('🧪 Starting Analytics & Recharts API Tests');
  console.log('=========================================\n');

  try {
    // Authenticate Demo User
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
    console.log('  ✅ Authenticated successfully.\n');

    // Test 1: Weekly completion stats (Bar Chart)
    console.log('Test 1: Fetch Weekly Completion Stats (GET /api/statistics/weekly)...');
    const weeklyRes = await fetch(`${BASE_URL}/statistics/weekly`, { headers: authHeaders });
    const weeklyData = await weeklyRes.json();
    if (!weeklyRes.ok) throw new Error(weeklyData.message);
    const weekly = weeklyData.data;
    console.log(`  ✅ Days returned: ${weekly.days.length} (Expected: 7)`);
    console.log(`  ✅ Total habits: ${weekly.totalHabits}`);
    for (const d of weekly.days) {
      console.log(`     • ${d.day} (${d.date}): ${d.completed}/${d.target} (${d.rate}%)`);
    }
    if (weekly.days.length !== 7) throw new Error('Expected 7 days for weekly stats');
    console.log('  ✅ Test 1 Passed.\n');

    // Test 2: Monthly trend stats (Line/Area Chart)
    console.log('Test 2: Fetch Monthly Trend Stats (GET /api/statistics/monthly?days=30)...');
    const monthlyRes = await fetch(`${BASE_URL}/statistics/monthly?days=30`, { headers: authHeaders });
    const monthlyData = await monthlyRes.json();
    if (!monthlyRes.ok) throw new Error(monthlyData.message);
    const monthly = monthlyData.data;
    console.log(`  ✅ Trend points: ${monthly.trend.length} points between ${monthly.startDate} and ${monthly.endDate}`);
    if (monthly.trend.length !== 30) throw new Error('Expected 30 points in monthly trend');
    console.log('  ✅ Test 2 Passed.\n');

    // Test 3: Category breakdown (Pie/Donut Chart)
    console.log('Test 3: Fetch Category Breakdown (GET /api/statistics/categories)...');
    const catRes = await fetch(`${BASE_URL}/statistics/categories`, { headers: authHeaders });
    const catData = await catRes.json();
    if (!catRes.ok) throw new Error(catData.message);
    const categories = catData.data;
    console.log(`  ✅ Categories count: ${categories.length}`);
    for (const c of categories) {
      console.log(`     • ${c.name}: ${c.completions} completions (${c.percentage}%), ${c.habitCount} habit(s)`);
    }
    if (categories.length === 0) throw new Error('Expected at least 1 category');
    console.log('  ✅ Test 3 Passed.\n');

    // Test 4: Habit comparison (Leaderboard & Bar Chart)
    console.log('Test 4: Fetch Habit Comparison (GET /api/statistics/comparison)...');
    const compRes = await fetch(`${BASE_URL}/statistics/comparison`, { headers: authHeaders });
    const compData = await compRes.json();
    if (!compRes.ok) throw new Error(compData.message);
    const comparison = compData.data;
    console.log(`  ✅ Habits compared: ${comparison.length}`);
    for (const h of comparison) {
      console.log(`     • ${h.name}: ${h.completionRate}% rate, ${h.currentStreak}d streak, ${h.totalCompletions} completions`);
    }
    console.log('  ✅ Test 4 Passed.\n');

    // Test 5: Day of week performance
    console.log('Test 5: Fetch Day of Week Stats (GET /api/statistics/days)...');
    const daysRes = await fetch(`${BASE_URL}/statistics/days`, { headers: authHeaders });
    const daysData = await daysRes.json();
    if (!daysRes.ok) throw new Error(daysData.message);
    const dayStats = daysData.data;
    console.log(`  ✅ Best performing day: ${dayStats.bestDay} (${dayStats.bestDayCompletions} completions)`);
    console.log('  ✅ Test 5 Passed.\n');

    // Test 6: Unified Analytics Overview
    console.log('Test 6: Fetch Unified Analytics (GET /api/statistics/overview?days=30)...');
    const overviewRes = await fetch(`${BASE_URL}/statistics/overview?days=30`, { headers: authHeaders });
    const overviewData = await overviewRes.json();
    if (!overviewRes.ok) throw new Error(overviewData.message);
    const overview = overviewData.data;
    console.log(`  ✅ Summary: Total completions: ${overview.summary.totalCompletions}, Avg rate: ${overview.summary.averageCompletionRate}%`);
    console.log(`  ✅ Best Current Streak: ${overview.summary.bestCurrentStreak}d, Best Ever: ${overview.summary.bestEverStreak}d`);
    console.log('  ✅ Test 6 Passed.\n');

    console.log('=========================================');
    console.log('🎉 ALL 6 ANALYTICS & RECHARTS TESTS PASSED!');
    console.log('=========================================');
  } catch (err) {
    console.error('\n❌ Analytics test error:', err.message);
    process.exit(1);
  }
}

runTests();
