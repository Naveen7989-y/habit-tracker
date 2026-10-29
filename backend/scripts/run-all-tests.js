import { spawn, fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const TEST_FILES = [
  'scripts/test-auth.js',
  'scripts/test-habits.js',
  'scripts/test-completions.js',
  'scripts/test-streaks.js',
  'scripts/test-dashboard.js',
  'scripts/test-calendar.js',
  'scripts/test-analytics.js',
  'scripts/test-workouts.js',
  'scripts/test-nutrition-engine.js',
  'scripts/test-nutrition.js',
  'scripts/test-nutrition-regression.js',
  'scripts/test-stage3-intelligence.js',
];

async function isServerRunning() {
  try {
    const res = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerRunning()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 HAbyTAT Comprehensive Backend Test Suite Runner');
  console.log(`📁 Test Suites Scheduled: ${TEST_FILES.length}`);
  console.log('======================================================\n');

  let spawnedServer = null;
  const alreadyRunning = await isServerRunning();

  if (alreadyRunning) {
    console.log('📡 Connected to active backend server on port 5000.\n');
  } else {
    console.log('🚀 Spawning ephemeral backend server for test execution...');
    spawnedServer = spawn('node', [path.join(backendRoot, 'src/server.js')], {
      cwd: backendRoot,
      env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
      stdio: 'inherit',
    });

    const ready = await waitForServer(20000);
    if (!ready) {
      console.error('❌ Failed to start backend server for tests.');
      if (spawnedServer) spawnedServer.kill();
      process.exit(1);
    }
    console.log('✅ Ephemeral backend server ready on port 5000.\n');
  }

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const testFile of TEST_FILES) {
    const fullPath = path.join(backendRoot, testFile);
    const suiteName = path.basename(testFile);
    console.log(`▶ Running ${suiteName}...`);
    const start = Date.now();

    const exitCode = await new Promise((resolve) => {
      const child = spawn('node', [fullPath], {
        cwd: backendRoot,
        stdio: 'inherit',
        env: { ...process.env, BASE_URL: 'http://localhost:5000/api' },
      });

      child.on('close', resolve);
      child.on('error', (err) => {
        console.error(`Error executing ${suiteName}:`, err);
        resolve(1);
      });
    });

    const duration = Date.now() - start;
    const passed = exitCode === 0;

    if (passed) totalPassed++;
    else totalFailed++;

    results.push({ suite: suiteName, passed, duration: `${(duration / 1000).toFixed(2)}s` });
    console.log(`${passed ? '✅' : '❌'} ${suiteName} finished in ${(duration / 1000).toFixed(2)}s (exit ${exitCode})\n`);
  }

  // Cleanup spawned server
  if (spawnedServer) {
    console.log('🛑 Shutting down ephemeral backend server...');
    spawnedServer.kill();
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\n======================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('======================================================');
  console.table(
    results.map((r) => ({
      'Test Suite': r.suite,
      Status: r.passed ? 'PASSED ✅' : 'FAILED ❌',
      Duration: r.duration,
    }))
  );

  console.log(`\n🎉 Total Suites Passed: ${totalPassed} / ${TEST_FILES.length}`);
  if (totalFailed > 0) {
    console.error(`❌ Total Suites Failed: ${totalFailed}`);
    process.exit(1);
  } else {
    console.log('🌟 100% OF ALL BACKEND TEST SUITES PASSED!\n');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

