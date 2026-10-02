import prisma from '../config/prisma.js';
import { calculateHabitStreaks, formatDateString, offsetDateString, daysDifference } from '../utils/streakEngine.js';

class DashboardService {
  /**
   * Determine greeting based on current hour in user's timezone
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  /**
   * Get full dashboard overview
   */
  async getDashboardOverview(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, timezone: true },
    });

    const todayStr = formatDateString(new Date());

    // 1. Fetch all active habits with their completions
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        isArchived: false,
      },
      include: {
        completions: {
          select: { completedDate: true, completedAt: true, note: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Compute today's checklist and streaks
    let completedCount = 0;
    let bestCurrentStreak = 0;
    let bestEverStreak = 0;

    const todayHabits = habits.map((habit) => {
      const stats = calculateHabitStreaks(habit.completions, habit.startDate, habit.endDate);
      const isDoneToday = stats.isCompletedToday;

      if (isDoneToday) completedCount += 1;
      if (stats.currentStreak > bestCurrentStreak) bestCurrentStreak = stats.currentStreak;
      if (stats.longestStreak > bestEverStreak) bestEverStreak = stats.longestStreak;

      const todayCompletion = habit.completions.find((c) => c.completedDate === todayStr) || null;

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        reminderTime: habit.reminderTime,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCompletions: stats.totalCompletions,
        completionRate: stats.completionRate,
        isCompletedToday: isDoneToday,
        todayCompletion,
      };
    });

    const totalHabits = habits.length;
    const todayPercentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    // 3. Compute Weekly Success Rate (Past 7 days including today)
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      past7Days.push(offsetDateString(todayStr, -i));
    }

    let weeklyCompletions = 0;
    const weeklyPossible = Math.max(1, totalHabits * 7);

    habits.forEach((h) => {
      const habitDateSet = new Set(h.completions.map((c) => c.completedDate));
      past7Days.forEach((d) => {
        if (habitDateSet.has(d)) weeklyCompletions += 1;
      });
    });
    const weeklySuccessRate = Math.min(100, Math.round((weeklyCompletions / weeklyPossible) * 100));

    // 4. Compute Monthly Progress Rate (Past 30 days)
    const past30Days = [];
    for (let i = 29; i >= 0; i--) {
      past30Days.push(offsetDateString(todayStr, -i));
    }

    let monthlyCompletions = 0;
    const monthlyPossible = Math.max(1, totalHabits * 30);

    habits.forEach((h) => {
      const habitDateSet = new Set(h.completions.map((c) => c.completedDate));
      past30Days.forEach((d) => {
        if (habitDateSet.has(d)) monthlyCompletions += 1;
      });
    });
    const monthlyProgressRate = Math.min(100, Math.round((monthlyCompletions / monthlyPossible) * 100));

    return {
      greeting: this.getGreeting(),
      userName: user?.name || 'Explorer',
      today: {
        date: todayStr,
        completedCount,
        totalHabits,
        percentage: todayPercentage,
      },
      metrics: {
        currentStreak: bestCurrentStreak,
        longestStreak: bestEverStreak,
        todayCompletionRate: todayPercentage,
        weeklySuccessRate,
        monthlyProgressRate,
        totalCompletions: habits.reduce((acc, h) => acc + h.completions.length, 0),
      },
      todayHabits,
    };
  }

  /**
   * Get lightweight today's habit checklist
   */
  async getTodayHabits(userId) {
    const overview = await this.getDashboardOverview(userId);
    return {
      today: overview.today,
      habits: overview.todayHabits,
    };
  }
}

export const dashboardService = new DashboardService();
