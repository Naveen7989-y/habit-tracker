/**
 * Automated Test Suite for Phase 8: Calendar & Heatmap API
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=========================================');
  console.log('🧪 Starting Calendar & Heatmap API Tests');
  console.log('=========================================\n');

  try {
    // Step 0: Login as demo user
    console.log('Setup: Authenticating as Demo User...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@habittracker.com',
        password: 'Demo@123',
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    const token = loginData.data.token;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log('  ✅ Authenticated successfully.\n');

    // Test 1: Get Monthly Calendar
    console.log('Test 1: Fetch Monthly Calendar (GET /api/calendar/month)...');
    const monthRes = await fetch(`${BASE_URL}/calendar/month?year=2026&month=10`, {
      headers: authHeaders,
    });
    const monthData = await monthRes.json();
    if (!monthRes.ok) {
      throw new Error(`Calendar month request failed: ${monthData.message}`);
    }
    const calendar = monthData.data;
    console.log(`  ✅ Month: ${calendar.monthName} ${calendar.year}`);
    console.log(`  ✅ Days in month returned: ${calendar.days.length} (Expected: 31)`);
    console.log(`  ✅ Total habits: ${calendar.totalHabits}`);
    console.log(`  ✅ Full days: ${calendar.fullDaysCount}, Partial: ${calendar.partialDaysCount}, Missed: ${calendar.missedDaysCount}`);
    
    if (calendar.days.length !== 31) {
      throw new Error(`Expected 31 days in October, got ${calendar.days.length}`);
    }
    console.log('  ✅ Test 1 Passed.\n');

    // Test 2: Get GitHub-Style Heatmap Data
    console.log('Test 2: Fetch Contribution Heatmap (GET /api/calendar/heatmap?days=90)...');
    const heatmapRes = await fetch(`${BASE_URL}/calendar/heatmap?days=90`, {
      headers: authHeaders,
    });
    const heatmapData = await heatmapRes.json();
    if (!heatmapRes.ok) {
      throw new Error(`Heatmap request failed: ${heatmapData.message}`);
    }
    const heatmap = heatmapData.data;
    console.log(`  ✅ Total heatmap days: ${heatmap.days.length}`);
    console.log(`  ✅ Active days count: ${heatmap.activeDaysCount}`);
    console.log(`  ✅ Consistency rate: ${heatmap.consistencyRate}%`);
    console.log(`  ✅ Total completions in range: ${heatmap.totalCompletions}`);
    console.log(`  ✅ Streak stats: Current ${heatmap.currentStreak}d, Longest ${heatmap.longestStreak}d`);
    
    // Verify levels are valid 0-4
    const invalidLevels = heatmap.days.filter(d => d.level < 0 || d.level > 4);
    if (invalidLevels.length > 0) {
      throw new Error(`Found ${invalidLevels.length} days with invalid activity levels`);
    }
    console.log('  ✅ Heatmap activity levels (0-4) verified.');
    console.log('  ✅ Test 2 Passed.\n');

    // Test 3: Get Day Details
    console.log('Test 3: Fetch Day Details (GET /api/calendar/day/2026-10-01)...');
    const dayRes = await fetch(`${BASE_URL}/calendar/day/2026-10-01`, {
      headers: authHeaders,
    });
    const dayData = await dayRes.json();
    if (!dayRes.ok) {
      throw new Error(`Day details request failed: ${dayData.message}`);
    }
    const day = dayData.data;
    console.log(`  ✅ Inspected date: ${day.date}`);
    console.log(`  ✅ Completed: ${day.completedCount} / ${day.totalHabits} (${day.percentage}%)`);
    console.log(`  ✅ Habit breakdown list count: ${day.habits.length}`);
    for (const h of day.habits) {
      console.log(`     - [${h.isCompleted ? '✓' : ' '}] ${h.name} (${h.category})`);
    }
    console.log('  ✅ Test 3 Passed.\n');

    console.log('=========================================');
    console.log('🎉 ALL 3 CALENDAR & HEATMAP TESTS PASSED!');
    console.log('=========================================');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
