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

async function runAuthTests() {
  console.log('\n=========================================');
  console.log('🧪 Starting Authentication Test Suite');
  console.log('=========================================\n');

  const testEmail = `tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = null;
  let userId = null;

  // Test 1: Register New User
  console.log('Test 1: Register new user (POST /api/auth/register)...');
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Engineer',
      email: testEmail,
      password: testPassword,
      timezone: 'America/New_York',
    },
  });

  assert.strictEqual(regRes.status, 201, `Expected 201 Created, got ${regRes.status}: ${JSON.stringify(regRes.data)}`);
  assert.strictEqual(regRes.data.success, true);
  assert.ok(regRes.data.data.token, 'Token should be returned');
  assert.strictEqual(regRes.data.data.user.email, testEmail);
  assert.strictEqual(regRes.data.data.user.password, undefined, 'Password must NEVER be returned');
  authToken = regRes.data.data.token;
  userId = regRes.data.data.user.id;
  console.log('  ✅ Passed: User registered with sanitized response and token.');

  // Test 2: Reject Duplicate Email Registration
  console.log('\nTest 2: Reject duplicate email registration (POST /api/auth/register)...');
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Duplicate Test',
      email: testEmail,
      password: 'AnotherPassword123!',
    },
  });
  assert.strictEqual(dupRes.status, 409, `Expected 409 Conflict, got ${dupRes.status}`);
  assert.strictEqual(dupRes.data.success, false);
  assert.strictEqual(dupRes.data.error, 'EMAIL_ALREADY_EXISTS');
  console.log('  ✅ Passed: Duplicate email rejected with 409 Conflict.');

  // Test 3: Reject Invalid Registration Input (Zod Validation)
  console.log('\nTest 3: Reject invalid input with Zod (POST /api/auth/register)...');
  const invalidRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'A', // Too short
      email: 'not-an-email',
      password: '123', // Too short
    },
  });
  assert.strictEqual(invalidRes.status, 400, `Expected 400 Bad Request, got ${invalidRes.status}`);
  assert.strictEqual(invalidRes.data.success, false);
  assert.strictEqual(invalidRes.data.error, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(invalidRes.data.errors), 'Validation errors array expected');
  console.log('  ✅ Passed: Invalid inputs blocked by Zod with descriptive error details.');

  // Test 4: Login with Demo User Credentials
  console.log('\nTest 4: Login with seeded Demo User (POST /api/auth/login)...');
  const demoLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'demo@habittracker.com',
      password: 'Demo@123',
    },
  });
  assert.strictEqual(demoLoginRes.status, 200, `Expected 200 OK, got ${demoLoginRes.status}`);
  assert.strictEqual(demoLoginRes.data.success, true);
  assert.ok(demoLoginRes.data.data.token, 'Token expected');
  assert.strictEqual(demoLoginRes.data.data.user.email, 'demo@habittracker.com');
  console.log('  ✅ Passed: Demo user logged in successfully.');

  // Test 5: Login with Invalid Password
  console.log('\nTest 5: Reject login with wrong password (POST /api/auth/login)...');
  const wrongPassRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: 'WrongPassword999!',
    },
  });
  assert.strictEqual(wrongPassRes.status, 401, `Expected 401 Unauthorized, got ${wrongPassRes.status}`);
  assert.strictEqual(wrongPassRes.data.error, 'INVALID_CREDENTIALS');
  console.log('  ✅ Passed: Incorrect password rejected with 401.');

  // Test 6: Login with Non-Existent Email
  console.log('\nTest 6: Reject login with unknown email (POST /api/auth/login)...');
  const unknownEmailRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'nonexistent_user_999@habittracker.com',
      password: 'Password123!',
    },
  });
  assert.strictEqual(unknownEmailRes.status, 401, `Expected 401 Unauthorized, got ${unknownEmailRes.status}`);
  assert.strictEqual(unknownEmailRes.data.error, 'INVALID_CREDENTIALS');
  console.log('  ✅ Passed: Unknown email rejected with 401.');

  // Test 7: Protected Route with Valid Token
  console.log('\nTest 7: Access protected route with Bearer token (GET /api/auth/me)...');
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(meRes.status, 200, `Expected 200 OK, got ${meRes.status}`);
  assert.strictEqual(meRes.data.success, true);
  assert.strictEqual(meRes.data.data.user.id, userId);
  console.log('  ✅ Passed: Authenticated user profile retrieved via JWT.');

  // Test 8: Protected Route Without Token
  console.log('\nTest 8: Reject access without token (GET /api/auth/me)...');
  const noTokenRes = await request('/auth/me');
  assert.strictEqual(noTokenRes.status, 401, `Expected 401 Unauthorized, got ${noTokenRes.status}`);
  assert.strictEqual(noTokenRes.data.error, 'UNAUTHORIZED');
  console.log('  ✅ Passed: Access without token blocked with 401.');

  // Test 9: Protected Route with Tampered Token
  console.log('\nTest 9: Reject access with forged/tampered token (GET /api/auth/me)...');
  const fakeTokenRes = await request('/auth/me', {
    headers: { Authorization: 'Bearer forged.token.payload' },
  });
  assert.strictEqual(fakeTokenRes.status, 401, `Expected 401 Unauthorized, got ${fakeTokenRes.status}`);
  assert.strictEqual(fakeTokenRes.data.error, 'INVALID_TOKEN');
  console.log('  ✅ Passed: Forged token rejected with 401.');

  // Test 10: Update User Profile
  console.log('\nTest 10: Update profile data (PUT /api/users/me)...');
  const updateRes = await request('/users/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authToken}` },
    body: {
      name: 'Updated Test Engineer',
      timezone: 'Europe/London',
    },
  });
  assert.strictEqual(updateRes.status, 200, `Expected 200 OK, got ${updateRes.status}`);
  assert.strictEqual(updateRes.data.data.user.name, 'Updated Test Engineer');
  assert.strictEqual(updateRes.data.data.user.timezone, 'Europe/London');
  console.log('  ✅ Passed: Profile successfully updated.');

  // Test 11: Logout
  console.log('\nTest 11: Logout (POST /api/auth/logout)...');
  const logoutRes = await request('/auth/logout', { method: 'POST' });
  assert.strictEqual(logoutRes.status, 200);
  assert.strictEqual(logoutRes.data.success, true);
  console.log('  ✅ Passed: Logout executed.');

  console.log('\n=========================================');
  console.log('🎉 ALL 11 AUTHENTICATION TESTS PASSED!');
  console.log('=========================================\n');
}

runAuthTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
