import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🛡️  Checking and seeding Administrator account...');

  const adminEmail = 'admin@habittracker.com';
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      name: 'System Administrator',
    },
    create: {
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      timezone: 'UTC',
    },
  });

  console.log(`✅ Administrator ready: ${admin.email} (Role: ${admin.role})`);

  // Ensure default SiteContent exists
  const defaultContent = await prisma.siteContent.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      heroTitle: 'Where dreams rise through the silence.',
      heroSubtitle: "We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.",
      heroCtaText: 'Start Journey',
      heroCtaLink: '/register',
      announcementText: '🔥 New Release: Indian Macro & Calorie Tracker is now live! Track 95+ regional dishes.',
      announcementActive: false,
      announcementType: 'info',
      adsJson: JSON.stringify([
        {
          id: 'ad-1',
          title: 'HAbyTAT Pro Athlete Pass',
          badge: 'Limited Offer',
          description: 'Unlock 3D fitness telemetry, advanced macro analytics, and personalized meal planning.',
          imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
          ctaText: 'Claim 50% Off',
          ctaLink: '/register',
          active: true,
        },
      ]),
      settingsJson: JSON.stringify({
        enableNutrition: true,
        enableWorkouts: true,
        enableHabits: true,
        maintenanceMode: false,
      }),
    },
  });

  console.log('✅ Default Site Content & CMS configuration initialized.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
