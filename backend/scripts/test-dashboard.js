import assert from 'assert';

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

async function runDashboardTests() {
  console.log('\n=========================================');
  console.log('🧪 Starting Dashboard API Test Suite');
  console.log('=========================================\n');

  // 1. Authenticate as Demo User
  console.log('Setup: Authenticating as Demo User...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demo@habittracker.com', password: 'Demo@123' },
  });
  assert.strictEqual(loginRes.status, 200);
  const token = loginRes.data.data.token;
  const todayStr = new Date().toISOString().split('T')[0];

  // 2. Test GET /api/dashboard
  console.log('Test 1: Fetch Dashboard Overview (GET /api/dashboard)...');
  const dashRes = await request('/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashRes.data.success, true);
  const overview = dashRes.data.data;

  // Validate Greeting & User
  assert.ok(['Good Morning', 'Good Afternoon', 'Good Evening'].includes(overview.greeting));
  assert.strictEqual(overview.userName, 'Naveen Kumar');
  console.log(`  ✅ Greeting verified: "${overview.greeting}, ${overview.userName} 👋"`);

  // Validate Today's Progress
  assert.strictEqual(overview.today.date, todayStr);
  assert.ok(typeof overview.today.completedCount === 'number');
  assert.ok(typeof overview.today.totalHabits === 'number');
  assert.ok(typeof overview.today.percentage === 'number');
  assert.ok(overview.today.percentage >= 0 && overview.today.percentage <= 100);
  console.log(`  ✅ Today's Progress: ${overview.today.completedCount} / ${overview.today.totalHabits} completed (${overview.today.percentage}%)`);

  // Validate 5 KPI Metrics
  const m = overview.metrics;
  assert.ok(typeof m.currentStreak === 'number', 'Current Streak missing');
  assert.ok(typeof m.longestStreak === 'number', 'Longest Streak missing');
  assert.ok(typeof m.todayCompletionRate === 'number', 'Today Completion Rate missing');
  assert.ok(typeof m.weeklySuccessRate === 'number', 'Weekly Success Rate missing');
  assert.ok(typeof m.monthlyProgressRate === 'number', 'Monthly Progress Rate missing');
  console.log('  ✅ 5 KPI Metrics verified:');
  console.log(`     • 🔥 Current Streak: ${m.currentStreak} days`);
  console.log(`     • 🏆 Longest Streak: ${m.longestStreak} days`);
  console.log(`     • ✅ Today Completion: ${m.todayCompletionRate}%`);
  console.log(`     • 📊 Weekly Success: ${m.weeklySuccessRate}%`);
  console.log(`     • 🎯 Monthly Progress: ${m.monthlyProgressRate}%`);

  // Validate Today's Habits Checklist
  assert.ok(Array.isArray(overview.todayHabits));
  assert.strictEqual(overview.todayHabits.length, overview.today.totalHabits);
  for (const h of overview.todayHabits) {
    assert.ok(h.id);
    assert.ok(h.name);
    assert.ok(typeof h.currentStreak === 'number');
    assert.ok(typeof h.isCompletedToday === 'boolean');
  }
  console.log(`  ✅ Checklist verified: ${overview.todayHabits.length} habits with streaks and completion status.`);

  // 3. Test GET /api/dashboard/today
  console.log('\nTest 2: Fetch Today\'s Checklist (GET /api/dashboard/today)...');
  const todayRes = await request('/dashboard/today', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(todayRes.status, 200);
  assert.strictEqual(todayRes.data.data.habits.length, overview.todayHabits.length);
  console.log('  ✅ Passed: /api/dashboard/today returned active habit checklist.');

  // 4. Test Live Progress Reactivity
  console.log('\nTest 3: Verify Live Progress Bar Reactivity on Completion Toggle...');
  const firstHabit = overview.todayHabits[0];
  const initialDone = firstHabit.isCompletedToday;
  const initialCount = overview.today.completedCount;

  if (initialDone) {
    // Undo it and verify completedCount drops by 1
    await request(`/habits/${firstHabit.id}/complete/${todayStr}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const refreshed = await request('/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    assert.strictEqual(refreshed.data.data.today.completedCount, initialCount - 1);
    // Re-complete it
    await request(`/habits/${firstHabit.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {},
    });
  } else {
    // Complete it and verify completedCount rises by 1
    await request(`/habits/${firstHabit.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {},
    });
    const refreshed = await request('/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    assert.strictEqual(refreshed.data.data.today.completedCount, initialCount + 1);
  }
  console.log('  ✅ Passed: Dashboard progress reactivity validated with live DB state sync.');

  console.log('\n=========================================');
  console.log('🎉 ALL 3 DASHBOARD TESTS PASSED!');
  console.log('=========================================\n');
}

runDashboardTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
