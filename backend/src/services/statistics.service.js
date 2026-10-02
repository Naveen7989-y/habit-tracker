import prisma from '../config/prisma.js';
import {
  calculateHabitStreaks,
  formatDateString,
  offsetDateString,
} from '../utils/streakEngine.js';

class StatisticsService {
  /**
   * Get streak statistics for all habits of a user
   */
  async getStreakStatistics(userId) {
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        completions: {
          select: { completedDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (habits.length === 0) {
      return {
        bestCurrentStreak: 0,
        bestEverStreak: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        habits: [],
      };
    }

    let bestCurrentStreak = 0;
    let bestEverStreak = 0;
    let totalCompletions = 0;
    let totalRateSum = 0;

    const habitStreakList = habits.map((habit) => {
      const stats = calculateHabitStreaks(
        habit.completions,
        habit.startDate,
        habit.endDate
      );

      if (stats.currentStreak > bestCurrentStreak) {
        bestCurrentStreak = stats.currentStreak;
      }
      if (stats.longestStreak > bestEverStreak) {
        bestEverStreak = stats.longestStreak;
      }
      totalCompletions += stats.totalCompletions;
      totalRateSum += stats.completionRate;

      return {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        frequency: habit.frequency,
        isArchived: habit.isArchived,
        ...stats,
      };
    });

    const averageCompletionRate = Math.round(totalRateSum / habits.length);

    return {
      bestCurrentStreak,
      bestEverStreak,
      totalCompletions,
      averageCompletionRate,
      habits: habitStreakList,
    };
  }

  /**
   * Get weekly completion statistics (past 7 days)
   * Formatted for Recharts Bar Chart
   */
  async getWeeklyCompletionStats(userId) {
    const today = new Date();
    const todayStr = formatDateString(today);
    const startDateStr = offsetDateString(todayStr, -6); // 7 days: today and 6 prior days

    // Active habits count
    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: { id: true },
    });
    const totalHabits = habits.length;

    // Completions in range
    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        completedDate: {
          gte: startDateStr,
          lte: todayStr,
        },
      },
      select: { completedDate: true },
    });

    const dateCounts = new Map();
    for (const c of completions) {
      dateCounts.set(c.completedDate, (dateCounts.get(c.completedDate) || 0) + 1);
    }

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const dStr = offsetDateString(todayStr, -i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = dayNames[dateObj.getDay()];
      const completed = dateCounts.get(dStr) || 0;
      const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;

      days.push({
        date: dStr,
        day: dayName,
        completed,
        target: totalHabits,
        rate,
        isToday: dStr === todayStr,
      });
    }

    return {
      totalHabits,
      days,
    };
  }

  /**
   * Get monthly completion trend statistics (past 30 days)
   * Formatted for Recharts Area / Line Chart
   */
  async getMonthlyTrendStats(userId, daysCount = 30) {
    const limit = Math.min(90, Math.max(7, parseInt(daysCount, 10) || 30));
    const today = new Date();
    const todayStr = formatDateString(today);
    const startDateStr = offsetDateString(todayStr, -(limit - 1));

    const totalHabits = await prisma.habit.count({
      where: { userId, isArchived: false },
    });

    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        completedDate: {
          gte: startDateStr,
          lte: todayStr,
        },
      },
      select: { completedDate: true },
    });

    const counts = new Map();
    for (const c of completions) {
      counts.set(c.completedDate, (counts.get(c.completedDate) || 0) + 1);
    }

    const trend = [];
    let cumulative = 0;

    for (let i = limit - 1; i >= 0; i--) {
      const dStr = offsetDateString(todayStr, -i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const shortLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const completed = counts.get(dStr) || 0;
      cumulative += completed;
      const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;

      trend.push({
        date: dStr,
        label: shortLabel,
        completed,
        target: totalHabits,
        rate,
        cumulative,
      });
    }

    return {
      daysCount: limit,
      startDate: startDateStr,
      endDate: todayStr,
      trend,
    };
  }

  /**
   * Get habit category distribution and performance
   * Formatted for Recharts Pie / Donut Chart
   */
  async getCategoryBreakdownStats(userId) {
    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        completions: {
          select: { id: true },
        },
      },
    });

    if (habits.length === 0) {
      return [];
    }

    const categoryMap = new Map();
    const categoryColors = {
      Fitness: '#10b981',
      Health: '#06b6d4',
      Work: '#6366f1',
      Study: '#8b5cf6',
      Mindfulness: '#ec4899',
      Personal: '#f59e0b',
      Finance: '#14b8a6',
      Other: '#64748b',
    };

    let totalCompletionsAllCategories = 0;

    for (const habit of habits) {
      const cat = habit.category || 'Other';
      const completionsCount = habit.completions.length;
      totalCompletionsAllCategories += completionsCount;

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          name: cat,
          habitCount: 0,
          completions: 0,
          color: categoryColors[cat] || habit.color || '#6366f1',
        });
      }

      const entry = categoryMap.get(cat);
      entry.habitCount += 1;
      entry.completions += completionsCount;
    }

    const categories = Array.from(categoryMap.values()).map((entry) => ({
      ...entry,
      percentage: totalCompletionsAllCategories > 0
        ? Math.round((entry.completions / totalCompletionsAllCategories) * 100)
        : 0,
    }));

    return categories.sort((a, b) => b.completions - a.completions);
  }

  /**
   * Compare habit performance (completion rate, current streak, longest streak)
   * Formatted for Recharts Horizontal Bar Chart
   */
  async getHabitComparisonStats(userId) {
    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        completions: {
          select: { completedDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const comparison = habits.map((habit) => {
      const stats = calculateHabitStreaks(habit.completions, habit.startDate, habit.endDate);
      return {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        completionRate: stats.completionRate,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCompletions: stats.totalCompletions,
      };
    });

    return comparison.sort((a, b) => b.completionRate - a.completionRate);
  }

  /**
   * Day of week performance analytics
   * Identifies which weekdays have highest and lowest completion rates
   */
  async getDayOfWeekStats(userId) {
    const completions = await prisma.habitCompletion.findMany({
      where: { userId },
      select: { completedDate: true },
    });

    const dayCompletions = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const c of completions) {
      const [y, m, d] = c.completedDate.split('-').map(Number);
      const dayIdx = new Date(y, m - 1, d).getDay();
      dayCompletions[dayIdx]++;
    }

    const total = completions.length;
    const days = dayNames.map((name, idx) => ({
      day: name,
      short: dayShort[idx],
      completions: dayCompletions[idx],
      percentage: total > 0 ? Math.round((dayCompletions[idx] / total) * 100) : 0,
    }));

    // Find best and lowest day
    let bestDay = days[0];
    for (const d of days) {
      if (d.completions > bestDay.completions) bestDay = d;
    }

    return {
      bestDay: bestDay.day,
      bestDayCompletions: bestDay.completions,
      days,
    };
  }

  /**
   * Unified Analytics Endpoint
   * Returns all statistical datasets in one synchronized payload
   */
  async getComprehensiveAnalytics(userId, daysCount = 30) {
    const [
      streaks,
      weekly,
      monthly,
      categories,
      habitsComparison,
      dayOfWeek,
    ] = await Promise.all([
      this.getStreakStatistics(userId),
      this.getWeeklyCompletionStats(userId),
      this.getMonthlyTrendStats(userId, daysCount),
      this.getCategoryBreakdownStats(userId),
      this.getHabitComparisonStats(userId),
      this.getDayOfWeekStats(userId),
    ]);

    return {
      summary: {
        bestCurrentStreak: streaks.bestCurrentStreak,
        bestEverStreak: streaks.bestEverStreak,
        totalCompletions: streaks.totalCompletions,
        averageCompletionRate: streaks.averageCompletionRate,
        bestDay: dayOfWeek.bestDay,
        topCategory: categories[0]?.name || 'N/A',
      },
      weekly,
      monthly,
      categories,
      habitsComparison,
      dayOfWeek,
    };
  }
}

export const statisticsService = new StatisticsService();
