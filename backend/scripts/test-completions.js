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

async function runCompletionTests() {
  console.log('\n=========================================');
  console.log('🧪 Starting Habit Completion Test Suite');
  console.log('=========================================\n');

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Authenticate as User A (Demo User)
  console.log('Setup: Authenticating User A (demo@habittracker.com)...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demo@habittracker.com', password: 'Demo@123' },
  });
  assert.strictEqual(loginRes.status, 200);
  const tokenA = loginRes.data.data.token;
  const userA = loginRes.data.data.user;

  // 2. Create fresh habit for completion testing
  console.log('Setup: Creating fresh test habit for User A...');
  const createHabitRes = await request('/habits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: {
      name: `Hydration Tracking ${Date.now()}`,
      category: 'Health',
      color: '#06b6d4',
      icon: 'Droplets',
      frequency: 'Daily',
      targetCount: 8,
    },
  });
  assert.strictEqual(createHabitRes.status, 201);
  const testHabit = createHabitRes.data.data.habit;
  console.log(`  ✅ Test habit created: "${testHabit.name}" (${testHabit.id})`);

  // 3. Verify initial state (pending today)
  console.log('\nTest 1: Verify habit is initially pending today...');
  const initialHabitRes = await request(`/habits/${testHabit.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(initialHabitRes.status, 200);
  assert.strictEqual(initialHabitRes.data.data.habit.isCompletedToday, false);
  console.log('  ✅ Passed: Habit is not yet completed for today.');

  // 4. Mark Habit as Completed for Today
  console.log('\nTest 2: Mark habit complete for today (POST /api/habits/:id/complete)...');
  const completeRes = await request(`/habits/${testHabit.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: { note: 'Drank 8 glasses throughout the workday!' },
  });
  assert.strictEqual(completeRes.status, 201, `Expected 201 Created, got ${completeRes.status}`);
  assert.strictEqual(completeRes.data.success, true);
  const completion = completeRes.data.data.completion;
  assert.strictEqual(completion.habitId, testHabit.id);
  assert.strictEqual(completion.userId, userA.id);
  assert.strictEqual(completion.completedDate, todayStr);
  assert.strictEqual(completion.note, 'Drank 8 glasses throughout the workday!');
  console.log(`  ✅ Passed: Completion recorded with ID ${completion.id} for ${todayStr}.`);

  // 5. Prevent Duplicate Completion for Same Date
  console.log('\nTest 3: Prevent duplicate completion for the same date...');
  const dupRes = await request(`/habits/${testHabit.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: { note: 'Duplicate attempt' },
  });
  assert.strictEqual(dupRes.status, 409, `Expected 409 Conflict, got ${dupRes.status}`);
  assert.strictEqual(dupRes.data.success, false);
  assert.strictEqual(dupRes.data.error, 'DUPLICATE_COMPLETION');
  console.log('  ✅ Passed: Duplicate completion blocked with 409 Conflict.');

  // 6. Verify Habit State Reflects Done Today
  console.log('\nTest 4: Verify habit list shows isCompletedToday: true...');
  const updatedHabitsRes = await request('/habits', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(updatedHabitsRes.status, 200);
  const updatedHabitInList = updatedHabitsRes.data.data.habits.find((h) => h.id === testHabit.id);
  assert.ok(updatedHabitInList);
  assert.strictEqual(updatedHabitInList.isCompletedToday, true);
  assert.ok(updatedHabitInList.todayCompletion);
  console.log('  ✅ Passed: Habit correctly marked done today in user habit list.');

  // 7. Get Habit Completion History
  console.log('\nTest 5: Retrieve habit completion history (GET /api/habits/:id/completions)...');
  const historyRes = await request(`/habits/${testHabit.id}/completions`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(historyRes.status, 200);
  assert.strictEqual(historyRes.data.success, true);
  assert.ok(historyRes.data.data.completions.length >= 1);
  assert.strictEqual(historyRes.data.data.completions[0].completedDate, todayStr);
  console.log(`  ✅ Passed: Retrieved completion history containing ${historyRes.data.data.completions.length} record(s).`);

  // 8. Cross-User Authorization Security Checks
  console.log('\nTest 6: Verify User B cannot log completions for User A habit...');
  const userBEmail = `user_b_comp_${Date.now()}@example.com`;
  const regBRes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'User B Completions', email: userBEmail, password: 'Password123!' },
  });
  const tokenB = regBRes.data.data.token;

  // 8a. User B tries to complete User A's habit
  const completeForbidden = await request(`/habits/${testHabit.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: {},
  });
  assert.strictEqual(completeForbidden.status, 403, `Expected 403 Forbidden, got ${completeForbidden.status}`);

  // 8b. User B tries to undo User A's completion
  const undoForbidden = await request(`/habits/${testHabit.id}/complete/${todayStr}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(undoForbidden.status, 403, `Expected 403 Forbidden, got ${undoForbidden.status}`);

  // 8c. User B tries to read User A's completions history
  const historyForbidden = await request(`/habits/${testHabit.id}/completions`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(historyForbidden.status, 403, `Expected 403 Forbidden, got ${historyForbidden.status}`);
  console.log('  ✅ Passed: User B strictly blocked from complete, undo, and view completions for User A habit.');

  // 9. Undo Completion for Today
  console.log('\nTest 7: Undo completion for today (DELETE /api/habits/:id/complete/:date)...');
  const undoRes = await request(`/habits/${testHabit.id}/complete/${todayStr}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(undoRes.status, 200);
  assert.strictEqual(undoRes.data.success, true);
  assert.strictEqual(undoRes.data.data.undone, true);

  // Verify habit is now pending again
  const habitAfterUndo = await request(`/habits/${testHabit.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(habitAfterUndo.data.data.habit.isCompletedToday, false);
  console.log('  ✅ Passed: Completion successfully undone; habit returned to pending today.');

  // 10. Attempt Undoing a Non-Existent Completion
  console.log('\nTest 8: Reject undoing non-existent completion record...');
  const undoNonExistent = await request(`/habits/${testHabit.id}/complete/1999-01-01`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(undoNonExistent.status, 404);
  assert.strictEqual(undoNonExistent.data.error, 'COMPLETION_NOT_FOUND');
  console.log('  ✅ Passed: Undoing non-existent record rejected with 404.');

  // Clean up test habit
  await request(`/habits/${testHabit.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });

  console.log('\n=========================================');
  console.log('🎉 ALL 8 HABIT COMPLETION TESTS PASSED!');
  console.log('=========================================\n');
}

runCompletionTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
