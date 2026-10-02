import prisma from '../config/prisma.js';

class CompletionService {
  /**
   * Helper to format Date to YYYY-MM-DD string
   */
  getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Mark a habit as completed for a given date
   */
  async completeHabit(userId, habitId, payload = {}) {
    // 1. Verify habit existence & ownership
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
      const error = new Error('You do not have permission to log completions for this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    const dateToComplete = payload.completedDate || this.getTodayDateString();

    // 2. Check for duplicate completion on the same date
    const existingCompletion = await prisma.habitCompletion.findUnique({
      where: {
        habit_completed_date_unique: {
          habitId,
          completedDate: dateToComplete,
        },
      },
    });

    if (existingCompletion) {
      const error = new Error(`Habit "${habit.name}" is already marked as completed for ${dateToComplete}`);
      error.statusCode = 409;
      error.errorCode = 'DUPLICATE_COMPLETION';
      throw error;
    }

    // 3. Create completion record
    const completion = await prisma.habitCompletion.create({
      data: {
        habitId,
        userId,
        completedDate: dateToComplete,
        completedAt: new Date(),
        note: payload.note || null,
      },
    });

    return completion;
  }

  /**
   * Undo / remove completion for a habit on a specific date
   */
  async undoCompletion(userId, habitId, dateStr) {
    // 1. Verify habit existence & ownership
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
      const error = new Error('You do not have permission to undo completions for this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    // 2. Find completion record
    const completion = await prisma.habitCompletion.findUnique({
      where: {
        habit_completed_date_unique: {
          habitId,
          completedDate: dateStr,
        },
      },
    });

    if (!completion) {
      const error = new Error(`No completion record found for ${dateStr}`);
      error.statusCode = 404;
      error.errorCode = 'COMPLETION_NOT_FOUND';
      throw error;
    }

    // 3. Delete completion
    await prisma.habitCompletion.delete({
      where: { id: completion.id },
    });

    return {
      habitId,
      completedDate: dateStr,
      undone: true,
    };
  }

  /**
   * Get completion history for a habit
   */
  async getHabitCompletions(userId, habitId, query = {}) {
    // 1. Verify habit existence & ownership
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
      const error = new Error('You do not have permission to view completions for this habit');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      throw error;
    }

    const { startDate, endDate, limit = 100 } = query;

    const where = { habitId };
    if (startDate || endDate) {
      where.completedDate = {};
      if (startDate) where.completedDate.gte = startDate;
      if (endDate) where.completedDate.lte = endDate;
    }

    const completions = await prisma.habitCompletion.findMany({
      where,
      orderBy: { completedDate: 'desc' },
      take: Number(limit) || 100,
    });

    const totalCount = await prisma.habitCompletion.count({
      where: { habitId },
    });

    return {
      habitId,
      habitName: habit.name,
      totalCompletions: totalCount,
      completions,
    };
  }
}

export const completionService = new CompletionService();
