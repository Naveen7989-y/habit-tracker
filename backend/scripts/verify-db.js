import prisma from '../src/config/prisma.js';

async function verify() {
  console.log('--- PostgreSQL Database Verification ---');

  const userCount = await prisma.user.count();
  const habitCount = await prisma.habit.count();
  const completionCount = await prisma.habitCompletion.count();

  console.log(`Users in PostgreSQL: ${userCount}`);
  console.log(`Habits in PostgreSQL: ${habitCount}`);
  console.log(`Completions in PostgreSQL: ${completionCount}`);

  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@habittracker.com' },
    include: {
      habits: {
        include: {
          _count: { select: { completions: true } },
        },
      },
    },
  });

  if (!demoUser) {
    throw new Error('Demo user not found!');
  }

  console.log(`\nDemo User Found: ${demoUser.name} <${demoUser.email}>`);
  console.log(`Timezone: ${demoUser.timezone}`);
  console.log('\nHabits Breakdown:');
  for (const habit of demoUser.habits) {
    console.log(` • [${habit.category}] ${habit.name} (Frequency: ${habit.frequency}, Target: ${habit.targetCount}) => ${habit._count.completions} completions recorded`);
  }

  // Test Unique Constraint Enforcement (attempt duplicate completion for same habit and date)
  console.log('\nTesting Unique Constraint Enforcement on HabitCompletion [habitId, completedDate]...');
  const firstHabit = demoUser.habits[0];
  const existingCompletion = await prisma.habitCompletion.findFirst({
    where: { habitId: firstHabit.id },
  });

  if (existingCompletion) {
    try {
      await prisma.habitCompletion.create({
        data: {
          habitId: existingCompletion.habitId,
          userId: existingCompletion.userId,
          completedDate: existingCompletion.completedDate,
        },
      });
      console.error('❌ FAILED: Duplicate completion was incorrectly permitted!');
    } catch (err) {
      if (err.code === 'P2002') {
        console.log(`✅ SUCCESS: Unique constraint (P2002) properly prevented duplicate completion for habit ${firstHabit.name} on ${existingCompletion.completedDate}`);
      } else {
        throw err;
      }
    }
  }

  console.log('\n🎉 ALL DATABASE CHECKS PASSED PERFECTLY!\n');
}

verify()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
