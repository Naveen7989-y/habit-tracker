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

async function runHabitTests() {
  console.log('\n=========================================');
  console.log('🧪 Starting Habit CRUD & Authorization Test Suite');
  console.log('=========================================\n');

  // 1. Authenticate as User A (Demo User)
  console.log('Setup: Authenticating User A (demo@habittracker.com)...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demo@habittracker.com', password: 'Demo@123' },
  });
  assert.strictEqual(loginRes.status, 200);
  const tokenA = loginRes.data.data.token;
  const userA = loginRes.data.data.user;
  console.log(`  ✅ User A authenticated: ${userA.name} (${userA.id})`);

  // 2. Create Habit for User A
  console.log('\nTest 1: Create a new habit (POST /api/habits)...');
  const habitPayload = {
    name: 'Evening Reading Routine',
    description: 'Read 25 pages before sleep',
    category: 'Study',
    color: '#8b5cf6',
    icon: 'BookOpen',
    frequency: 'Daily',
    targetCount: 25,
    reminderTime: '21:30',
  };

  const createRes = await request('/habits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: habitPayload,
  });

  assert.strictEqual(createRes.status, 201, `Expected 201, got ${createRes.status}`);
  assert.strictEqual(createRes.data.success, true);
  const habitA = createRes.data.data.habit;
  assert.strictEqual(habitA.name, habitPayload.name);
  assert.strictEqual(habitA.userId, userA.id);
  assert.strictEqual(habitA.targetCount, 25);
  assert.strictEqual(habitA.isArchived, false);
  console.log(`  ✅ Passed: Habit created successfully with ID ${habitA.id}`);

  // 3. Get All Habits for User A
  console.log('\nTest 2: Get all habits for User A (GET /api/habits)...');
  const getAllRes = await request('/habits', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(getAllRes.status, 200);
  assert.ok(Array.isArray(getAllRes.data.data.habits));
  const foundHabit = getAllRes.data.data.habits.find((h) => h.id === habitA.id);
  assert.ok(foundHabit, 'Created habit should appear in habits list');
  assert.strictEqual(typeof foundHabit.isCompletedToday, 'boolean');
  console.log(`  ✅ Passed: Retrieved ${getAllRes.data.data.habits.length} habits with completion flags.`);

  // 4. Search Habits by Keyword
  console.log('\nTest 3: Search habits by query (GET /api/habits?search=Reading)...');
  const searchRes = await request('/habits?search=Reading', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(searchRes.status, 200);
  assert.ok(searchRes.data.data.habits.length > 0);
  assert.ok(searchRes.data.data.habits.some((h) => h.name.includes('Reading')));
  console.log('  ✅ Passed: Search query filter matches habit name.');

  // 5. Filter Habits by Category
  console.log('\nTest 4: Filter habits by category (GET /api/habits?category=Study)...');
  const catRes = await request('/habits?category=Study', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(catRes.status, 200);
  assert.ok(catRes.data.data.habits.every((h) => h.category === 'Study'));
  console.log('  ✅ Passed: Category filter accurately returned only Study habits.');

  // 6. Get Single Habit by ID
  console.log('\nTest 5: Get single habit by ID (GET /api/habits/:id)...');
  const getOneRes = await request(`/habits/${habitA.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(getOneRes.status, 200);
  assert.strictEqual(getOneRes.data.data.habit.id, habitA.id);
  assert.strictEqual(getOneRes.data.data.habit.userId, userA.id);
  console.log('  ✅ Passed: Single habit retrieved with full details.');

  // 7. Update Habit
  console.log('\nTest 6: Update habit details (PUT /api/habits/:id)...');
  const updateRes = await request(`/habits/${habitA.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: {
      name: 'Evening Deep Reading Routine',
      targetCount: 30,
      reminderTime: '22:00',
    },
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.data.habit.name, 'Evening Deep Reading Routine');
  assert.strictEqual(updateRes.data.data.habit.targetCount, 30);
  assert.strictEqual(updateRes.data.data.habit.reminderTime, '22:00');
  console.log('  ✅ Passed: Habit updated with new name, target count, and reminder time.');

  // 8. Archive Habit
  console.log('\nTest 7: Archive habit (PATCH /api/habits/:id/archive)...');
  const archiveRes = await request(`/habits/${habitA.id}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(archiveRes.status, 200);
  assert.strictEqual(archiveRes.data.data.habit.isArchived, true);

  // Verify archived habit is excluded from active list by default
  const activeListRes = await request('/habits?status=active', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(activeListRes.data.data.habits.some((h) => h.id === habitA.id), false);

  // Verify archived habit is returned when status=archived
  const archivedListRes = await request('/habits?status=archived', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(archivedListRes.data.data.habits.some((h) => h.id === habitA.id), true);
  console.log('  ✅ Passed: Habit successfully archived and filtered.');

  // 9. Unarchive Habit
  console.log('\nTest 8: Unarchive habit (PATCH /api/habits/:id/archive)...');
  const unarchiveRes = await request(`/habits/${habitA.id}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(unarchiveRes.status, 200);
  assert.strictEqual(unarchiveRes.data.data.habit.isArchived, false);
  console.log('  ✅ Passed: Habit unarchived and returned to active rotation.');

  // 10. STRICT AUTHORIZATION ISOLATION TESTS (User B vs User A)
  console.log('\nTest 9: Cross-User Authorization Isolation (User B cannot access User A habits)...');
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const regBRes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'User B', email: userBEmail, password: 'Password123!' },
  });
  assert.strictEqual(regBRes.status, 201);
  const tokenB = regBRes.data.data.token;

  // 10a. User B attempts to read User A's habit
  const readForbidden = await request(`/habits/${habitA.id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(readForbidden.status, 403, `Expected 403 Forbidden, got ${readForbidden.status}`);
  assert.strictEqual(readForbidden.data.error, 'FORBIDDEN');
  console.log('  ✅ Passed: User B reading User A habit blocked with 403 Forbidden.');

  // 10b. User B attempts to update User A's habit
  const updateForbidden = await request(`/habits/${habitA.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: { name: 'Hacked Habit' },
  });
  assert.strictEqual(updateForbidden.status, 403);
  assert.strictEqual(updateForbidden.data.error, 'FORBIDDEN');
  console.log('  ✅ Passed: User B modifying User A habit blocked with 403 Forbidden.');

  // 10c. User B attempts to archive User A's habit
  const archiveForbidden = await request(`/habits/${habitA.id}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(archiveForbidden.status, 403);
  assert.strictEqual(archiveForbidden.data.error, 'FORBIDDEN');
  console.log('  ✅ Passed: User B archiving User A habit blocked with 403 Forbidden.');

  // 10d. User B attempts to delete User A's habit
  const deleteForbidden = await request(`/habits/${habitA.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(deleteForbidden.status, 403);
  assert.strictEqual(deleteForbidden.data.error, 'FORBIDDEN');
  console.log('  ✅ Passed: User B deleting User A habit blocked with 403 Forbidden.');

  // 11. Delete Habit by User A
  console.log('\nTest 10: Delete habit by owner User A (DELETE /api/habits/:id)...');
  const deleteRes = await request(`/habits/${habitA.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteRes.data.success, true);

  // Verify habit no longer exists
  const getDeletedRes = await request(`/habits/${habitA.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(getDeletedRes.status, 404);
  assert.strictEqual(getDeletedRes.data.error, 'HABIT_NOT_FOUND');
  console.log('  ✅ Passed: Habit deleted permanently and returns 404.');

  console.log('\n=========================================');
  console.log('🎉 ALL 10 HABIT CRUD & AUTHORIZATION TESTS PASSED!');
  console.log('=========================================\n');
}

runHabitTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
