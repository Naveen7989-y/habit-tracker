import prisma from '../config/prisma.js';
import { calculateHabitStreaks } from '../utils/streakEngine.js';

class HabitService {
  /**
   * Helper to format Date to YYYY-MM-DD string
   */
  getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Create a new habit
   */
  async createHabit(userId, habitData) {
    const {
      name,
      description,
      category = 'Other',
      color = '#6366f1',
      icon = 'Activity',
      frequency = 'Daily',
      targetCount = 1,
      reminderTime = null,
      startDate,
      endDate,
    } = habitData;

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        description: description || null,
        category,
        color,
        icon,
        frequency,
        targetCount: Number(targetCount) || 1,
        reminderTime: reminderTime || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return habit;
  }

  /**
   * Retrieve habits for a user with search, filter, and sorting
   */
  async getHabits(userId, query = {}) {
    const {
      search,
      category,
      status = 'active', // 'active', 'archived', 'all'
      sortBy = 'newest',
    } = query;

    const todayStr = this.getTodayDateString();

    // 1. Build where clause
    const where = {
      userId,
    };

    if (status === 'active') {
      where.isArchived = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // 2. Build orderBy clause
    let orderBy = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'targetCount':
        orderBy = { targetCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // 3. Query Prisma
    const habits = await prisma.habit.findMany({
      where,
      orderBy,
      include: {
        completions: {
          select: { completedDate: true, note: true },
        },
      },
    });

    // 4. Transform to include streak analytics and completion status
    return habits.map((habit) => {
      const streakStats = calculateHabitStreaks(
        habit.completions,
        habit.startDate,
        habit.endDate
      );

      const todayCompletion = habit.completions.find((c) => c.completedDate === todayStr) || null;

      return {
        id: habit.id,
        userId: habit.userId,
        name: habit.name,
        description: habit.description,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        reminderTime: habit.reminderTime,
        startDate: habit.startDate,
        endDate: habit.endDate,
        isArchived: habit.isArchived,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
        currentStreak: streakStats.currentStreak,
        longestStreak: streakStats.longestStreak,
        totalCompletions: streakStats.totalCompletions,
        completionRate: streakStats.completionRate,
        isCompletedToday: streakStats.isCompletedToday,
        todayCompletion,
      };
    });
  }

  /**
   * Get single habit by ID with strict ownership validation
   */
  async getHabitById(userId, habitId) {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        completions: {
          orderBy: { completedDate: 'desc' },
          take: 90,
        },
      },
    });

    if (!habit) {
      const error = new Error('Habit not found');
      error.statusCode = 404;
      error.errorCode = 'HABIT_NOT_FOUND';
      throw error;
    }

    // Authorization check: User must own the habit
    if (habit.userId !== userId) {
      const error = new Error('You do not have permission to access this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    const streakStats = calculateHabitStreaks(
      habit.completions,
      habit.startDate,
      habit.endDate
    );

    return {
      ...habit,
      currentStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,
      totalCompletions: streakStats.totalCompletions,
      completionRate: streakStats.completionRate,
      isCompletedToday: streakStats.isCompletedToday,
    };
  }

  /**
   * Update a habit with strict ownership validation
   */
  async updateHabit(userId, habitId, updateData) {
    // 1. Verify existence & ownership
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      const error = new Error('Habit not found');
      error.statusCode = 404;
      error.errorCode = 'HABIT_NOT_FOUND';
      throw error;
    }

    if (habit.userId !== userId) {
      const error = new Error('You do not have permission to modify this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    // 2. Prepare payload
    const data = {};
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.category !== undefined) data.category = updateData.category;
    if (updateData.color !== undefined) data.color = updateData.color;
    if (updateData.icon !== undefined) data.icon = updateData.icon;
    if (updateData.frequency !== undefined) data.frequency = updateData.frequency;
    if (updateData.targetCount !== undefined) data.targetCount = Number(updateData.targetCount) || 1;
    if (updateData.reminderTime !== undefined) data.reminderTime = updateData.reminderTime;
    if (updateData.startDate !== undefined) data.startDate = updateData.startDate ? new Date(updateData.startDate) : undefined;
    if (updateData.endDate !== undefined) data.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.isArchived !== undefined) data.isArchived = Boolean(updateData.isArchived);

    // 3. Update in database
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data,
    });

    return updatedHabit;
  }

  /**
   * Delete a habit with strict ownership validation
   */
  async deleteHabit(userId, habitId) {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      const error = new Error('Habit not found');
      error.statusCode = 404;
      error.errorCode = 'HABIT_NOT_FOUND';
      throw error;
    }

    if (habit.userId !== userId) {
      const error = new Error('You do not have permission to delete this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    await prisma.habit.delete({
      where: { id: habitId },
    });

    return { id: habitId, deleted: true };
  }

  /**
   * Toggle archive state for a habit
   */
  async toggleArchiveHabit(userId, habitId) {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      const error = new Error('Habit not found');
      error.statusCode = 404;
      error.errorCode = 'HABIT_NOT_FOUND';
      throw error;
    }

    if (habit.userId !== userId) {
      const error = new Error('You do not have permission to archive this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { isArchived: !habit.isArchived },
    });

    return updatedHabit;
  }
}

export const habitService = new HabitService();
