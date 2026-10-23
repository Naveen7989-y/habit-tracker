import prisma from '../src/config/prisma.js';
import { workoutService } from '../src/services/workout.service.js';

async function testWorkouts() {
  console.log('--- Testing Workout Service & Database Persistence ---');

  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@habittracker.com' },
  });

  if (!demoUser) throw new Error('Demo user not found');

  // Test 1: Log new workout
  const newWorkout = await workoutService.createWorkout(demoUser.id, {
    title: 'Test Trail Run',
    activityType: 'Running',
    durationSeconds: 1800,
    distanceKm: 5.0,
    caloriesBurned: 400,
    avgPace: "6'00\" /km",
    avgHeartRate: 145,
    status: 'COMPLETED',
  });

  console.log('✅ Created Workout:', newWorkout.id, newWorkout.title, `${newWorkout.distanceKm} km`);

  // Test 2: Fetch workouts
  const { workouts, total } = await workoutService.getWorkouts(demoUser.id);
  console.log(`✅ Fetched Workouts for Demo User: ${workouts.length} (Total: ${total})`);

  // Test 3: Fetch stats
  const stats = await workoutService.getWorkoutStats(demoUser.id);
  console.log(`✅ Fetched Workout Stats: ${stats.totalWorkouts} workouts, ${stats.totalDistanceKm} km, PR Longest Run: ${stats.personalRecords.longestRun.value}`);

  // Test 4: Clean up test workout
  await workoutService.deleteWorkout(demoUser.id, newWorkout.id);
  console.log('✅ Deleted test workout cleanly.');

  console.log('\n🎉 ALL WORKOUT SERVICE TESTS PASSED 100%!\n');
}

testWorkouts()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
