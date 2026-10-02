import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing seed data
  await prisma.habitCompletion.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Demo User
  // Password: Demo@123 (Hashed for production security standard)
  const hashedPassword = await bcrypt.hash('Demo@123', 10);
  const demoUser = await prisma.user.create({
    data: {
      name: 'Naveen Kumar',
      email: 'demo@habittracker.com',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      timezone: 'UTC',
    },
  });

  console.log(`👤 Created Demo User: ${demoUser.email} (ID: ${demoUser.id})`);
  console.log('⚠️  NOTE: Credentials [demo@habittracker.com / Demo@123] are strictly for development/demo testing.');

  // 2. Create 5 Predefined Realistic Habits
  const habitDefinitions = [
    {
      name: 'Drink Water',
      description: 'Drink 8 glasses of water throughout the day',
      category: 'Health',
      color: '#06b6d4', // Cyan
      icon: 'Droplets',
      frequency: 'Daily',
      targetCount: 8,
      reminderTime: '08:00',
      completionProbability: 0.90, // ~90% success rate
    },
    {
      name: 'Morning Workout',
      description: '30-45 minutes HIIT or functional strength training',
      category: 'Fitness',
      color: '#ef4444', // Red
      icon: 'Dumbbell',
      frequency: 'Daily',
      targetCount: 1,
      reminderTime: '07:00',
      completionProbability: 0.75, // ~75% success rate
    },
    {
      name: 'Read Books',
      description: 'Read 20 pages of non-fiction or software architecture',
      category: 'Study',
      color: '#8b5cf6', // Violet
      icon: 'BookOpen',
      frequency: 'Daily',
      targetCount: 20,
      reminderTime: '21:00',
      completionProbability: 0.85, // ~85% success rate
    },
    {
      name: 'Deep Work Sprint',
      description: '90 minutes distraction-free focused development',
      category: 'Work',
      color: '#3b82f6', // Blue
      icon: 'Brain',
      frequency: 'Daily',
      targetCount: 1,
      reminderTime: '10:00',
      completionProbability: 0.80, // ~80% success rate
    },
    {
      name: 'Evening Meditation',
      description: '10 minutes mindfulness and gratitude journaling',
      category: 'Mindfulness',
      color: '#10b981', // Emerald
      icon: 'Sparkles',
      frequency: 'Daily',
      targetCount: 1,
      reminderTime: '22:00',
      completionProbability: 0.70, // ~70% success rate
    },
  ];

  const createdHabits = [];
  for (const h of habitDefinitions) {
    const habit = await prisma.habit.create({
      data: {
        userId: demoUser.id,
        name: h.name,
        description: h.description,
        category: h.category,
        color: h.color,
        icon: h.icon,
        frequency: h.frequency,
        targetCount: h.targetCount,
        reminderTime: h.reminderTime,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Started 35 days ago
      },
    });
    createdHabits.push({ ...habit, probability: h.completionProbability });
    console.log(`📌 Created Habit: "${habit.name}" [${habit.category}]`);
  }

  // 3. Seed 30 Days of Completion History (including today)
  console.log('📅 Generating 30 days of realistic completion data...');

  const today = new Date();
  const sampleNotes = [
    'Felt great doing this early today!',
    'Consistent progress pays off.',
    'Pushed through despite feeling tired.',
    'Completed with ease.',
    'Focused session, high energy.',
    null,
    null, // Most entries without note
  ];

  let totalCompletions = 0;

  for (let i = 29; i >= 0; i--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

    for (const habit of createdHabits) {
      // Deterministic pseudo-random generation based on habit ID and day offset
      // Ensures consistent streaks while feeling organic
      const charCodeSum = habit.name.charCodeAt(0) + i * 7;
      const pseudoRandom = ((charCodeSum * 9301 + 49297) % 233280) / 233280;

      // Higher chance of completion on recent days to simulate strong active streak
      const streakBoost = i <= 5 ? 0.25 : 0;
      const isCompleted = (pseudoRandom - streakBoost) < habit.probability;

      if (isCompleted) {
        const note = sampleNotes[Math.floor(pseudoRandom * sampleNotes.length)];
        const completedTimestamp = new Date(dateObj);
        completedTimestamp.setHours(9 + Math.floor(pseudoRandom * 12), Math.floor(pseudoRandom * 60));

        await prisma.habitCompletion.create({
          data: {
            habitId: habit.id,
            userId: demoUser.id,
            completedDate: dateStr,
            completedAt: completedTimestamp,
            note,
          },
        });
        totalCompletions++;
      }
    }
  }

  console.log(`✅ Seeded ${totalCompletions} completion records across 30 days.`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
