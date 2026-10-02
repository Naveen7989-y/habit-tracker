import assert from 'assert';
import { calculateHabitStreaks } from '../src/utils/streakEngine.js';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data, headers: res.headers };
}

async function runStreakTests() {
  console.log('\n=========================================');
  console.log('🧪 Starting Streak Engine Test Suite');
  console.log('=========================================\n');

  // Test 1: Unit Test the exact prompt example from Section 11:
  // Day 1 ✅, Day 2 ✅, Day 3 ✅, Day 4 ❌, Day 5 ✅, Day 6 ✅
  // Current streak: 2 days, Longest streak: 3 days
  console.log('Test 1: Pure Engine Unit Test (Section 11 Specification Scenario)...');
  const completionsScenario = [
    '2026-09-01', // Day 1
    '2026-09-02', // Day 2
    '2026-09-03', // Day 3
    // Day 4 missing (gap)
    '2026-09-05', // Day 5
    '2026-09-06', // Day 6 (Today)
  ];
  const refDateDay6 = new Date('2026-09-06T12:00:00Z');
  const result1 = calculateHabitStreaks(completionsScenario, '2026-09-01', null, refDateDay6);

  assert.strictEqual(result1.currentStreak, 2, `Expected currentStreak 2, got ${result1.currentStreak}`);
  assert.strictEqual(result1.longestStreak, 3, `Expected longestStreak 3, got ${result1.longestStreak}`);
  assert.strictEqual(result1.totalCompletions, 5);
  console.log('  ✅ Passed: Current streak = 2 days, Longest streak = 3 days (Exact match for Section 11).');

  // Test 2: Active streak when not yet completed today, but completed yesterday
  console.log('\nTest 2: Streak retains value when completed yesterday (pending today)...');
  const refDateDay7 = new Date('2026-09-07T10:00:00Z'); // Not yet completed on Day 7
  const result2 = calculateHabitStreaks(completionsScenario, '2026-09-01', null, refDateDay7);
  assert.strictEqual(result2.currentStreak, 2, 'Streak should remain 2 until today passes');
  assert.strictEqual(result2.isCompletedToday, false);
  console.log('  ✅ Passed: Streak preserved through morning before user logs today.');

  // Test 3: Streak resets to 0 when yesterday was also missed
  console.log('\nTest 3: Streak resets to 0 when yesterday was missed...');
  const refDateDay8 = new Date('2026-09-08T10:00:00Z'); // Neither Day 8 nor Day 7 completed
  const result3 = calculateHabitStreaks(completionsScenario, '2026-09-01', null, refDateDay8);
  assert.strictEqual(result3.currentStreak, 0, 'Streak should reset to 0');
  assert.strictEqual(result3.longestStreak, 3, 'Longest streak remains 3');
  console.log('  ✅ Passed: Current streak reset to 0, longest streak preserved.');

  // Test 4: Live API Endpoint: GET /api/statistics/streaks
  console.log('\nTest 4: Integration Test: GET /api/statistics/streaks...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demo@habittracker.com', password: 'Demo@123' },
  });
  assert.strictEqual(loginRes.status, 200);
  const token = loginRes.data.data.token;

  const streaksRes = await request('/statistics/streaks', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(streaksRes.status, 200);
  assert.strictEqual(streaksRes.data.success, true);
  const streakData = streaksRes.data.data;

  assert.ok(typeof streakData.bestCurrentStreak === 'number');
  assert.ok(typeof streakData.bestEverStreak === 'number');
  assert.ok(streakData.bestEverStreak >= streakData.bestCurrentStreak);
  assert.ok(streakData.totalCompletions > 0);
  assert.ok(streakData.averageCompletionRate > 0 && streakData.averageCompletionRate <= 100);
  assert.ok(Array.isArray(streakData.habits) && streakData.habits.length > 0);

  console.log(`  ✅ Passed: Retrieved User Streaks:`);
  console.log(`     • Best Current Streak: ${streakData.bestCurrentStreak} days`);
  console.log(`     • Best Ever Streak: ${streakData.bestEverStreak} days`);
  console.log(`     • Total Completions: ${streakData.totalCompletions}`);
  console.log(`     • Average Completion Rate: ${streakData.averageCompletionRate}%`);

  // Test 5: Verify GET /api/habits includes streak metrics
  console.log('\nTest 5: Verify GET /api/habits includes streak fields on all habits...');
  const habitsRes = await request('/habits', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(habitsRes.status, 200);
  for (const h of habitsRes.data.data.habits) {
    assert.ok(typeof h.currentStreak === 'number', `Habit ${h.name} missing currentStreak`);
    assert.ok(typeof h.longestStreak === 'number', `Habit ${h.name} missing longestStreak`);
    assert.ok(typeof h.completionRate === 'number', `Habit ${h.name} missing completionRate`);
  }
  console.log(`  ✅ Passed: All ${habitsRes.data.data.habits.length} habits carry backend streak calculations.`);

  console.log('\n=========================================');
  console.log('🎉 ALL 5 STREAK ENGINE TESTS PASSED!');
  console.log('=========================================\n');
}

runStreakTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
