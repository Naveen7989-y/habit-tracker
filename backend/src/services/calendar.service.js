import prisma from '../config/prisma.js';
import { calculateHabitStreaks, formatDateString, offsetDateString } from '../utils/streakEngine.js';

export class CalendarService {
  /**
   * Get monthly calendar overview with day-by-day habit completion stats
   */
  static async getMonthCalendar(userId, yearParam, monthParam) {
    const today = new Date();
    const todayStr = formatDateString(today);

    const year = yearParam ? parseInt(yearParam, 10) : today.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : today.getMonth() + 1;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error('Invalid year or month parameter');
    }

    // Determine start and end date strings for the requested month
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // Fetch user's active habits
    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, category: true, color: true, icon: true },
    });
    const totalHabits = habits.length;

    // Fetch all completions for this user in the specified month
    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        completedDate: {
          gte: startDateStr,
          lte: endDateStr,
        },
      },
      select: {
        id: true,
        habitId: true,
        completedDate: true,
        note: true,
      },
    });

    // Group completions by date
    const completionsByDate = new Map();
    for (const comp of completions) {
      if (!completionsByDate.has(comp.completedDate)) {
        completionsByDate.set(comp.completedDate, []);
      }
      completionsByDate.get(comp.completedDate).push(comp);
    }

    // Build day items
    const days = [];
    let fullDaysCount = 0;
    let partialDaysCount = 0;
    let missedDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dateStr = formatDateString(dateObj);
      const dayCompletions = completionsByDate.get(dateStr) || [];
      const completedCount = dayCompletions.length;

      const completionRate = totalHabits > 0
        ? Math.round((completedCount / totalHabits) * 100)
        : 0;

      let status = 'future';
      if (dateStr < todayStr) {
        if (completedCount === 0) {
          status = 'missed';
          missedDaysCount++;
        } else if (completedCount >= totalHabits && totalHabits > 0) {
          status = 'full';
          fullDaysCount++;
        } else {
          status = 'partial';
          partialDaysCount++;
        }
      } else if (dateStr === todayStr) {
        if (completedCount >= totalHabits && totalHabits > 0) {
          status = 'full';
          fullDaysCount++;
        } else if (completedCount > 0) {
          status = 'partial';
          partialDaysCount++;
        } else {
          status = 'pending';
        }
      }

      days.push({
        date: dateStr,
        day,
        dayOfWeek: dateObj.getDay(), // 0 = Sunday, 1 = Monday...
        completedCount,
        totalHabits,
        completionRate,
        status,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        isFuture: dateStr > todayStr,
      });
    }

    // Calculate month name
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

    return {
      year,
      month,
      monthName,
      daysInMonth,
      firstDayOfWeek: new Date(year, month - 1, 1).getDay(),
      totalHabits,
      totalCompletionsInMonth: completions.length,
      fullDaysCount,
      partialDaysCount,
      missedDaysCount,
      days,
    };
  }

  /**
   * Get GitHub-style contribution heatmap data
   * Defaults to last 90 days (13 weeks)
   */
  static async getHeatmap(userId, daysCountParam = 90) {
    const daysCount = Math.min(365, Math.max(7, parseInt(daysCountParam, 10) || 90));
    const today = new Date();
    const todayStr = formatDateString(today);

    // Calculate start date
    const startDateStr = offsetDateString(todayStr, -(daysCount - 1));

    // Fetch user's active habits count
    const totalHabits = await prisma.habit.count({
      where: { userId, isArchived: false },
    });

    // Fetch all completions in range
    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        completedDate: {
          gte: startDateStr,
          lte: todayStr,
        },
      },
      select: {
        id: true,
        habitId: true,
        completedDate: true,
      },
    });

    // Group by date
    const dateCounts = new Map();
    for (const comp of completions) {
      dateCounts.set(comp.completedDate, (dateCounts.get(comp.completedDate) || 0) + 1);
    }

    // Build timeline
    const heatmapDays = [];
    let activeDaysCount = 0;

    let cursorStr = startDateStr;
    while (cursorStr <= todayStr) {
      const count = dateCounts.get(cursorStr) || 0;
      if (count > 0) activeDaysCount++;

      const percentage = totalHabits > 0
        ? Math.round((count / totalHabits) * 100)
        : 0;

      // GitHub-style contribution level (0 to 4)
      let level = 0;
      if (count > 0) {
        if (totalHabits > 0) {
          if (percentage >= 100) level = 4;
          else if (percentage >= 70) level = 3;
          else if (percentage >= 40) level = 2;
          else level = 1;
        } else {
          level = Math.min(4, count);
        }
      }

      const [y, m, d] = cursorStr.split('-').map(Number);
      const cursorDateObj = new Date(y, m - 1, d);

      heatmapDays.push({
        date: cursorStr,
        dayOfWeek: cursorDateObj.getDay(),
        count,
        totalHabits,
        percentage,
        level,
        isToday: cursorStr === todayStr,
      });

      cursorStr = offsetDateString(cursorStr, 1);
    }

    // Fetch all completed dates of user for overall streak calculation
    const allUserCompletions = await prisma.habitCompletion.findMany({
      where: { userId },
      select: { completedDate: true },
      distinct: ['completedDate'],
      orderBy: { completedDate: 'asc' },
    });
    const streakResult = calculateHabitStreaks(allUserCompletions.map(c => c.completedDate));

    return {
      daysCount,
      startDate: startDateStr,
      endDate: todayStr,
      totalCompletions: completions.length,
      activeDaysCount,
      consistencyRate: daysCount > 0 ? Math.round((activeDaysCount / daysCount) * 100) : 0,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      days: heatmapDays,
    };
  }

  /**
   * Get detailed habit status and completions for a specific day
   */
  static async getDayDetails(userId, dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const todayStr = formatDateString(new Date());

    // Fetch all active habits
    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch completions on this specific date
    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        completedDate: dateStr,
      },
    });

    const completionMap = new Map();
    for (const comp of completions) {
      completionMap.set(comp.habitId, comp);
    }

    const habitDetails = habits.map(habit => {
      const comp = completionMap.get(habit.id);
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
        isCompleted: !!comp,
        completion: comp ? {
          id: comp.id,
          completedDate: comp.completedDate,
          completedAt: comp.completedAt,
          note: comp.note,
        } : null,
      };
    });

    const completedCount = completions.length;
    const totalHabits = habits.length;
    const percentage = totalHabits > 0
      ? Math.round((completedCount / totalHabits) * 100)
      : 0;

    return {
      date: dateStr,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr,
      completedCount,
      totalHabits,
      percentage,
      habits: habitDetails,
    };
  }
}
